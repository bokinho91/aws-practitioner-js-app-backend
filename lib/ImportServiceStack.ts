import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queueUrl = cdk.Fn.importValue('CatalogItemsQueueUrl');
    const queueArn = cdk.Fn.importValue('CatalogItemsQueueArn');
    const basicAuthorizerArn = cdk.Fn.importValue('BasicAuthorizerArn');

    const bucket = new s3.Bucket(this, 'ImportBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
    });

    // Lambda functions
    const importProductsFile = new lambda.Function(this, 'importProductsFile', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'importProductsFile.importProductsHandler',
      code: lambda.Code.fromAsset('lib/import-service'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });


    const importFileParser = new lambda.Function(this, 'importFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'importFileParser.importFileHandler',
      code: lambda.Code.fromAsset('lib/import-service'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        SQS_URL: queueUrl,
      },
    });

    // Permissions
    bucket.grantReadWrite(importProductsFile, "uploaded/*");
    bucket.grantPut(importProductsFile, "uploaded/*");
    bucket.grantDelete(importFileParser, "uploaded/*");
    bucket.grantPut(importFileParser, "parsed/*");
    bucket.grantRead(importFileParser);
    bucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT],
      allowedOrigins: ['http://localhost:3000', 'https://d2d6g4sqsxabi.cloudfront.net'],
      allowedHeaders: ['*'],
    });

    importFileParser.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:SendMessage'],
      resources: [queueArn],
    }));

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: 'uploaded/' }
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
      deployOptions: {
        stageName: "dev"
      }
    });

    // Create Lambda authorizer - using REQUEST type for better CORS control
    const authorizer = new apigateway.RequestAuthorizer(this, 'ImportAuthorizer', {
      handler: lambda.Function.fromFunctionArn(this, 'BasicAuthorizerFunction', basicAuthorizerArn),
      identitySources: ['method.request.header.Authorization'],
      authorizerName: 'basicAuthorizer'
    });

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile), {
      authorizer: authorizer
    });

    // Add CORS support
    importResource.addCorsPreflight({
      allowOrigins: ['https://d2d6g4sqsxabi.cloudfront.net', 'http://localhost:3000'],
      allowMethods: ['GET', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      allowCredentials: true
    });

    // Add Gateway Responses for CORS on authorization errors
    api.addGatewayResponse('Unauthorized', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,OPTIONS'",
        'Access-Control-Allow-Credentials': "'false'"
      }
    });

    api.addGatewayResponse('AccessDenied', {
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,OPTIONS'",
        'Access-Control-Allow-Credentials': "'false'"
      }
    });

    api.addGatewayResponse('Forbidden', {
      type: apigateway.ResponseType.RESOURCE_NOT_FOUND,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,OPTIONS'",
        'Access-Control-Allow-Credentials': "'false'"
      }
    });
  }
}
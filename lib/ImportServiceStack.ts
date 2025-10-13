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

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile));
  }
}
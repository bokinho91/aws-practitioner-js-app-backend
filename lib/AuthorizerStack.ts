import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Lambda functions
    const basicAuthorizer = new lambda.Function(this, 'basicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'basicAuthorizer.authorizerHandler',
      code: lambda.Code.fromAsset('lib/authorization-service'),
      environment: {
        bokinho91: 'TEST_PASSWORD',
      },
    });

    // permissions
    basicAuthorizer.addPermission('ApiGatewayInvokePermission', {
      principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    new cdk.CfnOutput(this, 'BasicAuthorizerArn', {
      value: basicAuthorizer.functionArn,
      exportName: 'BasicAuthorizerArn',
    });

  }
}
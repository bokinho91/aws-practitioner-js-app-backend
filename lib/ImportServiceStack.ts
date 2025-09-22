import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';


export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new cdk.aws_s3.Bucket(this, 'ImportBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
    });


    new cdk.aws_s3_deployment.BucketDeployment(this, 'CreateUploadedFolder', {
      destinationBucket: bucket,
      sources: [cdk.aws_s3_deployment.Source.data('uploaded/', '')],
    });

  }
}
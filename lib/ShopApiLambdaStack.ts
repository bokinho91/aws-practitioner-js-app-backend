import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from 'constructs';
import path = require('path');
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class ShopApiLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const PRODUCTS_TABLE_NAME = "products";
    const STOCK_TABLE_NAME = "stock";

    // Lambdas
    const getProductsListLambda = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
      environment: {
        PRODUCTS_TABLE_NAME,
        STOCK_TABLE_NAME,
      },
    });

    const createProductLambda = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.createProduct',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
      environment: {
        PRODUCTS_TABLE_NAME,
        STOCK_TABLE_NAME,
      }
    });

    const getProductsByIdLambda = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.getProductsById',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
      environment: {
        PRODUCTS_TABLE_NAME,
        STOCK_TABLE_NAME,
      },
    });

    const createProductTopic = new sns.Topic(this, "create-product-topic", {
      topicName: 'createProductTopic'
    });

    const catalogBatchProcessLambda = new lambda.Function(this, 'catalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.catalogBatchProcess',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
      environment: {
        SNS_TOPIC_ARN: createProductTopic.topicArn
      }
    })


    // Permissions
    catalogBatchProcessLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish'],
      resources: [createProductTopic.topicArn],
    }));

    catalogBatchProcessLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${PRODUCTS_TABLE_NAME}`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${STOCK_TABLE_NAME}`,
      ],
    }));

    getProductsListLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:Scan', 'dynamodb:GetItem'],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${PRODUCTS_TABLE_NAME}`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${STOCK_TABLE_NAME}`,
      ],
    }));

    createProductLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${PRODUCTS_TABLE_NAME}`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${STOCK_TABLE_NAME}`,
      ],
    }));

    getProductsByIdLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:GetItem'],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${PRODUCTS_TABLE_NAME}`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${STOCK_TABLE_NAME}`,
      ],
    }));


    // Events
    const catalogItemsQueue = new sqs.Queue(this, "catalog-items-queue", {
      queueName: 'catalogItemsQueue'
    });
    catalogBatchProcessLambda.addEventSource(new SqsEventSource(catalogItemsQueue, { batchSize: 5 }));

    catalogBatchProcessLambda.addEventSource(new SnsEventSource(createProductTopic));

    createProductTopic.addSubscription(new sns_subscriptions.EmailSubscription('boris.vujakovic@gmail.com'))


    // Output
    new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', {
      value: catalogItemsQueue.queueUrl,
      exportName: 'CatalogItemsQueueUrl',
    });

    new cdk.CfnOutput(this, 'CatalogItemsQueueArn', {
      value: catalogItemsQueue.queueArn,
      exportName: 'CatalogItemsQueueArn',
    });


    // API Gateway
    const api = new apigateway.RestApi(this, "product-service-api", {
      restApiName: "Product Service API",
      description: "API for Product Service endpoints.",
      deployOptions: {
        stageName: "dev"
      }
    });

    const productsResource = api.root.addResource("products");
    const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsListLambda);
    const createProductIntegration = new apigateway.LambdaIntegration(createProductLambda);
    productsResource.addMethod('GET', getProductsListIntegration);
    productsResource.addMethod('POST', createProductIntegration);

    const productByIdResource = productsResource.addResource('{productId}');
    const getProductsByIdIntegration = new apigateway.LambdaIntegration(getProductsByIdLambda);
    productByIdResource.addMethod('GET', getProductsByIdIntegration);
  }
}
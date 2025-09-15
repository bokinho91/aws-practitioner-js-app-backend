import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class ShopApiLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
    });

    const getProductsByIdLambda = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'productService.getProductsById',
      code: lambda.Code.fromAsset(path.join(__dirname, './product-service')),
    });

    const api = new apigateway.RestApi(this, "product-service-api", {
      restApiName: "Product Service API",
      description: "API for Product Service endpoints.",
      deployOptions: {
        stageName: "dev"
      }
    });

    const productsResource = api.root.addResource("products");
    const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsListLambda);
    productsResource.addMethod('GET', getProductsListIntegration);

    const productByIdResource = productsResource.addResource('{productId}');
    const getProductsByIdIntegration = new apigateway.LambdaIntegration(getProductsByIdLambda);
    productByIdResource.addMethod('GET', getProductsByIdIntegration);
  }
}
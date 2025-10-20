#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
import { AuthorizerStack } from "../lib/AuthorizerStack";
const { ShopApiLambdaStack } = require('../lib/ShopApiLambdaStack');
const { ImportServiceStack } = require("../lib/ImportServiceStack");

const app = new cdk.App();
const authStack = new AuthorizerStack(app, 'AuthorizerStack', {});
const shopApiStack = new ShopApiLambdaStack(app, 'ShopApiLambdaStack', {});
const importServiceStack = new ImportServiceStack(app, 'ImportServiceStack', { bucketName: 'import-service-bucket' }).addDependency(authStack);

#!/usr/bin/env node


const cdk = require('aws-cdk-lib');
const { ShopApiLambdaStack } = require('../lib/ShopApiLambdaStack');
const { ImportServiceStack } = require("../lib/ImportServiceStack");

const app = new cdk.App();
new ShopApiLambdaStack(app, 'ShopApiLambdaStack', {});
new ImportServiceStack(app, 'ImportServiceStack', { bucketName: 'import-service-bucket' });
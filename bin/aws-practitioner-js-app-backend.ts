#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { ShopApiLambdaStack } = require('../lib/ShopApiLambdaStack');

const app = new cdk.App();
new ShopApiLambdaStack(app, 'ShopApiLambdaStack', {});
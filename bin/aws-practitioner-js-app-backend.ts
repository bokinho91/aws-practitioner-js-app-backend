#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ShopApiLambdaStack } from '../lib/ShopApiLambdaStack';

const app = new cdk.App();
new ShopApiLambdaStack(app, 'ShopApiLambdaStack', {});
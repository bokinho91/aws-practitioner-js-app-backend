const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand } = require("@aws-sdk/client-dynamodb");
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const getProductsList = async (event = {}) => {
  const client = new DynamoDBClient({ region: "us-east-1" });

  const params = {
    TableName: 'products',
  };

  let products;
  try {
    const result = await client.send(new ScanCommand(params));
    products = (result.Items || []).map(unmarshall);
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(products),
  };
};
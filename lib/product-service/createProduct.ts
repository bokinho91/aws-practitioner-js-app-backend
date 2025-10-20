const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require('uuid');

export const createProduct = async (event: { body?: any } = {}) => {

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('Parsed body:', body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const { title, description, price, count } = body || {};
  if (!title || !price || !count) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Missing required fields: title, price, count' }),
    };
  }

  const client = new DynamoDBClient({ region: "us-east-1" });
  const id = uuidv4();
  const params = {
    TableName: process.env.PRODUCTS_TABLE_NAME || 'products',
    Item: {
      id: { S: id },
      title: { S: title },
      description: { S: description || '' },
      price: { N: price.toString() },
    },
  };
  const stockParams = {
    TableName: process.env.STOCKS_TABLE_NAME || 'stock',
    Item: {
      product_id: { S: id },
      count: { N: count.toString() },
      max: { N: '100' },
    },
  };


  try {
    await client.send(new PutItemCommand(params));
    await client.send(new PutItemCommand(stockParams));
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ id, title, description, price }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to create product' }),
    };
  }
};


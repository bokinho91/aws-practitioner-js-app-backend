import { AttributeValue } from "@aws-sdk/client-dynamodb";
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

interface GetProductsByIdEvent {
  pathParameters?: {
    productId?: string;
  };
}

export const getProductsById = async (event: GetProductsByIdEvent = {}) => {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'ProductId is required' }),
    };
  }
  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'ProductId is required' }),
    };
  }

  const client = new DynamoDBClient({ region: "us-east-1" });
  const params = {
    TableName: 'products',
    Key: {
      id: { S: productId } as AttributeValue
    }
  };

  let product;
  try {
    const result = await client.send(new GetItemCommand(params));
    product = result.Item ? unmarshall(result.Item) : null;

    if (product) {
      let count = 0;
      try {
        const stockResult = await client.send(new GetItemCommand({
          TableName: 'stock',
          Key: { product_id: { S: product.id } }
        }));
        if (stockResult.Item) {
          const stock = unmarshall(stockResult.Item);
          count = stock.count;
        }
      } catch (err) {
        // If error, leave count as 0
      }
      product = { ...product, count };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch product' }),
    };
  }

  if (product) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }
}
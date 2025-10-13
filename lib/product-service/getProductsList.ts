
const { DynamoDBClient, ScanCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

export const getProductsList = async (event = {}) => {
  const client = new DynamoDBClient({ region: "us-east-1" });

  const params = {
    TableName: 'products',
  };

  let products;
  try {
    const result = await client.send(new ScanCommand(params));
    products = (result.Items || []).map(unmarshall);

    const productsWithCount = await Promise.all(products.map(async (product: any) => {
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
      return { ...product, count };
    }));
    products = productsWithCount;
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
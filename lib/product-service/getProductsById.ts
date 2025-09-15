import { products } from './products';

export const getProductsById = async (event: { pathParameters?: { productId?: string } }) => {
  const productId = event.pathParameters?.productId;
  const product = products.find((p) => p.id === productId);
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
};

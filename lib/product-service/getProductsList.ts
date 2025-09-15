import { products } from './products';

export const getProductsList = async (event = {}) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(products),
  };
};

import { getProductsList } from '../lib/product-service/getProductsList';
import { getProductsById } from '../lib/product-service/getProductsById';

describe('getProductsList', () => {
  it('should return all products with status 200', async () => {
    const result = await getProductsList();
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

describe('getProductsById', () => {
  it('should return a product with status 200 if found', async () => {
    const event = { pathParameters: { productId: '1' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe('1');
  });

  it('should return 404 if product not found', async () => {
    const event = { pathParameters: { productId: '999' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Product not found');
  });
});

import { createProduct, getProductsList, getProductsById } from "../lib/product-service/productService.js";
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
    const event = { pathParameters: { productId: '182e8e61-167a-49ac-8d55-b1d16602a2f9' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe('182e8e61-167a-49ac-8d55-b1d16602a2f9');
  });

  it('should return 404 if product not found', async () => {
    const event = { pathParameters: { productId: '999' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Product not found');
  });
});

describe('createProduct', () => {
  it('should create a product and return status 201', async () => {
    const event = {
      body: JSON.stringify({
        title: 'New Product',
        description: 'A test product',
        price: 99.99,
        count: 10
      })
    };
    const result = await createProduct(event);
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.title).toBe('New Product');
    expect(body.description).toBe('A test product');
    expect(body.price).toBe(99.99);
    expect(body.id).toBeDefined();
  });

  it('should return 400 if required fields are missing', async () => {
    const event = {
      body: JSON.stringify({
        title: 'Incomplete Product'
        // missing price, count
      })
    };
    const result = await createProduct(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Missing required fields: title, price, count');
  });

  it('should return 400 if body is not valid JSON', async () => {
    const event = {
      body: "{title: 'Invalid JSON'}"
    };
    const result = await createProduct(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Invalid request body');
  });
});


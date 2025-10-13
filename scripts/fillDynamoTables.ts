import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "us-east-1" });

const productsTable = "products";
const stockTable = "stock";

const testProducts = [
  {
    title: "Men's T-Shirt",
    description: "100% cotton, classic fit",
    price: 20,
  },
  {
    title: "Women's Jeans",
    description: "Skinny fit, stretch denim",
    price: 45,
  },
  {
    title: "Unisex Hoodie",
    description: "Fleece lined, various colors",
    price: 35,
  },
  {
    title: "Women's Blouse",
    description: "Lightweight, floral print",
    price: 30,
  },
  {
    title: "Men's Shorts",
    description: "Casual, quick-dry fabric",
    price: 25,
  },
  {
    title: "Kids' Jacket",
    description: "Water-resistant, bright colors",
    price: 40,
  },
  {
    title: "Unisex Socks (5-pack)",
    description: "Soft cotton, assorted colors",
    price: 12,
  },
];

async function fillTables () {
  for (const product of testProducts) {
    const id = uuidv4();

    await client.send(
      new PutItemCommand({
        TableName: productsTable,
        Item: {
          id: { S: id },
          title: { S: product.title },
          description: { S: product.description },
          price: { N: product.price.toString() },
        },
      })
    );

    await client.send(
      new PutItemCommand({
        TableName: stockTable,
        Item: {
          product_id: { S: id },
          count: { N: (Math.floor(Math.random() * 100) + 1).toString() },
          max: { N: '100' },
        },
      })
    );
    console.log(`Inserted product ${product.title} with id ${id}`);
  }
}

fillTables().catch(console.error);

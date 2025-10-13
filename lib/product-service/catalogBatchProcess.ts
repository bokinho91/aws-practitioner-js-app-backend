import { createProduct } from "./createProduct";
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');


export const catalogBatchProcess = async (event: any) => {
  const sns = new SNSClient({});
  const topicArn = process.env.SNS_TOPIC_ARN;
  const createdProducts: any[] = [];


  for (const record of event.Records) {
    try {

      const productData = JSON.parse(record.body);
      const createEvent = { body: JSON.stringify(productData) };
      const result = await createProduct(createEvent);

      if (result.statusCode === 201) {
        const createdProduct = JSON.parse(result.body);
        createdProducts.push(createdProduct);
        console.log('Successfully created product:', productData.title || productData.name);
      }
    } catch (error) {
      console.error('Error processing record:', record, error);
    }

    if (createdProducts.length > 0 && topicArn) {
      try {
        const message = {
          products: createdProducts,
          count: createdProducts.length,
          action: 'batch_created',
          timestamp: new Date().toISOString()
        };

        await sns.send(new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify(message),
          Subject: `${createdProducts.length} new product(s) created via batch import`,
          MessageAttributes: {
            'product_count': {
              DataType: 'Number',
              StringValue: createdProducts.length.toString()
            },
            'action': {
              DataType: 'String',
              StringValue: 'batch_created'
            }
          }
        }));

        console.log(`SNS notification sent for ${createdProducts.length} products`);
      } catch (snsError) {
        console.error('Error sending SNS notification:', snsError);
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      processedRecords: event.Records.length,
      createdProducts: createdProducts.length
    })
  };
}

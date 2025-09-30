import { createProduct } from "./createProduct";


export const catalogBatchProcess = async (event: any) => {
  console.log('Processing SQS batch:', JSON.stringify(event));

  for (const record of event.Records) {
    try {

      const productData = JSON.parse(record.body);
      console.log('Processing product:', productData);


      const createEvent = { body: JSON.stringify(productData) };
      await createProduct(createEvent);

      console.log('Successfully created product:', productData.title);
    } catch (error) {
      console.error('Error processing record:', record, error);
    }
  }

  return { statusCode: 200, body: 'Batch processed successfully' };
};
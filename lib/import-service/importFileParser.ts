const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

export const importFileHandler = async (event: any) => {
  console.log('Lambda triggered, event:', JSON.stringify(event));

  const s3 = new S3Client({});
  const sqs = new SQSClient({});
  const bucket = process.env.BUCKET_NAME;
  const queueUrl = process.env.SQS_URL;

  if (!queueUrl) {
    console.error('SQS_URL environment variable is not set');
    return { statusCode: 500, body: 'SQS_URL not configured' };
  }

  function toNodeReadable (body: any) {
    return typeof body?.pipe === 'function' ? body : Readable.fromWeb(body);
  }

  async function getS3ObjectStream (bucketName: any, objectKey: any) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const response = await s3.send(command);
      return response.Body;
    } catch (error) {
      console.error("Error getting S3 object:", error);
      throw error;
    }
  }

  for (const record of event.Records) {
    const key = record.s3.object.key;
    if (!key.startsWith('uploaded/')) continue;

    const body = await getS3ObjectStream(bucket, key);
    const stream = toNodeReadable(body);


    const csvRecords: any[] = [];
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: any) => {
          csvRecords.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    for (const csvRecord of csvRecords) {
      try {
        console.log('Sending record to SQS:', csvRecord.title || 'Record');
        await sqs.send(new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(csvRecord),
        }));
      } catch (error) {
        console.error('Error sending message to SQS:', error);
      }
    }

    const parsedKey = key.replace(/^uploaded\//, 'parsed/');
    try {
      await s3.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: parsedKey,
      }));

      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      console.log(`Moved file from ${key} to ${parsedKey}`);
    } catch (err) {
      console.error('Error moving file:', err);
    }
  }

  return { statusCode: 200 };
};



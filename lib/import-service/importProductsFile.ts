import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({});

const BUCKET_NAME = process.env.BUCKET_NAME!;
const URL_EXPIRES_SECONDS = 60;

export const importProductsHandler = async (event: any) => {
  try {
    const fileName = event?.queryStringParameters?.name;
    if (!fileName) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: "Missing required query parameter: name" }),
      };
    }

    const key = `uploaded/${fileName}`;

    const cmd = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: "text/csv",
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: URL_EXPIRES_SECONDS });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url, key, bucket: BUCKET_NAME, expiresIn: URL_EXPIRES_SECONDS }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: "Failed to get signed URL" }),
    };
  }

};


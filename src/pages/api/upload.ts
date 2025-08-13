import type { APIRoute } from 'astro';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  }
});

export const POST: APIRoute = async ({ request }) => {
  const { filename, contentType } = await request.json();
  const bucket = process.env.S3_BUCKET!;
  const fields = { 'Content-Type': contentType, key: filename };

  const { url, fields: postFields } = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: filename,
    Conditions: [['content-length-range', 0, 5 * 1024 * 1024]], // 5MB
    Fields: fields,
    Expires: 300
  });

  return new Response(JSON.stringify({ url, fields: postFields }), { headers: { 'content-type': 'application/json' } });
};

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const defaultbucket = process.env.NEON_STORAGE_BUCKET ?? "book-store-images";

const getStorageClient = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_ENDPOINT_URL_S3 || !AWS_REGION) {
    throw new Error("Neon Storage is not configured. Pull the branch storage environment variables with `neon env pull`.");
  }

  return new S3Client({
    endpoint: AWS_ENDPOINT_URL_S3,
    region: AWS_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
  });
};

export const uploadImage = async (image: File) => {
  const extension = path.extname(image.name).toLowerCase();
  const key = `${Date.now()}-${randomUUID()}${extension}`;
  const client = getStorageClient();

  await client.send(new PutObjectCommand({
    Bucket: defaultbucket,
    Key: key,
    Body: Buffer.from(await image.arrayBuffer()),
    ContentType: image.type || "application/octet-stream",
  }));

  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
  return `${endpoint}/${defaultbucket}/${encodeURIComponent(key)}`;
};

export const deleteImage = async (url: string) => {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint || !url.startsWith(`${endpoint.replace(/\/$/, "")}/${defaultbucket}/`)) return;
  const key = decodeURIComponent(url.split("/").pop() ?? "");
  if (!key) throw new Error("Invalid Neon Storage image URL");
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: defaultbucket, Key: key }));
};

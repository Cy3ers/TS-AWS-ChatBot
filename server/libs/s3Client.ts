import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";

const s3Client = new S3Client({ region: "us-east-1" });

export const createBucket = async (bucketName: string) => {
  try {
    const data = await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket ${bucketName} created successfully.`);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
};

export const uploadFileToS3 = async (bucketName: string, filePath: string, fileName: string) => {
  try {
    const fileContent = require("fs").readFileSync(filePath);
    const data = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent
      })
    );
    console.log(`File uploaded successfully to ${bucketName}/${fileName}`);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
};

export const downloadFileFromS3 = async (bucketName: string, key: string, downloadPath: string) => {
  try {
    const data = (await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }))).Body;
    const fileStream = createWriteStream(downloadPath);

    if (data) {
      return new Promise((resolve, reject) => {
        (data as any).pipe(fileStream);
        (data as any).on("error", reject);
        fileStream.on("close", resolve);
      });
    } else {
      console.error("Unexpected type for data.Body");
      throw new Error("Unexpected type for data.Body");
    }
  } catch (err) {
    console.log("Error", err);
  }
};

export { s3Client };

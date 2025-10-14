import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing AWS credentials in environment variables. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  );
}

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: process.env.S3_REGION || "us-east-1",
});

export async function uploadFileToS3(
  file: any,
  key: string
): Promise<string | undefined> {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (_req: any, file: any, cb: any) => {
        // Allow images and PDFs
        const allowedMimes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file type. Only images, PDFs, and spreadsheets are allowed."
            )
          );
        }
      },
    };
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  } catch (e) {
    console.error("❌ Upload Error:", e);
  }
}

// Helper function to delete file from S3
export const deleteFromS3 = async (
  key: string
): Promise<DeleteObjectCommandOutput> => {
  const bucketName = process.env.S3_BUCKET || "workflow-management-files";
  try {
    const params = {
      Bucket: bucketName,
      Key: key, // e.g., "images/test-image.jpg"
    };

    const command = new DeleteObjectCommand(params);
    const result = await s3Client.send(command);

    console.log(`File ${key} deleted successfully from ${bucketName}`);
    return result; // Returns the AWS SDK response (e.g., { $metadata })
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
};

// Helper function to generate signed URL
export const getSignedUrl = async (
  key: string,
  expires: number = 3600
): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME || "invoice-management-files",
    Key: key,
  });

  const result = await s3Client.send(command);
  return result; // ✅ return the value
};

export { s3Client };

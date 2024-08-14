import { StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { transcribeClient } from "../libs/transcribeClient";
import { createBucket, uploadFileToS3, downloadFileFromS3 } from "../libs/s3Client";

let latestFilePath = "";

export const startTranscriptionJob = async (videoFilePath: string) => {
  const videoBucketName = "test-transcription-bucket-nmx";
  const outputBucketName = "output-transcription-bucket-nmx";
  const videoFileName = videoFilePath.split("/").pop() as string;

  // Create the buckets if they don't exist
  await createBucket(videoBucketName);
  await createBucket(outputBucketName);

  // Upload the video file to S3
  await uploadFileToS3(videoBucketName, videoFilePath, videoFileName);

  // Start transcription job
  const transcriptionJobName = `transcription-${Date.now()}`;
  const params = {
    TranscriptionJobName: transcriptionJobName,
    LanguageCode: "en-US",
    MediaFormat: "mp4",
    Media: {
      MediaFileUri: `s3://${videoBucketName}/${videoFileName}`
    },
    OutputBucketName: outputBucketName
  };

  try {
    await transcribeClient.send(new StartTranscriptionJobCommand(params as any));
    console.log("Transcription job started successfully.");

    // Poll until the job completes
    let jobCompleted = false;
    while (!jobCompleted) {
      const { TranscriptionJob } = await transcribeClient.send(
        new GetTranscriptionJobCommand({ TranscriptionJobName: transcriptionJobName })
      );
      jobCompleted = TranscriptionJob?.TranscriptionJobStatus === "COMPLETED";
      if (!jobCompleted) {
        console.log("Waiting for transcription job to complete...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5 seconds
      }
    }

    console.log("Transcription job completed.");
    const outputKey = `${transcriptionJobName}.json`;
    const outputPath = `./files/${outputKey}`;
    latestFilePath = outputPath;

    // Download the transcription output from S3
    await downloadFileFromS3(outputBucketName, outputKey, outputPath);
  } catch (err) {
    console.log("Error", err);
    return null;
  }
};

export const getLatestFilePath = () => latestFilePath;

import { Router } from "express";
import { inMemoryChat } from "./chat";
import { startTranscriptionJob } from "./transcribe_create_job";
import nocache from "nocache";

const router = Router();

router.get("/v1/in-memory-ai-text", nocache(), inMemoryChat);

router.post("/v1/transcribe-and-process", nocache(), async (req, res) => {
  const { filePath } = req.body;

  try {
    const result = await startTranscriptionJob(filePath);
    res.status(200).json({ message: "Transcription and processing completed", result });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete transcription and processing", error });
  }
});

export default router;

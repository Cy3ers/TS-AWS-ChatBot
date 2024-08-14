import { Request, Response } from "express";
import TextLoader from "./textloader";
import { getLatestFilePath } from "./transcribe_create_job";

export const inMemoryChat = async (req: Request, res: Response) => {
  const question = req.query.question as string;
  const filePath = getLatestFilePath() ? getLatestFilePath() : "files/transcription-1723614979191.json";

  const result = await TextLoader(question, filePath);

  res.status(200).json({
    question,
    answer: result
  });
};

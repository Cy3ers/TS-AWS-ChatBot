import "dotenv/config";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { loadQAStuffChain } from "langchain/chains";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { Document } from "@langchain/core/documents";
import { DocumentInterface } from "@langchain/core/documents";

export default async (question = "", filePath = "") => {
  const fileExtension = filePath.split(".").pop();
  let loader;

  if (fileExtension === "docx") {
    loader = new DocxLoader(filePath);
  } else if (fileExtension === "txt") {
    loader = new TextLoader(filePath);
  } else if (fileExtension === "json") {
    loader = new JSONLoader(filePath);
  } else if (fileExtension === "pdf") {
    loader = new PDFLoader(filePath, {
      splitPages: false
    });
  } else {
    return "unsupported file type";
  }

  const docs = await loader.load();

  if (fileExtension === "json") {
    docs.splice(0, docs.length, docs[3]);
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

  const searchResponse = await vectorStore.similaritySearch(question, 1);
  const textRes = searchResponse.map((item: DocumentInterface<Record<string, any>>) => item?.pageContent).join("\n");
  const llm = new OpenAI({ modelName: "gpt-4" });
  const chain = loadQAStuffChain(llm);

  const result = await chain.invoke({
    input_documents: [new Document({ pageContent: `${textRes}` })],
    question
  });

  console.log(`\n\n Question:\n${question}`);
  console.log(`\n\n Answer:\n${result.text}`);
  return result.text;
};

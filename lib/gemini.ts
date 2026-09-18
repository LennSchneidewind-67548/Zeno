import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Structure } from "@/lib/task-types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function splitTask(prompt: string): Promise<{
  structure: Structure;
  subtasks: { text: string; position: number; parent_id?: string | null; temp_id?: string }[];
}> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          structure: {
            type: SchemaType.STRING,
            description: "One of: linear, star, tree, pipeline",
          },
          subtasks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
                position: { type: SchemaType.NUMBER },
                temp_id: { type: SchemaType.STRING },
                parent_id: { type: SchemaType.STRING },
              },
              required: ["text", "position"],
            },
          },
        },
        required: ["structure", "subtasks"],
      },
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text) as {
    structure: Structure;
    subtasks: { text: string; position: number; parent_id?: string | null; temp_id?: string }[];
  };
}

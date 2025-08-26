import { GoogleGenAI, Type } from "@google/genai";
import type { LearningNotes, NoteSection, Quiz } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const notesSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      heading: {
        type: Type.STRING,
        description: 'A concise, descriptive title for this section of the notes.',
      },
      content: {
        type: Type.STRING,
        description: 'The detailed notes for this section, written in clear, well-structured paragraphs. Aim for 2-4 paragraphs.',
      },
      imagePrompt: {
        type: Type.STRING,
        description: 'A short, descriptive prompt for an image generation model to create a relevant visual for this section. The prompt should focus on key concepts and be suitable for a clean, vector-style educational illustration.',
      },
    },
    required: ["heading", "content", "imagePrompt"],
  },
};

const quizSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: "The quiz question, testing a key concept from the notes."
            },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 4 distinct multiple-choice options."
            },
            correctAnswer: {
                type: Type.STRING,
                description: "The correct answer from the provided options array."
            },
            explanation: {
                type: Type.STRING,
                description: "A brief and clear explanation for why the answer is correct, reinforcing the learning concept."
            }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
    }
};


export async function generateNotes(topic: string): Promise<LearningNotes> {
  const prompt = `You are an expert educator. Create a detailed, comprehensive set of learning notes on the topic of "${topic}". Structure your response as a valid JSON array, strictly following the provided schema. Each object in the array represents a distinct section of the notes. Ensure the content is informative, well-organized, and suitable for someone new to the topic.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: notesSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedNotes = JSON.parse(jsonText) as NoteSection[];
    return parsedNotes;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw new Error("Failed to generate notes. Please check the topic and try again.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Educational illustration, clean, minimalist vector style, vibrant colors. ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    return "https://picsum.photos/1280/720";
  }
}

export async function generateQuiz(topic: string, notes: LearningNotes): Promise<Quiz> {
    const notesContent = notes.map(note => `## ${note.heading}\n${note.content}`).join('\n\n');
    const prompt = `You are a quiz master. Based on the following notes about "${topic}", create a 10-question multiple-choice quiz to test understanding. For each question, provide the question, 4 plausible options, the correct answer, and a brief explanation for the correct answer. Ensure the questions cover diverse key concepts from the notes. Structure your response as a valid JSON array, strictly following the provided schema.

    Here are the notes:
    ---
    ${notesContent}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedQuiz = JSON.parse(jsonText) as Quiz;
        if (!Array.isArray(parsedQuiz) || parsedQuiz.length === 0 || !parsedQuiz[0].question) {
            throw new Error("Received invalid quiz data from API.");
        }
        return parsedQuiz;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate a quiz for this topic. Please try again.");
    }
}

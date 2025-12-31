
import { GoogleGenAI } from "@google/genai";
import { ConversionSettings } from "../types";

export const generateTextFromImage = async (
  imageBase64: string,
  settings: ConversionSettings
): Promise<string> => {
  try {
    // Fix: Always initialize GoogleGenAI inside the call context to ensure up-to-date configuration
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct the prompt based on selected settings
    let promptInstructions = "Analyze the provided image and extract information. ";
    const activeSettings = [];

    if (settings.extractProjectStructure) {
      activeSettings.push("- Focus on extracting content relevant to Building Planning, Architecture, or Project Structures. Format this section as a Markdown document.");
    }
    if (settings.extractSourceCode) {
      activeSettings.push("- Identify any Code Snippets, syntax, or technical logic. Extract them accurately and wrap them in appropriate Markdown code blocks (e.g., ```javascript ... ```).");
    }
    if (settings.addDocumentation) {
      activeSettings.push("- Identify technical Jargon or specialized terms found in the image. Provide a specific 'Glossary' or README section that defines these terms and explains their context.");
    }
    if (settings.refactorForBestPractices) {
      activeSettings.push("- Ensure the entire output is strictly Organized. Use clear Heading levels (H1, H2, H3), bullet points, and numbered lists to structure the data logically.");
    }

    if (activeSettings.length === 0) {
      promptInstructions += "Provide a general detailed description and text extraction of the image content.";
    } else {
      promptInstructions += "Strictly follow these processing requirements:\n" + activeSettings.join("\n");
      promptInstructions += "\n\nCombine all enabled requirements into a single, cohesive, well-formatted Markdown response.";
    }

    // Clean base64 string if it contains metadata prefix
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Standard image format support
              data: base64Data,
            },
          },
          {
            text: promptInstructions,
          },
        ],
      },
    });

    // Fix: Access .text property directly as per latest @google/genai guidelines
    return response.text || "No text generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process image.");
  }
};

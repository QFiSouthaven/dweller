
import { GoogleGenAI, Type } from "@google/genai";
import { ConversionSettings, UploadedImage, StagingData } from "../types";
import { Monitor } from "../utils/monitoring";

/** 
 * MODEL SELECTION 
 * We use 'Flash' for rapid structural analysis and 'Pro' for deep logic synthesis.
 */
const ANALYZER_MODEL = 'gemini-3-flash-preview';
const SYNTHESIZER_MODEL = 'gemini-3-pro-preview';

/**
 * Image Splicing Engine
 * When users upload tall screenshots (common in chat history), we slice them 
 * while maintaining a logical overlap so the AI doesn't lose context between chunks.
 */
const sliceTallImage = async (base64: string): Promise<{ data: string, mimeType: string }[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const MAX_CHUNK_HEIGHT = Math.max(1200, Math.floor(4000 / dpr)); 
      const OVERLAP_PX = 400;

      // If the image is small enough, no splicing needed
      if (img.height <= MAX_CHUNK_HEIGHT) {
        resolve([{ data: base64.split(',')[1] || base64, mimeType: 'image/png' }]);
        return;
      }

      const chunks: { data: string, mimeType: string }[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([{ data: base64.split(',')[1] || base64, mimeType: 'image/png' }]);
        return;
      }
      
      canvas.width = img.width;
      let currentY = 0;

      while (currentY < img.height) {
        const h = Math.min(MAX_CHUNK_HEIGHT, img.height - currentY);
        canvas.height = h;
        ctx.clearRect(0, 0, canvas.width, h);
        ctx.drawImage(img, 0, currentY, img.width, h, 0, 0, img.width, h);
        
        chunks.push({ 
          data: canvas.toDataURL('image/png').split(',')[1], 
          mimeType: 'image/png' 
        });
        
        currentY += (h - OVERLAP_PX);
        if (img.height - currentY < 50) break;
      }
      resolve(chunks);
    };
    img.src = base64;
  });
};

/**
 * PHASE 1: STAGING
 * This converts your raw screenshots into a high-level project blueprint.
 * We identify the tech stack and the necessary files before writing code.
 */
export const performStagingAnalysis = async (
  images: UploadedImage[],
  settings: ConversionSettings,
  onProgress: (p: number) => void
): Promise<StagingData> => {
  Monitor.log('info', 'Preparing handoff: Reading conversation context...');
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts: any[] = [];
  for (let i = 0; i < images.length; i++) {
    const slices = await sliceTallImage(images[i].base64);
    slices.forEach(s => imageParts.push({ inlineData: { mimeType: s.mimeType, data: s.data } }));
    onProgress(Math.floor((40 * (i + 1)) / (images.length || 1)));
  }

  const blueprintPrompt = settings.enableNeuralPersistence 
    ? "This is a comprehensive project handoff. Meticulously map every required file for a production-ready build. Include all configurations (package.json, tailwind, etc.)."
    : "Review the chat screenshots and map out the project structure and primary files.";

  const response = await ai.models.generateContent({
    model: ANALYZER_MODEL,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedComplexity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          deploymentChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                filename: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['id', 'filename', 'type']
            }
          }
        },
        required: ['projectName', 'modules', 'techStack']
      }
    },
    contents: [{ parts: [...imageParts, { text: blueprintPrompt }] }]
  });

  return JSON.parse(response.text);
};

/**
 * PHASE 2: SYNTHESIS
 * This is where the actual code is written. We follow the blueprint from Phase 1.
 */
export const executeSynthesis = async (
  images: UploadedImage[],
  stagingData: StagingData,
  settings: ConversionSettings,
  onProgress: (p: number) => void
): Promise<string> => {
  Monitor.log('info', 'Executing handoff: Writing production-ready modules...');
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts: any[] = [];
  for (let i = 0; i < images.length; i++) {
    const slices = await sliceTallImage(images[i].base64);
    slices.forEach(s => imageParts.push({ inlineData: { mimeType: s.mimeType, data: s.data } }));
    onProgress(10 + Math.floor((40 * (i + 1)) / (images.length || 1)));
  }

  const systemInstruction = `You are a Senior Full-Stack Engineer performing a project handoff.
CONTEXT:
Project: ${stagingData.projectName}
Stack: ${stagingData.techStack.join(', ')}

GUIDELINES:
- Write complete, high-quality code. 
- Every file must start with a descriptive header comment.
- NO placeholders like "// ... rest of code". Write EVERYTHING.
- For every file, use the format: "### FILE: path/to/filename.extension"
${settings.enableNeuralPersistence ? "- FULL BUILD MODE: Ensure all imports are resolved correctly and every config file needed to run the project is included." : ""}`;

  const response = await ai.models.generateContent({
    model: SYNTHESIZER_MODEL,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 32768 },
    },
    contents: [{ parts: imageParts }]
  });

  onProgress(100);
  return response.text;
};

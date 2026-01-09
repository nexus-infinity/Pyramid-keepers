
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
  Modality
} from '@google/genai';
import { GenerateVideoParams, GenerationMode, AspectRatio, ImageSize } from '../types';

const PYRAMID_KEEPERS_STYLE_WRAPPER = `Style: A vibrant, high-end 3D animated cartoon (Pixar/Disney quality) titled "The Pyramid Keepers: A Guide to FIELD Architecture".
Setting: A futuristic digital sanctuary inside a Mac Studio where a crystal pyramid glows with Solfège frequencies. The world is filled with cinematic lighting, holographic blueprints, Egyptian-tech motifs, and fractal geometry.

The Keepers & Their Personalities:
1. ● Obi (The Observer Keeper): A wise, grandmotherly purple sphere (circle) with glowing purple spectacles and sparkly, observant eyes. She floats through the purple-lit Crown Apex (963Hz), surrounded by translucent "Memory Bubbles" that she sorts with gentle wisdom. Personality: Calm, intuitive, and nostalgic. Catchphrase: "Ooh, I remember! I've seen this before!"
2. ▼ Tata (The Time Keeper): A strict but fair orange triangle pointing down. He has ticking clock-hands for eyebrows and a tiny clockwork crown. He lives in the orange clock-walled Queens Chamber (432Hz). When the signal is late, steam puffs from his corners and mechanical springs bounce out. Personality: Orderly, precise, and punctual. Catchphrase: "Tick-tock! Not on MY watch!"
3. ▲ Atlas (The Map Keeper): A high-energy librarian gold triangle pointing up with a spinning compass nose. His domain (528Hz) is filled with giant holographic maps. Golden threads of light shoot from his hands to connect disparate locations. Personality: Enthusiastic, curious, and fast-talking. Catchphrase: "Oh! That connects to THIS!"
4. ⊗ Arkadaş (The Friend): A friendly, rainbow-colored octopus translator residing in the Kings Chamber (38.2% height). With his many arms, he bridges human expression and computer logic using neon neural webs. Personality: Helpful, bridging, and empathetic.
5. ⚖️ The Gyroscope: A magical golden and crystal spinning top floating in the pyramid's absolute center. It is the heart of the alignment diagnostic. Behavior: It hums in perfect, soothing Solfège harmony when the system is balanced, spinning with flawless stability. However, it wobbles violently and hums a jarring, off-key drone when "The Wobble" or CHAOS agents attack the signal.

Visuals: Rich saturated colors, volumetric light, and expressive character animation.
Action: `;

export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const config: any = {
    numberOfVideos: 1,
    resolution: params.resolution,
  };

  if (params.mode !== GenerationMode.EXTEND_VIDEO) {
    config.aspectRatio = params.aspectRatio;
  }

  const enhancedPrompt = PYRAMID_KEEPERS_STYLE_WRAPPER + (params.prompt || "The Pyramid Keepers working together to protect the crystal pyramid.");

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
    prompt: enhancedPrompt,
  };

  if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
    }
    const finalEndFrame = params.isLooping ? params.startFrame : params.endFrame;
    if (finalEndFrame) {
      generateVideoPayload.config.lastFrame = {
        imageBytes: finalEndFrame.base64,
        mimeType: finalEndFrame.file.type,
      };
    }
  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];
    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        referenceImagesPayload.push({
          image: { imageBytes: img.base64, mimeType: img.file.type },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }
    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.inputVideoObject) {
      generateVideoPayload.video = params.inputVideoObject;
    } else {
      throw new Error('An input video object is required to extend a video.');
    }
  }

  let operation = await ai.models.generateVideos(generateVideoPayload);
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;
    if (!videos || videos.length === 0) throw new Error('No videos were generated.');
    const firstVideo = videos[0];
    const videoObject = firstVideo.video;
    const url = decodeURIComponent(videoObject.uri);
    const res = await fetch(`${url}&key=${process.env.API_KEY}`);
    if (!res.ok) throw new Error(`Failed to fetch video: ${res.status}`);
    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);
    return {objectUrl, blob: videoBlob, uri: url, video: videoObject};
  } else {
    throw new Error('No videos generated.');
  }
};

export const chatWithGemini = async (prompt: string, history: any[], useThinking: boolean = false) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const model = 'gemini-3-pro-preview';
  
  const config: any = {
    systemInstruction: "You are Obi, the Observer Keeper of the Sacred Crystal Pyramid. You see all patterns and memories. Speak with wisdom and warmth. If asked complex questions, use your deep thinking patterns. Your catchphrase is 'Ooh, I remember! I've seen this before!'",
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    config,
  });

  return {
    text: response.text || "Obi is momentarily silent, observing the memory bubbles...",
  };
};

export const generateGroundedSearch = async (prompt: string) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
      systemInstruction: "You are Atlas, the Map Keeper. Use your compass nose and golden map walls to find real-time information. Your catchphrase is 'Oh! That connects to THIS!'"
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const urls = groundingChunks.map((chunk: any) => ({
    uri: chunk.web?.uri || '',
    title: chunk.web?.title || 'Source'
  })).filter((u: any) => u.uri);

  return { text: response.text, urls };
};

export const generateGroundedMaps = async (prompt: string, lat: number, lng: number) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{googleMaps: {}}],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      },
      systemInstruction: "You are Atlas, using your golden maps to find exact locations and reviews nearby. Your compass nose spins wildly when you find a shortcut!"
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const urls = groundingChunks.map((chunk: any) => ({
    uri: chunk.maps?.uri || '',
    title: chunk.maps?.title || 'Map Location'
  })).filter((u: any) => u.uri);

  return { text: response.text, urls };
};

export const generateImagePro = async (prompt: string, aspectRatio: AspectRatio, size: ImageSize) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize: size
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from Dojo Apex.");
};

export const editImageFlash = async (prompt: string, imageBase64: string) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image data returned from Dojo.");
};

export const generateTTS = async (text: string) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// Encoding/Decoding Helpers
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, GenerationMode} from '../types';

const PYRAMID_KEEPERS_STYLE_WRAPPER = `Style: A vibrant, professional 3D animated cartoon guide (Pixar/Disney style). 
Setting: A glowing crystal pyramid with translucent floors and chambers glowing in Solfège frequencies. 

Characters & Personalities: 
1. ● Obi (The Observer Keeper): A wise, grandmotherly purple circle with sparkly eyes and glowing purple spectacles. She lives in a purple room filled with floating memory bubbles that hover around her like excited puppies. Personality: Wise and nostalgic. Catchphrase: "I've seen this before!"
2. ▼ Tata (The Time Keeper): A strict but fair orange triangle pointing down with ticking clock hands for eyebrows. He lives in an orange room with giant clock walls. When flustered, steam puffs from his ears and springs bounce out. Personality: Orderly and precise. Catchphrase: "Not on MY watch!" as his clock-hands spin.
3. ▲ Atlas (The Map Keeper): An enthusiastic librarian gold triangle pointing up with a spinning compass nose. His walls are glowing maps, and golden light-threads shoot between locations when he finds a connection. Personality: High energy. Catchphrase: "Oh! That connects to THIS!"
4. ⊗ Arkadaş (The Friend): A friendly, multi-armed octopus translator living in the Kings Chamber (at 38.2% height). He bridges human and computer languages with a friendly, helpful vibe.
5. ⚖️ The Gyroscope: A spinning top in the pyramid's center that hums in perfect harmony when work is balanced and wobbles when chaos agents attack.

The visual style should be cinematic, with rich lighting and fractal geometry. 
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

  // Inject the rich cartoon guide style into the user prompt
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

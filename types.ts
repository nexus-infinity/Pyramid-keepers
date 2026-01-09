
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Video } from '@google/genai';

export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum KeeperTab {
  OBI = 'Obi', // Chat & Thinking
  TATA = 'Tata', // Video Gen & Analysis
  ATLAS = 'Atlas', // Maps & Search Grounding
  ARKADAS = 'Arkadaş', // Live Audio & TTS
  DOJO = 'Dojo', // Image Gen & Editing
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  A1_1 = '1:1',
  A3_4 = '3:4',
  A4_3 = '4:3',
  A9_16 = '9:16',
  A16_9 = '16:9',
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  EXTEND_VIDEO = 'Extend Video',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  inputVideoObject?: Video | null;
  isLooping?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingUrls?: {uri: string; title: string}[];
}

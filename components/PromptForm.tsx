
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
} from './icons';

const characterPresets = [
  { name: '● Obi', color: 'text-purple-400', desc: 'The Observer Keeper. Wise grandmother, purple circle, floating memory bubbles.' },
  { name: '▼ Tata', color: 'text-orange-400', desc: 'The Time Keeper. Strict clockwork grandfather, orange triangle, spinning clock hands.' },
  { name: '▲ Atlas', color: 'text-yellow-400', desc: 'The Map Keeper. Enthusiastic librarian, gold triangle, glowing map walls.' },
  { name: '⊗ Arkadaş', color: 'text-green-400', desc: 'The Brain. Friendly octopus translator with many arms, rainbow neural web.' },
  { name: '⚖️ Gyroscope', color: 'text-blue-400', desc: 'The Balance Watcher. A spinning top in the center of the pyramid. Hums in perfect harmony when balanced, but wobbles and hums off-key when CHAOS agents attack.' }
];

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) { resolve({file, base64} as T); } else { reject(new Error('Failed to read file as base64.')); }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> => fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> => fileToBase64<VideoFile>(file);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, image, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try { const img = await fileToImageFile(file); onSelect(img); } catch (e) { console.error(e); }
    }
    if (inputRef.current) inputRef.current.value = '';
  };
  if (image) {
    return (
      <div className="relative w-28 h-20 group">
        <img src={URL.createObjectURL(image.file)} alt="preview" className="w-full h-full object-cover rounded-xl border border-white/20" />
        <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => inputRef.current?.click()} className="w-28 h-20 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-xs text-gray-500">
      <PlusIcon className="w-5 h-5 mb-1" />
      <span>{label}</span>
      <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </button>
  );
};

const PromptForm: React.FC<{onGenerate: (p: GenerateVideoParams) => void, initialValues?: GenerateVideoParams | null}> = ({onGenerate, initialValues}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(initialValues?.model ?? VeoModel.VEO_FAST);
  // Fix: AspectRatio.LANDSCAPE replaced with AspectRatio.A16_9
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialValues?.aspectRatio ?? AspectRatio.A16_9);
  const [resolution, setResolution] = useState<Resolution>(initialValues?.resolution ?? Resolution.P720);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO);
  const [startFrame, setStartFrame] = useState<ImageFile | null>(initialValues?.startFrame ?? null);
  const [endFrame, setEndFrame] = useState<ImageFile | null>(initialValues?.endFrame ?? null);
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(initialValues?.referenceImages ?? []);
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(initialValues?.inputVideoObject ?? null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      // Fix: AspectRatio.LANDSCAPE replaced with AspectRatio.A16_9
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.A16_9);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
    }
  }, [initialValues]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  const addPreset = (desc: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + desc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      prompt, model, aspectRatio, resolution, mode: generationMode,
      startFrame, endFrame, referenceImages, inputVideoObject
    });
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {characterPresets.map(cp => (
          <button 
            key={cp.name}
            onClick={() => addPreset(cp.desc)}
            className={`px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold ${cp.color} hover:bg-white/10 transition-colors shadow-sm`}
          >
            {cp.name}
          </button>
        ))}
      </div>

      <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-orange-500 to-yellow-500 opacity-30"></div>
        
        {generationMode === GenerationMode.FRAMES_TO_VIDEO && (
          <div className="flex gap-4 mb-4 justify-center">
            <ImageUpload label="Start Frame" image={startFrame} onSelect={setStartFrame} onRemove={() => setStartFrame(null)} />
            <ImageUpload label="End Frame" image={endFrame} onSelect={setEndFrame} onRemove={() => setEndFrame(null)} />
          </div>
        )}

        {generationMode === GenerationMode.REFERENCES_TO_VIDEO && (
          <div className="flex gap-2 mb-4 justify-center overflow-x-auto pb-2">
            {referenceImages.map((img, i) => (
              <ImageUpload key={i} label="" image={img} onSelect={() => {}} onRemove={() => setReferenceImages(imgs => imgs.filter((_, idx) => idx !== i))} />
            ))}
            {referenceImages.length < 3 && <ImageUpload label="Add Ref" onSelect={img => setReferenceImages(prev => [...prev, img])} />}
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="relative">
             <button 
               type="button" 
               onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
               className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-indigo-400 transition-all border border-white/5"
             >
               <FilmIcon className="w-5 h-5" />
             </button>
             {isModeSelectorOpen && (
               <div className="absolute bottom-full left-0 mb-4 w-48 bg-black border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                 {[GenerationMode.TEXT_TO_VIDEO, GenerationMode.FRAMES_TO_VIDEO, GenerationMode.REFERENCES_TO_VIDEO].map(m => (
                   <button 
                     key={m} 
                     onClick={() => { setGenerationMode(m); setIsModeSelectorOpen(false); }}
                     className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-600 transition-colors border-b border-white/5 last:border-0"
                   >
                     {m}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe a Pyramid Keeper adventure...`}
            className="flex-grow bg-transparent focus:outline-none resize-none text-lg text-white placeholder-white/20 max-h-48 py-2 font-medium"
            rows={1}
          />

          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-3 rounded-2xl transition-all border border-white/5 ${isSettingsOpen ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={!prompt.trim() && generationMode !== GenerationMode.EXTEND_VIDEO}
            onClick={handleSubmit}
            className="p-3 bg-indigo-600 rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all"
          >
            <ArrowRightIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {isSettingsOpen && (
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Model</label>
                <select value={model} onChange={e => setModel(e.target.value as VeoModel)} className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white">
                  <option value={VeoModel.VEO_FAST}>Veo 3.1 Fast</option>
                  <option value={VeoModel.VEO}>Veo 3.1 Pro</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Aspect</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white">
                  {/* Fix: use AspectRatio.A16_9 and AspectRatio.A9_16 instead of LANDSCAPE/PORTRAIT */}
                  <option value={AspectRatio.A16_9}>16:9 (Landscape)</option>
                  <option value={AspectRatio.A9_16}>9:16 (Portrait)</option>
                </select>
             </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-[10px] text-white/20 font-mono tracking-tighter">VEO CORE • FIELD-ARCH-v1.0 • DOJO APEX</p>
      </div>
    </div>
  );
};

export default PromptForm;

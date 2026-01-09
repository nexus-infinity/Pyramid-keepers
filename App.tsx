
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useState, useRef } from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import { 
  generateVideo, 
  chatWithGemini, 
  generateGroundedSearch, 
  generateGroundedMaps,
  generateImagePro,
  editImageFlash,
  generateTTS,
  decodeBase64,
  decodeAudioData,
  encodeBase64
} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  KeeperTab,
  ChatMessage,
  AspectRatio,
  ImageSize,
  ImageFile
} from './types';
import { 
  ChatIcon, 
  VideoCameraIcon, 
  MapIcon, 
  MicIcon, 
  SparklesIcon, 
  BrainIcon, 
  SearchIcon, 
  VolumeIcon, 
  WandIcon, 
  SendIcon, 
  LoadingIcon,
  XMarkIcon,
  PlusIcon
} from './components/icons';
import { GoogleGenAI, Modality } from '@google/genai';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<KeeperTab>(KeeperTab.OBI);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  // Video States
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [lastVideoObject, setLastVideoObject] = useState<any>(null);

  // Chat/Grounding States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [groundingUrls, setGroundingUrls] = useState<{uri: string; title: string}[]>([]);

  // Dojo States
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [dojoImageInput, setDojoImageInput] = useState<ImageFile | null>(null);

  // Live States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        setShowApiKeyDialog(true);
      }
    };
    checkApiKey();
  }, []);

  const handleGenerateVideo = async (params: GenerateVideoParams) => {
    setAppState(AppState.LOADING);
    try {
      const { objectUrl, blob, video } = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setLastConfig(params);
      setAppState(AppState.SUCCESS);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setAppState(AppState.LOADING);

    try {
      const formattedHistory = chatHistory.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      const response = await chatWithGemini(currentInput, formattedHistory, isThinking);
      setChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
      setAppState(AppState.IDLE);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleAtlasSearch = async () => {
    if (!chatInput.trim()) return;
    setAppState(AppState.LOADING);
    try {
      const result = await generateGroundedSearch(chatInput);
      setChatHistory(prev => [...prev, { role: 'user', text: chatInput }, { role: 'model', text: result.text, groundingUrls: result.urls }]);
      setChatInput('');
      setAppState(AppState.IDLE);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleAtlasMaps = async () => {
    if (!chatInput.trim()) return;
    setAppState(AppState.LOADING);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const result = await generateGroundedMaps(chatInput, pos.coords.latitude, pos.coords.longitude);
        setChatHistory(prev => [...prev, { role: 'user', text: chatInput }, { role: 'model', text: result.text, groundingUrls: result.urls }]);
        setChatInput('');
        setAppState(AppState.IDLE);
      }, async () => {
        // Fallback or error if geoloc fails
        const result = await generateGroundedMaps(chatInput, 37.78193, -122.40476);
        setChatHistory(prev => [...prev, { role: 'user', text: chatInput }, { role: 'model', text: result.text, groundingUrls: result.urls }]);
        setChatInput('');
        setAppState(AppState.IDLE);
      });
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleDojoGenerate = async (aspect: AspectRatio, size: ImageSize) => {
    if (!chatInput.trim()) return;
    setAppState(AppState.LOADING);
    try {
      const url = await generateImagePro(chatInput, aspect, size);
      setGeneratedImageUrl(url);
      setAppState(AppState.SUCCESS);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleDojoEdit = async () => {
    if (!chatInput.trim() || !dojoImageInput) return;
    setAppState(AppState.LOADING);
    try {
      const url = await editImageFlash(chatInput, dojoImageInput.base64);
      setGeneratedImageUrl(url);
      setAppState(AppState.SUCCESS);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleArkadasLive = async () => {
    if (isLiveActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsLiveActive(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
    const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setIsLiveActive(true);
          const source = inputAudioCtx.createMediaStreamSource(stream);
          const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ 
              media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
            }));
          };
          source.connect(processor);
          processor.connect(inputAudioCtx.destination);
        },
        onmessage: async (msg) => {
          const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64) {
            nextStartTime = Math.max(nextStartTime, outputAudioCtx.currentTime);
            const buffer = await decodeAudioData(decodeBase64(base64), outputAudioCtx, 24000, 1);
            const source = outputAudioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputAudioCtx.destination);
            source.start(nextStartTime);
            nextStartTime += buffer.duration;
            sources.add(source);
          }
          if (msg.serverContent?.interrupted) {
            sources.forEach(s => s.stop());
            sources.clear();
            nextStartTime = 0;
          }
        },
        onclose: () => setIsLiveActive(false),
        onerror: () => setIsLiveActive(false)
      },
      config: { 
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
      }
    });

    liveSessionRef.current = await sessionPromise;
  };

  const handleArkadasTTS = async () => {
    if (!chatInput.trim()) return;
    setAppState(AppState.LOADING);
    try {
      const base64 = await generateTTS(chatInput);
      if (base64) {
        const ctx = new AudioContext({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
      setAppState(AppState.IDLE);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4338ca_0%,transparent_70%)]"></div>
      
      {showApiKeyDialog && <ApiKeyDialog onContinue={() => { setShowApiKeyDialog(false); window.aistudio.openSelectKey(); }} />}

      <header className="pt-8 pb-4 flex flex-col justify-center items-center px-8 relative z-20">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center bg-gradient-to-b from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] uppercase">
          Pyramid Keepers
        </h1>
        <nav className="flex flex-wrap justify-center gap-2 mt-6 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          {Object.values(KeeperTab).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setAppState(AppState.IDLE); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col p-4 relative z-10">
        {appState === AppState.LOADING ? (
          <div className="flex-grow flex items-center justify-center">
            <LoadingIndicator />
          </div>
        ) : (
          <div className="flex-grow flex flex-col gap-6">
            
            {/* OBI: Chat & Thinking */}
            {activeTab === KeeperTab.OBI && (
              <div className="flex-grow flex flex-col gap-4">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 h-[450px] overflow-y-auto space-y-4 backdrop-blur-sm">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <BrainIcon className="w-12 h-12 mb-4" />
                      <p>Consult Obi, the Observer. Patterns await...</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-white/5 border border-white/10'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 p-4 bg-white/5 rounded-[2rem] border border-white/10 items-center">
                  <button 
                    onClick={() => setIsThinking(!isThinking)}
                    className={`p-3 rounded-2xl transition-all ${isThinking ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500'}`}
                    title="Thinking Mode"
                  >
                    <SparklesIcon className="w-5 h-5" />
                  </button>
                  <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChat()}
                    placeholder="Ask Obi about patterns..." 
                    className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-white/20"
                  />
                  <button onClick={handleChat} className="p-3 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 transition-all">
                    <SendIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TATA: Video Gen */}
            {activeTab === KeeperTab.TATA && (
              <div className="flex-grow flex flex-col items-center gap-8">
                {appState === AppState.SUCCESS && videoUrl ? (
                  <VideoResult 
                    videoUrl={videoUrl} 
                    onRetry={() => handleGenerateVideo(lastConfig!)} 
                    onNewVideo={() => setAppState(AppState.IDLE)} 
                    onExtend={() => {}} 
                    canExtend={false} 
                  />
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <div className="py-20 opacity-20"><VideoCameraIcon className="w-24 h-24" /></div>
                    <PromptForm onGenerate={handleGenerateVideo} />
                  </div>
                )}
              </div>
            )}

            {/* ATLAS: Grounding */}
            {activeTab === KeeperTab.ATLAS && (
              <div className="flex-grow flex flex-col gap-4">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 h-[400px] overflow-y-auto space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20' : 'bg-white/5 border border-white/10'}`}>
                        <p className="text-sm">{msg.text}</p>
                        {msg.groundingUrls && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.groundingUrls.map((u, j) => (
                              <a key={j} href={u.uri} target="_blank" className="text-[10px] bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded-md hover:underline">{u.title}</a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                   <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Where are the best nearby pyramids?" 
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 text-lg"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAtlasSearch} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600/40 transition-all font-bold">
                      <SearchIcon className="w-4 h-4" /> Global Search
                    </button>
                    <button onClick={handleAtlasMaps} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/40 transition-all font-bold">
                      <MapIcon className="w-4 h-4" /> Nearby Maps
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ARKADAS: Live & TTS */}
            {activeTab === KeeperTab.ARKADAS && (
              <div className="flex-grow flex flex-col items-center justify-center gap-12">
                <div className={`relative w-48 h-48 flex items-center justify-center ${isLiveActive ? 'animate-pulse' : ''}`}>
                   <div className={`absolute inset-0 bg-indigo-600/20 rounded-full blur-3xl transition-opacity ${isLiveActive ? 'opacity-100' : 'opacity-0'}`}></div>
                   <button 
                    onClick={handleArkadasLive}
                    className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all ${isLiveActive ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'bg-indigo-600 hover:scale-105 shadow-2xl'}`}
                   >
                     {isLiveActive ? <XMarkIcon className="w-12 h-12 text-white" /> : <MicIcon className="w-12 h-12 text-white" />}
                     <span className="text-[10px] mt-2 font-black uppercase text-white/80">{isLiveActive ? 'Disconnect' : 'Live Voice'}</span>
                   </button>
                </div>
                
                <div className="w-full max-w-lg p-6 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col gap-4">
                  <h3 className="text-center text-xs font-mono text-indigo-400 uppercase tracking-widest">Speech Synthesis</h3>
                  <div className="flex gap-2">
                    <input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="Enter text to speak..." 
                      className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-white/20"
                    />
                    <button onClick={handleArkadasTTS} className="p-3 bg-white/10 rounded-xl text-white hover:bg-indigo-600 transition-all">
                      <VolumeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DOJO: Image Gen & Edit */}
            {activeTab === KeeperTab.DOJO && (
              <div className="flex-grow flex flex-col gap-6 items-center">
                {generatedImageUrl ? (
                   <div className="relative group max-w-xl w-full">
                     <img src={generatedImageUrl} className="w-full rounded-3xl border border-white/10 shadow-2xl" />
                     <button onClick={() => setGeneratedImageUrl(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-all">
                       <XMarkIcon className="w-5 h-5" />
                     </button>
                   </div>
                ) : (
                  <div className="w-full max-w-xl space-y-6">
                    <div className="flex justify-center gap-4">
                       <div className="w-48 h-32 bg-white/5 border border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                          {dojoImageInput ? (
                            <>
                              <img src={URL.createObjectURL(dojoImageInput.file)} className="w-full h-full object-cover" />
                              <button onClick={() => setDojoImageInput(null)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><XMarkIcon className="w-3 h-3" /></button>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center">
                              <PlusIcon className="w-6 h-6 mb-2 opacity-40" />
                              <span className="text-[10px] uppercase font-bold text-white/30">Input Image</span>
                              <input type="file" className="hidden" onChange={async e => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  const reader = new FileReader();
                                  reader.onload = () => setDojoImageInput({ file: f, base64: (reader.result as string).split(',')[1] });
                                  reader.readAsDataURL(f);
                                }
                              }} />
                            </label>
                          )}
                       </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                       <input 
                         value={chatInput} 
                         onChange={e => setChatInput(e.target.value)} 
                         placeholder="A crystal pyramid in a neon forest..." 
                         className="w-full bg-transparent border-none focus:ring-0 text-white text-xl placeholder-white/20"
                       />
                       <div className="flex gap-2">
                         <button onClick={() => handleDojoGenerate(AspectRatio.A1_1, ImageSize.K1)} className="flex-grow py-3 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                           <SparklesIcon className="w-4 h-4" /> Generate 1K
                         </button>
                         {dojoImageInput && (
                           <button onClick={handleDojoEdit} className="flex-grow py-3 bg-purple-600 rounded-xl text-white font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
                             <WandIcon className="w-4 h-4" /> Magic Edit
                           </button>
                         )}
                       </div>
                       <div className="flex gap-2 justify-center">
                         <button onClick={() => handleDojoGenerate(AspectRatio.A1_1, ImageSize.K2)} className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-white/40 hover:text-white transition-all">2K</button>
                         <button onClick={() => handleDojoGenerate(AspectRatio.A1_1, ImageSize.K4)} className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-white/40 hover:text-white transition-all">4K</button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      <footer className="p-8 text-center text-[10px] font-mono opacity-20 uppercase tracking-[0.3em] pointer-events-none">
        FIELD Architecture • DOJOSuite v2.5.0 • Sovereignty Layer Active
      </footer>
    </div>
  );
};

export default App;

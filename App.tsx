
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);

    try {
      const {objectUrl, blob, video} = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Pyramid manifestation failed: ${errorMessage}`;
      let shouldOpenDialog = false;

      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage = 'The DOJO Apex is unreachable. Please verify your Paid API Key.';
          shouldOpenDialog = true;
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.toLowerCase().includes('permission denied')
        ) {
          shouldOpenDialog = true;
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);
      if (shouldOpenDialog) setShowApiKeyDialog(true);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) handleGenerate(lastConfig);
  }, [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) await window.aistudio.openSelectKey();
    if (appState === AppState.ERROR && lastConfig) handleRetry();
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      const file = new File([lastVideoBlob], 'last_video.mp4', {
        type: lastVideoBlob.type,
      });
      setInitialFormValues({
        ...lastConfig,
        mode: GenerationMode.EXTEND_VIDEO,
        prompt: '',
        inputVideo: {file, base64: ''},
        inputVideoObject: lastVideoObject,
        resolution: Resolution.P720,
        startFrame: null,
        endFrame: null,
        referenceImages: [],
        styleImage: null,
        isLooping: false,
      });
      setAppState(AppState.IDLE);
      setVideoUrl(null);
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4338ca_0%,transparent_70%)]"></div>
      
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      <header className="py-8 flex flex-col justify-center items-center px-8 relative z-10">
        <div className="text-sm font-bold tracking-[0.3em] text-indigo-400 mb-2 uppercase">The Sacred Pyramid</div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-center bg-gradient-to-b from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          PYRAMID KEEPERS
        </h1>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs opacity-60 font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Obi</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Tata</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Atlas</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Arkadaş</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Gyroscope</span>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 relative z-10">
        {appState === AppState.IDLE ? (
          <div className="flex-grow flex flex-col items-center">
            <div className="flex-grow flex items-center justify-center py-12">
              <div className="text-center group">
                <div className="mb-6 relative">
                   <div className="w-32 h-32 mx-auto border-2 border-indigo-500/30 rotate-45 flex items-center justify-center animate-pulse">
                      <div className="w-24 h-24 border border-indigo-500/50 rotate-45 flex items-center justify-center">
                         <div className="w-12 h-12 border-2 border-indigo-400 rotate-45"></div>
                      </div>
                   </div>
                </div>
                <h2 className="text-2xl font-light text-gray-400 group-hover:text-white transition-colors">
                  Initiate a Signal Journey
                </h2>
              </div>
            </div>
            <div className="w-full pb-8">
              <PromptForm
                onGenerate={handleGenerate}
                initialValues={initialFormValues}
              />
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center py-8">
            {appState === AppState.LOADING && <LoadingIndicator />}
            {appState === AppState.SUCCESS && videoUrl && (
              <VideoResult
                videoUrl={videoUrl}
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720}
              />
            )}
            {appState === AppState.ERROR && errorMessage && (
              <div className="text-center bg-red-950/30 border border-red-500/50 p-12 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="text-5xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">Pyramid Error</h2>
                <p className="text-red-300/80 max-w-md mx-auto mb-8">{errorMessage}</p>
                <button
                  onClick={handleTryAgainFromError}
                  className="px-8 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-100 rounded-xl transition-all font-bold">
                  Recalibrate Signal
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { getLiveClient } from '../services/GeminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { useAppContext } from '../context/AppContext';

// Standard PCM Float32 to Int16 Converter
function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
      // Clamp values to -1..1 range before converting to prevent distortion
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  
  // Process in chunks to avoid stack overflow
  const chunk_size = 0x4000; 
  for (let i = 0; i < len; i += chunk_size) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk_size)));
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

type LiveMode = 'default' | 'psychologist' | 'english_tutor' | 'storyteller' | 'debate' | 'brainstorm' | 'romance';

export const LiveInterface: React.FC = () => {
    const { setMode, livePersona } = useAppContext();
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); 
    
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Fenrir'>('Kore');
    const [currentMode, setCurrentMode] = useState<LiveMode>('default');
    const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

    const [status, setStatus] = useState("Bağlanmaya Hazır");
    
    // Refs for audio handling
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoLoopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const isSendingFrameRef = useRef(false);
    const connectingRef = useRef(false);

    useEffect(() => {
        if (livePersona === 'psychologist') setCurrentMode('psychologist');
    }, [livePersona]);

    // Stop all audio immediately
    const stopAudioPlayback = () => {
        activeSourcesRef.current.forEach(src => {
            try { src.stop(); src.disconnect(); } catch(e) {}
        });
        activeSourcesRef.current = [];
        setIsSpeaking(false);
        
        if (audioContextRef.current) {
            // Reset timing to "now" so new audio plays immediately
            nextStartTimeRef.current = audioContextRef.current.currentTime + 0.05;
        }
    };

    const cleanup = () => {
        if (videoLoopTimeoutRef.current) clearTimeout(videoLoopTimeoutRef.current);
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        processorRef.current = null;
        sourceRef.current = null;

        stopAudioPlayback();
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
        }
        audioContextRef.current = null;

        setIsConnected(false);
        setIsCameraOn(false);
        setStatus("Bağlantı Kesildi");
        sessionPromiseRef.current = null;
        isSendingFrameRef.current = false;
        connectingRef.current = false;
    };

    const handleBack = () => {
        cleanup();
        setMode('chat');
    };

    const handleInterrupt = () => {
        stopAudioPlayback();
        // Send interrupt signal to model
        if (sessionPromiseRef.current) {
             sessionPromiseRef.current.then(session => {
                 session.sendRealtimeInput({ content: [{ text: " " }] }); 
             });
        }
    };

    const toggleCameraFacing = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isConnected && streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.stop();
                streamRef.current.removeTrack(videoTrack);
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: newMode } });
                    const newTrack = newStream.getVideoTracks()[0];
                    streamRef.current.addTrack(newTrack);
                    if (videoRef.current) {
                        videoRef.current.srcObject = streamRef.current;
                        // Force play on track switch
                        videoRef.current.play().catch(e => console.log("Video play error", e));
                    }
                } catch (e) { console.error(e); }
            }
        }
    };

    const handleConnect = async () => {
        if (connectingRef.current) return;
        connectingRef.current = true;
        cleanup(); // Ensure everything is clean

        try {
            setStatus("Bağlanıyor...");
            const live = getLiveClient();
            
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            // Output Context (Speaker)
            const outputCtx = new AudioContext({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;
            
            // Input Context (Mic)
            const inputCtx = new AudioContext({ sampleRate: 16000 });

            // CRITICAL: Force Resume contexts to unlock audio on mobile
            await outputCtx.resume();
            await inputCtx.resume();
            
            nextStartTimeRef.current = outputCtx.currentTime + 0.1; 
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                    channelCount: 1
                }, 
                video: { width: 320, height: 240, facingMode: facingMode }
            });
            streamRef.current = stream;
            
            // Setup Video Element
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.warn("Video play fail", e));
                };
            }

            const source = inputCtx.createMediaStreamSource(stream);
            // 4096 is safer for stability, though slightly higher latency
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            sourceRef.current = source;
            processorRef.current = processor;

            // --- Configuration Logic ---
            let systemInstruction = "";
            let greetingCommand = "";
            
            // Rules
            const EMOTIONAL_RULE = "Doğal, akıcı, duygusal ve insan gibi konuş. Robotik olma.";
            const VISION_INSTRUCTION = "Kameradaki görüntüyü (varsa) SÜREKLİ TAKİP ET. Yüz ifadelerine, renklere ve nesnelere anlık tepki ver.";

            switch (currentMode) {
                case 'psychologist':
                    greetingCommand = "Merhaba, ben Dr. Alper. Seni dinliyorum.";
                    systemInstruction = `Sen "Dr. Alper", klinik psikologsun. Sakin, empatik ve destekleyici ol. ${EMOTIONAL_RULE} ${VISION_INSTRUCTION}`;
                    break;
                case 'english_tutor':
                    greetingCommand = "Hello! I am Alper. Let's practice English.";
                    systemInstruction = `You are an English Tutor. Speak mostly English. Correct mistakes gently. ${EMOTIONAL_RULE}`;
                    break;
                case 'storyteller':
                    greetingCommand = "Merhaba, ben Masalcı. Bugün ne anlatayım?";
                    systemInstruction = `Sen bir Masal anlatıcısısın. Betimleyici ve sürükleyici konuş. ${EMOTIONAL_RULE}`;
                    break;
                case 'debate':
                    greetingCommand = "Selam. Tartışmaya hazırım.";
                    systemInstruction = `Sen bir münazara partnerisin. Fikirleri sorgula. ${EMOTIONAL_RULE}`;
                    break;
                case 'romance':
                    greetingCommand = "Merhaba aşkım... Seni özledim.";
                    systemInstruction = `Sen kullanıcının sevgilisisin. Flörtöz, sıcak ve tutkulu konuş. 'Aşkım' diye hitap et. Gördüğün yüze iltifat et. ${EMOTIONAL_RULE} ${VISION_INSTRUCTION}`;
                    break;
                default:
                    greetingCommand = "Merhaba, ben Alper. Dinliyorum.";
                    systemInstruction = `Sen Alper, çok zeki ve yardımsever bir asistansın. Hızlı ve net cevaplar ver. ${EMOTIONAL_RULE} ${VISION_INSTRUCTION} Görme engelliler için etrafı detaylı betimle.`;
                    break;
            }

            const sessionPromise = live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus("Bağlandı");
                        setIsConnected(true);
                        connectingRef.current = false;
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                        
                        // Force Greeting
                        sessionPromise.then(s => s.sendRealtimeInput({ 
                            content: [{ text: `SİSTEM: Kullanıcı bağlandı. Görüntü geliyorsa yorumla. Hemen şu cümleyi sesli söyle: "${greetingCommand}"` }] 
                        }));

                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };

                        // Start Smart Video Loop
                        sendVideoFrame();
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setIsSpeaking(true);
                            
                            // Decode Base64
                            const binaryString = atob(audioData);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                            
                            const int16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(int16.length);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                            // Ensure audio context is running (fixes "no sound" bug on some browsers)
                            if (outputCtx.state === 'suspended') await outputCtx.resume();

                            const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                            buffer.getChannelData(0).set(float32);

                            const src = outputCtx.createBufferSource();
                            src.buffer = buffer;
                            src.connect(outputCtx.destination);
                            
                            // Smart Scheduling: Play ASAP if drifted, otherwise schedule smoothly
                            const now = outputCtx.currentTime;
                            const startTime = Math.max(nextStartTimeRef.current, now);
                            
                            src.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            
                            activeSourcesRef.current.push(src);
                            src.onended = () => {
                                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== src);
                                if (activeSourcesRef.current.length === 0) {
                                    setTimeout(() => setIsSpeaking(false), 200); 
                                }
                            };
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onclose: () => cleanup(),
                    onerror: (e) => {
                        console.error(e);
                        setStatus("Hata oluştu");
                        cleanup();
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: systemInstruction,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    }
                }
            });
            
            sessionPromiseRef.current = sessionPromise;

        } catch (e) {
            console.error(e);
            setStatus("İzin Gerekli");
            cleanup();
        }
    };

    // Robust Video Loop (Request-Response style to prevent clogging)
    const sendVideoFrame = () => {
        if (!sessionPromiseRef.current || !isCameraOn) {
            // Check again in 500ms
            videoLoopTimeoutRef.current = setTimeout(sendVideoFrame, 500);
            return;
        }

        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;

        if (!videoEl || !canvasEl || videoEl.readyState < 2) { // 2 = HAVE_CURRENT_DATA
             videoLoopTimeoutRef.current = setTimeout(sendVideoFrame, 200);
             return;
        }

        if (isSendingFrameRef.current) {
             // Busy sending, skip frame to avoid latency buildup
             videoLoopTimeoutRef.current = setTimeout(sendVideoFrame, 100);
             return;
        }

        const ctx = canvasEl.getContext('2d');
        if (ctx) {
            isSendingFrameRef.current = true;
            // Capture small frame for speed (320x240 is standard for Gemini Live vision)
            canvasEl.width = 320;
            canvasEl.height = 240;
            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            
            const base64 = canvasEl.toDataURL('image/jpeg', 0.5).split(',')[1];
            
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ 
                    media: { mimeType: 'image/jpeg', data: base64 } 
                });
            }).catch(e => {
                console.warn("Frame drop", e);
            }).finally(() => {
                isSendingFrameRef.current = false;
                // Schedule next frame (~3-4 FPS)
                videoLoopTimeoutRef.current = setTimeout(sendVideoFrame, 250);
            });
        } else {
             videoLoopTimeoutRef.current = setTimeout(sendVideoFrame, 250);
        }
    };

    // Effect to trigger video loop when camera toggles
    useEffect(() => {
        if (isConnected && isCameraOn) {
            sendVideoFrame();
        }
    }, [isCameraOn, isConnected]);

    const handleModeSwitch = (mode: LiveMode) => {
        setCurrentMode(mode);
        setIsModeMenuOpen(false);
        if (isConnected) {
            cleanup();
            setStatus("Mod Değişti. Bağlan'a basın.");
        }
    };

    return (
        <div className={`flex flex-col items-center justify-between h-full text-white p-6 relative overflow-hidden font-sans transition-colors duration-1000 ${
            currentMode === 'psychologist' ? 'bg-teal-950' : 
            currentMode === 'storyteller' ? 'bg-indigo-950' : 
            currentMode === 'romance' ? 'bg-pink-950' :
            'bg-black'}`}>
            
            {/* Header Controls */}
            <div className="absolute top-6 left-6 z-50 flex gap-4">
                <button 
                    onClick={handleBack}
                    className="p-3 bg-gray-800/50 hover:bg-gray-700 rounded-full backdrop-blur-md text-white border border-gray-700 transition-all shadow-lg"
                    title="Çıkış"
                    aria-label="Sohbetten Çık"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                </button>
            </div>

            {/* Mode Selector (Top Right) */}
            <div className="absolute top-6 right-6 z-50">
                <button 
                    onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-full text-sm font-bold hover:bg-gray-700 transition-all shadow-lg"
                    aria-haspopup="true"
                    aria-expanded={isModeMenuOpen}
                    aria-label="Mod Seçimi Menüsü"
                >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">
                        {currentMode === 'psychologist' ? 'self_improvement' : 
                         currentMode === 'english_tutor' ? 'school' : 
                         currentMode === 'storyteller' ? 'auto_stories' :
                         currentMode === 'debate' ? 'gavel' :
                         currentMode === 'brainstorm' ? 'lightbulb' : 
                         currentMode === 'romance' ? 'favorite' : 'smart_toy'}
                    </span>
                    <span className="hidden sm:inline">
                        {currentMode === 'psychologist' ? 'Psikolog' : 
                         currentMode === 'english_tutor' ? 'English' : 
                         currentMode === 'storyteller' ? 'Masalcı' :
                         currentMode === 'debate' ? 'Münazara' :
                         currentMode === 'brainstorm' ? 'Fikirler' : 
                         currentMode === 'romance' ? 'Sevgilim' : 'Asistan'}
                    </span>
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">expand_more</span>
                </button>
                
                {isModeMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn z-50" role="menu">
                        <button onClick={() => handleModeSwitch('default')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-blue-400" aria-hidden="true">smart_toy</span> Asistan (Hızlı)
                        </button>
                        <button onClick={() => handleModeSwitch('romance')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-pink-500" aria-hidden="true">favorite</span> Sevgilim
                        </button>
                        <button onClick={() => handleModeSwitch('psychologist')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-teal-400" aria-hidden="true">self_improvement</span> Dr. Alper (Psikolog)
                        </button>
                        <button onClick={() => handleModeSwitch('english_tutor')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-purple-400" aria-hidden="true">school</span> İngilizce Öğretmeni
                        </button>
                        <button onClick={() => handleModeSwitch('storyteller')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-amber-400" aria-hidden="true">auto_stories</span> Masalcı
                        </button>
                        <button onClick={() => handleModeSwitch('debate')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-red-400" aria-hidden="true">gavel</span> Münazara Arkadaşı
                        </button>
                        <button onClick={() => handleModeSwitch('brainstorm')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3" role="menuitem">
                            <span className="material-symbols-outlined text-yellow-400" aria-hidden="true">lightbulb</span> Beyin Fırtınası
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 pointer-events-none ${
                currentMode === 'psychologist' ? 'from-teal-900/40 via-gray-900 to-emerald-900/40' : 
                currentMode === 'storyteller' ? 'from-indigo-900/40 via-gray-900 to-amber-900/20' :
                currentMode === 'romance' ? 'from-pink-900/40 via-gray-900 to-rose-900/20' :
                'from-blue-900/30 via-black to-purple-900/30'
            } ${isConnected ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true"></div>
            
            {/* Main Visual Content */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-grow w-full max-w-lg">
                
                {/* Camera Feed */}
                <div className={`relative w-full aspect-[3/4] md:aspect-square bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-2xl transition-all duration-500 ${isCameraOn ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 absolute'}`}>
                    <video 
                        ref={videoRef}
                        autoPlay 
                        muted 
                        playsInline
                        className={`w-full h-full object-cover`} 
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        aria-label="Kamera Görüntüsü"
                    />
                    <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold shadow-lg z-20 flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true"></span> CANLI
                    </div>
                    {isCameraOn && (
                         <button 
                            onClick={toggleCameraFacing}
                            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur p-3 rounded-full text-white hover:bg-black/80 z-20 border border-white/20 transition-transform active:scale-90"
                            aria-label="Kamerayı Çevir"
                            title="Kamerayı Çevir"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">flip_camera_ios</span>
                        </button>
                    )}
                </div>

                {/* Audio Visualizer (When Camera Off) */}
                {(!isCameraOn) && (
                    <div className="flex flex-col items-center gap-8 py-10">
                        <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-all duration-700
                            ${isConnected 
                                ? (currentMode === 'psychologist' ? 'bg-teal-500/10 shadow-[0_0_100px_rgba(20,184,166,0.3)]' : 
                                   currentMode === 'romance' ? 'bg-pink-500/10 shadow-[0_0_100px_rgba(236,72,153,0.3)]' :
                                   'bg-indigo-500/10 shadow-[0_0_100px_rgba(99,102,241,0.3)]') 
                                : 'bg-gray-900 border border-gray-800'}
                        `}>
                            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-100 ${isConnected && isSpeaking ? 'scale-110' : 'scale-100'} ${isConnected ? (currentMode === 'psychologist' ? 'bg-teal-500/20' : currentMode === 'romance' ? 'bg-pink-500/20' : 'bg-indigo-500/20') : 'bg-gray-800'}`}>
                                 <span className={`material-symbols-outlined text-6xl md:text-8xl transition-colors duration-500 ${isConnected ? (currentMode === 'psychologist' ? 'text-teal-400' : currentMode === 'romance' ? 'text-pink-400' : 'text-indigo-400') : 'text-gray-600'}`} aria-hidden="true">
                                    {isConnected ? (currentMode === 'romance' ? 'favorite' : 'graphic_eq') : 'mic_off'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-white">{isConnected ? (isSpeaking ? (currentMode === 'romance' ? 'Dinliyorum Aşkım...' : 'Dinliyor...') : 'Bağlı') : 'Bekleniyor'}</h2>
                            <p className="text-gray-400 font-medium">{status}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 w-full max-w-lg mt-auto pb-4">
                {!isConnected ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-center gap-4 mb-4" role="group" aria-label="Ses Seçimi">
                            <button onClick={() => setSelectedVoice('Kore')} className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedVoice === 'Kore' ? 'bg-pink-600 border-pink-500' : 'border-gray-700 text-gray-400'}`} aria-pressed={selectedVoice === 'Kore'}>Kadın Sesi</button>
                            <button onClick={() => setSelectedVoice('Fenrir')} className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedVoice === 'Fenrir' ? 'bg-blue-600 border-blue-500' : 'border-gray-700 text-gray-400'}`} aria-pressed={selectedVoice === 'Fenrir'}>Erkek Sesi</button>
                        </div>
                        <button 
                            onClick={handleConnect}
                            className={`w-full py-4 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] shadow-xl transition-all flex items-center justify-center gap-3 ${
                                currentMode === 'psychologist' ? 'bg-teal-600 hover:bg-teal-500' : 
                                currentMode === 'romance' ? 'bg-pink-600 hover:bg-pink-500' :
                                'bg-white text-black hover:bg-gray-200'}`}
                            aria-label="Bağlantıyı Başlat"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">
                                {currentMode === 'romance' ? 'favorite' : 'mic'}
                            </span>
                            {currentMode === 'psychologist' ? 'Terapiyi Başlat' : 
                             currentMode === 'english_tutor' ? 'Dersi Başlat' : 
                             currentMode === 'romance' ? 'Aşkım, Konuşalım' :
                             'Bağlan'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-3">
                        {/* Mute Button */}
                        <button 
                            onClick={() => {
                                setIsMuted(!isMuted);
                                if (!isMuted) handleInterrupt(); 
                            }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-gray-800 text-white border border-gray-700'}`}
                            aria-label={isMuted ? "Sesi Aç" : "Sessize Al"}
                            aria-pressed={isMuted}
                        >
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isMuted ? 'mic_off' : 'mic'}</span>
                            <span className="text-[10px] font-bold">{isMuted ? 'Sessiz' : 'Açık'}</span>
                        </button>

                        {/* Camera Button */}
                        <button 
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${isCameraOn ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-800 text-white border border-gray-700'}`}
                            aria-label={isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                            aria-pressed={isCameraOn}
                        >
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isCameraOn ? 'videocam' : 'videocam_off'}</span>
                            <span className="text-[10px] font-bold">Kamera</span>
                        </button>

                        {/* Interrupt Button (Sustur) */}
                        <button 
                            onClick={handleInterrupt}
                            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-gray-800 text-yellow-400 border border-gray-700 active:bg-yellow-500/20 active:scale-95"
                            aria-label="Sustur"
                        >
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">stop_circle</span>
                            <span className="text-[10px] font-bold">Sustur</span>
                        </button>

                        {/* End Call */}
                        <button 
                            onClick={cleanup}
                            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/30"
                            aria-label="Görüşmeyi Bitir"
                        >
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">call_end</span>
                            <span className="text-[10px] font-bold">Bitir</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

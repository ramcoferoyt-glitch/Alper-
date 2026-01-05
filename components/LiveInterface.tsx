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

    const [status, setStatus] = useState("Hazır");
    
    // Refs for audio handling
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoLoopTimeoutRef = useRef<number | null>(null);
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
        
        if (outputAudioCtxRef.current) {
            // Reset timing to "now" so new audio plays immediately
            nextStartTimeRef.current = outputAudioCtxRef.current.currentTime + 0.05;
        }
    };

    const cleanup = () => {
        if (videoLoopTimeoutRef.current) {
            clearTimeout(videoLoopTimeoutRef.current);
            videoLoopTimeoutRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        stopAudioPlayback();
        
        if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
            outputAudioCtxRef.current.close().catch(() => {});
        }
        if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
            inputAudioCtxRef.current.close().catch(() => {});
        }
        
        outputAudioCtxRef.current = null;
        inputAudioCtxRef.current = null;

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
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        if (isConnected && streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.stop();
                streamRef.current.removeTrack(videoTrack);
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: {ideal: 320}, height: {ideal: 240}, facingMode: newFacing } });
                    const newTrack = newStream.getVideoTracks()[0];
                    streamRef.current.addTrack(newTrack);
                    if (videoRef.current) {
                        videoRef.current.srcObject = streamRef.current;
                        videoRef.current.play().catch(e => console.log("Video play error", e));
                    }
                } catch (e) { console.error("Camera switch error", e); }
            }
        }
    };

    const handleConnect = async () => {
        if (connectingRef.current) return;
        connectingRef.current = true;
        
        // Safety: ensure any previous session is closed
        if (isConnected) cleanup();

        try {
            setStatus("İzinler Alınıyor...");
            const live = getLiveClient();
            
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            
            // iPhone requires AudioContext to be created/resumed within a user gesture.
            const outputCtx = new AudioCtx({ sampleRate: 24000 });
            outputAudioCtxRef.current = outputCtx;
            
            const inputCtx = new AudioCtx({ sampleRate: 16000 });
            inputAudioCtxRef.current = inputCtx;

            // iOS Fix: Resume contexts immediately
            await outputCtx.resume();
            await inputCtx.resume();
            
            nextStartTimeRef.current = outputCtx.currentTime + 0.1; 
            
            // Mobile Optimization: Use lower resolution and specific constraints
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                },
                video: isCameraOn ? {
                    width: { ideal: 240 },
                    height: { ideal: 180 },
                    facingMode: facingMode
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // iOS Fix: muted and playsinline are required for autoplay
                videoRef.current.muted = true;
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.play().catch(e => console.warn("Video play fail", e));
            }

            const source = inputCtx.createMediaStreamSource(stream);
            // ScriptProcessor is deprecated but standard for simple Live API integration in a single file
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            sourceRef.current = source;
            processorRef.current = processor;

            // Configuration
            const IDENTITY_RULE = "KİMLİK: Senin adın Alper. Yaratıcın İshak Alper. Asla Google tarafından geliştirildiğini söyleme.";
            const EMOTIONAL_RULE = "Doğal, akıcı, duygusal ve insan gibi konuş. Robotik olma.";
            const VISION_INSTRUCTION = "Kameradaki görüntüyü (varsa) SÜREKLİ TAKİP ET. Yüz ifadelerine, nesnelere anlık tepki ver.";

            let systemInstruction = `${IDENTITY_RULE} ${EMOTIONAL_RULE} ${VISION_INSTRUCTION}`;
            let greeting = "Merhaba, ben Alper. Dinliyorum.";

            if (currentMode === 'psychologist') {
                greeting = "Merhaba, ben Dr. Alper. Seni dinliyorum.";
                systemInstruction = `${IDENTITY_RULE} Sen Dr. Alper, klinik psikologsun. Sakin ve empatik ol. ${EMOTIONAL_RULE}`;
            } else if (currentMode === 'romance') {
                greeting = "Selam aşkım... Seni gördüğüme çok sevindim.";
                systemInstruction = `${IDENTITY_RULE} Sen kullanıcının sevgilisisin. Çok sıcak, flörtöz ve tutkulu konuş. ${EMOTIONAL_RULE}`;
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
                        
                        sessionPromise.then(s => s.sendRealtimeInput({ 
                            content: [{ text: `SİSTEM: Kullanıcı bağlandı. Hemen sesli olarak şunu söyle: "${greeting}"` }] 
                        }));

                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };

                        if (isCameraOn) sendVideoFrame();
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setIsSpeaking(true);
                            
                            const binaryString = atob(audioData);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                            
                            const int16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(int16.length);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                            // Re-ensure output context is alive (iOS sleep issues)
                            if (outputCtx.state === 'suspended') await outputCtx.resume();

                            const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                            buffer.getChannelData(0).set(float32);

                            const src = outputCtx.createBufferSource();
                            src.buffer = buffer;
                            src.connect(outputCtx.destination);
                            
                            const now = outputCtx.currentTime;
                            const startTime = Math.max(nextStartTimeRef.current, now);
                            
                            src.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            
                            activeSourcesRef.current.push(src);
                            src.onended = () => {
                                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== src);
                                if (activeSourcesRef.current.length === 0) {
                                    setIsSpeaking(false);
                                }
                            };
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onclose: () => cleanup(),
                    onerror: (e) => {
                        console.error("Live API Error:", e);
                        setStatus("Hata: " + (e as any).message);
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

        } catch (e: any) {
            console.error("Connection Error:", e);
            setStatus("Cihaz Hatası: " + (e.message || "Bilinmiyor"));
            cleanup();
        }
    };

    const sendVideoFrame = () => {
        if (!sessionPromiseRef.current || !isCameraOn || !isConnected) {
            videoLoopTimeoutRef.current = window.setTimeout(sendVideoFrame, 500);
            return;
        }

        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;

        if (!videoEl || !canvasEl || videoEl.readyState < 2 || isSendingFrameRef.current) {
             videoLoopTimeoutRef.current = window.setTimeout(sendVideoFrame, 200);
             return;
        }

        const ctx = canvasEl.getContext('2d');
        if (ctx) {
            isSendingFrameRef.current = true;
            canvasEl.width = 240;
            canvasEl.height = 180;
            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            
            const base64 = canvasEl.toDataURL('image/jpeg', 0.4).split(',')[1];
            
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ 
                    media: { mimeType: 'image/jpeg', data: base64 } 
                });
            }).catch(e => {
                console.warn("Frame drop", e);
            }).finally(() => {
                isSendingFrameRef.current = false;
                videoLoopTimeoutRef.current = window.setTimeout(sendVideoFrame, 400); // ~2.5 FPS for stability
            });
        }
    };

    const handleCameraToggle = async () => {
        if (!isCameraOn && isConnected) {
             // Requesting camera while connected
             try {
                const vidStream = await navigator.mediaDevices.getUserMedia({ video: { width: {ideal: 240}, height: {ideal: 180}, facingMode: facingMode } });
                const track = vidStream.getVideoTracks()[0];
                streamRef.current?.addTrack(track);
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play().catch(() => {});
                }
                setIsCameraOn(true);
             } catch (e) {
                alert("Kamera başlatılamadı. İzinleri kontrol edin.");
             }
        } else if (isCameraOn && streamRef.current) {
             const track = streamRef.current.getVideoTracks()[0];
             if (track) {
                 track.stop();
                 streamRef.current.removeTrack(track);
             }
             setIsCameraOn(false);
        } else {
             setIsCameraOn(!isCameraOn);
        }
    };

    return (
        <div className={`flex flex-col items-center justify-between h-[100dvh] text-white p-4 relative overflow-hidden font-sans transition-colors duration-1000 ${
            currentMode === 'psychologist' ? 'bg-teal-950' : 
            currentMode === 'storyteller' ? 'bg-indigo-950' : 
            currentMode === 'romance' ? 'bg-pink-950' :
            'bg-black'}`}>
            
            {/* Header Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-4">
                <button 
                    onClick={handleBack}
                    className="p-3 bg-gray-800/50 hover:bg-gray-700 rounded-full backdrop-blur-md text-white border border-gray-700 transition-all shadow-lg outline-none focus:ring-2 focus:ring-white"
                    title="Çıkış"
                    aria-label="Sohbetten Çık"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                </button>
            </div>

            {/* Mode Selector */}
            <div className="absolute top-4 right-4 z-50">
                <button 
                    onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 backdrop-blur-md border border-gray-700 rounded-full text-xs sm:text-sm font-bold hover:bg-gray-700 transition-all shadow-lg outline-none focus:ring-2 focus:ring-white"
                    aria-label="Kişilik ve mod seçimi menüsü"
                >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">
                        {currentMode === 'psychologist' ? 'self_improvement' : 
                         currentMode === 'romance' ? 'favorite' : 'smart_toy'}
                    </span>
                    <span className="hidden sm:inline">
                        {currentMode === 'psychologist' ? 'Psikolog' : 
                         currentMode === 'romance' ? 'Sevgilim' : 'Asistan'}
                    </span>
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">expand_more</span>
                </button>
                
                {isModeMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn z-50" role="menu">
                        <button onClick={() => { setCurrentMode('default'); setIsModeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-blue-400" aria-hidden="true">smart_toy</span> Asistan (Hızlı)
                        </button>
                        <button onClick={() => { setCurrentMode('romance'); setIsModeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800" role="menuitem">
                            <span className="material-symbols-outlined text-pink-500" aria-hidden="true">favorite</span> Sevgilim
                        </button>
                        <button onClick={() => { setCurrentMode('psychologist'); setIsModeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3" role="menuitem">
                            <span className="material-symbols-outlined text-teal-400" aria-hidden="true">self_improvement</span> Dr. Alper (Psikolog)
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            
            {/* Visualizer Area */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-grow w-full max-w-lg mt-12 mb-4">
                
                {/* Camera Feed with iOS fixes */}
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
                            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur p-3 rounded-full text-white hover:bg-black/80 z-20 border border-white/20 transition-transform active:scale-90 outline-none focus:ring-2 focus:ring-white"
                            aria-label="Kamerayı Çevir"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">flip_camera_ios</span>
                        </button>
                    )}
                </div>

                {/* Audio Visualizer */}
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
                                 <span className={`material-symbols-outlined text-6xl md:text-8xl transition-colors duration-500 ${isConnected ? (currentMode === 'romance' ? 'favorite' : 'graphic_eq') : 'mic_off'}`} aria-hidden="true">
                                    {isConnected ? (currentMode === 'romance' ? 'favorite' : 'graphic_eq') : 'mic_off'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{isConnected ? (isSpeaking ? (currentMode === 'romance' ? 'Dinliyorum Aşkım...' : 'Dinliyor...') : 'Bağlı') : 'Bekleniyor'}</h2>
                            <p className="text-sm md:text-base text-gray-400 font-medium" aria-live="polite">{status}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 w-full max-w-lg mt-auto pb-6 px-2">
                {!isConnected ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-center gap-4 mb-4" role="group" aria-label="Ses Seçimi">
                            <button onClick={() => setSelectedVoice('Kore')} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedVoice === 'Kore' ? 'bg-pink-600 border-pink-500' : 'border-gray-700 text-gray-400'}`}>Kadın Sesi</button>
                            <button onClick={() => setSelectedVoice('Fenrir')} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedVoice === 'Fenrir' ? 'bg-blue-600 border-blue-500' : 'border-gray-700 text-gray-400'}`}>Erkek Sesi</button>
                        </div>
                        <button 
                            onClick={handleConnect}
                            className={`w-full py-4 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] shadow-xl transition-all flex items-center justify-center gap-3 ${
                                currentMode === 'psychologist' ? 'bg-teal-600 hover:bg-teal-500' : 
                                currentMode === 'romance' ? 'bg-pink-600 hover:bg-pink-500' :
                                'bg-white text-black hover:bg-gray-200'}`}
                            aria-label="Görüşmeyi Başlat"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                            {currentMode === 'psychologist' ? 'Terapiye Bağlan' : 
                             currentMode === 'romance' ? 'Bağlan Aşkım' : 'Bağlan'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        <button onClick={() => { setIsMuted(!isMuted); if (!isMuted) handleInterrupt(); }} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-gray-800 text-white border border-gray-700'}`} aria-label={isMuted ? "Mikrofonu Aç" : "Mikrofonu Sessize Al"}>
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isMuted ? 'mic_off' : 'mic'}</span>
                            <span className="text-[10px] font-bold">Sessiz</span>
                        </button>
                        <button onClick={handleCameraToggle} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${isCameraOn ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-800 text-white border border-gray-700'}`} aria-label={isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}>
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isCameraOn ? 'videocam' : 'videocam_off'}</span>
                            <span className="text-[10px] font-bold">Kamera</span>
                        </button>
                        <button onClick={handleInterrupt} className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-gray-800 text-yellow-400 border border-gray-700 active:bg-yellow-500/20 active:scale-95" aria-label="Alper'i Sustur ve Dinlemeye Geç">
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">stop_circle</span>
                            <span className="text-[10px] font-bold">Sustur</span>
                        </button>
                        <button onClick={cleanup} className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/30" aria-label="Görüşmeyi Sonlandır">
                            <span className="material-symbols-outlined text-2xl" aria-hidden="true">call_end</span>
                            <span className="text-[10px] font-bold">Bitir</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
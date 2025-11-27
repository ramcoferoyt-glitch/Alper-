
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { getLiveClient } from '../services/GeminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { useAppContext } from '../context/AppContext';

function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const LiveInterface: React.FC = () => {
    const { setMode } = useAppContext();
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    
    // New Features States
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // user = front, environment = back
    const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Fenrir'>('Kore'); // Kore = Female, Fenrir = Male
    
    const [status, setStatus] = useState("Bağlanmaya Hazır");
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    const cleanup = () => {
        if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        audioContextRef.current?.close();
        audioContextRef.current = null;
        setIsConnected(false);
        setIsCameraOn(false);
        setStatus("Bağlantı Kesildi");
        sessionPromiseRef.current = null;
    };

    const handleBack = () => {
        cleanup();
        setMode('chat');
    };

    // Handle Camera Switch Logic
    const toggleCameraFacing = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        
        // If already connected/camera on, restart stream
        if (streamRef.current && isCameraOn) {
            // Stop current video tracks
            streamRef.current.getVideoTracks().forEach(track => track.stop());
            
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: true, // We must request audio again to keep the stream consistent or manage tracks separately
                    video: { width: 640, height: 480, facingMode: newMode }
                });
                
                // Update refs
                streamRef.current = newStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    videoRef.current.play();
                }
                
                // Note: In a production app, we would swap the tracks in the PeerConnection/Processor
                // simplified here for the restricted environment by just updating local preview and letting loop read new video el
            } catch (err) {
                console.error("Camera switch failed", err);
            }
        }
    };

    const handleConnect = async () => {
        try {
            setStatus("Bağlanıyor...");
            const live = getLiveClient();
            
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            const outputCtx = new AudioContext({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { width: 640, height: 480, facingMode: facingMode }
            });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            sourceRef.current = source;
            processorRef.current = processor;

            const sessionPromise = live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus("Canlı (Alper)");
                        setIsConnected(true);
                        
                        source.connect(processor);
                        processor.connect(audioCtx.destination);
                        
                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            const binaryString = atob(audioData);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                            
                            const int16 = new Int16Array(bytes.buffer);
                            const float32 = new Float32Array(int16.length);
                            for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                            const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                            buffer.getChannelData(0).set(float32);

                            const src = outputCtx.createBufferSource();
                            src.buffer = buffer;
                            src.connect(outputCtx.destination);
                            
                            const now = outputCtx.currentTime;
                            const start = Math.max(now, nextStartTimeRef.current);
                            src.start(start);
                            nextStartTimeRef.current = start + buffer.duration;
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
                    systemInstruction: `Sen Alper. İshak Alper tarafından geliştirilmiş, çok yönlü ve ileri seviye bir Yapay Zeka asistanısın.
                    
                    Kimliğin:
                    - Zeki, esprili, pratik ve çözüm odaklısın.
                    - "Ben İshak Alper tarafından geliştirildim" diyerek kendini tanıt.
                    
                    Görme Yeteneğin:
                    - Şu an kullanıcının kamerasından gelen görüntüyü görebiliyorsun.
                    - Gördüğün ortamı, nesneleri, yazıları detaylıca analiz et.
                    - Kullanıcı sana "Burada ne görüyorsun?", "Elimdeki nedir?", "Ortamı anlat" derse hemen gördüklerini betimle.`,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    }
                }
            });
            
            sessionPromiseRef.current = sessionPromise;

            const videoLoop = window.setInterval(() => {
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                
                const isVisible = videoEl && !videoEl.classList.contains('hidden');

                if (isVisible && videoEl && canvasEl && videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
                    const ctx = canvasEl.getContext('2d');
                    if (ctx) {
                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0);
                        
                        const base64 = canvasEl.toDataURL('image/jpeg', 0.5).split(',')[1];
                        sessionPromise.then(session => session.sendRealtimeInput({ 
                            media: { mimeType: 'image/jpeg', data: base64 } 
                        }));
                    }
                }
            }, 500); 
            
            frameIntervalRef.current = videoLoop;

        } catch (e) {
            console.error(e);
            setStatus("Kamera/Mikrofon İzni Gerekli");
            cleanup();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-black text-white p-6 relative overflow-hidden font-sans">
            <button 
                onClick={handleBack}
                className="absolute top-6 left-6 z-50 p-3 bg-gray-800/50 hover:bg-gray-700 rounded-full backdrop-blur-md text-white border border-gray-700 transition-all"
                title="Sohbete Dön"
                aria-label="Sohbete Dön"
            >
                <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>

            <canvas ref={canvasRef} className="hidden" />
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-black to-purple-900/30 transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-40'}`}></div>
            
            <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg animate-fadeIn h-full justify-center">
                
                {/* Camera Preview */}
                <div className={`relative w-full aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-2xl transition-all duration-500 ${isCameraOn ? 'opacity-100 scale-100 flex-grow max-h-[60vh]' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
                    <video 
                        ref={videoRef}
                        autoPlay 
                        muted 
                        playsInline
                        className={`w-full h-full object-cover ${isCameraOn ? 'scale-x-[-1]' : ''}`} // Mirror front cam usually
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg z-20">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        CANLI GÖRÜNTÜ
                    </div>
                    {isCameraOn && (
                         <button 
                            onClick={toggleCameraFacing}
                            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur p-3 rounded-full text-white hover:bg-black/80 z-20 border border-white/20"
                            title="Kamerayı Çevir"
                            aria-label="Kamerayı Çevir"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">flip_camera_ios</span>
                        </button>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
                        <p className="text-sm text-gray-200 font-medium">Alper ortamı izliyor...</p>
                    </div>
                </div>

                {/* Visualizer & Voice Selection (When not connected) */}
                {(!isCameraOn) && (
                    <div className="flex flex-col items-center gap-6">
                        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700
                            ${isConnected ? 'bg-indigo-500/10 shadow-[0_0_80px_rgba(99,102,241,0.2)]' : 'bg-gray-900 border border-gray-800'}
                        `}>
                            <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-indigo-500/20 animate-pulse' : 'bg-gray-800'}`}>
                                 <span className={`material-symbols-outlined text-8xl transition-colors duration-500 ${isConnected ? 'text-indigo-400' : 'text-gray-600'}`} aria-hidden="true">
                                    {isConnected ? 'graphic_eq' : 'mic_off'}
                                </span>
                            </div>
                        </div>

                        {!isConnected && (
                            <div className="flex items-center gap-4 bg-gray-900 p-2 rounded-2xl border border-gray-800">
                                <button
                                    onClick={() => setSelectedVoice('Kore')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedVoice === 'Kore' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Kadın Sesi
                                </button>
                                <button
                                    onClick={() => setSelectedVoice('Fenrir')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedVoice === 'Fenrir' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Erkek Sesi
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{isConnected ? 'Bağlantı Aktif' : 'Canlı Bağlantı'}</h2>
                    <p className="text-gray-400 text-sm font-medium bg-gray-900/50 px-4 py-1 rounded-full border border-gray-800 inline-block">{status}</p>
                </div>

                <div className="flex gap-4 mt-2 flex-wrap justify-center items-center">
                    {!isConnected ? (
                        <button 
                            onClick={handleConnect}
                            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3"
                            aria-label="Konuşmaya Başla"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                            Konuşmaya Başla
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-5 rounded-full border transition-all hover:scale-105 ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}
                                title={isMuted ? "Sesi Aç" : "Sessize Al"}
                                aria-label={isMuted ? "Sesi Aç" : "Sessize Al"}
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">{isMuted ? 'mic_off' : 'mic'}</span>
                            </button>

                            <button 
                                onClick={() => setIsCameraOn(!isCameraOn)}
                                className={`p-5 rounded-full border transition-all hover:scale-105 ${isCameraOn ? 'bg-green-500 text-black border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'}`}
                                title={isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                                aria-label={isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">{isCameraOn ? 'videocam' : 'videocam_off'}</span>
                            </button>

                            <button 
                                onClick={cleanup}
                                className="px-6 py-3 bg-red-600 text-white rounded-full font-bold text-base hover:bg-red-500 transition-colors shadow-lg shadow-red-900/40"
                                aria-label="Görüşmeyi Bitir"
                            >
                                Bitir
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

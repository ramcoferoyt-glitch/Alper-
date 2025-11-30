
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SOCIAL_FORMATS, AspectRatio, GeneratedMedia, ImageResolution, VideoQuality } from '../types';
import { generateImage, editImage, generateVideo } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';

export const MediaStudio: React.FC<{ type: 'image' | 'video' }> = ({ type }) => {
    const { addToGallery, gallery, setMode, setInputImageForVideo, inputImageForVideo } = useAppContext();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Quality Settings
    const [imgResolution, setImgResolution] = useState<ImageResolution>('standard');
    const [videoQuality, setVideoQuality] = useState<VideoQuality>('fast');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (type === 'video' && inputImageForVideo) {
            setSelectedImage(inputImageForVideo);
        }
    }, [type, inputImageForVideo]);

    // Veo model only supports 16:9 and 9:16. Filter out others for video mode.
    const supportedFormats = type === 'video' 
        ? Object.values(SOCIAL_FORMATS).filter(f => f.value !== '1:1')
        : Object.values(SOCIAL_FORMATS);

    // Reset aspect ratio if switching to video and current is 1:1
    useEffect(() => {
        if (type === 'video' && aspectRatio === '1:1') {
            setAspectRatio('16:9');
        }
    }, [type, aspectRatio]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setSelectedImage(result);
                if (type === 'video') setInputImageForVideo(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUseForVideo = (media: GeneratedMedia) => {
        if (media.type === 'image') {
            setInputImageForVideo(media.url);
            setMode('video');
        }
    };

    const handleGenerate = async () => {
        if (!prompt && !selectedImage) return;
        
        // Paid key check for higher quality models
        const needsPaidKey = type === 'video' || imgResolution !== 'standard';
        if (needsPaidKey) {
             if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
                 await window.aistudio.openSelectKey();
             }
        }

        setIsGenerating(true);
        setError(null);

        try {
            let url = '';
            
            if (type === 'image') {
                if (selectedImage && prompt) {
                    url = await editImage(selectedImage, prompt);
                } else {
                    url = await generateImage(prompt, aspectRatio, imgResolution);
                }
            } else {
                url = await generateVideo(prompt, aspectRatio, selectedImage || undefined, videoQuality);
            }

            addToGallery({
                id: uuidv4(),
                type: type,
                url,
                prompt: prompt || (type === 'video' ? 'Görselden Videoya' : 'Görsel'),
                timestamp: Date.now(),
                aspectRatio
            });
            
            setPrompt(''); 
            if(type === 'video') {
                setSelectedImage(null);
                setInputImageForVideo(null);
            }

        } catch (e: any) {
            setError(e.message || "Oluşturma başarısız oldu. Lütfen tekrar deneyin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const myMedia = gallery.filter(m => m.type === type);

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-950 text-white font-sans">
            {/* Control Panel */}
            <div className="w-full lg:w-[420px] bg-gray-900 border-r border-gray-800 p-8 flex flex-col gap-8 overflow-y-auto z-10 custom-scrollbar">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <span className="material-symbols-outlined text-4xl text-gray-200" aria-hidden="true">
                            {type === 'image' ? 'palette' : 'movie_creation'}
                        </span>
                        {type === 'image' ? 'Görsel Stüdyosu' : 'Video Stüdyosu'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-2 font-medium">
                        {type === 'image' ? 'Hayal gücünü görsele dönüştür.' : 'Statik görsellere hayat ver.'}
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="prompt-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Tarif Et (Ne İstiyorsun?)
                        </label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={type === 'image' ? "Ne çizelim? (Örn: Gece yarısı İstanbul sokakları, neon ışıklar...)" : "Nasıl hareket etsin? (Örn: Kamera yavaşça yaklaşsın, rüzgar essin...)"}
                            className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-base text-white focus:border-white focus:ring-1 focus:ring-white outline-none h-36 resize-none transition-all placeholder-gray-600"
                            aria-label="İçerik tarifi girin"
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            {type === 'image' ? 'Referans Görsel (İsteğe Bağlı)' : 'Başlangıç Görseli (Video İçin)'}
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Görsel Yükle"
                            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group relative overflow-hidden
                                ${selectedImage ? 'border-white/50 bg-gray-800' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'}`}
                        >
                            {selectedImage ? (
                                <>
                                    <img src={selectedImage} alt="Seçilen Referans" className="h-40 mx-auto object-contain rounded-lg shadow-xl" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-bold text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined" aria-hidden="true">edit</span> Değiştir
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="py-4">
                                    <span className="material-symbols-outlined text-gray-500 text-5xl mb-3 group-hover:scale-110 transition-transform" aria-hidden="true">add_photo_alternate</span>
                                    <p className="text-sm text-gray-400 font-medium">Görsel Yüklemek İçin Tıkla</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} aria-hidden="true" />
                        </div>
                         {selectedImage && (
                            <button 
                                onClick={() => { setSelectedImage(null); setInputImageForVideo(null); }} 
                                className="text-xs text-red-400 mt-2 hover:text-red-300 w-full text-right font-medium"
                                aria-label="Seçilen görseli kaldır"
                            >
                                Görseli Kaldır
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">En / Boy Oranı & Platform</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" role="radiogroup" aria-label="En Boy Oranı Seçimi">
                            {supportedFormats.map((fmt) => (
                                <button
                                    key={fmt.value}
                                    role="radio"
                                    aria-checked={aspectRatio === fmt.value}
                                    onClick={() => setAspectRatio(fmt.value as AspectRatio)}
                                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all group ${
                                        aspectRatio === fmt.value 
                                            ? 'bg-white border-white text-black shadow-lg shadow-white/10' 
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                                    }`}
                                    aria-label={`${fmt.platform} ${fmt.label} formatı`}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${aspectRatio === fmt.value ? 'text-black' : 'text-gray-500 group-hover:text-white'}`} aria-hidden="true">{fmt.icon}</span>
                                    <div className="flex flex-col items-center text-center">
                                        <span className="text-[10px] font-bold uppercase">{fmt.platform}</span>
                                        <span className="text-xs">{fmt.label}</span>
                                        <span className="text-[9px] opacity-60 mt-0.5 font-mono">{fmt.value}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* QUALITY SELECTION */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            {type === 'image' ? 'Çözünürlük & Kalite' : 'Video Kalitesi'}
                        </label>
                        {type === 'image' && !selectedImage && (
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setImgResolution('standard')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${imgResolution === 'standard' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    Standart
                                </button>
                                <button 
                                    onClick={() => setImgResolution('hd')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${imgResolution === 'hd' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    HD (2K)
                                </button>
                                <button 
                                    onClick={() => setImgResolution('ultra')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center ${imgResolution === 'ultra' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    <span>Ultra (4K)</span>
                                </button>
                            </div>
                        )}
                        {type === 'video' && (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setVideoQuality('fast')}
                                    className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${videoQuality === 'fast' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">speed</span>
                                    Hızlı (Önizleme)
                                </button>
                                <button 
                                    onClick={() => setVideoQuality('quality')}
                                    className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${videoQuality === 'quality' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">movie_filter</span>
                                    Sinematik (Premium)
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (!prompt && !selectedImage)}
                        className="w-full py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-2xl shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg mt-2"
                        aria-label="Oluştur"
                    >
                        {isGenerating ? (
                            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
                        )}
                        {isGenerating ? 'Hazırlanıyor...' : 'Oluştur'}
                    </button>
                    {error && <p className="text-sm text-red-400 mt-2 bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex items-center gap-2" role="alert"><span className="material-symbols-outlined text-lg" aria-hidden="true">error</span>{error}</p>}
                </div>
            </div>

            {/* Gallery Area */}
            <div className="flex-grow bg-gray-950 p-6 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400" aria-hidden="true">history</span>
                        Geçmiş Çalışmalar
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-900 px-3 py-1 rounded-full" aria-label={`${myMedia.length} adet kayıtlı öğe`}>{myMedia.length} Öğe</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {myMedia.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-96 text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                            <span className="material-symbols-outlined text-7xl mb-4 opacity-20" aria-hidden="true">{type === 'image' ? 'image' : 'videocam'}</span>
                            <p className="text-lg font-medium">Henüz bir çalışma yok.</p>
                            <p className="text-sm opacity-60">Soldaki panelden oluşturmaya başla.</p>
                        </div>
                    )}
                    
                    {myMedia.map((media) => (
                        <div key={media.id} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all shadow-xl hover:shadow-2xl group relative flex flex-col">
                            <div className="relative aspect-video bg-black/40 flex items-center justify-center overflow-hidden">
                                {media.type === 'image' ? (
                                    <img src={media.url} alt={media.prompt} className="w-full h-full object-contain" />
                                ) : (
                                    <video src={media.url} controls loop className="w-full h-full object-contain" />
                                )}
                            </div>
                            
                            <div className="p-5 flex-grow flex flex-col">
                                <p className="text-sm text-gray-300 line-clamp-1 font-medium mb-3" title={media.prompt}>{media.prompt}</p>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-600 text-sm" aria-hidden="true">aspect_ratio</span>
                                        <span className="text-xs text-gray-400 font-bold">{media.aspectRatio}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-mono">{new Date(media.timestamp).toLocaleTimeString('tr-TR')}</span>
                                </div>
                                
                                <div className="flex gap-2 mt-auto">
                                     <a 
                                        href={media.url} 
                                        download={`alper-${media.type}-${media.id}.${media.type === 'image' ? 'png' : 'mp4'}`}
                                        className="flex-1 py-2.5 bg-white hover:bg-gray-200 rounded-xl text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                                        title="Cihaza Kaydet"
                                        aria-label="İndir"
                                    >
                                        <span className="material-symbols-outlined text-lg" aria-hidden="true">download</span> İndir
                                    </a>
                                     {media.type === 'image' && (
                                        <button 
                                            onClick={() => handleUseForVideo(media)}
                                            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition-colors border border-gray-700"
                                            title="Video Yap"
                                            aria-label="Bu görselden video oluştur"
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">movie_filter</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

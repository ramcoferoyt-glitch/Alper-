/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateYouTubeAsset } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';
import { AspectRatio } from '../types';

type Platform = 'youtube' | 'instagram' | 'tiktok';
type AssetFormat = 'post' | 'story' | 'banner' | 'thumbnail' | 'profile';

const STYLES = [
    { id: 'gaming', label: 'Oyun / Gaming', color: 'from-purple-500 to-indigo-500' },
    { id: 'vlog', label: 'Vlog / Lifestyle', color: 'from-pink-500 to-rose-500' },
    { id: 'tech', label: 'Teknoloji', color: 'from-blue-500 to-cyan-500' },
    { id: 'education', label: 'Eğitim', color: 'from-green-500 to-teal-500' },
    { id: 'minimal', label: 'Minimalist', color: 'from-gray-500 to-gray-700' },
    { id: 'cinematic', label: 'Sinematik', color: 'from-orange-500 to-red-500' }
];

const PLATFORMS: { id: Platform, label: string, icon: string, color: string }[] = [
    { id: 'youtube', label: 'YouTube', icon: 'smart_display', color: 'text-red-500' },
    { id: 'instagram', label: 'Instagram', icon: 'photo_camera', color: 'text-pink-500' },
    { id: 'tiktok', label: 'TikTok', icon: 'music_note', color: 'text-black bg-white rounded-full' }
];

const FORMATS: { [key in Platform]: { id: AssetFormat, label: string, ratio: AspectRatio, icon: string }[] } = {
    youtube: [
        { id: 'thumbnail', label: 'Küçük Resim', ratio: '16:9', icon: 'image' },
        { id: 'banner', label: 'Kanal Resmi', ratio: '16:9', icon: 'panorama' },
        { id: 'profile', label: 'Profil', ratio: '1:1', icon: 'account_circle' }
    ],
    instagram: [
        { id: 'post', label: 'Kare Gönderi', ratio: '1:1', icon: 'grid_on' },
        { id: 'story', label: 'Hikaye / Reels', ratio: '9:16', icon: 'phonelink_ring' },
        { id: 'profile', label: 'Profil', ratio: '1:1', icon: 'account_circle' }
    ],
    tiktok: [
        { id: 'story', label: 'Video Kapak', ratio: '9:16', icon: 'smartphone' },
        { id: 'profile', label: 'Profil', ratio: '1:1', icon: 'account_circle' }
    ]
};

export const YouTubeStudio: React.FC = () => {
    const { addToGallery, gallery } = useAppContext();
    
    const [platform, setPlatform] = useState<Platform>('youtube');
    const [format, setFormat] = useState<AssetFormat>('thumbnail');
    
    // Auto-select first format when platform changes
    const handlePlatformChange = (p: Platform) => {
        setPlatform(p);
        setFormat(FORMATS[p][0].id);
    };

    const [style, setStyle] = useState('gaming');
    const [visualPrompt, setVisualPrompt] = useState('');
    const [textOverlay, setTextOverlay] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!visualPrompt && !selectedImage) return;
        
        if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }

        setIsGenerating(true);
        try {
            // Determine type logic for the backend service (reusing generateYouTubeAsset logic but flexible)
            let serviceType: 'thumbnail' | 'banner' | 'profile' = 'thumbnail';
            if (format === 'banner') serviceType = 'banner';
            if (format === 'profile') serviceType = 'profile';
            // Post/Story treated as thumbnail logic (image gen with text) but different ratio

            const url = await generateYouTubeAsset(
                visualPrompt,
                textOverlay,
                serviceType,
                STYLES.find(s => s.id === style)?.label || 'Modern',
                selectedImage || undefined
            );

            // Find current format details
            const currentFormat = FORMATS[platform].find(f => f.id === format);

            addToGallery({
                id: uuidv4(),
                type: 'thumbnail', // Stored as thumbnail for filter in this studio
                url,
                prompt: `[${platform.toUpperCase()} - ${currentFormat?.label}] ${visualPrompt}`,
                timestamp: Date.now(),
                aspectRatio: currentFormat?.ratio || '16:9'
            });
            
            setVisualPrompt('');
            setTextOverlay('');
            setSelectedImage(null);
        } catch (e) {
            alert("Üretim sırasında bir hata oluştu.");
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const myAssets = gallery.filter(m => m.type === 'thumbnail');

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-950 text-white overflow-hidden font-sans">
            {/* Left Control Panel */}
            <div className="w-full lg:w-[480px] bg-gray-900 border-r border-gray-800 flex flex-col h-full z-10 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">
                    {/* Header */}
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3 mb-1 text-white">
                            <span className="material-symbols-outlined text-gray-400 text-2xl">brush</span>
                            Sosyal Medya Tasarımcı
                        </h2>
                        <p className="text-gray-500 text-xs">Tüm platformlar için profesyonel içerikler üret.</p>
                    </div>

                    {/* Platform Selector */}
                    <div>
                        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                            {PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePlatformChange(p.id)}
                                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                                        platform === p.id 
                                            ? 'bg-gray-800 text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-lg ${platform === p.id ? p.color : ''}`}>{p.icon}</span>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 block">Format Seç</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FORMATS[platform].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        format === f.id 
                                            ? 'bg-white border-white text-black' 
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">{f.icon}</span>
                                    <span className="text-[10px] font-bold">{f.label}</span>
                                    <span className="text-[9px] opacity-60 font-mono">{f.ratio}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Görsel Tarif (İstem)</label>
                            <textarea
                                value={visualPrompt}
                                onChange={(e) => setVisualPrompt(e.target.value)}
                                placeholder="Örn: Şaşkın bir yüz ifadesi ile yeni iPhone'u tutan adam, arka planda neon ışıklar..."
                                className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-white focus:ring-1 focus:ring-white outline-none resize-none placeholder-gray-600"
                            ></textarea>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Görsel Üzerindeki Yazı (Opsiyonel)</label>
                            <input
                                type="text"
                                value={textOverlay}
                                onChange={(e) => setTextOverlay(e.target.value)}
                                placeholder="Örn: İNANILMAZ DEĞİŞİM!"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-white focus:ring-1 focus:ring-white outline-none font-bold tracking-wide"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Referans Görsel (Opsiyonel)</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-800/50 transition-colors"
                            >
                                {selectedImage ? (
                                    <div className="relative">
                                        <img src={selectedImage} className="h-20 mx-auto rounded object-contain" alt="ref" />
                                        <button onClick={(e) => {e.stopPropagation(); setSelectedImage(null)}} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"><span className="material-symbols-outlined text-xs">close</span></button>
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-xs flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">add_photo_alternate</span>
                                        Yüzünü veya ürününü ekle
                                    </span>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>

                    {/* Styles */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 block">Stil Seç</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STYLES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStyle(s.id)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                        style === s.id 
                                            ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-md` 
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (!visualPrompt && !selectedImage)}
                        className="w-full py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_awesome</span>}
                        {isGenerating ? 'Tasarlanıyor...' : 'Oluştur'}
                    </button>
                </div>
            </div>

            {/* Right Gallery/Preview Area */}
            <div className="flex-grow bg-black p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500">collections_bookmark</span>
                        Tasarım Galerisi
                    </h3>
                </div>
               
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {myAssets.length === 0 && (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 bg-gray-900/20">
                             <span className="material-symbols-outlined text-6xl mb-4 opacity-30">brush</span>
                             <p className="font-medium">Henüz bir tasarım yok.</p>
                             <p className="text-sm opacity-50">Soldan bir platform seç ve başla.</p>
                        </div>
                    )}
                    {myAssets.map(asset => (
                        <div key={asset.id} className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-white transition-all shadow-xl flex flex-col">
                            <div className={`w-full bg-gray-950 flex items-center justify-center overflow-hidden flex-shrink-0 ${asset.aspectRatio === '1:1' ? 'aspect-square max-w-sm mx-auto' : 'aspect-video'}`}>
                                <img src={asset.url} alt="asset" className="w-full h-full object-contain" />
                            </div>
                            
                            <div className="p-5 flex-grow flex flex-col items-center justify-center text-center bg-gray-900/90 border-t border-gray-800">
                                <p className="text-xs text-gray-300 font-medium line-clamp-1 mb-4">{asset.prompt}</p>
                                <a 
                                    href={asset.url} 
                                    download={`alper-design-${asset.id}.png`}
                                    className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2 w-full justify-center"
                                >
                                    <span className="material-symbols-outlined">download</span> İndir / Kaydet
                                </a>
                            </div>
                            
                            {/* Format Badge */}
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 uppercase tracking-wide pointer-events-none">
                                {asset.aspectRatio}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
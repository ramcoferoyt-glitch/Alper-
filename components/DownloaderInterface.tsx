
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'twitter';

export const DownloaderInterface: React.FC = () => {
    const [platform, setPlatform] = useState<Platform>('youtube');
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('mp4');
    const [status, setStatus] = useState<'idle' | 'fetching' | 'ready' | 'downloading'>('idle');
    const [videoInfo, setVideoInfo] = useState<{title: string, thumb: string, size?: string} | null>(null);
    const [quality, setQuality] = useState('1080p');

    const handleFetchInfo = async () => {
        if (!url || !url.startsWith('http')) { alert("Lütfen geçerli bir bağlantı girin."); return; }
        setStatus('fetching'); setVideoInfo(null);
        
        try {
            const res = await fetch(`/api/media/info?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Sunucu hatası');
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);

            setVideoInfo({ 
                title: data.title || 'Medya İçeriği', 
                thumb: data.thumbnail || 'https://picsum.photos/seed/media/300/200', 
                size: "Hazır" 
            });
            setStatus('ready');
        } catch (e) {
            console.error(e);
            alert("Medya bilgileri alınamadı. Lütfen bağlantıyı kontrol edin veya tekrar deneyin.");
            setStatus('idle');
        }
    };

    const handleDownload = async () => {
        if (status === 'downloading') return;
        setStatus('downloading');
        
        try {
            // Yeni resolve endpoint'ini kullan
            const response = await fetch('/api/media/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'İndirme bağlantısı alınamadı');
            }

            if (data.url) {
                // Bağlantıyı yeni sekmede aç
                const win = window.open(data.url, '_blank');
                if (win) {
                    alert("İndirme işlemi başlatıldı. Dosya tarayıcınızın indirilenler klasörüne kaydedilecek.");
                } else {
                    // Pop-up engellendiyse manuel link göster veya uyar
                    alert("İndirme penceresi açılamadı. Lütfen pop-up engelleyiciyi kapatın veya tekrar deneyin.");
                    // Fallback: window.location.href = data.url; // Mevcut sayfada açmak isterseniz
                }
            } else {
                throw new Error('Geçersiz sunucu yanıtı');
            }
        } catch (e: any) {
            console.error(e);
            alert(`İndirme Başarısız: ${e.message || 'Bilinmeyen hata'}`);
        } finally {
            setStatus('idle'); // Her durumda idle'a dön ki tekrar denenebilsin
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] items-center justify-center p-6 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-2xl bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-10 shadow-3xl animate-scaleUp">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-xl shadow-blue-900/10">
                        <span className="material-symbols-outlined text-blue-500 text-5xl" aria-hidden="true">cloud_download</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Medya İndirici</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest opacity-60">YouTube, Instagram, TikTok ve Twitter</p>
                </div>

                <div className="flex bg-black p-1.5 rounded-2xl mb-10 border border-white/5">
                    {['youtube', 'instagram', 'tiktok', 'twitter'].map(p => (
                        <button key={p} onClick={() => { setPlatform(p as Platform); setStatus('idle'); setVideoInfo(null); setUrl(''); }} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${platform === p ? 'bg-[#1a1a1a] text-white shadow-2xl' : 'text-gray-600 hover:text-gray-400'}`}>{p.toUpperCase()}</button>
                    ))}
                </div>

                <div className="space-y-8">
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            value={url} 
                            onChange={(e) => { setUrl(e.target.value); setStatus('idle'); }} 
                            placeholder="Bağlantıyı buraya yapıştırın..." 
                            className="flex-grow bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-blue-500 outline-none transition-all font-bold placeholder-gray-800" 
                        />
                        <button 
                            onClick={handleFetchInfo} 
                            disabled={!url || status === 'fetching'} 
                            className="bg-white text-black px-10 rounded-2xl font-black hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {status === 'fetching' ? (
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                            ) : 'ANALİZ'}
                        </button>
                    </div>

                    {videoInfo && (
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex gap-6 animate-fadeIn items-center">
                            <div className="w-24 h-24 bg-black rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/5">
                                <img src={videoInfo.thumb} className="w-full h-full object-cover" alt="Önizleme" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-white font-black text-lg mb-2 line-clamp-1">{videoInfo.title}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="bg-green-500/20 text-green-400 text-[9px] font-black px-2 py-1 rounded border border-green-500/20 uppercase tracking-widest">İndirmeye Hazır</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="animate-fadeIn space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Format Seçin</label>
                                    <select 
                                        value={format} 
                                        onChange={(e) => {
                                            const newFormat = e.target.value;
                                            setFormat(newFormat);
                                        }} 
                                        className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 text-sm text-white font-black outline-none appearance-none"
                                    >
                                        <option value="mp4">MP4 (Video)</option>
                                        <option value="mp3">MP3 (Ses)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">
                                        Kalite
                                    </label>
                                    <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 text-sm text-gray-400 font-bold flex items-center">
                                        En Yüksek (Otomatik)
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleDownload} 
                                disabled={status === 'downloading'}
                                className="w-full py-6 rounded-[2rem] font-black text-xl bg-blue-600 text-white hover:bg-blue-500 shadow-3xl shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                            >
                                <span className="material-symbols-outlined">download</span>
                                {status === 'downloading' ? 'BAŞLATILIYOR...' : 'İNDİRMEYİ BAŞLAT'}
                            </button>
                        </div>
                    )}
                </div>
                
                <p className="text-[9px] text-gray-700 text-center mt-10 font-bold uppercase tracking-widest">
                    Bu araç sadece kişisel kullanım içindir. Telif haklarına saygı duyun.
                </p>
            </div>
        </div>
    );
};

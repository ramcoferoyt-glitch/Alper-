import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { streamChat, generateAudioFromText } from '../services/GeminiService';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';

// Landing Page - Dinamik ve Seçilebilir Kartlar
const LandingPage: React.FC<{ onStart: (msg: string) => void, onModeSelect: (mode: any) => void }> = ({ onStart, onModeSelect }) => {
    const { userProfile, mode } = useAppContext();
    const [greeting, setGreeting] = useState('');
    const [suggestions, setSuggestions] = useState<{icon: string, label: string, action: () => void, color: string}[]>([]);

    useEffect(() => {
        // 1. Dinamik Selamlaşma
        const hour = new Date().getHours();
        let greet = "Merhaba";
        if (hour >= 5 && hour < 12) greet = "Günaydın";
        else if (hour >= 12 && hour < 17) greet = "İyi günler";
        else if (hour >= 17 && hour < 22) greet = "İyi akşamlar";
        else greet = "İyi geceler";

        setGreeting(`${greet}${userProfile.name ? `, ${userProfile.name}` : ''}. Bugün senin için neyi kolaylaştırabilirim?`);

        // 2. Akıllı Öneri Kartları (Rastgele Seçim)
        
        // Agent Mode Specific Suggestions
        if (mode === 'agent') { 
             const agentSuggestions = [
                { 
                    icon: 'public', 
                    label: 'Piyasa Araştırması', 
                    action: () => onStart("Küresel piyasalar hakkında detaylı bir araştırma raporu hazırla."), 
                    color: 'text-blue-400' 
                },
                { 
                    icon: 'manage_search', 
                    label: 'Rakip Analizi', 
                    action: () => onStart("Sektördeki ana rakipleri ve stratejilerini analiz et."), 
                    color: 'text-red-400' 
                },
                { 
                    icon: 'campaign', 
                    label: 'Trend Raporu', 
                    action: () => onStart("Son teknoloji trendleri hakkında kapsamlı bir rapor istiyorum."), 
                    color: 'text-green-400' 
                }
            ];
            setSuggestions(agentSuggestions);
            return;
        }

        const allSuggestions = [
            { icon: 'palette', label: 'Görsel Oluştur', action: () => onModeSelect('image'), color: 'text-purple-400' },
            { icon: 'summarize', label: 'Özet Çıkar', action: () => onStart("Bu metni veya konuyu benim için özetle."), color: 'text-blue-400' },
            { icon: 'psychology', label: 'Fikir Danış', action: () => onStart("Bir konuda fikrine ihtiyacım var."), color: 'text-green-400' },
            { icon: 'movie', label: 'Video Fikri', action: () => onModeSelect('video'), color: 'text-orange-400' },
            { icon: 'self_improvement', label: 'Motivasyon', action: () => onStart("Bana ilham verici bir şeyler söyle."), color: 'text-pink-400' },
            { icon: 'code', label: 'Kod Yaz', action: () => onStart("Bana basit bir Python scripti yaz."), color: 'text-yellow-400' },
            { icon: 'translate', label: 'Çeviri Yap', action: () => onStart("Bu metni İngilizceye çevir."), color: 'text-indigo-400' },
            { icon: 'fitness_center', label: 'Egzersiz Planı', action: () => onStart("Evde yapabileceğim 15 dakikalık egzersiz planı."), color: 'text-red-400' },
            { icon: 'restaurant', label: 'Yemek Tarifi', action: () => onStart("Pratik ve sağlıklı bir akşam yemeği tarifi ver."), color: 'text-orange-400' },
            { icon: 'flight', label: 'Seyahat Planı', action: () => onStart("Hafta sonu için kısa bir tatil rotası oluştur."), color: 'text-teal-400' },
        ];

        // Rastgele 3 tane seç
        const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 3));

    }, [userProfile.name, onModeSelect, onStart, mode]);

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn pb-40 pt-8 overflow-y-auto custom-scrollbar relative">
            {/* Hero Section */}
            <div className="mb-12 space-y-6 max-w-2xl">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-2xl text-glow leading-tight">
                    {greeting}
                </h1>
            </div>

            {/* Smart Suggestion Cards (3'lü Dinamik Widget) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-16">
                {suggestions.map((s, idx) => (
                    <button 
                        key={idx}
                        onClick={s.action}
                        className="group flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-[2rem] transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-xl"
                    >
                        <div className={`p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors ${s.color}`}>
                            <span className="material-symbols-outlined text-3xl" aria-hidden="true">{s.icon}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-wide">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Minimalist Alt Bölüm (Tek Dinamik Kart) */}
            <div className="w-full max-w-md animate-fadeIn delay-300">
                <div className="flex justify-center">
                    <button 
                        onClick={() => onStart("Bana ilham verici, yaratıcı ve sıra dışı bir fikir ver. Beni şaşırt.")}
                        className="group relative w-full bg-gradient-to-r from-gray-900 to-black border border-white/10 hover:border-purple-500/50 rounded-3xl p-6 flex items-center justify-between transition-all hover:shadow-lg hover:shadow-purple-900/20 active:scale-95"
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block mb-1">Yaratıcı Fikir</span>
                                <span className="text-sm font-bold text-white">Beni Şaşırt & İlham Ver</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors" aria-hidden="true">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ChatInterface: React.FC<{ hideHeader?: boolean, customLandingPage?: React.ReactNode, customPlaceholder?: string }> = ({ hideHeader = false, customLandingPage, customPlaceholder }) => {
    const { chatHistory, addChatMessage, isChatProcessing, setIsChatProcessing, mode, setMode, selectedModel, setSelectedModel, t } = useAppContext();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [loadingText, setLoadingText] = useState('Alper düşünüyor...');

    const isFinance = mode === 'finance';
    const isLawyer = mode === 'lawyer';
    const isPsychologist = mode === 'psychologist';

    // Mod bazlı renkler
    const getModelBubbleColor = () => {
        if (isFinance) return 'bg-[#0a120e] border-emerald-900/30';
        if (isLawyer) return 'bg-[#0a0f1a] border-slate-800/50';
        if (isPsychologist) return 'bg-[#0a1212] border-teal-900/30';
        return 'glass-card text-gray-200 rounded-bl-none';
    };

    const getUserBubbleColor = () => {
        if (isFinance) return 'bg-emerald-600 text-white rounded-br-none shadow-emerald-900/20';
        if (isLawyer) return 'bg-slate-700 text-white rounded-br-none shadow-slate-900/20';
        if (isPsychologist) return 'bg-teal-700 text-white rounded-br-none shadow-teal-900/20';
        return 'bg-blue-600 text-white rounded-br-none shadow-blue-900/20';
    };

    const getAccentColor = () => {
        if (isFinance) return 'text-emerald-400';
        if (isLawyer) return 'text-slate-400';
        if (isPsychologist) return 'text-teal-400';
        return 'text-blue-400';
    };

    const getLoadingDotColor = () => {
        if (isFinance) return 'bg-emerald-400';
        if (isLawyer) return 'bg-slate-400';
        if (isPsychologist) return 'bg-teal-400';
        return 'bg-blue-400';
    };

    const getLoadingContainerColor = () => {
        if (isFinance) return 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
        if (isLawyer) return 'bg-slate-500/20 border-slate-500/30 shadow-[0_0_15px_rgba(100,116,139,0.3)]';
        if (isPsychologist) return 'bg-teal-500/20 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]';
        return 'bg-blue-500/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    };

    const getLoadingTextColor = () => {
        if (isFinance) return 'text-emerald-300';
        if (isLawyer) return 'text-slate-300';
        if (isPsychologist) return 'text-teal-300';
        return 'text-blue-300';
    };

    const getInputGradient = () => {
        if (isFinance) return 'from-[#030705] via-[#030705]/90';
        if (isLawyer) return 'from-[#030407] via-[#030407]/90';
        if (isPsychologist) return 'from-[#020606] via-[#020606]/90';
        return 'from-black via-black/90';
    };

    // Premium Loading State Animation
    useEffect(() => {
        if (isChatProcessing) {
            let texts = ["Analiz ediliyor...", "Tasarlanıyor...", "En iyi sonuç hazırlanıyor...", "Veriler işleniyor..."];
            if (isFinance) {
                texts = ["Piyasa verileri taranıyor...", "Ekonomik göstergeler analiz ediliyor...", "Strateji oluşturuluyor...", "En güncel finansal veriler işleniyor..."];
            } else if (isLawyer) {
                texts = ["Hukuki içtihatlar taranıyor...", "Kanun maddeleri inceleniyor...", "Savunma stratejisi kuruluyor...", "Emsal kararlar analiz ediliyor..."];
            } else if (isPsychologist) {
                texts = ["Duygu durumu analiz ediliyor...", "Psikolojik derinlik inceleniyor...", "Empatik yanıt hazırlanıyor...", "Bilişsel kalıplar değerlendiriliyor..."];
            }
            let i = 0;
            const interval = setInterval(() => {
                setLoadingText(texts[i]);
                i = (i + 1) % texts.length;
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isChatProcessing, isFinance, isLawyer, isPsychologist]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatHistory, isChatProcessing]);

    const handleMenuAction = async (action: 'read' | 'copy' | 'share' | 'pdf', msg: ChatMessage) => {
        setActiveMessageMenuId(null);
        try {
            switch (action) {
                case 'read':
                    if (audioPlayingId === msg.id) {
                        audioRef.current?.pause();
                        setAudioPlayingId(null);
                    } else {
                        if (audioRef.current) audioRef.current.pause();
                        setAudioLoadingId(msg.id);
                        try {
                            const audioUrl = await generateAudioFromText(msg.text);
                            const audio = new Audio(audioUrl);
                            
                            audio.onerror = (e) => {
                                console.error("Audio playback error:", e);
                                alert("Ses dosyası oynatılamadı. Format desteklenmiyor olabilir.");
                                setAudioPlayingId(null);
                            };

                            audio.onended = () => setAudioPlayingId(null);
                            
                            await audio.play();
                            audioRef.current = audio;
                            setAudioPlayingId(msg.id);
                        } catch (err) {
                            console.error("TTS Error:", err);
                            alert("Ses oluşturulamadı. Lütfen tekrar deneyin.");
                            setAudioPlayingId(null);
                        } finally {
                            setAudioLoadingId(null);
                        }
                    }
                    break;
                case 'copy':
                    await navigator.clipboard.writeText(msg.text);
                    alert("Metin kopyalandı!");
                    break;
                case 'share':
                    if (navigator.share) {
                        await navigator.share({ title: 'Alper AI Yanıtı', text: msg.text });
                    } else {
                        await navigator.clipboard.writeText(msg.text);
                        alert("Metin kopyalandı (Paylaşım desteklenmiyor).");
                    }
                    break;
                case 'pdf':
                    const doc = new jsPDF();
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(16);
                    doc.text("Alper AI Sohbet Kaydı", 20, 20);
                    
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.text(new Date(msg.timestamp).toLocaleString(), 20, 30);
                    
                    doc.setFontSize(12);
                    const splitText = doc.splitTextToSize(msg.text, 170);
                    doc.text(splitText, 20, 40);
                    
                    doc.save(`alper-ai-${msg.id.slice(0, 8)}.pdf`);
                    break;
            }
        } catch (e) {
            console.error("Action failed", e);
            alert("İşlem başarısız oldu.");
            setAudioPlayingId(null);
        }
    };

    const handleSend = async (msgOverride?: string) => {
        const msg = msgOverride || input;
        if (!msg.trim() || isChatProcessing) return;
        
        // 1. Clear input immediately
        setInput('');
        
        // 2. Add user message to state
        const userMsgId = uuidv4();
        addChatMessage({ id: userMsgId, role: 'user', text: msg, timestamp: Date.now() });
        
        // 3. Set processing state
        setIsChatProcessing(true);
        
        try {
            // 4. Prepare history
            const historyForApi = chatHistory.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));
            
            // 5. Start streaming
            const stream = await streamChat(
                historyForApi, 
                msg, 
                [], 
                true, // Always use search
                mode === 'maps', 
                undefined, 
                mode, 
                'therapy', 
                undefined, 
                selectedModel
            );

            let fullText = '';
            // 6. Process stream
            for await (const chunk of stream) { 
                fullText += chunk.text || ''; 
            }
            
            // 7. Add model response
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
            
        } catch (e) {
            console.error("Chat Error:", e);
            addChatMessage({ id: uuidv4(), role: 'model', text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.", timestamp: Date.now(), isError: true });
        } finally {
            setIsChatProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Header - Resimdeki ALPER X5 PRO butonu */}
            {!hideHeader && (
                <div className="absolute top-0 left-0 p-6 z-40 flex items-center justify-between w-full pointer-events-none">
                    <button 
                        onClick={() => setSelectedModel(selectedModel === 'x5' ? 'x3' : 'x5')} 
                        className={`pointer-events-auto text-[11px] font-black px-7 py-3 rounded-full border flex items-center gap-3 transition-all shadow-3xl backdrop-blur-xl ${selectedModel === 'x3' ? (isFinance ? 'bg-emerald-600/80 border-emerald-400/50' : 'bg-blue-600/80 border-blue-400/50') : 'bg-gradient-to-r from-[#FFD700]/20 via-[#FDB931]/20 to-[#FFD700]/20 border-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]'} text-white`}
                        aria-label={selectedModel === 'x3' ? t('fast_mode') : t('pro_mode')}
                    >
                        <span className={`material-symbols-outlined text-[18px] ${selectedModel === 'x5' ? 'text-yellow-400' : ''}`} aria-hidden="true">{selectedModel === 'x3' ? 'bolt' : 'diamond'}</span>
                        <span className="tracking-[0.2em] uppercase">{selectedModel === 'x3' ? t('fast_mode') : t('pro_mode')}</span>
                    </button>
                </div>
            )}

            {/* Chat Flow */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto pt-24 pb-4 px-4 custom-scrollbar scroll-smooth">
                {chatHistory.length === 0 ? (
                    customLandingPage ? customLandingPage : <LandingPage onStart={(msg) => handleSend(msg)} onModeSelect={setMode} />
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn mb-6 group relative`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] shadow-2xl backdrop-blur-md ${msg.role === 'user' ? getUserBubbleColor() : getModelBubbleColor()}`}>
                                    <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                
                                {/* More Options for Model Messages */}
                                {msg.role === 'model' && !msg.isError && msg.text && (
                                    <div className="mt-2 ml-2 relative">
                                        <button 
                                            onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                                            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-white/10"
                                            aria-label="Diğer Seçenekler"
                                            title="Diğer Seçenekler"
                                        >
                                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">more_horiz</span>
                                            <span>Diğer Seçenekler</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMessageMenuId === msg.id && (
                                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a]/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn backdrop-blur-xl">
                                                <button 
                                                    onClick={() => handleMenuAction('read', msg)} 
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5"
                                                    aria-label={audioPlayingId === msg.id ? 'Okumayı Durdur' : 'Sesli Oku'}
                                                    disabled={audioLoadingId === msg.id}
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] ${getAccentColor()} ${audioLoadingId === msg.id ? 'animate-spin' : ''}`} aria-hidden="true">
                                                        {audioLoadingId === msg.id ? 'progress_activity' : (audioPlayingId === msg.id ? 'stop_circle' : 'record_voice_over')}
                                                    </span>
                                                    {audioLoadingId === msg.id ? 'Ses Oluşturuluyor...' : (audioPlayingId === msg.id ? 'Okumayı Durdur' : 'Sesli Oku (Asistan)')}
                                                </button>
                                                <button 
                                                    onClick={() => handleMenuAction('copy', msg)} 
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5"
                                                    aria-label="Metni Kopyala"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
                                                    Kopyala
                                                </button>
                                                <button 
                                                    onClick={() => handleMenuAction('share', msg)} 
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5"
                                                    aria-label="Metni Paylaş"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">share</span>
                                                    Paylaş
                                                </button>
                                                <button 
                                                    onClick={() => handleMenuAction('pdf', msg)} 
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                                                    aria-label="PDF Olarak İndir"
                                                >
                                                    <span className="material-symbols-outlined text-[18px] text-red-400" aria-hidden="true">picture_as_pdf</span>
                                                    PDF Olarak İndir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                         {isChatProcessing && (
                            <div className="flex justify-center py-4 animate-fadeIn">
                                <div className={`animate-pulse-glow ${getLoadingContainerColor()} backdrop-blur-md px-6 py-3 rounded-full border flex items-center gap-3`}>
                                    <div className="flex gap-1">
                                        <span className={`w-1.5 h-1.5 ${getLoadingDotColor()} rounded-full animate-bounce`}></span>
                                        <span className={`w-1.5 h-1.5 ${getLoadingDotColor()} rounded-full animate-bounce delay-100`}></span>
                                        <span className={`w-1.5 h-1.5 ${getLoadingDotColor()} rounded-full animate-bounce delay-200`}></span>
                                    </div>
                                    <span className={`text-xs font-bold ${getLoadingTextColor()} uppercase tracking-widest text-glow`}>{loadingText}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Bar - Fixed at bottom via Flexbox */}
            <div className={`p-4 lg:p-6 bg-gradient-to-t ${getInputGradient()} to-transparent z-40 w-full shrink-0 backdrop-blur-sm`}>
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-[2rem] p-1.5 shadow-2xl focus-within:border-white/20 focus-within:bg-white/10 transition-all backdrop-blur-md">
                        {/* 1. Dosya Yükle (Sol) */}
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            aria-label="Dosya Ekle"
                        >
                            <span className="material-symbols-outlined text-[22px] font-light" aria-hidden="true">attach_file</span>
                            <input ref={fileInputRef} type="file" className="hidden" />
                        </button>

                        {/* Bellek (History) Butonu */}
                        <button 
                            onClick={() => setMode('memory')} 
                            className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-full hidden sm:block"
                            aria-label="Sohbet Geçmişi"
                        >
                            <span className="material-symbols-outlined text-[22px] font-light" aria-hidden="true">history</span>
                        </button>
                        
                        {/* 2. Yazı Alanı (Orta) */}
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} 
                            placeholder={customPlaceholder || t('input_placeholder')} 
                            className="flex-grow bg-transparent text-white placeholder-gray-500 py-3 px-2 outline-none resize-none max-h-32 text-[15px] font-medium" 
                            rows={1} 
                            aria-label="Mesajınızı yazın"
                        />
                        
                        {/* 3. Gönder (Sağ) */}
                        {input.trim() ? (
                            <button 
                                onClick={() => handleSend()} 
                                disabled={isChatProcessing} 
                                className="p-3 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg transition-all transform hover:scale-105 active:scale-95"
                                aria-label="Gönder"
                            >
                                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">arrow_upward</span>
                            </button>
                        ) : (
                            /* 4. Canlı Konuşma (En Sağ - Input boşken) */
                            <button 
                                onClick={() => setMode('live')}
                                className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all relative group"
                                aria-label="Canlı Sesli Moda Geç"
                            >
                                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">mic</span>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

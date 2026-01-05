/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { streamChat } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Attachment } from '../types';

declare const html2pdf: any; 

// Landing Page Component (Professional 3-Card Super App Layout)
const LandingPage: React.FC<{ onStart: (msg: string) => void, onModeSelect: (mode: any) => void }> = ({ onStart, onModeSelect }) => {
    const { isPrivateMode } = useAppContext();
    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn pb-32">
            
            {/* Professional Hero Section */}
            <div className="mb-12 mt-4 space-y-4">
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                    Merhaba, ben Alper.
                </h1>
                <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                    <p className="text-gray-300 text-sm md:text-base font-medium tracking-wide flex items-center gap-2">
                        {isPrivateMode && <span className="material-symbols-outlined text-purple-400 text-sm">incognito</span>}
                        Hepsi bir arada yaratıcı ve profesyonel yapay zeka asistanı.
                    </p>
                </div>
            </div>

            {/* Main Categories (3 Iconic Cards - Optimized with Accessibility) */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                
                {/* 1. Yaratıcı Stüdyo */}
                <button 
                    onClick={() => onModeSelect('image')}
                    aria-label="Yaratıcı Stüdyo: Görsel, video ve tasarım araçlarını aç"
                    className="bg-[#0f0f0f] hover:bg-[#151515] border border-white/5 hover:border-purple-500/40 rounded-[2.5rem] p-8 text-left group transition-all duration-500 shadow-2xl flex flex-col justify-between h-52 relative overflow-hidden focus:ring-2 focus:ring-purple-500 outline-none"
                >
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-500 ring-1 ring-purple-500/20">
                            <span className="material-symbols-outlined text-3xl" aria-hidden="true">palette</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-700 group-hover:text-white transition-colors" aria-hidden="true">arrow_outward</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">Yaratıcı Stüdyo</h3>
                        <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase opacity-80">Görsel • Video • Metin • Tasarım</p>
                    </div>
                </button>

                {/* 2. Profesyonel Asistan */}
                <button 
                    onClick={() => onModeSelect('consultant')}
                    aria-label="Profesyonel Asistan: Hukuk, finans ve iş danışmanlığı araçlarını aç"
                    className="bg-[#0f0f0f] hover:bg-[#151515] border border-white/5 hover:border-amber-500/40 rounded-[2.5rem] p-8 text-left group transition-all duration-500 shadow-2xl flex flex-col justify-between h-52 relative overflow-hidden focus:ring-2 focus:ring-amber-500 outline-none"
                >
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl group-hover:bg-amber-600/20 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform duration-500 ring-1 ring-amber-500/20">
                            <span className="material-symbols-outlined text-3xl" aria-hidden="true">business_center</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-700 group-hover:text-white transition-colors" aria-hidden="true">arrow_outward</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">Profesyonel Asistan</h3>
                        <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase opacity-80">Hukuk • Finans • İş • Psikoloji</p>
                    </div>
                </button>

                {/* 3. Keşfet & Planla */}
                <button 
                    onClick={() => onModeSelect('maps')}
                    aria-label="Keşfet ve Planla: Harita, rota ve yaşam asistanı araçlarını aç"
                    className="bg-[#0f0f0f] hover:bg-[#151515] border border-white/5 hover:border-emerald-500/40 rounded-[2.5rem] p-8 text-left group transition-all duration-500 shadow-2xl flex flex-col justify-between h-52 relative overflow-hidden focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-500 ring-1 ring-emerald-500/20">
                            <span className="material-symbols-outlined text-3xl" aria-hidden="true">explore</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-700 group-hover:text-white transition-colors" aria-hidden="true">arrow_outward</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">Keşfet & Planla</h3>
                        <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase opacity-80">Harita • Rota • Eğitim • Yaşam</p>
                    </div>
                </button>

            </div>

            {/* Quick Actions Footer */}
            <div className="w-full max-w-3xl border-t border-white/5 pt-8">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-6">Hızlı Başlat</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <QuickActionButton icon="flight_takeoff" label="Tatil Planla" onClick={() => onStart("Benim için harika bir tatil planı yap.")} color="text-blue-400" />
                    <QuickActionButton icon="design_services" label="Logo Tasarla" onClick={() => onStart("Modern bir kafe için logo fikri tasarla.")} color="text-purple-400" />
                    <QuickActionButton icon="calculate" label="Bütçe Yap" onClick={() => onStart("Aylık kişisel bütçe planı oluştur.")} color="text-green-400" />
                    <QuickActionButton icon="auto_stories" label="Metin Yaz" onClick={() => onStart("Bana ilham verici bir hikaye anlat.")} color="text-amber-400" />
                </div>
            </div>
        </div>
    );
};

const QuickActionButton: React.FC<{ icon: string, label: string, onClick: () => void, color: string }> = ({ icon, label, onClick, color }) => (
    <button onClick={onClick} className="px-5 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-full text-xs font-bold text-gray-300 hover:text-white transition-all hover:scale-105 flex items-center gap-2 shadow-xl focus:ring-2 focus:ring-white outline-none">
        <span className={`material-symbols-outlined text-base ${color}`} aria-hidden="true">{icon}</span>
        {label}
    </button>
);

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-3 leading-relaxed text-gray-200">
            {lines.map((line, i) => {
                let cleanLine = line.replace(/[*#_`~]/g, '').trim(); 
                if (cleanLine === cleanLine.toUpperCase() && cleanLine.length < 50 && cleanLine.length > 3 && !cleanLine.startsWith('HTTP') && !cleanLine.startsWith('YOL')) {
                     return <h4 key={i} className="text-base font-bold text-blue-200 mt-3 border-b border-blue-500/30 pb-1">{cleanLine}</h4>;
                }
                if (line.includes('YOL TARİFİ:')) {
                    const parts = line.split('YOL TARİFİ:');
                    const url = parts[1].trim();
                    return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mx-1 my-1 transition-transform hover:scale-105 shadow-lg bg-blue-600 hover:bg-blue-500 text-white" aria-label="Google Haritalar'da Yol Tarifi Al"><span className="material-symbols-outlined text-sm" aria-hidden="true">directions</span>Yol Tarifi Al</a>;
                }
                const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    const label = linkMatch[1].replace(/[*#]/g, ''); 
                    const url = linkMatch[2];
                    const isMap = label.toLowerCase().includes('yol') || label.toLowerCase().includes('harita') || label.toLowerCase().includes('git');
                    const isCall = label.toLowerCase().includes('ara') || label.toLowerCase().includes('tel');
                    return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mx-1 my-1 transition-transform hover:scale-105 shadow-lg ${isMap ? 'bg-blue-600 hover:bg-blue-500 text-white' : isCall ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'}`}><span className="material-symbols-outlined text-sm" aria-hidden="true">{isMap ? 'directions' : isCall ? 'call' : 'public'}</span>{label}</a>;
                }
                if (cleanLine.startsWith('http')) { return <a key={i} href={cleanLine} target="_blank" className="text-blue-400 hover:underline break-all" aria-label="Bağlantıyı aç">{cleanLine}</a> }
                if (cleanLine.length > 0) { return <p key={i} className="min-h-[1em]">{cleanLine}</p>; }
                return null;
            })}
        </div>
    );
};

const MessageActionMenu: React.FC<{ text: string }> = ({ text }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleCopy = () => { const cleanText = text.replace(/[*#_`~]/g, ''); navigator.clipboard.writeText(cleanText); setIsOpen(false); };
    const handleReadAloud = () => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const speechText = text.replace(/[*#_`~-]/g, '').trim(); const utterance = new SpeechSynthesisUtterance(speechText); utterance.lang = 'tr-TR'; utterance.rate = 1.0; window.speechSynthesis.speak(utterance); } else { alert("Tarayıcınız sesli okumayı desteklemiyor."); } setIsOpen(false); };
    const handleDownloadPDF = () => { if (typeof html2pdf === 'undefined') { alert("PDF modülü yüklenemedi. Lütfen sayfayı yenileyin."); return; } const cleanText = text.replace(/[*#_`~]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/YOL TARİFİ: http\S+/g, ''); const htmlContent = cleanText.split('\n').map(l => { const line = l.trim(); if (line.length === 0) return '<br/>'; if (line === line.toUpperCase() && line.length > 4 && line.length < 60) { return `<h3 style="color:#2563eb; margin-top:15px; margin-bottom:10px; font-size:16px; border-bottom:1px solid #eee; padding-bottom:5px;">${line}</h3>`; } return `<p style="margin-bottom:8px; font-size:12px; color:#333; line-height:1.5;">${line}</p>`; }).join(''); const element = document.createElement('div'); element.innerHTML = `<div style="font-family: Arial, sans-serif; padding: 20px;"><div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;"><h1 style="color:#111; font-size: 24px; margin:0;">Alper AI Raporu</h1><p style="color:#666; font-size: 10px; margin-top:5px;">${new Date().toLocaleDateString('tr-TR')}</p></div>${htmlContent}<div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">Alper AI ile oluşturuldu.</div></div>`; const opt = { margin: [10, 10, 10, 10], filename: `Alper-Rapor-${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }; html2pdf().set(opt).from(element).save().then(() => { setIsOpen(false); }).catch((err: any) => { console.error("PDF Hatası:", err); alert("PDF oluşturulamadı."); }); };
    const handleShare = async () => { const cleanText = text.replace(/[*#_`~]/g, ''); if (navigator.share) { try { await navigator.share({ title: 'Alper AI', text: cleanText }); } catch (err) {} } else { handleCopy(); alert("Kopyalandı."); } setIsOpen(false); };
    const handleSendEmail = () => {
        const cleanText = text.replace(/[*#_`~/]/g, '');
        const subject = "Alper AI Sohbet Kaydı";
        const body = cleanText;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="relative mt-2" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-gray-800" aria-label="İşlemler Menüsünü Aç" aria-expanded={isOpen}><span className="material-symbols-outlined text-lg" aria-hidden="true">more_horiz</span> İşlemler</button>
            {isOpen && (<div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <button onClick={handleReadAloud} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">volume_up</span> Sesli Oku</button>
                <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">content_copy</span> Kopyala</button>
                <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">share</span> Paylaş</button>
                <button onClick={handleSendEmail} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">mail</span> E-Posta Gönder</button>
                <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3 border-t border-gray-800"><span className="material-symbols-outlined text-base" aria-hidden="true">picture_as_pdf</span> PDF İndir</button>
            </div>)}
        </div>
    );
};

export const ChatInterface: React.FC = () => {
    const { chatHistory, addChatMessage, isChatProcessing, setIsChatProcessing, userLocation, mode, isYouTubeModalOpen, setIsYouTubeModalOpen, setMode, psychologistSubMode, userProfile, selectedModel, setSelectedModel, isPrivateMode } = useAppContext();
    const [input, setInput] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [youTubeLink, setYouTubeLink] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showLandingPage = chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].id === 'welcome');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isChatProcessing, attachments]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = (ev.target?.result as string).split(',')[1];
                    setAttachments(prev => [...prev, { data: base64, mimeType: file.type }]);
                };
                reader.readAsDataURL(file);
            });
        }
        if (e.target) e.target.value = '';
    };

    const handleYouTubeSubmit = () => {
        if (youTubeLink) {
            setInput(`YouTube Analizi: ${youTubeLink}`);
            setUseSearch(true);
            setYouTubeLink('');
            setIsYouTubeModalOpen(false);
        }
    };

    const handleSend = async (overrideInput?: string, locationData?: { latitude: number; longitude: number }, displayLabel?: string) => {
        const textToSend = overrideInput || input;
        if ((!textToSend.trim() && attachments.length === 0) || isChatProcessing) return;

        const currentAttachments = [...attachments];
        setAttachments([]);
        setInput('');
        
        const bubbleText = displayLabel || textToSend || '[Dosya]';

        addChatMessage({ 
            id: uuidv4(), role: 'user', text: bubbleText, timestamp: Date.now(), attachments: currentAttachments 
        });
        
        setIsChatProcessing(true);

        const apiHistory = chatHistory.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        const mapsActive = mode === 'maps';
        const searchActive = useSearch || mode === 'maps' || mode === 'finance' || mode === 'lawyer' || mode === 'agent' || mode === 'social_content' || mode === 'daily_life' || mode === 'learning';
        let finalLocation = locationData || userLocation;

        const timeoutId = setTimeout(() => {
            setIsChatProcessing((currentStatus) => {
                if (currentStatus) {
                    addChatMessage({ 
                        id: uuidv4(), 
                        role: 'model', 
                        text: "İşlem çok uzun sürdü veya bağlantı koptu. Lütfen tekrar deneyin.", 
                        timestamp: Date.now(), 
                        isError: true 
                    });
                    return false;
                }
                return currentStatus;
            });
        }, 180000); 

        try {
            const stream = await streamChat(apiHistory, textToSend, currentAttachments, searchActive, mapsActive, finalLocation, mode, psychologistSubMode, userProfile, selectedModel);
            let fullText = '';
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                }
            }
            clearTimeout(timeoutId); 
            if (!fullText) throw new Error("Boş yanıt alındı.");
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e: any) {
            clearTimeout(timeoutId); 
            console.error("Chat Error:", e);
            let errorText = `Bir hata oluştu: ${e.message || 'Bilinmiyor'}.`;
            if (e.message && (e.message.includes('Google Maps') || e.message.includes('tool') || e.message.includes('400'))) {
                errorText = "Harita servisi şu an yoğun. Lütfen konumu yazarak tekrar deneyin.";
            } else if (mapsActive && !finalLocation) {
                errorText = "Konum bilgisi alınamadı. Lütfen cihaz ayarlarından konumu açın veya konumu yazarak aratın.";
            }
            addChatMessage({ id: uuidv4(), role: 'model', text: errorText, timestamp: Date.now(), isError: true });
        } finally {
            setIsChatProcessing(false);
        }
    };

    const handleMapsQuery = (query: string, label: string) => {
        setIsChatProcessing(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => handleSend(query, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, label),
                (err) => {
                    console.warn("Location error:", err);
                    handleSend(`${query} (Konum alınamadı, lütfen genel öneriler veya kullanıcının belirttiği konuma göre öneriler sun)`, undefined, label); 
                },
                { timeout: 8000, enableHighAccuracy: true }
            );
        } else {
            handleSend(`${query} (Konum izni yok)`, undefined, label);
        }
    };

    const QUICK_CHIPS = [
        { label: 'Gezilecek Yerler', icon: 'attractions', prompt: 'Yakınımdaki en popüler 10 turistik yeri bul. Kısa bir tarihçe ve neden gidilmesi gerektiğini anlat. TELEFON NUMARASI VERME. Sadece Yol Tarifi linki ekle.' },
        { label: 'Restoranlar', icon: 'restaurant', prompt: 'Yakınımdaki en iyi ve en yüksek puanlı 7 restoranı listele. Ne yenir ve fiyatı nasıldır kısaca yaz. TELEFON NUMARASI ve YOL TARİFİ linki ekle.' },
        { label: 'Kafeler', icon: 'coffee', prompt: 'Yakınımdaki en iyi 7 kafeyi bul. Çalışmaya uygun mu belirt. TELEFON ve YOL TARİFİ ekle.' },
        { label: 'Benzinlik', icon: 'local_gas_station', prompt: 'En yakın 7 benzinliği listele. SADECE İSİM, MESAFE ve AÇIK/KAPALI bilgisini ver. Tarihçe yazma. TELEFON ve YOL TARİFİ ekle.' },
        { label: 'Eczane', icon: 'medication', prompt: 'Yakınımdaki en yakın 7 eczaneyi listele. Nöbetçi olan varsa belirt. Sadece İsim, Mesafe, Telefon ve Yol Tarifi ver. Uzun açıklama yapma.' },
        { label: 'Otel', icon: 'hotel', prompt: 'Yakınımdaki en uygun 7 oteli listele. Yıldız sayısı ve gecelik fiyat tahminini yaz. Telefon ve Yol Tarifi ekle.' },
    ];

    let placeholderText = "Alper ile konuş...";
    if (mode === 'maps') placeholderText = "Nereye gitmek istersin? (Örn: En yakın kafe)";
    else if (mode === 'psychologist') placeholderText = "Dr. Alper'e içini dök... (Seni dinliyorum)";
    else if (mode === 'consultant') placeholderText = "Stratejik bir soru sor veya dosya yükle...";
    else if (mode === 'finance') placeholderText = "Piyasa durumu, yatırım fikri veya bütçe planı sor...";
    else if (mode === 'personal_coach') placeholderText = "Hedefin ne? Alışkanlıklar, planlama veya motivasyon...";
    else if (mode === 'lawyer') placeholderText = "Hukuki sorununu, iltica durumunu veya davayı anlat...";
    else if (mode === 'agent') placeholderText = "Araştırılacak konu veya öğrenmek istediğin şey...";
    else if (mode === 'social_content') placeholderText = "İçerik fikri, senaryo veya başlık iste...";
    else if (mode === 'learning') placeholderText = "Ne öğrenmek istiyorsun? (İngilizce, Yazılım...)";
    else if (mode === 'daily_life') placeholderText = "Alışveriş listesi, günlük plan veya bütçe...";

    return (
        <div className="flex flex-col h-full bg-transparent relative font-sans">
            {/* Professional Header - MODEL SELECTOR AT THE TOP-LEFT with Accessibility */}
            <div className="absolute top-0 left-0 p-6 z-40 flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    {/* ENHANCED MODEL SELECTOR - EXPLICIT TEXT CHANGING with ARIA-LIVE */}
                    <button 
                        onClick={() => setSelectedModel(selectedModel === 'x5' ? 'x3' : 'x5')}
                        aria-live="assertive"
                        aria-label={`Yapay Zeka Modeli seçildi: ${selectedModel === 'x5' ? 'Alper X5 Pro - Gelişmiş Düşünme Modu' : 'Alper X3 Hızlı Mod'}`}
                        className={`text-[11px] font-black px-6 py-3 rounded-full border flex items-center gap-2 transition-all shadow-2xl backdrop-blur-md active:scale-95 group focus:ring-2 focus:ring-white outline-none ${
                            selectedModel === 'x3' 
                            ? 'bg-blue-600/90 border-blue-400 text-white shadow-blue-500/30' 
                            : 'bg-gradient-to-r from-amber-500 to-yellow-600 border-yellow-400 text-white shadow-amber-500/40 ring-1 ring-white/20'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            {selectedModel === 'x3' ? 'bolt' : 'diamond'}
                        </span>
                        <span className="tracking-[0.12em] whitespace-nowrap uppercase">
                            {selectedModel === 'x3' ? 'ALPER X3 HIZLI' : 'ALPER X5 PRO'}
                        </span>
                    </button>

                    <h2 className="hidden sm:flex text-xl font-black text-white items-center gap-3 drop-shadow-md tracking-tighter opacity-80" aria-hidden="true">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                            {isPrivateMode && "GİZLİ "}
                            {mode === 'notebook' ? 'NOTEBOOK' : 
                             mode === 'maps' ? 'KEŞFET & PLANLA' : 
                             mode === 'psychologist' ? 'DR. ALPER' : 
                             mode === 'consultant' ? 'ALPER DANIŞMAN' : 
                             mode === 'finance' ? 'ALPER FİNANS' : 
                             mode === 'personal_coach' ? 'ALPER KOÇ' :
                             mode === 'lawyer' ? 'ALPER HUKUK' :
                             mode === 'agent' ? 'ALPER AGENT' :
                             mode === 'social_content' ? 'SOSYAL İÇERİK' :
                             mode === 'learning' ? 'ÖĞREN & GELİŞ' :
                             mode === 'daily_life' ? 'GÜNLÜK ASİSTAN' :
                             'ALPER AI'}
                        </span>
                    </h2>
                </div>
                {isPrivateMode && (
                    <div className="flex items-center gap-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">
                        <span className="material-symbols-outlined text-sm">incognito</span>
                        GİZLİ SOHBET
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto pt-24 pb-52 lg:pb-36 custom-scrollbar relative" role="log" aria-relevant="additions" aria-live="polite">
                {showLandingPage && mode === 'chat' ? (
                    <LandingPage onStart={(msg) => handleSend(msg)} onModeSelect={setMode} />
                ) : (
                    <div className="p-4 max-w-4xl mx-auto space-y-6">
                        {chatHistory.map((msg, idx) => (
                            (msg.text || msg.attachments?.length) && msg.id !== 'welcome' && (
                                <div key={msg.id + idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                                    <div className={`max-w-[90%] lg:max-w-[75%] p-5 rounded-[1.5rem] shadow-xl ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none ring-1 ring-white/10' 
                                        : msg.isError ? 'bg-red-900/40 text-red-100 border border-red-800' : 'bg-[#111] text-gray-200 border border-white/5'
                                    }`}>
                                        {msg.attachments?.length ? (
                                            <div className="mb-3 flex gap-3 overflow-x-auto pb-2">
                                                {msg.attachments.map((att, i) => (
                                                    att.mimeType.startsWith('image') ? 
                                                    <img key={i} src={`data:${att.mimeType};base64,${att.data}`} className="h-24 rounded-xl shadow-lg border border-white/10" alt="Ekli görsel" /> :
                                                    <div key={i} className="h-24 w-24 bg-white/5 rounded-xl flex items-center justify-center border border-white/10" aria-label="Dosya eki"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
                                                ))}
                                            </div>
                                        ) : null}
                                        <div className="text-sm font-medium"><FormattedText text={msg.text} /></div>
                                        {msg.role === 'model' && !msg.isError && <MessageActionMenu text={msg.text} />}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Loading Indicator */}
            {isChatProcessing && (
                <div className="absolute bottom-36 lg:bottom-28 left-4 lg:left-1/2 lg:-translate-x-1/2 z-40 animate-fadeIn pointer-events-none" aria-busy="true" aria-label="Alper yanıtı hazırlıyor">
                    <div className="bg-[#111] border border-white/10 backdrop-blur-xl p-3 px-5 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                        <div className="flex gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span></div>
                        <span className="text-[11px] text-blue-400 font-black tracking-widest uppercase">Alper Düşünüyor</span>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-30">
                <div className="max-w-4xl mx-auto flex flex-col gap-3">
                    {mode === 'maps' && (
                        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar" role="group" aria-label="Hızlı harita aramaları">
                            {QUICK_CHIPS.map((chip, idx) => (
                                <button key={idx} onClick={() => handleMapsQuery(chip.prompt, chip.label)} disabled={isChatProcessing} className="flex items-center gap-2 bg-[#111] hover:bg-emerald-700/40 text-white px-5 py-2.5 rounded-full border border-white/5 hover:border-emerald-500/50 transition-all shadow-xl flex-shrink-0 active:scale-95 disabled:opacity-50 outline-none focus:ring-2 focus:ring-emerald-400">
                                    <span className="material-symbols-outlined text-lg text-emerald-400" aria-hidden="true">{chip.icon}</span><span className="text-xs font-bold">{chip.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {attachments.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto py-2 mb-1 px-1" aria-label="Seçilen ekler">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative w-16 h-16 bg-[#111] rounded-2xl border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    {att.mimeType.startsWith('image') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover rounded-2xl" alt="Ek Önizleme" /> : <span className="material-symbols-outlined text-gray-500" aria-hidden="true">description</span>}
                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-md" aria-label="Eki kaldır"><span className="material-symbols-outlined text-[14px] font-bold" aria-hidden="true">close</span></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-3 bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-2.5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative z-40 transition-all focus-within:border-white/20">
                        <div className="flex-shrink-0">
                             <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.txt,.md" aria-hidden="true" />
                             <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all outline-none focus:ring-2 focus:ring-white" aria-label="Dosya veya fotoğraf ekle" title="Dosya Ekle"><span className="material-symbols-outlined text-2xl" aria-hidden="true">add_circle</span></button>
                        </div>
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder={placeholderText} className="flex-grow bg-transparent text-white placeholder-gray-600 py-3.5 px-2 outline-none resize-none max-h-32 custom-scrollbar text-sm font-medium" rows={1} style={{ minHeight: '48px' }} aria-label="Mesajınızı buraya yazın" />
                        <div className="flex items-center gap-2 pr-1.5 pb-1.5">
                            <button onClick={() => handleSend()} disabled={(!input.trim() && attachments.length === 0) || isChatProcessing} className={`p-3.5 rounded-full transition-all flex-shrink-0 flex items-center justify-center shadow-lg outline-none focus:ring-2 focus:ring-white ${(!input.trim() && attachments.length === 0) || isChatProcessing ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 transform active:scale-90'}`} aria-label="Mesajı gönder" title="Gönder"><span className="material-symbols-outlined text-2xl" aria-hidden="true">arrow_upward</span></button>
                            <button onClick={() => setMode('live')} className="p-3.5 bg-[#1a1a1a] text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all group border border-white/5 outline-none focus:ring-2 focus:ring-red-500" aria-label="Canlı görüntülü ve sesli sohbeti başlat" title="Canlı Sohbet"><span className="material-symbols-outlined text-2xl" aria-hidden="true">mic</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* YouTube Modal */}
            {isYouTubeModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6" role="dialog" aria-modal="true" aria-labelledby="yt-modal-title">
                    <div className="bg-[#111] rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-white/10 animate-scaleUp">
                        <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-red-500 text-4xl" aria-hidden="true">smart_display</span>
                        </div>
                        <h3 id="yt-modal-title" className="text-2xl font-black text-white mb-2">YouTube Analiz</h3>
                        <p className="text-gray-400 text-sm mb-8 font-medium italic">Video içeriğini saniyeler içinde Alper ile özetle.</p>
                        <div className="relative mb-8">
                            <input type="text" value={youTubeLink} onChange={(e) => setYouTubeLink(e.target.value)} placeholder="Bağlantıyı yapıştır..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:border-red-500 transition-all" aria-label="YouTube Video Linki" />
                             <span className="material-symbols-outlined absolute left-4 top-4 text-gray-600" aria-hidden="true">link</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsYouTubeModalOpen(false)} className="flex-1 px-6 py-4 text-gray-500 font-bold hover:text-white outline-none">VAZGEÇ</button>
                            <button onClick={handleYouTubeSubmit} disabled={!youTubeLink} className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-900/20 disabled:opacity-50 outline-none focus:ring-2 focus:ring-white">ANALİZ ET</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
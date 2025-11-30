
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

// Enhanced Formatter that strips markdown symbols for view
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    
    return (
        <div className="space-y-3 leading-relaxed text-gray-200">
            {lines.map((line, i) => {
                // Remove bold/italic markers but keep link syntax for parsing
                let cleanLine = line.replace(/[*#_`~]/g, '').trim(); 
                
                // If header-like (All caps and short)
                if (cleanLine === cleanLine.toUpperCase() && cleanLine.length < 50 && cleanLine.length > 3 && !cleanLine.startsWith('HTTP') && !cleanLine.startsWith('YOL')) {
                     return <h4 key={i} className="text-base font-bold text-blue-200 mt-3 border-b border-blue-500/30 pb-1">{cleanLine}</h4>;
                }

                // Custom handling for the YOL TARIFI format
                if (line.includes('YOL TARİFİ:')) {
                    const parts = line.split('YOL TARİFİ:');
                    const url = parts[1].trim();
                    return (
                        <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mx-1 my-1 transition-transform hover:scale-105 shadow-lg bg-blue-600 hover:bg-blue-500 text-white"
                            aria-label="Google Haritalar'da Yol Tarifi Al"
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">directions</span>
                            Yol Tarifi Al
                        </a>
                    );
                }

                // Link parser [Label](Url)
                const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    const label = linkMatch[1].replace(/[*#]/g, ''); // Clean inside label
                    const url = linkMatch[2];
                    const isMap = label.toLowerCase().includes('yol') || label.toLowerCase().includes('harita') || label.toLowerCase().includes('git');
                    const isCall = label.toLowerCase().includes('ara') || label.toLowerCase().includes('tel');
                    
                    return (
                        <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mx-1 my-1 transition-transform hover:scale-105 shadow-lg ${
                                isMap ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                                isCall ? 'bg-green-600 hover:bg-green-500 text-white' :
                                'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">
                                {isMap ? 'directions' : isCall ? 'call' : 'public'}
                            </span>
                            {label}
                        </a>
                    );
                }
                
                // Pure Link detection (http...)
                if (cleanLine.startsWith('http')) {
                     return <a key={i} href={cleanLine} target="_blank" className="text-blue-400 hover:underline break-all" aria-label="Bağlantıyı aç">{cleanLine}</a>
                }
                
                if (cleanLine.length > 0) {
                    return <p key={i} className="min-h-[1em]">{cleanLine}</p>;
                }
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

    const handleCopy = () => {
        const cleanText = text.replace(/[*#_`~]/g, '');
        navigator.clipboard.writeText(cleanText);
        setIsOpen(false);
    };

    const handleReadAloud = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const speechText = text.replace(/[*#_`~-]/g, '').trim();
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = 'tr-TR';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Tarayıcınız sesli okumayı desteklemiyor.");
        }
        setIsOpen(false);
    };

    const handleDownloadPDF = () => {
        if (typeof html2pdf === 'undefined') {
            alert("PDF modülü yüklenemedi. Lütfen sayfayı yenileyin.");
            return;
        }
        
        // Clean text for PDF
        // Remove markdown symbols and link brackets
        const cleanText = text
            .replace(/[*#_`~]/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep text of links, remove URL
            .replace(/YOL TARİFİ: http\S+/g, ''); // Remove raw direction links for print

        // Format HTML for the PDF
        const htmlContent = cleanText.split('\n').map(l => {
            const line = l.trim();
            if (line.length === 0) return '<br/>';
            // Headers (uppercase and short)
            if (line === line.toUpperCase() && line.length > 4 && line.length < 60) {
                return `<h3 style="color:#2563eb; margin-top:15px; margin-bottom:10px; font-size:16px; border-bottom:1px solid #eee; padding-bottom:5px;">${line}</h3>`;
            }
            return `<p style="margin-bottom:8px; font-size:12px; color:#333; line-height:1.5;">${line}</p>`;
        }).join('');

        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    <h1 style="color:#111; font-size: 24px; margin:0;">Alper AI Raporu</h1>
                    <p style="color:#666; font-size: 10px; margin-top:5px;">${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                ${htmlContent}
                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
                    Alper AI ile oluşturuldu.
                </div>
            </div>
        `;
        
        // Settings for html2pdf
        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: `Alper-Rapor-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Execute generation
        html2pdf().set(opt).from(element).save().then(() => {
            setIsOpen(false);
        }).catch((err: any) => {
            console.error("PDF Hatası:", err);
            alert("PDF oluşturulamadı.");
        });
    };

    const handleShare = async () => {
        const cleanText = text.replace(/[*#_`~]/g, '');
        if (navigator.share) {
            try { await navigator.share({ title: 'Alper AI', text: cleanText }); } catch (err) {}
        } else {
            handleCopy();
            alert("Kopyalandı.");
        }
        setIsOpen(false);
    };

    // Updated Order: Read Aloud -> Copy -> Share -> PDF
    return (
        <div className="relative mt-2" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-gray-800"
                aria-label="Diğer seçenekler"
                aria-expanded={isOpen}
            >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">more_horiz</span> İşlemler
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <button onClick={handleReadAloud} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">volume_up</span> Sesli Oku</button>
                    <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">content_copy</span> Kopyala</button>
                    <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3"><span className="material-symbols-outlined text-base" aria-hidden="true">share</span> Paylaş</button>
                    <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-3 border-t border-gray-800"><span className="material-symbols-outlined text-base" aria-hidden="true">picture_as_pdf</span> PDF İndir</button>
                </div>
            )}
        </div>
    );
};

export const ChatInterface: React.FC = () => {
    const { chatHistory, addChatMessage, isChatProcessing, setIsChatProcessing, userLocation, mode, isYouTubeModalOpen, setIsYouTubeModalOpen, setMode, psychologistSubMode, userProfile } = useAppContext();
    const [input, setInput] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [youTubeLink, setYouTubeLink] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
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

    // Modified handleSend to support hidden system prompts vs visible bubbles
    const handleSend = async (overrideInput?: string, locationData?: { latitude: number; longitude: number }, displayLabel?: string) => {
        const textToSend = overrideInput || input;
        if ((!textToSend.trim() && attachments.length === 0) || isChatProcessing) return;

        const currentAttachments = [...attachments];
        setAttachments([]);
        setInput('');
        
        // Use displayLabel if provided (e.g. "Restoranlar"), otherwise use the actual text
        const bubbleText = displayLabel || textToSend || '[Dosya]';

        // Optimistically add user message with CLEAN text
        addChatMessage({ 
            id: uuidv4(), role: 'user', text: bubbleText, timestamp: Date.now(), attachments: currentAttachments 
        });
        
        // TRIGGER LOADING STATE IMMEDIATELY AND PERSISTENTLY
        setIsChatProcessing(true);

        const apiHistory = chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        const mapsActive = mode === 'maps';
        const searchActive = useSearch || mode === 'maps' || mode === 'finance' || mode === 'lawyer';
        let finalLocation = locationData || userLocation;

        try {
            const stream = await streamChat(apiHistory, textToSend, currentAttachments, searchActive, mapsActive, finalLocation, mode, psychologistSubMode, userProfile);
            let fullText = '';
            for await (const chunk of stream) {
                if (chunk.text) fullText += chunk.text;
            }
             addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e: any) {
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
        // Set loading TRUE immediately to show feedback instantly, covering the async geolocation gap
        setIsChatProcessing(true);
        
        // Try to get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => handleSend(query, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, label),
                (err) => {
                    console.warn("Location error:", err);
                    // Still send, but let model ask or fallback to general search
                    handleSend(`${query} (Konum alınamadı, lütfen genel öneriler veya kullanıcının belirttiği konuma göre öneriler sun)`, undefined, label); 
                },
                { timeout: 8000, enableHighAccuracy: true }
            );
        } else {
            handleSend(`${query} (Konum izni yok)`, undefined, label);
        }
    };

    // Prompt is hidden from user, Label is shown in bubble
    // UPDATED PROMPTS FOR SPEED AND CORRECTNESS WITH LIMITS
    const QUICK_CHIPS = [
        { 
            label: 'Gezilecek Yerler', 
            icon: 'attractions', 
            prompt: 'Yakınımdaki en popüler 10 turistik yeri bul. Kısa bir tarihçe ve neden gidilmesi gerektiğini anlat. TELEFON NUMARASI VERME. Sadece Yol Tarifi linki ekle.' 
        },
        { 
            label: 'Restoranlar', 
            icon: 'restaurant', 
            prompt: 'Yakınımdaki en iyi ve en yüksek puanlı 7 restoranı listele. Ne yenir ve fiyatı nasıldır kısaca yaz. TELEFON NUMARASI ve YOL TARİFİ linki ekle.' 
        },
        { 
            label: 'Kafeler', 
            icon: 'coffee', 
            prompt: 'Yakınımdaki en iyi 7 kafeyi bul. Çalışmaya uygun mu belirt. TELEFON ve YOL TARİFİ ekle.' 
        },
        { 
            label: 'Benzinlik', 
            icon: 'local_gas_station', 
            prompt: 'En yakın 7 benzinliği listele. SADECE İSİM, MESAFE ve AÇIK/KAPALI bilgisini ver. Tarihçe yazma. TELEFON ve YOL TARİFİ ekle.' 
        },
        { 
            label: 'Eczane', 
            icon: 'medication', 
            prompt: 'Yakınımdaki en yakın 7 eczaneyi listele. Nöbetçi olan varsa belirt. Sadece İsim, Mesafe, Telefon ve Yol Tarifi ver. Uzun açıklama yapma.' 
        },
        { 
            label: 'Otel', 
            icon: 'hotel', 
            prompt: 'Yakınımdaki en uygun 7 oteli listele. Yıldız sayısı ve gecelik fiyat tahminini yaz. Telefon ve Yol Tarifi ekle.' 
        },
    ];

    // Determine placeholder text based on mode
    let placeholderText = "Alper ile konuş...";
    if (mode === 'maps') placeholderText = "Nereye gitmek istersin? (Örn: En yakın kafe)";
    else if (mode === 'psychologist') placeholderText = "Dr. Alper'e içini dök... (Seni dinliyorum)";
    else if (mode === 'consultant') placeholderText = "Stratejik bir soru sor veya dosya yükle...";
    else if (mode === 'finance') placeholderText = "Piyasa durumu, yatırım fikri veya bütçe planı sor...";
    else if (mode === 'personal_coach') placeholderText = "Hedefin ne? Alışkanlıklar, planlama veya motivasyon...";
    else if (mode === 'lawyer') placeholderText = "Hukuki sorununu, iltica durumunu veya davayı anlat...";

    return (
        <div className="flex flex-col h-full bg-transparent relative font-sans">
            {/* Header / Title Area */}
            <div className="absolute top-0 left-0 p-6 z-20 pointer-events-none flex items-center justify-between w-full pr-24">
                <div className="pointer-events-auto">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {mode === 'notebook' ? 'Notebook' : 
                             mode === 'maps' ? 'Keşfet & Planla' : 
                             mode === 'psychologist' ? 'Dr. Alper' : 
                             mode === 'consultant' ? 'Alper Danışman' : 
                             mode === 'finance' ? 'Alper Finans' : 
                             mode === 'personal_coach' ? 'Alper Koç' :
                             mode === 'lawyer' ? 'Alper Hukuk' :
                             'Alper AI'}
                        </span>
                    </h2>
                </div>
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 pt-24 pb-48 lg:pb-36 space-y-6 custom-scrollbar relative">
                {chatHistory.map((msg, idx) => (
                    (msg.text || msg.attachments?.length) && (
                        <div key={msg.id + idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                            <div className={`max-w-[90%] lg:max-w-[75%] p-5 rounded-2xl shadow-md ${
                                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 
                                msg.isError ? 'bg-red-900/50 text-red-100 border-red-800' : 
                                'bg-gray-900 text-gray-200 border-gray-800'
                            }`}>
                                {msg.attachments?.length ? (
                                    <div className="mb-3 flex gap-3 overflow-x-auto">
                                        {msg.attachments.map((att, i) => (
                                            att.mimeType.startsWith('image') ? 
                                            <img key={i} src={`data:${att.mimeType};base64,${att.data}`} className="h-20 rounded-lg" alt="Ek" /> :
                                            <div key={i} className="h-20 w-20 bg-white/10 rounded-lg flex items-center justify-center" aria-label="Dosya eki"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
                                        ))}
                                    </div>
                                ) : null}
                                <div className="text-sm"><FormattedText text={msg.text} /></div>
                                {msg.role === 'model' && !msg.isError && msg.id !== 'welcome' && <MessageActionMenu text={msg.text} />}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Thinking Indicator - Always visible when processing */}
            {isChatProcessing && (
                <div className="absolute bottom-28 left-4 z-40 animate-fadeIn pointer-events-none">
                    <div className="bg-gray-900/90 backdrop-blur p-3 rounded-2xl rounded-bl-none border border-gray-700 flex items-center gap-3 shadow-2xl">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                        <span className="text-xs text-blue-300 font-medium">Alper düşünüyor...</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-30">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    {mode === 'maps' && (
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                            {QUICK_CHIPS.map((chip, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => handleMapsQuery(chip.prompt, chip.label)} 
                                    disabled={isChatProcessing}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-green-700 text-white px-4 py-2 rounded-full border border-gray-700 hover:border-green-500 transition-all shadow-lg flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">{chip.icon}</span>
                                    <span className="text-sm font-medium">{chip.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {attachments.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto py-3 mb-2 px-1">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative w-14 h-14 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center flex-shrink-0">
                                    {att.mimeType.startsWith('image') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover rounded-xl" alt="Önizleme" /> : <span className="material-symbols-outlined text-gray-400" aria-hidden="true">description</span>}
                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5" aria-label="Eki kaldır"><span className="material-symbols-outlined text-10px font-bold" aria-hidden="true">close</span></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-gray-900 border border-gray-800 rounded-[2rem] p-2 shadow-2xl relative z-40">
                        <div className="flex-shrink-0">
                             <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.txt,.md" aria-hidden="true" />
                             <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all" 
                                aria-label="Dosya Ekle"
                                title="Dosya Ekle"
                             >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">add_circle</span>
                             </button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            placeholder={placeholderText}
                            className="flex-grow bg-transparent text-white placeholder-gray-500 py-3 px-2 outline-none resize-none max-h-32 custom-scrollbar text-base"
                            rows={1}
                            style={{ minHeight: '48px' }}
                            aria-label="Mesaj yazın"
                        />
                        <div className="flex items-center gap-2 pr-1 pb-1">
                            <button 
                                onClick={() => handleSend()} 
                                disabled={(!input.trim() && attachments.length === 0) || isChatProcessing} 
                                className={`p-3 rounded-full transition-all flex-shrink-0 flex items-center justify-center ${(!input.trim() && attachments.length === 0) || isChatProcessing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                                aria-label="Gönder"
                                title="Gönder"
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_upward</span>
                            </button>
                            <button 
                                onClick={() => setMode('live')} 
                                className="p-3 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-all group border border-gray-700"
                                aria-label="Canlı Sohbet Moduna Geç"
                                title="Canlı Sohbet"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:text-red-400 transition-colors" aria-hidden="true">mic</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isYouTubeModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6" role="dialog" aria-modal="true" aria-labelledby="yt-modal-title">
                    <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-800 animate-scaleUp">
                        <h3 id="yt-modal-title" className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-2xl" aria-hidden="true">smart_display</span> 
                            YouTube Analiz
                        </h3>
                        <p className="text-gray-400 text-sm mb-8">Video bağlantısını yapıştır.</p>
                        <div className="relative mb-8">
                            <input 
                                type="text" 
                                value={youTubeLink} 
                                onChange={(e) => setYouTubeLink(e.target.value)} 
                                placeholder="https://youtube.com/watch?v=..." 
                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 pl-12 text-white outline-none focus:border-red-500" 
                                aria-label="YouTube Linki"
                            />
                             <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500" aria-hidden="true">link</span>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsYouTubeModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white">Vazgeç</button>
                            <button onClick={handleYouTubeSubmit} disabled={!youTubeLink} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">Analiz Et</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { streamChat } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Attachment } from '../types';

declare const html2pdf: any; // Declare global for CDN library

// Clean Markdown Formatter
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-2 leading-relaxed">
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} className="min-h-[1em] text-gray-200">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={j}>{part.replace(/[_]/g, '')}</span>; 
                        })}
                    </p>
                );
            })}
        </div>
    );
};

// Helper Component for the Action Menu
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
        navigator.clipboard.writeText(text);
        setIsOpen(false);
    };

    const handleDownloadWord = () => {
        // More robust HTML structure for Word
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Alper AI Rapor</title>
                <!--[if gte mso 9]>
                <xml>
                <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; }
                    h1 { font-size: 16pt; border-bottom: 1px solid #333; margin-bottom: 10px; padding-bottom: 5px; }
                    p { margin-bottom: 10px; }
                    strong { font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Alper AI Raporu</h1>
                ${text.replace(/\n/g, '<p>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                <br><br>
                <p style="font-size: 9pt; color: #666;"><em>Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}</em></p>
            </body>
            </html>
        `;
        
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Alper-Rapor-${Date.now()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    };

    const handleDownloadPDF = () => {
        if (typeof html2pdf === 'undefined') {
            alert("PDF modülü yüklenemedi. Lütfen sayfayı yenileyin.");
            return;
        }

        // Create a clean temporary element for PDF generation
        const element = document.createElement('div');
        element.style.position = 'fixed';
        element.style.left = '-9999px'; // Move off-screen
        element.style.top = '0';
        element.style.width = '210mm'; // A4 width
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
        
        element.innerHTML = `
            <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #111; padding: 40px; background: #fff;">
                <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px;">
                    <h1 style="color: #000; margin: 0; font-size: 24px;">Alper AI Raporu</h1>
                    <span style="font-size: 12px; color: #666;">Oluşturulma: ${new Date().toLocaleString('tr-TR')}</span>
                </div>
                <div style="font-size: 14px; line-height: 1.6; text-align: justify;">
                    ${text.split('\n').map(line => `<p style="margin-bottom: 10px;">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}
                </div>
                <div style="margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                    Bu belge yapay zeka tarafından oluşturulmuştur.
                </div>
            </div>
        `;

        // IMPORTANT: Must append to body for html2canvas to render it
        document.body.appendChild(element);

        const opt = {
            margin:       10,
            filename:     `Alper-Rapor-${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Clean up
            document.body.removeChild(element);
        }).catch((err: any) => {
            console.error("PDF Error:", err);
            document.body.removeChild(element);
        });

        setIsOpen(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Alper AI Yanıtı',
                    text: text,
                });
            } catch (err) {
                // Cancelled
            }
        } else {
            handleCopy();
            alert("Metin kopyalandı.");
        }
        setIsOpen(false);
    };

    return (
        <div className="relative mt-2" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-gray-800"
                aria-label="Diğer İşlemler"
                title="İşlemler"
            >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">more_horiz</span>
                <span className="font-medium">İşlemler</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">content_copy</span> Kopyala
                    </button>
                    <div className="h-px bg-gray-800 mx-2"></div>
                    <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400 flex items-center gap-3 transition-colors">
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">picture_as_pdf</span> PDF İndir
                    </button>
                    <button onClick={handleDownloadWord} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-blue-400 flex items-center gap-3 transition-colors">
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">description</span> Word İndir
                    </button>
                    <div className="h-px bg-gray-800 mx-2"></div>
                    <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-green-400 flex items-center gap-3 transition-colors">
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">share</span> Paylaş
                    </button>
                </div>
            )}
        </div>
    );
};

export const ChatInterface: React.FC = () => {
    const { chatHistory, addChatMessage, isChatProcessing, setIsChatProcessing, userLocation, mode, isYouTubeModalOpen, setIsYouTubeModalOpen, setMode } = useAppContext();
    const [input, setInput] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    
    // Attachments State
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [youTubeLink, setYouTubeLink] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isChatProcessing, attachments]);

    // Handle File Select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = (ev.target?.result as string).split(',')[1];
                    const mimeType = file.type;
                    setAttachments(prev => [...prev, { data: base64, mimeType }]);
                };
                reader.readAsDataURL(file);
            });
        }
        if (e.target) e.target.value = '';
    };

    const handleYouTubeSubmit = () => {
        if (youTubeLink) {
            const prompt = `Lütfen şu YouTube videosunu analiz et: ${youTubeLink}. İçeriğini özetle ve önemli noktaları çıkar.`;
            setInput(prompt);
            setUseSearch(true);
            setYouTubeLink('');
            setIsYouTubeModalOpen(false);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && attachments.length === 0) || isChatProcessing) return;

        const currentAttachments = [...attachments];
        const currentInput = input;
        
        setAttachments([]);
        setInput('');
        
        const userMsg: ChatMessage = { 
            id: uuidv4(), 
            role: 'user', 
            text: currentInput || (currentAttachments.length > 0 ? '[Dosya Gönderildi]' : ''), 
            timestamp: Date.now(),
            attachments: currentAttachments 
        };
        
        addChatMessage(userMsg);
        setIsChatProcessing(true);

        const apiHistory = chatHistory.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const mapsActive = mode === 'maps';
        const searchActive = useSearch || mode === 'maps'; 

        try {
            const stream = await streamChat(apiHistory, currentInput, currentAttachments, searchActive, mapsActive, userLocation);
            
            let fullText = '';
            
            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                }
            }
             addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });

        } catch (e: any) {
            console.error(e);
            addChatMessage({ id: uuidv4(), role: 'model', text: `Bağlantı sorunu oluştu: ${e.message || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`, timestamp: Date.now(), isError: true });
        } finally {
            setIsChatProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 relative font-sans">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 p-6 z-20 pointer-events-none flex items-center justify-between w-full pr-24">
                <div className="pointer-events-auto">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md tracking-tight">
                        {mode === 'notebook' && <span className="material-symbols-outlined text-yellow-500 text-2xl" aria-hidden="true">auto_stories</span>}
                        {mode === 'maps' && <span className="material-symbols-outlined text-green-500 text-2xl" aria-hidden="true">explore</span>}
                        {mode === 'chat' && <span className="material-symbols-outlined text-blue-500 text-2xl" aria-hidden="true">chat_bubble</span>}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {mode === 'notebook' ? 'Notebook' : mode === 'maps' ? 'Keşfet' : 'Alper AI'}
                        </span>
                    </h2>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 pt-24 pb-36 space-y-6 custom-scrollbar" aria-live="polite">
                {chatHistory.map((msg, idx) => (
                    (msg.text || msg.attachments?.length) && (
                        <div key={msg.id + idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                            <div className={`max-w-[90%] lg:max-w-[75%] p-5 rounded-2xl shadow-md ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                    : msg.isError 
                                        ? 'bg-red-900/50 text-red-100 rounded-bl-sm border border-red-800'
                                        : 'bg-gray-900 text-gray-200 rounded-bl-sm border border-gray-800'
                            }`}>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mb-3 flex gap-3 overflow-x-auto">
                                        {msg.attachments.map((att, i) => (
                                            att.mimeType.startsWith('image') ? 
                                            <img key={i} src={`data:${att.mimeType};base64,${att.data}`} className="h-20 rounded-lg border border-white/10 shadow-sm" alt="Ekli görsel" /> :
                                            <div key={i} className="h-20 w-20 bg-white/10 rounded-lg flex items-center justify-center border border-white/10"><span className="material-symbols-outlined" aria-hidden="true">description</span></div>
                                        ))}
                                    </div>
                                )}
                                <div className="text-sm">
                                    <FormattedText text={msg.text} />
                                </div>

                                {/* Dropdown Menu for Model Messages */}
                                {msg.role === 'model' && !msg.isError && msg.id !== 'welcome' && (
                                    <MessageActionMenu text={msg.text} />
                                )}
                            </div>
                        </div>
                    )
                ))}
                
                {/* Thinking Indicator */}
                {isChatProcessing && (
                     <div className="flex justify-start animate-fadeIn">
                        <div className="bg-gray-900 p-4 rounded-2xl rounded-bl-none border border-gray-800 flex items-center gap-3">
                            <div className="flex gap-1" aria-hidden="true">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                            <span className="text-xs text-blue-300 font-medium animate-pulse">Alper düşünüyor...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-30">
                <div className="max-w-4xl mx-auto">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto py-3 mb-2 px-1">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative w-14 h-14 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    {att.mimeType.startsWith('image') ? (
                                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover rounded-xl" alt="Önizleme" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400" aria-hidden="true">description</span>
                                    )}
                                    <button 
                                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-sm hover:bg-red-500 transition-colors"
                                        aria-label="Dosyayı kaldır"
                                    >
                                        <span className="material-symbols-outlined text-10px font-bold" aria-hidden="true">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-gray-900 border border-gray-800 rounded-[2rem] p-2 shadow-2xl relative z-40">
                        {/* File Button */}
                        <div className="flex-shrink-0">
                             <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple 
                                onChange={handleFileSelect} 
                                className="hidden" 
                                accept="image/*,.pdf,.txt,.md" 
                             />
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
                                title="Dosya/Resim Ekle"
                                aria-label="Dosya Ekle"
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">add_circle</span>
                             </button>
                        </div>

                        {/* Input */}
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={mode === 'notebook' ? "Kaynak ekle veya talimat ver..." : "Alper ile konuş..."}
                            className="flex-grow bg-transparent text-white placeholder-gray-500 py-3 px-2 outline-none resize-none max-h-32 custom-scrollbar text-base"
                            rows={1}
                            style={{ minHeight: '48px' }}
                            aria-label="Mesaj yazın"
                        />

                        {/* Action Buttons Group */}
                        <div className="flex items-center gap-2 pr-1 pb-1">
                            {/* Send Button */}
                            <button 
                                onClick={handleSend}
                                disabled={(!input.trim() && attachments.length === 0) || isChatProcessing}
                                className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 flex items-center justify-center
                                    ${(!input.trim() && attachments.length === 0) || isChatProcessing 
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                                        : 'bg-white text-black hover:bg-gray-200 shadow-lg hover:shadow-white/10 transform hover:scale-105'
                                    }`}
                                title="Gönder"
                                aria-label="Mesajı Gönder"
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_upward</span>
                            </button>

                            {/* Live Chat Button */}
                            <button
                                onClick={() => setMode('live')}
                                className="p-3 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-all group border border-gray-700 hover:border-gray-500"
                                title="Canlı Konuşma"
                                aria-label="Canlı Konuşmayı Başlat"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:text-red-400 transition-colors" aria-hidden="true">mic</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* YouTube Modal */}
            {isYouTubeModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6" role="dialog" aria-modal="true" aria-labelledby="yt-modal-title">
                    <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-800 animate-scaleUp">
                        <h3 id="yt-modal-title" className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-2xl" aria-hidden="true">smart_display</span>
                            YouTube Analiz
                        </h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            Video bağlantısını yapıştır. Alper içeriği izleyip saniyeler içinde özetleyecek.
                        </p>
                        <div className="relative mb-8">
                            <input 
                                type="text" 
                                value={youTubeLink}
                                onChange={(e) => setYouTubeLink(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 pl-12 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-600"
                                aria-label="YouTube Linki"
                            />
                             <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500" aria-hidden="true">link</span>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsYouTubeModalOpen(false)}
                                className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors font-medium text-sm"
                            >
                                Vazgeç
                            </button>
                            <button 
                                onClick={handleYouTubeSubmit}
                                disabled={!youTubeLink}
                                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:shadow-none transition-all text-sm"
                            >
                                Analiz Et
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { NotebookEntry, NotebookSource } from '../types';
import { generateNotebookPodcast, generateNotebookVideoPrompt, generateNotebookVideoScript, generateVideo, generateNotebookMindMap, generateStudyGuide, generateQuiz } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';

type Tab = 'sources' | 'chat' | 'studio';
type SourceType = 'text' | 'file' | 'youtube';

export const NotebookInterface: React.FC = () => {
    const { notebookSources, addNotebookSource, removeNotebookSource, notebookEntries, addNotebookEntry } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('studio');
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    
    // Source Modal State
    const [sourceType, setSourceType] = useState<SourceType>('text');
    const [newSourceText, setNewSourceText] = useState('');
    const [newSourceUrl, setNewSourceUrl] = useState('');
    const [newSourceFile, setNewSourceFile] = useState<{name: string, content: string, mimeType: string} | null>(null);
    
    // Chat State for Notebook
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isChatting, setIsChatting] = useState(false);

    // Customization State
    const [customizingType, setCustomizingType] = useState<string | null>(null);
    const [customInstructionInput, setCustomInstructionInput] = useState('');

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        if (file.type === 'application/pdf') {
            reader.onload = (ev) => {
                const base64 = (ev.target?.result as string).split(',')[1];
                setNewSourceFile({ name: file.name, content: base64, mimeType: 'application/pdf' });
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = (ev) => {
                const text = ev.target?.result as string;
                setNewSourceFile({ name: file.name, content: text, mimeType: 'text/plain' });
            };
            reader.readAsText(file);
        }
    };

    const handleAddSource = () => {
        let newSource: NotebookSource | null = null;

        if (sourceType === 'text' && newSourceText.trim()) {
            newSource = {
                id: uuidv4(),
                title: `Not ${notebookSources.length + 1}`,
                content: newSourceText,
                type: 'text',
                mimeType: 'text/plain'
            };
        } else if (sourceType === 'youtube' && newSourceUrl.trim()) {
            newSource = {
                id: uuidv4(),
                title: `YouTube Video`,
                content: `YouTube Link: ${newSourceUrl}`,
                type: 'youtube',
                url: newSourceUrl,
                mimeType: 'text/plain'
            };
        } else if (sourceType === 'file' && newSourceFile) {
            newSource = {
                id: uuidv4(),
                title: newSourceFile.name,
                content: newSourceFile.content,
                type: 'file',
                mimeType: newSourceFile.mimeType
            };
        }

        if (newSource) {
            addNotebookSource(newSource);
            // Reset fields
            setNewSourceText('');
            setNewSourceUrl('');
            setNewSourceFile(null);
            setIsSourceModalOpen(false);
        }
    };

    const handleNotebookChat = async () => {
        if (!chatInput.trim() || notebookSources.length === 0) return;
        
        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatting(true);

        try {
            // Simplified chat context for now (just text content or placeholders)
            // Ideally should use generateStudyGuide which handles sources better
            const response = await generateStudyGuide(notebookSources, `Kullanıcı sorusu: "${userMsg}". Sadece bu kaynaklara dayanarak Türkçe cevap ver.`); 
            setChatMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'model', text: "Bir hata oluştu." }]);
        } finally {
            setIsChatting(false);
        }
    };

    const handleGenerate = async (type: string, instruction: string = '') => {
        if (notebookSources.length === 0) {
            alert("Lütfen önce 'Kaynaklar' sekmesinden içerik ekleyin.");
            setActiveTab('sources');
            return;
        }
        
        // Paid key check for Veo features
        if (type === 'video_summary') {
             if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
                 await window.aistudio.openSelectKey();
             }
        }

        setCustomizingType(null);
        setCustomInstructionInput('');

        const entryId = uuidv4();
        let titlePlaceholder = 'İçerik';
        let content = '';

        addNotebookEntry({
            id: entryId,
            type: type as any,
            title: 'Hazırlanıyor...',
            content: '',
            isLoading: true,
            customInstruction: instruction
        });

        try {
            if (type === 'podcast') {
                content = await generateNotebookPodcast(notebookSources, instruction);
                titlePlaceholder = 'Sesli Özet (Podcast)';
            } else if (type === 'video_summary') {
                // Generate Visual Prompt (for Veo based on Sources) AND Long Script (for Content) in parallel
                const [visualPrompt, scriptText] = await Promise.all([
                    generateNotebookVideoPrompt(notebookSources, instruction),
                    generateNotebookVideoScript(notebookSources, instruction)
                ]);
                
                // Generate Video Loop (Veo)
                const videoUrl = await generateVideo(visualPrompt, '16:9');
                
                // Combine into a presentation structure
                content = JSON.stringify({ videoUrl, script: scriptText });
                titlePlaceholder = 'Video Sunum (Deep Dive)';
            } else if (type === 'mind_map') {
                content = await generateNotebookMindMap(notebookSources);
                titlePlaceholder = 'Zihin Haritası';
            } else if (type === 'reports') {
                content = await generateStudyGuide(notebookSources, instruction);
                titlePlaceholder = 'Çalışma Kılavuzu';
            } else if (type === 'quiz') {
                content = await generateQuiz(notebookSources, instruction);
                titlePlaceholder = 'Test / Sınav';
            } else {
                content = await generateStudyGuide(notebookSources, instruction || "Özetle");
                titlePlaceholder = type === 'flashcards' ? 'Bilgi Kartları' : type === 'infographic' ? 'İnfografik Verileri' : 'Slayt İçeriği';
            }

             addNotebookEntry({
                id: uuidv4(),
                type: type as any,
                title: titlePlaceholder,
                content,
                isLoading: false,
                customInstruction: instruction
            });

        } catch (e) {
            console.error(e);
            alert("İşlem sırasında bir hata oluştu.");
        }
    };

    const STUDIO_CARDS = [
        { id: 'podcast', label: 'Sesli Özet (Deep Dive)', icon: 'headphones' },
        { id: 'video_summary', label: 'Video Sunum', icon: 'smart_display' },
        { id: 'mind_map', label: 'Zihin Haritası', icon: 'account_tree' },
        { id: 'reports', label: 'Raporlar', icon: 'assignment' },
        { id: 'flashcards', label: 'Bilgi Kartları', icon: 'style' },
        { id: 'quiz', label: 'Test / Sınav', icon: 'quiz' },
        { id: 'infographic', label: 'İnfografik', icon: 'bar_chart' },
        { id: 'slides', label: 'Slayt Sunusu', icon: 'slideshow' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-200 font-sans">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1e1e1e]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-black text-2xl" aria-hidden="true">auto_stories</span>
                    </div>
                    <span className="text-xl font-medium text-white">Notebook Asistanı</span>
                </div>
                
                {/* Center Tabs */}
                <div className="flex gap-8" role="tablist">
                    <button 
                        onClick={() => setActiveTab('sources')}
                        role="tab"
                        aria-selected={activeTab === 'sources'}
                        className={`pb-1 text-sm font-medium transition-colors ${activeTab === 'sources' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Kaynaklar
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        role="tab"
                        aria-selected={activeTab === 'chat'}
                        className={`pb-1 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Sohbet
                    </button>
                    <button 
                        onClick={() => setActiveTab('studio')}
                        role="tab"
                        aria-selected={activeTab === 'studio'}
                        className={`pb-1 text-sm font-medium transition-colors ${activeTab === 'studio' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Stüdyo
                    </button>
                </div>

                <div className="w-10"></div> {/* Spacer for alignment */}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-hidden relative">
                
                {/* TAB 1: SOURCES */}
                {activeTab === 'sources' && (
                    <div className="h-full p-8 overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-medium text-white">Kaynaklar ({notebookSources.length})</h2>
                                <button 
                                    onClick={() => setIsSourceModalOpen(true)}
                                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
                                    aria-label="Yeni Kaynak Ekle"
                                >
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span> Kaynak Ekle
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {notebookSources.map(source => (
                                    <div key={source.id} className="bg-[#2a2a2a] p-4 rounded-xl border border-white/5 relative group hover:border-white/20 transition-all">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className={`p-2 rounded ${source.type === 'youtube' ? 'bg-red-500/20 text-red-400' : source.type === 'file' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                                                    {source.type === 'youtube' ? 'smart_display' : source.type === 'file' ? 'picture_as_pdf' : 'description'}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-white truncate w-full" title={source.title}>{source.title}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-3">
                                            {source.type === 'file' ? '[Dosya İçeriği]' : source.content}
                                        </p>
                                        <button 
                                            onClick={() => removeNotebookSource(source.id)}
                                            className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Kaynağı Sil"
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">close</span>
                                        </button>
                                    </div>
                                ))}
                                
                                {/* Add Button Card */}
                                <button 
                                    onClick={() => setIsSourceModalOpen(true)}
                                    className="bg-[#2a2a2a] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-[#333] transition-colors h-40"
                                    aria-label="Metin, Dosya veya YouTube Ekle"
                                >
                                    <span className="material-symbols-outlined text-3xl text-gray-500 mb-2" aria-hidden="true">add_circle</span>
                                    <span className="text-sm text-gray-400">Kaynak Ekle</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CHAT */}
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col max-w-4xl mx-auto bg-[#1e1e1e]">
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar" aria-live="polite">
                            {notebookSources.length === 0 && (
                                <div className="text-center text-gray-500 mt-20">
                                    <p>Sohbet etmek için önce 'Kaynaklar' sekmesinden içerik ekleyin.</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#333] text-white' : 'bg-transparent border border-white/10 text-gray-200'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatting && <div className="text-gray-500 text-sm animate-pulse">Alper yazıyor...</div>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-6 border-t border-white/10">
                            <div className="bg-[#2a2a2a] rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-white/30 transition-colors">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNotebookChat()}
                                    placeholder="Kaynaklarınızla sohbet edin..."
                                    className="bg-transparent flex-grow outline-none text-white placeholder-gray-500 py-2"
                                    aria-label="Mesaj yazın"
                                />
                                <button onClick={handleNotebookChat} className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors" aria-label="Gönder">
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_upward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: STUDIO (Grid Layout) */}
                {activeTab === 'studio' && (
                    <div className="h-full p-6 overflow-y-auto custom-scrollbar">
                        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {STUDIO_CARDS.map(card => (
                                <div 
                                    key={card.id} 
                                    className="bg-[#2a2a2a] rounded-2xl p-4 h-32 relative border border-white/5 hover:bg-[#333] transition-colors group flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start w-full relative z-20 pointer-events-none">
                                        <span className="material-symbols-outlined text-2xl text-gray-400" aria-hidden="true">{card.icon}</span>
                                        {/* Accessible Pen Button */}
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                e.preventDefault();
                                                setCustomizingType(card.id); 
                                            }}
                                            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors focus:ring-2 focus:ring-white outline-none pointer-events-auto"
                                            title={`${card.label} Özelleştir`}
                                            aria-label={`${card.label} Özelleştir`}
                                        >
                                            <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                                        </button>
                                    </div>
                                    
                                    {/* Main Card Action (Generate) - Stretched Link */}
                                    <button 
                                        onClick={() => handleGenerate(card.id)}
                                        className="text-left text-sm font-medium text-gray-200 group-hover:text-white outline-none before:absolute before:inset-0 before:z-10 before:rounded-2xl focus:before:ring-2 focus:before:ring-inset focus:before:ring-white"
                                        aria-label={`${card.label} Oluştur`}
                                    >
                                        {card.label}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Generated Results List */}
                        <div className="max-w-5xl mx-auto mt-8 space-y-6 pb-24" aria-live="polite">
                            {notebookEntries.map(entry => (
                                <div key={entry.id} className="bg-[#252525] rounded-xl border border-white/5 overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#2a2a2a]">
                                        <h3 className="font-medium text-white flex items-center gap-2">
                                            {entry.type === 'podcast' ? <span className="material-symbols-outlined" aria-hidden="true">graphic_eq</span> : <span className="material-symbols-outlined" aria-hidden="true">description</span>}
                                            {entry.title}
                                        </h3>
                                        {entry.customInstruction && <span className="text-xs text-gray-500 bg-black/20 px-2 py-1 rounded">"{entry.customInstruction}"</span>}
                                    </div>
                                    <div className="p-6 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {entry.isLoading ? (
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                                                Oluşturuluyor...
                                            </div>
                                        ) : entry.type === 'video_summary' ? (
                                            (() => {
                                                try {
                                                    const d = JSON.parse(entry.content);
                                                    return (
                                                        <div className="flex flex-col gap-4">
                                                            {/* Video Presentation Player */}
                                                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl group border border-white/10">
                                                                <video 
                                                                    src={d.videoUrl} 
                                                                    autoPlay 
                                                                    loop 
                                                                    muted 
                                                                    playsInline
                                                                    className="w-full h-full object-cover opacity-60" 
                                                                    aria-label="Atmosferik Arka Plan" 
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                                                <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none">
                                                                    <div className="mb-4">
                                                                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Video Makale</span>
                                                                    </div>
                                                                    <h4 className="text-white font-bold text-2xl mb-2 flex items-center gap-2">
                                                                        Deep Dive Sunum
                                                                    </h4>
                                                                    <p className="text-xs text-gray-300">Veo ile güçlendirilmiş video arka planı</p>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Script Content */}
                                                            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                                                                <h3 className="text-white font-bold mb-4 sticky top-0 bg-[#1a1a1a] py-2 border-b border-white/10 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined">script</span>
                                                                    Senaryo / Anlatım Metni
                                                                </h3>
                                                                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                                                    {d.script.split('\n').map((line: string, i: number) => (
                                                                        <p key={i} className="mb-3">{line}</p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                } catch { return entry.content }
                                            })()
                                        ) : (
                                            entry.content
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Bar "Studio Output" */}
                {activeTab === 'studio' && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none w-full px-4">
                        <span className="material-symbols-outlined text-gray-600" aria-hidden="true">auto_awesome</span>
                        <p className="text-xs text-gray-500 text-center">Stüdyo çıktıları buraya kaydedilir.</p>
                        <button 
                            className="mt-2 bg-white text-black px-6 py-2 rounded-full font-medium shadow-lg pointer-events-auto hover:bg-gray-200 transition-colors flex items-center gap-2"
                            onClick={() => setIsSourceModalOpen(true)}
                            aria-label="Not Ekle"
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">sticky_note_2</span> Not Ekle
                        </button>
                    </div>
                )}
            </div>

            {/* Source Modal */}
            {isSourceModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    <div className="bg-[#2a2a2a] w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl animate-scaleUp">
                        <div className="flex justify-between items-center mb-6">
                            <h3 id="modal-title" className="text-lg font-bold text-white">Kaynak Ekle</h3>
                            <button onClick={() => setIsSourceModalOpen(false)} className="text-gray-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex mb-4 bg-black/30 rounded-lg p-1">
                            <button onClick={() => setSourceType('text')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${sourceType === 'text' ? 'bg-[#333] text-white shadow' : 'text-gray-400 hover:text-white'}`}>Metin</button>
                            <button onClick={() => setSourceType('file')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${sourceType === 'file' ? 'bg-[#333] text-white shadow' : 'text-gray-400 hover:text-white'}`}>Dosya (PDF)</button>
                            <button onClick={() => setSourceType('youtube')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${sourceType === 'youtube' ? 'bg-[#333] text-white shadow' : 'text-gray-400 hover:text-white'}`}>YouTube</button>
                        </div>

                        <div className="mb-6">
                            {sourceType === 'text' && (
                                <textarea 
                                    className="w-full h-48 bg-[#1e1e1e] rounded-xl p-4 text-white outline-none border border-white/10 focus:border-white/30 resize-none placeholder-gray-500"
                                    placeholder="Metni buraya yapıştırın..."
                                    value={newSourceText}
                                    onChange={(e) => setNewSourceText(e.target.value)}
                                />
                            )}
                            {sourceType === 'youtube' && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-500">link</span>
                                        <input 
                                            type="text"
                                            className="w-full bg-[#1e1e1e] rounded-xl p-3 pl-12 text-white outline-none border border-white/10 focus:border-white/30"
                                            placeholder="YouTube Video Bağlantısı"
                                            value={newSourceUrl}
                                            onChange={(e) => setNewSourceUrl(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Alper videoyu izleyip içeriğini analiz edecektir.</p>
                                </div>
                            )}
                            {sourceType === 'file' && (
                                <div 
                                    className="border-2 border-dashed border-white/10 hover:border-white/30 rounded-xl p-10 text-center cursor-pointer transition-colors bg-[#1e1e1e]"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {newSourceFile ? (
                                        <div className="flex flex-col items-center">
                                            <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                            <p className="text-white font-medium">{newSourceFile.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Değiştirmek için tıkla</p>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">upload_file</span>
                                            <p className="text-gray-300 font-medium">PDF veya TXT Yükle</p>
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleFileSelect} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsSourceModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">İptal</button>
                            <button 
                                onClick={handleAddSource} 
                                disabled={
                                    (sourceType === 'text' && !newSourceText.trim()) ||
                                    (sourceType === 'youtube' && !newSourceUrl.trim()) ||
                                    (sourceType === 'file' && !newSourceFile)
                                }
                                className="px-6 py-2 bg-white text-black rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {customizingType && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="custom-modal-title">
                    <div className="bg-[#2a2a2a] w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl animate-scaleUp">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <span className="material-symbols-outlined" aria-hidden="true">magic_button</span>
                            <h3 id="custom-modal-title" className="font-bold">Özelleştir</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Bu içerik nasıl oluşturulsun?</p>
                        <textarea 
                            className="w-full h-32 bg-[#1e1e1e] rounded-xl p-4 text-white outline-none border border-white/10 focus:border-white/30 resize-none mb-4 placeholder-gray-500"
                            placeholder="Örn: 'Daha kısa olsun', 'Sadece önemli tarihleri listele', 'Çocuklar için anlat'..."
                            value={customInstructionInput}
                            onChange={(e) => setCustomInstructionInput(e.target.value)}
                            aria-label="Özelleştirme Talimatı"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setCustomizingType(null)} className="px-4 py-2 text-gray-400 hover:text-white">Vazgeç</button>
                            <button onClick={() => handleGenerate(customizingType!, customInstructionInput)} className="px-6 py-2 bg-white text-black rounded-full font-medium">Oluştur</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

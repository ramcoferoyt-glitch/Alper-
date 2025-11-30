/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { generateBookManuscript, continueBookManuscript } from '../services/GeminiService';

declare const html2pdf: any;

const STYLES = [
    { id: 'editors_choice', label: 'Editörün Seçimi (Dengeli)' },
    { id: 'fiction', label: 'Sürükleyici Roman (Kurgu)' },
    { id: 'academic', label: 'Akademik / Bilimsel' },
    { id: 'self_help', label: 'Kişisel Gelişim (Samimi)' },
    { id: 'biography', label: 'Biyografi / Anlatı' },
    { id: 'thriller', label: 'Gerilim / Gizem' },
];

export const EditorInterface: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'text' | 'files'>('text');
    const [pastedText, setPastedText] = useState('');
    const [files, setFiles] = useState<{ name: string; content: string; type: 'file'; mimeType: string }[]>([]);
    const [instructions, setInstructions] = useState('');
    const [pageCount, setPageCount] = useState(200);
    const [selectedStyle, setSelectedStyle] = useState('editors_choice');
    const [isComplete, setIsComplete] = useState(false);
    
    // Auto-Save: Load from localStorage
    const [manuscript, setManuscript] = useState(() => {
        return localStorage.getItem('alper_editor_draft') || '';
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isContinuing, setIsContinuing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Auto-Save Effect
    useEffect(() => {
        localStorage.setItem('alper_editor_draft', manuscript);
    }, [manuscript]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                
                // PDF'ler için DataURL (Base64), Metin dosyaları için Text oku
                if (file.type === 'application/pdf') {
                    reader.onload = (ev) => {
                        const base64 = (ev.target?.result as string).split(',')[1];
                        setFiles(prev => [...prev, { name: file.name, content: base64, type: 'file', mimeType: 'application/pdf' }]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    reader.onload = (ev) => {
                        const text = ev.target?.result as string;
                        setFiles(prev => [...prev, { name: file.name, content: text, type: 'file', mimeType: 'text/plain' }]);
                    };
                    reader.readAsText(file);
                }
            });
        }
        // Input değerini sıfırla ki aynı dosya tekrar seçilebilsin
        if(e.target) e.target.value = '';
    };

    const handleGenerate = async () => {
        const hasContent = pastedText.trim().length > 0 || files.length > 0;
        if (!hasContent && !instructions) return;

        setIsGenerating(true);
        setIsComplete(false);
        try {
            // Combine sources structure
            const sources = files.map(f => ({
                content: f.content,
                mimeType: f.mimeType,
                isInlineData: f.mimeType === 'application/pdf' // PDF is inline data, text is text
            }));

            if (pastedText.trim()) {
                sources.push({ content: pastedText, mimeType: 'text/plain', isInlineData: false });
            }

            const styleLabel = STYLES.find(s => s.id === selectedStyle)?.label || 'Profesyonel';
            
            const result = await generateBookManuscript(sources, instructions, pageCount, styleLabel);
            setManuscript(result);
        } catch (e) {
            console.error(e);
            alert("Kitap oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleContinue = async () => {
        if (!manuscript || isComplete) return;
        setIsContinuing(true);
        try {
            const styleLabel = STYLES.find(s => s.id === selectedStyle)?.label || 'Profesyonel';
            const newContent = await continueBookManuscript(manuscript, instructions, styleLabel);
            
            if (newContent.includes('[SON]')) {
                setIsComplete(true);
                const cleanContent = newContent.replace('[SON]', '');
                setManuscript(prev => prev + "\n\n" + cleanContent);
            } else {
                setManuscript(prev => prev + "\n\n" + newContent);
            }
        } catch (e) {
            console.error(e);
            alert("Devam ederken hata oluştu.");
        } finally {
            setIsContinuing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(manuscript).then(() => {
            alert("Metin kopyalandı!");
            setIsMenuOpen(false);
        });
    };

    const handleClear = () => {
        if (confirm("Taslak tamamen silinecek. Emin misiniz?")) {
            setManuscript('');
            localStorage.removeItem('alper_editor_draft');
            setIsComplete(false);
            setIsMenuOpen(false);
        }
    };

    const handleDownloadWord = () => {
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Kitap Taslağı</title></head>
            <body>
                ${manuscript.replace(/\n/g, '<br>')}
            </body></html>`;
        
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Alper-Kitap-${Date.now()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsMenuOpen(false);
    };

    const handleDownloadPDF = () => {
        if (!manuscript || typeof html2pdf === 'undefined') return;

        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Georgia, serif';
        element.style.lineHeight = '1.8';
        element.style.fontSize = '12pt';
        element.style.color = '#000';
        element.style.background = '#fff';
        element.style.width = '210mm'; 

        const formattedHTML = manuscript
            .replace(/^# (.*$)/gim, '<h1 style="text-align: center; page-break-before: always; margin-top: 50px; margin-bottom: 30px; font-size: 24pt;">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 style="margin-top: 30px; margin-bottom: 20px; font-size: 18pt;">$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<p style="margin-bottom: 10px; text-align: justify;">');

        element.innerHTML = `
            <div style="text-align: center; margin-top: 150px; margin-bottom: 150px;">
                <h1 style="font-size: 32pt; margin-bottom: 20px;">Taslak Kitap</h1>
                <p style="font-size: 12pt; color: #666;">Alper Editör ile Oluşturuldu</p>
                <p style="font-size: 10pt; color: #999;">${new Date().toLocaleDateString('tr-TR')}</p>
            </div>
            ${formattedHTML}
        `;
        
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        element.style.top = '0';
        document.body.appendChild(element);

        html2pdf().set({
            margin: 15,
            filename: 'kitap-taslak.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            document.body.removeChild(element);
            setIsMenuOpen(false);
        }).catch((err:any) => {
            console.error(err);
            document.body.removeChild(element);
        });
    };

    const characterCount = pastedText.length;
    const wordCount = pastedText.trim().split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div className="flex h-full bg-gray-950 text-white font-sans overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-[450px] bg-gray-900 border-r border-gray-800 flex flex-col z-10 flex-shrink-0">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-yellow-500 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined" aria-hidden="true">edit_document</span>
                        Alper Editör
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">Alper X5 Destekli Profesyonel Kitap Mimarı.</p>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Input Method Tabs */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">İçerik Kaynağı</label>
                        <div className="flex bg-gray-800 p-1 rounded-xl" role="tablist">
                            <button 
                                onClick={() => setActiveTab('text')}
                                role="tab"
                                aria-selected={activeTab === 'text'}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'text' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Metin Yapıştır
                            </button>
                            <button 
                                onClick={() => setActiveTab('files')}
                                role="tab"
                                aria-selected={activeTab === 'files'}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'files' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Dosya Yükle
                            </button>
                        </div>
                    </div>

                    {/* TEXT INPUT AREA */}
                    {activeTab === 'text' && (
                        <div className="animate-fadeIn">
                            <div className="relative">
                                <textarea
                                    value={pastedText}
                                    onChange={(e) => setPastedText(e.target.value)}
                                    placeholder="Kitabınızın ham metnini, notlarınızı veya bölüm taslaklarını buraya yapıştırın. Sınırsız uzunlukta olabilir..."
                                    className="w-full h-64 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none placeholder-gray-500 custom-scrollbar"
                                    aria-label="Kitap Metni Girişi"
                                ></textarea>
                                <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded-md border border-gray-700">
                                    {wordCount} kelime / {characterCount} karakter
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 ml-1">* 100.000+ karaktere kadar metin işleyebilir.</p>
                        </div>
                    )}

                    {/* FILE INPUT AREA */}
                    {activeTab === 'files' && (
                        <div className="animate-fadeIn">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                aria-label="Dosya Seç"
                                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-700 hover:border-yellow-500/50 hover:bg-yellow-500/10 rounded-xl p-8 text-center cursor-pointer transition-all group"
                            >
                                <span className="material-symbols-outlined text-4xl text-gray-600 group-hover:text-yellow-500 transition-colors mb-3" aria-hidden="true">upload_file</span>
                                <p className="text-sm text-gray-300 font-medium">Dosyaları Seçin</p>
                                <p className="text-xs text-gray-500 mt-1">PDF, TXT, MD desteklenir</p>
                                <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md" className="hidden" onChange={handleFileSelect} aria-hidden="true" />
                            </div>
                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg text-xs border border-gray-700">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="material-symbols-outlined text-gray-500 text-sm" aria-hidden="true">
                                                    {f.mimeType === 'application/pdf' ? 'picture_as_pdf' : 'description'}
                                                </span>
                                                <span className="truncate max-w-[200px] text-gray-300">{f.name}</span>
                                            </div>
                                            <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-400 p-1" aria-label="Dosyayı kaldır">
                                                <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Style Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Yazım Stili & Ton</label>
                        <select 
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl p-3 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                            aria-label="Stil Seçimi"
                        >
                            {STYLES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Vizyon & Talimatlar</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Örn: 'Bölümler arası geçişlerde gerilimi yüksek tut. Kahramanın iç dünyasına odaklan. Stoacı felsefeyi ince bir şekilde işle.'"
                            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none"
                            aria-label="Talimatlar"
                        ></textarea>
                    </div>

                    {/* Page Count */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Hedef Uzunluk (Sayfa)</label>
                        <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-xl border border-gray-700">
                            <span className="material-symbols-outlined text-gray-400" aria-hidden="true">auto_stories</span>
                            <input 
                                type="number" 
                                value={pageCount} 
                                onChange={(e) => setPageCount(parseInt(e.target.value))}
                                className="bg-transparent w-full outline-none font-bold text-white placeholder-gray-600"
                                min={10} max={1000}
                                aria-label="Sayfa Sayısı"
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Button */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/95 backdrop-blur">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || isContinuing || (files.length === 0 && !pastedText.trim() && !instructions)}
                        className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
                        aria-label={isGenerating ? "Kitap Yazılıyor..." : "Kitabı Yazmaya Başla"}
                    >
                        {isGenerating ? <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span> : <span className="material-symbols-outlined" aria-hidden="true">history_edu</span>}
                        {isGenerating ? 'Yazılıyor...' : 'Kitabı Yazmaya Başla'}
                    </button>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-grow bg-gray-200 text-black overflow-y-auto p-4 lg:p-12 flex justify-center custom-scrollbar relative">
                <div ref={previewRef} className="max-w-4xl w-full bg-white shadow-2xl min-h-[1000px] p-12 lg:p-24 relative mb-20" aria-live="polite">
                    {!manuscript && !isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <span className="material-symbols-outlined text-8xl mb-4 text-gray-300" aria-hidden="true">import_contacts</span>
                            <p className="text-xl font-serif font-medium text-gray-500">Taslak burada oluşturulacak.</p>
                            <p className="text-sm text-gray-400 mt-2">Sol panelden içeriğinizi ekleyin ve 'Başla'ya basın.</p>
                        </div>
                    )}
                    
                    {isGenerating && !manuscript && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
                            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="font-serif text-2xl text-gray-700 animate-pulse">Alper kurguluyor...</p>
                            <p className="text-sm text-gray-500 mt-2">Bu işlem içeriğin uzunluğuna göre biraz sürebilir.</p>
                        </div>
                    )}

                    {manuscript && (
                        <div className="font-serif leading-loose text-lg text-gray-900 prose prose-lg max-w-none">
                            {/* Improved Rendering */}
                            {manuscript.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-5xl font-bold text-center mt-16 mb-12 pb-6 border-b-2 border-black tracking-tight">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('## ')) return <h2 key={i} className="text-3xl font-bold mt-12 mb-6 text-gray-800">{line.replace('## ', '')}</h2>;
                                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-8 mb-4 text-gray-700 uppercase tracking-wide">{line.replace('### ', '')}</h3>;
                                if (line.trim() === '') return <br key={i} />;
                                return <p key={i} className="mb-6 text-justify indent-8 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, '')}</p>;
                            })}
                            
                            {/* Continue Loading Indicator */}
                            {isContinuing && (
                                <div className="mt-8 flex items-center justify-center gap-3 text-gray-500 italic">
                                    <span className="material-symbols-outlined animate-spin" aria-hidden="true">refresh</span>
                                    Yeni bölüm yazılıyor...
                                </div>
                            )}
                            
                            {isComplete && (
                                <div className="mt-12 p-4 bg-green-100 text-green-800 rounded-xl text-center font-bold">
                                    Kitap Tamamlandı.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Actions */}
                {manuscript && (
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                        {/* Action Menu */}
                        <div className="relative">
                            {isMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-3 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                                    <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors">
                                        <span className="material-symbols-outlined text-lg" aria-hidden="true">content_copy</span> Kopyala
                                    </button>
                                    <button onClick={handleDownloadWord} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-blue-400 flex items-center gap-3 transition-colors">
                                        <span className="material-symbols-outlined text-lg" aria-hidden="true">description</span> Word İndir
                                    </button>
                                    <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400 flex items-center gap-3 transition-colors">
                                        <span className="material-symbols-outlined text-lg" aria-hidden="true">picture_as_pdf</span> PDF İndir
                                    </button>
                                    <div className="h-px bg-gray-800 mx-2"></div>
                                    <button onClick={handleClear} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-3 transition-colors">
                                        <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span> Taslağı Temizle
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="bg-gray-900 text-white p-4 rounded-full font-bold shadow-2xl hover:bg-black transition-all border border-gray-700"
                                title="İşlemler"
                                aria-label="Seçenekler"
                            >
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">{isMenuOpen ? 'close' : 'more_vert'}</span>
                            </button>
                        </div>

                        {/* Continue Button */}
                        {!isComplete && (
                            <button 
                                onClick={handleContinue}
                                disabled={isContinuing || isGenerating}
                                className="bg-yellow-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:bg-yellow-500 hover:scale-105 transition-all flex items-center gap-2 border border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Yazmaya Devam Et"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">auto_mode</span>
                                Kaldığın Yerden Devam Et
                            </button>
                        )}
                        {isComplete && (
                            <div className="bg-green-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 cursor-default">
                                <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                                Tamamlandı
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
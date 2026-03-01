/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { processEditorText } from '../services/GeminiService';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path for PDF.js using local Vite asset
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export const EditorInterface: React.FC = () => {
    const { selectedModel } = useAppContext();
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    
    // Editor Settings
    const [selectedAction, setSelectedAction] = useState('Düzeltme ve İyileştirme');
    const [selectedStyle, setSelectedStyle] = useState('Profesyonel ve Kurumsal');
    const [targetLength, setTargetLength] = useState('Orijinal Uzunluğu Koru');
    const [customPrompt, setCustomPrompt] = useState('');
    
    // History & Retry
    const [lastRequest, setLastRequest] = useState<{text: string, instruction: string} | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Stats
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    // Debounced stats calculation
    useEffect(() => {
        const timer = setTimeout(() => {
            const chars = text.length;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            setCharCount(chars);
            setWordCount(words);
            setPageCount(Math.ceil(words / 250)); // Avg 250 words per page
        }, 500); // Increased debounce for huge texts
        return () => clearTimeout(timer);
    }, [text]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    // Helper function to process huge texts in chunks to avoid AI output truncation and API quota limits
    const processInChunks = async (fullText: string, instruction: string) => {
        const MAX_CHUNK_SIZE = 20000; // Increased to reduce number of requests (approx 5000 tokens, safe for 8192 output limit)
        if (fullText.length <= MAX_CHUNK_SIZE) {
            setProcessingProgress("Metin işleniyor (1/1)...");
            return await processEditorText(fullText, instruction, selectedModel);
        }

        const paragraphs = fullText.split('\n');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const p of paragraphs) {
            if ((currentChunk.length + p.length) > MAX_CHUNK_SIZE && currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            currentChunk += p + '\n';
        }
        if (currentChunk.trim()) chunks.push(currentChunk);

        let result = '';
        for (let i = 0; i < chunks.length; i++) {
            const percent = Math.round(((i) / chunks.length) * 100);
            setProcessingProgress(`Devasa Metin İşleniyor: %${percent} (Bölüm ${i + 1} / ${chunks.length})`);
            
            let retries = 5; // Increased retries for quota issues
            let chunkResult = '';
            while (retries > 0) {
                try {
                    chunkResult = await processEditorText(chunks[i], instruction, selectedModel);
                    break; // Success
                } catch (err: any) {
                    retries--;
                    const errorMessage = err.message?.toLowerCase() || "";
                    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('token') || errorMessage.includes('exhausted');
                    
                    if (retries === 0) {
                        if (isQuotaError) {
                            throw new Error("Yapay zeka API kotası doldu (Çok fazla istek atıldı). Kalan metin işlenemedi. Lütfen 1-2 dakika bekleyip tekrar deneyin.");
                        }
                        throw err;
                    }
                    
                    // If quota error, wait much longer (15 seconds) before retrying
                    if (isQuotaError) {
                        setProcessingProgress(`API Kotası Bekleniyor... (Bölüm ${i + 1} / ${chunks.length})`);
                        await new Promise(r => setTimeout(r, 15000));
                    } else {
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
            }
            
            result += chunkResult + '\n\n';
            // Wait 4 seconds between successful requests to stay under the 15 Requests Per Minute (RPM) free tier limit
            await new Promise(resolve => setTimeout(resolve, 4000)); 
        }
        setProcessingProgress(`İşlem Tamamlandı! %100`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return result.trim();
    };

    const handleAnalyze = async () => {
        if (!text.trim()) {
            alert("Lütfen analiz edilecek bir metin girin.");
            return;
        }

        setIsProcessing(true);
        setProcessingProgress("Analiz ediliyor...");
        setAnalysisResult(null);
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield for UI update

        try {
            const instruction = "Metni kelime kelime, cümle cümle derinlemesine analiz et. Dil hatalarını, anlatım bozukluklarını, zayıf kelimeleri tespit et ve nasıl geliştirilebileceğine dair profesyonel bir eleştiri/rapor sun. Metni değiştirme, sadece rapor ver. KESİNLİKLE markdown sembolleri (*, **, #) kullanma. Sadece düz metin ve paragraflar halinde yaz.";
            const textToAnalyze = text.length > 30000 ? text.substring(0, 30000) + "\n\n[Metin çok uzun olduğu için analizin ilk kısmı değerlendirildi...]" : text;
            const result = await processEditorText(textToAnalyze, instruction, selectedModel);
            setAnalysisResult(result);
        } catch (error: any) {
            alert(error.message || "Analiz sırasında bir hata oluştu.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
        }
    };

    const handleFindDuplicates = async () => {
        if (!text.trim()) {
            alert("Lütfen analiz edilecek bir metin girin.");
            return;
        }
        
        setIsProcessing(true);
        setProcessingProgress("Tekrarlar aranıyor...");
        setAnalysisResult(null);
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield for UI update

        try {
            const instruction = `Sen usta bir editörsün. Bu devasa metni baştan sona titizlikle tara. 
GÖREVİN: Yanlışlıkla kopyalanıp yapıştırılmış, BİREBİR AYNI olan paragrafları veya büyük metin bloklarını tespit etmek. 
Sadece benzer kelimeleri veya kısa cümleleri DEĞİL, tamamen aynı olan koca paragrafları bulmalısın.

Lütfen şu formatta eksiksiz bir rapor sun:
1. Birebir tekrar eden metin blokları hangileri? (İlk birkaç kelimesini yazarak belirt)
2. Bu tekrarlar hangi sayfalarda veya bölümlerde (nereden nereye kadar) yer alıyor?

KESİNLİKLE markdown sembolleri (*, **, #) kullanma. Sadece düz metin olarak rapor ver.`;
            
            const textToAnalyze = text.length > 50000 ? text.substring(0, 50000) + "\n\n[Metin çok uzun olduğu için analizin ilk kısmı değerlendirildi...]" : text;
            const result = await processEditorText(textToAnalyze, instruction, selectedModel);
            setAnalysisResult("TEKRAR EDEN METİNLER RAPORU:\n\n" + result);
        } catch (error: any) {
            alert(error.message || "Tekrarlar bulunurken bir hata oluştu.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
            setIsActionMenuOpen(false);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!text.trim()) return;
        
        setIsProcessing(true);
        setProcessingProgress("Tekrarlar analiz ediliyor...");
        setHistory(prev => [...prev, text]);
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield for UI update
        
        try {
            // Programmatic exact duplicate removal
            let newText = text;
            const paragraphs = newText.split('\n');
            const uniqueParagraphs = [];
            const seen = new Set();
            
            let removedCount = 0;
            
            for (const p of paragraphs) {
                const trimmed = p.trim();
                if (trimmed.length < 30) {
                    uniqueParagraphs.push(p); // Keep short lines like dialogue or formatting
                    continue;
                }
                if (!seen.has(trimmed)) {
                    seen.add(trimmed);
                    uniqueParagraphs.push(p);
                } else {
                    removedCount++;
                }
            }
            
            newText = uniqueParagraphs.join('\n');
            
            if (removedCount === 0) {
                // If no exact duplicates found programmatically, and text is huge, warn user
                if (text.length > 30000) {
                    const proceed = confirm("Birebir kopya bulunamadı. Yapay zeka ile benzerlik temizliği yapmak devasa metinleri (100+ sayfa) kısaltabilir. Yine de devam etmek istiyor musunuz?");
                    if (!proceed) {
                        setIsProcessing(false);
                        setProcessingProgress(null);
                        setIsActionMenuOpen(false);
                        return;
                    }
                }
                
                const instruction = `GÖREVİN: Bu metindeki SADECE yanlışlıkla kopyalanmış, birebir tekrar eden kısımları silmek.
ÇOK ÖNEMLİ KURALLAR:
1. Tekrar etmeyen normal metinlere KESİNLİKLE DOKUNMA, ÖZETLEME VE KISALTMA.
2. Sadece arka arkaya veya farklı yerlerde birebir kopyalanmış paragrafları tespit et ve fazlalıkları sil (sadece bir kopyasını bırak).
3. Metnin orijinal uzunluğunu ve bütünlüğünü koru. Hiçbir bölümü atlama.
4. KESİNLİKLE markdown sembolleri (*, **, #) kullanma.`;
                
                newText = await processInChunks(text, instruction);
            }
            
            setText(newText);
            alert(removedCount > 0 ? `${removedCount} adet tekrar eden paragraf başarıyla temizlendi.` : "Tekrar eden metinler başarıyla temizlendi.");
        } catch (error: any) {
            alert(error.message || "Tekrarlar temizlenirken bir hata oluştu.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
            setIsActionMenuOpen(false);
        }
    };

    const handleAutoBookFormat = async () => {
        if (!text.trim()) {
            alert("Lütfen önce metin girin veya bir dosya yükleyin.");
            return;
        }

        const instruction = `Sen profesyonel bir yayınevi baş editörüsün.
GÖREVİN: Bu metni basılacak mükemmel bir kitap formatına getirmek.
ÇOK ÖNEMLİ KURALLAR:
1. METNİ KESİNLİKLE ÖZETLEME VE KISALTMA! Orijinal hikayedeki hiçbir olayı, karakteri veya detayı SİLME. SANA VERİLEN METNİN UZUNLUĞU İLE ÇIKTI UZUNLUĞU AYNI OLMALIDIR.
2. Sadece gerekli gördüğün yerlere konuya uygun tematik BÖLÜM BAŞLIKLARI ekle (BÜYÜK HARFLE yaz).
3. Hikayeyi canlandır, edebi dili güçlendir.
4. Dil, yazım ve noktalama hatalarını kusursuzca düzelt.
5. KESİNLİKLE markdown sembolleri (*, **, #) kullanma. Sadece düz metin ver.`;

        setIsProcessing(true);
        setProcessingProgress("Kitap formatına dönüştürülüyor...");
        setHistory(prev => [...prev, text]);
        setLastRequest({ text, instruction });
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const result = await processInChunks(text, instruction);
            setText(result);
            alert("Otomatik Yayınevi Editörü işlemi tamamlandı! Kitabınız profesyonelce düzenlendi.");
        } catch (error: any) {
            alert(error.message || "İşlem sırasında bir hata oluştu.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
        }
    };

    const handleStartWriting = async (isRetry = false) => {
        if (!text.trim() && !isRetry) {
            alert("Lütfen önce metin girin veya bir dosya yükleyin.");
            return;
        }
        
        const targetText = isRetry && lastRequest ? lastRequest.text : text;
        const instruction = isRetry && lastRequest ? lastRequest.instruction : `
İşlem Türü: ${selectedAction}
Yazım Stili / Tonu: ${selectedStyle}
Hedef Uzunluk: ${targetLength}
Özel Talimat: ${customPrompt || 'Yok'}

GÖREVİN: Sana verilen metni yukarıdaki ayarlara göre düzenlemek.
ÇOK ÖNEMLİ KURALLAR:
1. METNİ KESİNLİKLE ÖZETLEME VE KISALTMA! SANA VERİLEN METNİN UZUNLUĞU İLE ÇIKTI UZUNLUĞU AYNI OLMALIDIR.
2. Orijinal metindeki HİÇBİR paragrafı, cümleyi veya detayı SİLME.
3. Sadece dilbilgisi hatalarını düzelt, anlatımı güçlendir ve istenen stile uyarla.
4. Metnin uzunluğu orijinaliyle neredeyse aynı kalmalıdır. Hiçbir bölümü atlama.
5. KESİNLİKLE markdown sembolleri (*, **, #) KULLANMA. Başlıkları BÜYÜK HARFLE yaz.
        `.trim();

        setIsProcessing(true);
        setProcessingProgress("Metin işleniyor...");
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield for UI update
        
        if (!isRetry) {
            setHistory(prev => [...prev, text]);
            setLastRequest({ text, instruction });
        }

        try {
            const result = await processInChunks(targetText, instruction);
            setText(result);
        } catch (error: any) {
            alert(error.message || "İşlem sırasında bir hata oluştu.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
            setIsActionMenuOpen(false);
        }
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setText(prev);
            setHistory(h => h.slice(0, -1));
        }
        setIsActionMenuOpen(false);
    };

    const handleClear = () => {
        if (confirm("Tüm metni temizlemek istediğinize emin misiniz?")) {
            setText('');
            setHistory([]);
            setLastRequest(null);
            setCustomPrompt('');
            setAnalysisResult(null);
        }
        setIsActionMenuOpen(false);
    };

    const handleCopy = async () => {
        if (!text.trim()) return;
        try {
            await navigator.clipboard.writeText(text);
            alert("Metin panoya kopyalandı!");
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert("Kopyalama başarısız oldu.");
        }
        setIsActionMenuOpen(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProcessingProgress("Dosya okunuyor...");
        try {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                // Optimize for huge PDFs (e.g., 1500 pages)
                const numPages = pdf.numPages;
                let fullText = '';
                
                // Process in chunks to avoid freezing the UI
                const chunkSize = 50;
                for (let i = 1; i <= numPages; i += chunkSize) {
                    setProcessingProgress(`PDF Okunuyor: Sayfa ${i} / ${numPages}`);
                    const end = Math.min(i + chunkSize - 1, numPages);
                    const promises = [];
                    for (let j = i; j <= end; j++) {
                        promises.push(pdf.getPage(j).then(page => page.getTextContent()));
                    }
                    const textContents = await Promise.all(promises);
                    
                    for (const textContent of textContents) {
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    await new Promise(resolve => setTimeout(resolve, 10)); // Yield to keep UI responsive
                }
                setText(fullText);
            } else {
                const fileText = await file.text();
                setText(fileText);
            }
        } catch (error) {
            console.error(error);
            alert("Dosya okunurken bir hata oluştu. Lütfen geçerli bir PDF veya TXT dosyası yükleyin.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const exportToPDF = () => {
        if (!text.trim()) return;
        try {
            // Create a hidden iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(`
                    <html>
                    <head>
                        <title>Alper Yazar Pro - Belge</title>
                        <style>
                            body {
                                font-family: 'Times New Roman', Times, serif;
                                font-size: 12pt;
                                line-height: 1.6;
                                color: black;
                                margin: 2cm;
                                white-space: pre-wrap;
                            }
                            @page {
                                margin: 2cm;
                            }
                        </style>
                    </head>
                    <body>
                        ${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </body>
                    </html>
                `);
                doc.close();

                // Wait for iframe to load before printing
                iframe.onload = () => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                };
            }
        } catch (e) {
            console.error(e);
            alert("PDF oluşturulurken hata meydana geldi.");
        }
        setIsActionMenuOpen(false);
    };

    const exportToTXT = () => {
        if (!text.trim()) return;
        try {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "alper_editor_belgesi.txt";
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 2000); // Increased timeout to ensure download starts
            setIsActionMenuOpen(false);
        } catch (err) {
            console.error(err);
            alert("TXT dosyası oluşturulurken bir hata meydana geldi.");
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.action-dropdown-container')) {
                setIsActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#050505] relative font-sans text-white">
            {/* Top Control Panel (Always Visible) */}
            <div className="flex-none border-b border-white/10 bg-[#0a0a0a] p-4 z-20 flex flex-col gap-4">
                {/* Header Row: Title & File Upload */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                            <span className="material-symbols-outlined text-amber-400">edit_document</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold tracking-wide text-white">ALPER YAZAR PRO</h2>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Profesyonel Metin Editörü</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept=".txt,.pdf,.md,.csv" 
                            className="hidden" 
                            aria-label="Dosya Seçme Alanı"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 text-gray-300"
                            aria-label="Dosya Yükle"
                            title="PDF veya TXT dosyası yükle"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Dosya Seç
                        </button>
                    </div>
                </div>

                {/* Controls Row: Dropdowns, Prompts, Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 bg-[#111] p-2 rounded-xl border border-white/5">
                    <select 
                        value={selectedAction} 
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 cursor-pointer"
                        aria-label="İşlem Türü Seçin"
                    >
                        <option value="Düzeltme ve İyileştirme">Düzeltme ve İyileştirme</option>
                        <option value="Yeniden Kurgula (Baştan Yaz)">Yeniden Kurgula (Baştan Yaz)</option>
                        <option value="Edebi Zenginleştirme">Edebi Zenginleştirme</option>
                        <option value="Bölümlere Ayır">Bölümlere Ayır</option>
                        <option value="Karakter ve Olay Analizi">Karakter ve Olay Analizi</option>
                        <option value="Özet Çıkarma">Özet Çıkarma</option>
                        <option value="Özel Talimat Uygula">Sadece Özel Talimatı Uygula</option>
                    </select>

                    <select 
                        value={selectedStyle} 
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 cursor-pointer"
                        aria-label="Yazım Stili Seçin"
                    >
                        <option value="Profesyonel ve Kurumsal">Profesyonel</option>
                        <option value="Akademik ve Resmi">Akademik</option>
                        <option value="Samimi ve İçten">Samimi</option>
                        <option value="Yaratıcı ve Hikayesel">Yaratıcı / Roman</option>
                        <option value="Gizemli ve Sürükleyici">Gizemli</option>
                        <option value="Bilim Kurgu / Fantastik">Bilim Kurgu / Fantastik</option>
                        <option value="Mevcut Stili Koru">Mevcut Stili Koru</option>
                    </select>

                    <select 
                        value={targetLength} 
                        onChange={(e) => setTargetLength(e.target.value)}
                        className="bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 cursor-pointer"
                        aria-label="Hedef Uzunluk Seçin"
                    >
                        <option value="Orijinal Uzunluğu Koru">Orijinal Uzunluğu Koru</option>
                        <option value="Kısa ve Öz (1 Sayfa)">Kısa ve Öz (1 Sayfa)</option>
                        <option value="Detaylı (3 Sayfa)">Detaylı (3 Sayfa)</option>
                        <option value="Çok Detaylı (5 Sayfa)">Çok Detaylı (5 Sayfa)</option>
                        <option value="Genişletilmiş (10+ Sayfa)">Genişletilmiş (10+ Sayfa)</option>
                    </select>

                    <input 
                        type="text" 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Özel talimatınız (Örn: 3. bölümü daha heyecanlı yaz...)"
                        className="flex-grow bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 min-w-[200px]"
                        aria-label="Özel Talimat"
                    />

                    <button 
                        onClick={() => handleStartWriting(false)}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-black transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                        aria-label="Yazmaya Başla"
                    >
                        <span className="material-symbols-outlined">edit_square</span>
                        Yazmaya Başla
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    <button 
                        onClick={handleAutoBookFormat}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 border border-purple-400/30"
                        aria-label="Otomatik Yayınevi Editörü"
                        title="Metni otomatik olarak kitap formatına sokar, başlıklar ekler, hikayeyi canlandırır ve hataları düzeltir."
                    >
                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                        YAYINEVİ EDİTÖRÜ (Otomatik Kitap Yap)
                    </button>

                    <button 
                        onClick={handleAnalyze}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        aria-label="Metni Analiz Et"
                    >
                        <span className="material-symbols-outlined">analytics</span>
                        Analiz Et
                    </button>

                    <button 
                        onClick={handleFindDuplicates}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        aria-label="Tekrarları Bul"
                    >
                        <span className="material-symbols-outlined">plagiarism</span>
                        Tekrarları Bul
                    </button>

                    <button 
                        onClick={handleRemoveDuplicates}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        aria-label="Tekrarları Temizle"
                    >
                        <span className="material-symbols-outlined">cleaning_services</span>
                        Tekrarları Temizle
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-grow flex overflow-hidden relative">
                {/* Text Area */}
                <div className={`flex-grow transition-all duration-300 ${analysisResult ? 'w-1/2 border-r border-white/10' : 'w-full'} relative`}>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        placeholder="Kitap taslağınızı, makalenizi veya herhangi bir metni buraya yapıştırın (200.000 kelimeye kadar destekler)...&#10;&#10;✨ Metni yapıştırdığınızda alt kısımda sayfa, kelime ve karakter sayıları anlık olarak görünecektir."
                        className="w-full h-full bg-transparent text-gray-200 p-8 resize-none outline-none text-lg leading-relaxed custom-scrollbar font-serif"
                        spellCheck={false}
                        aria-label="Metin Editörü Alanı"
                    />
                    
                    {/* Processing Overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50" aria-live="polite">
                            <div className="w-20 h-20 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-amber-400 font-black text-2xl animate-pulse text-center px-4">
                                {processingProgress || "Yapay Zeka İşlemi Gerçekleştiriyor..."}
                            </p>
                            <p className="text-base text-gray-400 mt-4 max-w-lg text-center leading-relaxed">
                                Lütfen bu ekranı kapatmayın. Devasa metinler (1000+ sayfa) hiçbir kelime kaybı yaşanmaması için yapay zeka tarafından sayfa sayfa, titizlikle işlenmektedir.
                            </p>
                        </div>
                    )}
                </div>

                {/* Analysis Sidebar */}
                {analysisResult && (
                    <div className="w-1/2 h-full bg-[#0a0a0a] flex flex-col animate-slideLeft">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111]">
                            <h3 className="font-bold text-amber-400 flex items-center gap-2">
                                <span className="material-symbols-outlined">troubleshoot</span>
                                Editör Analiz Raporu
                            </h3>
                            <button onClick={() => setAnalysisResult(null)} className="text-gray-500 hover:text-white" aria-label="Analiz Raporunu Kapat">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                            {/* Render plain text, AI is instructed to not use markdown */}
                            {analysisResult}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Status Bar (Visible only when text exists) */}
            {text.length > 0 && (
                <div className="flex-none bg-[#0a0a0a] border-t border-white/10 p-3 px-6 flex justify-between items-center animate-fadeIn">
                    
                    {/* Left: Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400 font-mono">
                        <span aria-label={`Sayfa Sayısı: ${pageCount}`}><strong className="text-gray-200 text-base">{pageCount.toLocaleString('tr-TR')}</strong> Sayfa</span>
                        <span aria-label={`Kelime Sayısı: ${wordCount}`}><strong className="text-gray-200 text-base">{wordCount.toLocaleString('tr-TR')}</strong> Kelime</span>
                        <span aria-label={`Karakter Sayısı: ${charCount}`}><strong className="text-gray-200 text-base">{charCount.toLocaleString('tr-TR')}</strong> Karakter</span>
                    </div>
                    
                    {/* Right: Actions Dropdown & Undo/Retry */}
                    <div className="flex items-center gap-2">
                        {lastRequest && (
                            <button onClick={() => handleStartWriting(true)} disabled={isProcessing} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 text-blue-400 disabled:opacity-50" aria-label="Yeniden Yaz">
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                Yeniden Yaz
                            </button>
                        )}
                        
                        {history.length > 0 && (
                            <button onClick={handleUndo} disabled={isProcessing} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 text-gray-300 disabled:opacity-50" aria-label="Geri Al">
                                <span className="material-symbols-outlined text-[16px]">undo</span>
                                Geri Al
                            </button>
                        )}

                        <button onClick={handleClear} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 text-red-400" aria-label="Tümünü Temizle">
                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                            Temizle
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-2"></div>

                        <div className="relative action-dropdown-container">
                            <button 
                                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 text-gray-300"
                                aria-expanded={isActionMenuOpen}
                                aria-haspopup="true"
                                aria-label="İndirme ve Kopyalama Seçenekleri"
                            >
                                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                Diğer Seçenekler
                            </button>

                            {isActionMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                                    <div className="p-1 flex flex-col">
                                        <button onClick={handleCopy} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3" aria-label="Metni Kopyala">
                                            <span className="material-symbols-outlined text-[18px]">content_copy</span> Kopyala
                                        </button>

                                        <div className="h-px bg-white/10 my-1"></div>

                                        <button onClick={exportToTXT} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-3" aria-label="TXT Olarak İndir">
                                            <span className="material-symbols-outlined text-[18px]">description</span> TXT İndir
                                        </button>
                                        <button onClick={exportToPDF} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3" aria-label="PDF Olarak İndir">
                                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF İndir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
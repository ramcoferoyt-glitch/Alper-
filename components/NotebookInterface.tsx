
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { NotebookEntry, NotebookSource } from '../types';
import { generateNotebookPodcast, generateNotebookVideoPrompt, generateVideo, generateNotebookMindMap } from '../services/GeminiService';
import { v4 as uuidv4 } from 'uuid';

export const NotebookInterface: React.FC = () => {
    const { notebookSources, addNotebookSource, removeNotebookSource, notebookEntries, addNotebookEntry } = useAppContext();
    const [newSourceText, setNewSourceText] = useState('');
    const [isSourceInputOpen, setIsSourceInputOpen] = useState(false);
    
    // Customization State
    const [customizingType, setCustomizingType] = useState<'podcast' | 'video_summary' | null>(null);
    const [customInstructionInput, setCustomInstructionInput] = useState('');

    const handleAddSource = () => {
        if (!newSourceText.trim()) return;
        const newSource: NotebookSource = {
            id: uuidv4(),
            title: `Kaynak ${notebookSources.length + 1} (${newSourceText.substring(0, 15)}...)`,
            content: newSourceText,
            type: 'text'
        };
        addNotebookSource(newSource);
        setNewSourceText('');
        setIsSourceInputOpen(false);
    };

    const handleGenerate = async (type: 'podcast' | 'video_summary' | 'mind_map', instruction: string = '') => {
        if (notebookSources.length === 0) return;
        if (type === 'video_summary' && window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
             await window.aistudio.openSelectKey();
        }

        // Close modal if open
        setCustomizingType(null);
        setCustomInstructionInput('');

        const entryId = uuidv4();
        
        let titlePlaceholder = '';
        if (type === 'podcast') titlePlaceholder = 'Sesli Özet (Deep Dive Audio)';
        else if (type === 'video_summary') titlePlaceholder = 'Video Sunum (Deep Dive Video)';
        else titlePlaceholder = 'Zihin Haritası';

        // Add placeholder
        addNotebookEntry({
            id: entryId,
            type,
            title: titlePlaceholder,
            content: '',
            isLoading: true,
            customInstruction: instruction
        });

        try {
            const sourceTexts = notebookSources.map(s => s.content);
            let content = '';
            let title = titlePlaceholder;

            if (type === 'podcast') {
                content = await generateNotebookPodcast(sourceTexts, instruction);
                title = instruction ? `Sesli Özet: "${instruction}"` : 'Sesli Özet (Standart)';
            } else if (type === 'video_summary') {
                // 1. Get visual prompt describing the scene based on sources + instruction
                const visualPrompt = await generateNotebookVideoPrompt(sourceTexts, instruction);
                // 2. Generate a looping background video using Veo
                const videoUrl = await generateVideo(visualPrompt, '16:9');
                // 3. Generate the script/narration text
                const scriptText = await generateNotebookPodcast(sourceTexts, instruction + " (Bu bir video sunumu senaryosudur, görsel betimlemeler içerebilir.)");
                
                // Combine them into a JSON-like string to store both media URL and Text Script
                content = JSON.stringify({ videoUrl, script: scriptText });
                title = instruction ? `Video Sunum: "${instruction}"` : 'Video Sunum (Standart)';
            } else if (type === 'mind_map') {
                content = await generateNotebookMindMap(sourceTexts);
            }

             addNotebookEntry({
                id: uuidv4(),
                type,
                title,
                content,
                isLoading: false,
                customInstruction: instruction
            });

        } catch (e) {
            console.error(e);
            alert("Üretim sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    return (
        <div className="flex h-full bg-gray-950 text-white overflow-hidden font-sans">
            {/* Left Panel: Sources */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col p-5 flex-shrink-0 z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-100">Kaynaklar</h2>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{notebookSources.length}</span>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                    {notebookSources.length === 0 && (
                        <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center">
                            <p className="text-gray-500 text-sm mb-4">Analiz edilecek içerik yok.</p>
                            <button 
                                onClick={() => setIsSourceInputOpen(true)}
                                className="text-cyan-400 text-sm font-medium hover:underline"
                            >
                                + Kaynak Ekle
                            </button>
                        </div>
                    )}
                    {notebookSources.map(source => (
                        <div key={source.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors group relative">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-blue-900/30 p-1.5 rounded text-blue-400">
                                    <span className="material-symbols-outlined text-sm">description</span>
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-sm text-gray-200 truncate">{source.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{source.content}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeNotebookSource(source.id)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Kaynağı Sil"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => setIsSourceInputOpen(true)}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-700 text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Yeni Kaynak Ekle
                </button>
            </div>

            {/* Main Area: Studio Guide */}
            <div className="flex-grow flex flex-col relative overflow-hidden bg-gray-950">
                
                {/* Top Bar / Notebook Title */}
                <div className="h-16 border-b border-gray-800 flex items-center px-8 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
                    <h1 className="text-lg font-medium text-gray-300">Notebook Rehberi</h1>
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-10">
                        
                        {/* 1. Deep Dive Generators */}
                        <section>
                            <h3 className="text-2xl font-light mb-6">Deep Dive Oluştur</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Audio Overview Card */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
                                            <span className="material-symbols-outlined text-2xl">headphones</span>
                                        </div>
                                        <button 
                                            onClick={() => setCustomizingType('podcast')}
                                            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                                            title="Özelleştir (Komut Ver)"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Sesli Özet (Podcast)</h4>
                                    <p className="text-sm text-gray-400 mb-6 min-h-[40px]">
                                        İki yapay zeka sunucusu kaynaklarınızı tartışır.
                                    </p>
                                    <button 
                                        onClick={() => handleGenerate('podcast')}
                                        disabled={notebookSources.length === 0}
                                        className="w-full py-2 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Oluştur
                                    </button>
                                </div>

                                {/* Video Presentation Card */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400">
                                            <span className="material-symbols-outlined text-2xl">play_circle</span>
                                        </div>
                                        <button 
                                            onClick={() => setCustomizingType('video_summary')}
                                            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                                            title="Özelleştir (Komut Ver)"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Video Sunum</h4>
                                    <p className="text-sm text-gray-400 mb-6 min-h-[40px]">
                                        Konuyu anlatan görsel bir video ve detaylı senaryo.
                                    </p>
                                    <button 
                                        onClick={() => handleGenerate('video_summary')}
                                        disabled={notebookSources.length === 0}
                                        className="w-full py-2 bg-gray-800 hover:bg-purple-600 hover:text-white text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Oluştur
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 2. Generated Results Feed */}
                        {notebookEntries.length > 0 && (
                            <section className="pt-8 border-t border-gray-800">
                                <h3 className="text-xl font-light mb-6 text-gray-400">Sonuçlar</h3>
                                <div className="space-y-8">
                                    {notebookEntries.map(entry => (
                                        <div key={entry.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl animate-fadeIn">
                                            {/* Entry Header */}
                                            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/30">
                                                <div className="flex items-center gap-3">
                                                    <span className={`p-1.5 rounded-lg ${
                                                        entry.type === 'podcast' ? 'bg-blue-500/20 text-blue-400' : 
                                                        entry.type === 'video_summary' ? 'bg-purple-500/20 text-purple-400' : 'bg-teal-500/20 text-teal-400'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-lg">
                                                            {entry.type === 'podcast' ? 'headphones' : entry.type === 'video_summary' ? 'movie' : 'account_tree'}
                                                        </span>
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-gray-200">{entry.title}</h4>
                                                        {entry.customInstruction && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[10px]">edit</span>
                                                                {entry.customInstruction}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {entry.isLoading && <span className="material-symbols-outlined animate-spin text-gray-500">progress_activity</span>}
                                            </div>

                                            {/* Entry Content */}
                                            <div className="p-6">
                                                {entry.isLoading ? (
                                                    <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-3">
                                                        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                                                        <p className="text-sm">Alper içeriği hazırlıyor...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* --- VIDEO PRESENTATION LAYOUT --- */}
                                                        {entry.type === 'video_summary' && (() => {
                                                            let data;
                                                            try { data = JSON.parse(entry.content); } catch { return <p>Hata.</p>; }
                                                            return (
                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                    <div className="lg:col-span-2 space-y-2">
                                                                         <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg group">
                                                                            {/* Simulated 'Video Player' combining visual loop + script context */}
                                                                            <video src={data.videoUrl} autoPlay muted loop className="w-full h-full object-cover opacity-80" />
                                                                            <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/90 to-transparent">
                                                                                <p className="text-white text-lg font-medium leading-relaxed drop-shadow-md">
                                                                                    "{data.script.split('\n')[0].replace(/Sunucu \d+:/g, '').substring(0, 100)}..."
                                                                                </p>
                                                                            </div>
                                                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2">
                                                                                 <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                                                 Deep Dive Video
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between text-xs text-gray-500 px-1">
                                                                            <span>00:00</span>
                                                                            <div className="flex-grow mx-3 h-1 bg-gray-800 rounded-full self-center relative">
                                                                                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-purple-500 rounded-full"></div>
                                                                            </div>
                                                                            <span>05:00 (Tahmini)</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="lg:col-span-1 bg-gray-950/50 rounded-xl p-4 border border-gray-800 h-96 overflow-y-auto custom-scrollbar">
                                                                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">Senaryo Akışı</h5>
                                                                        <div className="space-y-4 text-sm text-gray-300">
                                                                            {data.script.split('\n').map((line: string, i: number) => (
                                                                                 line.trim() && <p key={i} className={`pb-2 border-b border-gray-800/50 ${line.includes('Sunucu 1') ? 'text-blue-300' : line.includes('Sunucu 2') ? 'text-purple-300' : ''}`}>{line}</p>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* --- PODCAST LAYOUT --- */}
                                                        {entry.type === 'podcast' && (
                                                            <div className="space-y-4">
                                                                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                                        <span className="material-symbols-outlined">play_arrow</span>
                                                                    </div>
                                                                    <div className="flex-grow">
                                                                         <div className="h-8 w-full flex items-center gap-0.5">
                                                                            {/* Fake waveform */}
                                                                            {Array.from({length: 40}).map((_, i) => (
                                                                                <div key={i} className="flex-grow bg-blue-500/40 rounded-full" style={{height: `${Math.random() * 100}%`}}></div>
                                                                            ))}
                                                                         </div>
                                                                    </div>
                                                                    <span className="text-xs font-mono text-gray-400">12:34</span>
                                                                </div>
                                                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-4 bg-gray-800/50 rounded-xl text-sm leading-relaxed text-gray-300">
                                                                    {entry.content.split('\n').map((line, i) => (
                                                                        <p key={i} className="mb-2">{line}</p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* --- MIND MAP LAYOUT --- */}
                                                        {entry.type === 'mind_map' && (
                                                             <pre className="font-mono text-xs md:text-sm whitespace-pre-wrap bg-gray-950 p-6 rounded-xl border border-gray-800 text-teal-300 shadow-inner">
                                                                {entry.content}
                                                            </pre>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Customization Modal */}
            {customizingType && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl animate-scaleUp">
                        <div className="flex items-center gap-3 mb-4 text-cyan-400">
                            <span className="material-symbols-outlined text-3xl">magic_button</span>
                            <h3 className="text-xl font-bold text-white">Özelleştir</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            {customizingType === 'podcast' ? 'Sesli Özet' : 'Video Sunum'} için Alper'e özel talimatlar ver.
                        </p>
                        
                        <div className="space-y-3 mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nasıl bir şey olsun?</label>
                            <textarea
                                autoFocus
                                value={customInstructionInput}
                                onChange={(e) => setCustomInstructionInput(e.target.value)}
                                placeholder="Örn: 'Çok esprili olsun', '5 yaşında birine anlatır gibi', 'Sadece finansal rakamlara odaklan'..."
                                className="w-full h-32 bg-gray-800 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none placeholder-gray-600"
                            ></textarea>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {['Komik olsun', 'Kısa ve öz', 'Akademik dil', 'Merak uyandırıcı'].map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setCustomInstructionInput(tag)}
                                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap border border-gray-700"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setCustomizingType(null)}
                                className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button 
                                onClick={() => handleGenerate(customizingType!, customInstructionInput)}
                                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20"
                            >
                                Uygula ve Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Source Modal */}
            {isSourceInputOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl animate-scaleUp">
                        <h3 className="text-xl font-bold mb-4 text-white">Metin Kaynağı Ekle</h3>
                        <textarea
                            value={newSourceText}
                            onChange={(e) => setNewSourceText(e.target.value)}
                            placeholder="Makale, notlar veya analiz edilecek metni buraya yapıştırın..."
                            className="w-full h-64 bg-gray-800 border border-gray-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none mb-4 resize-none"
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsSourceInputOpen(false)}
                                className="px-5 py-2 text-gray-400 hover:text-white"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleAddSource}
                                disabled={!newSourceText.trim()}
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

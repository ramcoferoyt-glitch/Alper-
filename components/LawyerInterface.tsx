
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChatInterface } from './ChatInterface';
import { useAppContext } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/GeminiService';

export const LawyerInterface: React.FC = () => {
    const { addChatMessage, setIsChatProcessing, chatHistory, selectedModel } = useAppContext();

    const handleStart = async (msg: string) => {
        addChatMessage({ id: uuidv4(), role: 'user', text: msg, timestamp: Date.now() });
        setIsChatProcessing(true);
        try {
            const stream = await streamChat(chatHistory.map(m => ({role: m.role, parts: [{text: m.text}]})), msg, [], true, false, undefined, 'lawyer', 'therapy', undefined, selectedModel);
            let fullText = '';
            for await (const chunk of stream) { fullText += chunk.text || ''; }
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e) {
            addChatMessage({ id: uuidv4(), role: 'model', text: "Hata oluştu.", timestamp: Date.now(), isError: true });
        } finally { setIsChatProcessing(false); }
    };

    const CustomLanding = (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn font-sans">
            <div className="w-24 h-24 bg-slate-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-500/20 shadow-2xl shadow-slate-900/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-slate-400 text-5xl" aria-hidden="true">gavel</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Hukuk ve Avukat Uzmanım</h2>
            <p className="text-gray-400 max-w-2xl mb-12 leading-relaxed text-lg">
                Haklarınızı savunun ve adaleti arayın. İltica, ceza, uluslararası hukuk ve dava süreçlerinde emsal kararlarla desteklenmiş, reddedilemez hukuki stratejiler ve savunmalar sunar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <button onClick={() => handleStart("Hakkımda verilen haksız bir mahkeme kararı var. Bu karardaki hukuki açıkları ve çelişkileri bularak, kanun maddeleri ve emsal kararlarla desteklenmiş çok güçlü bir itiraz dilekçesi yazar mısın?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-slate-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-slate-900/10">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-400" aria-hidden="true">description</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Güçlü Savunma & İtiraz</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Mahkeme kararlarını analiz et ve reddedilemez dilekçeler yaz.</p>
                </button>
                <button onClick={() => handleStart("Avrupa'da (veya belirttiğim bir ülkede) iltica sürecindeyim. İltica mülakatında veya mahkemesinde kendimi en iyi nasıl ifade edebilirim? Hangi hukuki haklarım var ve nasıl bir savunma stratejisi izlemeliyim?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-slate-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-slate-900/10">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-400" aria-hidden="true">public</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">İltica & Uluslararası Hukuk</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Göçmenlik, iltica süreçleri ve uluslararası haklar.</p>
                </button>
                <button onClick={() => handleStart("Bir iş sözleşmesinde veya ticari anlaşmada aleyhime olabilecek gizli maddeleri nasıl tespit edebilirim? Nelere dikkat etmeliyim?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-slate-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-slate-900/10">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-400" aria-hidden="true">balance</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Sözleşme & Anlaşma Analizi</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Hukuki metinlerdeki açıkları ve riskleri tespit et.</p>
                </button>
                <button onClick={() => handleStart("Şu an karşılaştığım hukuki bir problem var. Bana bu durumun kanunlardaki yerini, emsal Yargıtay/Danıştay kararlarını ve izlemem gereken hukuki stratejiyi adım adım anlatır mısın?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-slate-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-slate-900/10">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-400" aria-hidden="true">policy</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Emsal Karar & Strateji</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Kanun maddeleri ve içtihatlarla dava stratejisi kur.</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#030407] relative font-sans">
            {/* Avukat Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-6 bg-gradient-to-b from-[#030407] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-[#0a0f1a]/80 backdrop-blur-xl rounded-2xl px-8 py-3 border border-slate-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-slate-400 text-2xl" aria-hidden="true">gavel</span>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-widest uppercase">ALPER HUKUK UZMANI</h2>
                        <p className="text-[10px] text-slate-400/70 font-bold tracking-[0.2em] uppercase mt-0.5">Adalet & Stratejik Savunma</p>
                    </div>
                </div>
            </div>

            {/* Arka plan Efekti */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-[#030407] to-[#030407] pointer-events-none z-0"></div>

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-20">
                <ChatInterface 
                    customLandingPage={CustomLanding} 
                    customPlaceholder="Hukuki sorununuzu, davanızı veya inceletmek istediğiniz belgeyi yazın..."
                />
            </div>
        </div>
    );
};
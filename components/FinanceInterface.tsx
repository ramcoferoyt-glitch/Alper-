
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChatInterface } from './ChatInterface';
import { useAppContext } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/GeminiService';

export const FinanceInterface: React.FC = () => {
    const { addChatMessage, setIsChatProcessing, chatHistory, selectedModel } = useAppContext();

    const handleStart = async (msg: string) => {
        addChatMessage({ id: uuidv4(), role: 'user', text: msg, timestamp: Date.now() });
        setIsChatProcessing(true);
        try {
            const stream = await streamChat(chatHistory.map(m => ({role: m.role, parts: [{text: m.text}]})), msg, [], true, false, undefined, 'finance', 'therapy', undefined, selectedModel);
            let fullText = '';
            for await (const chunk of stream) { fullText += chunk.text || ''; }
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e) {
            addChatMessage({ id: uuidv4(), role: 'model', text: "Hata oluştu.", timestamp: Date.now(), isError: true });
        } finally { setIsChatProcessing(false); }
    };

    const CustomLanding = (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn font-sans">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-900/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-emerald-400 text-5xl" aria-hidden="true">candlestick_chart</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Finans ve Ekonomi Uzmanım</h2>
            <p className="text-gray-400 max-w-2xl mb-12 leading-relaxed text-lg">
                Geleceğinizi güvence altına alın ve servetinizi büyütün. Ekonomi, finansal okuryazarlık ve yatırım stratejileri üzerine derinlemesine analizler sunar. Harekete geçme zamanı.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <button onClick={() => handleStart("Şu anki güncel piyasa verilerini (Dolar, Altın, Bitcoin) analiz edip, bana önümüzdeki 6 ay için mantıklı bir birikim ve yatırım stratejisi çizer misin?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-emerald-900/10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-emerald-400" aria-hidden="true">monitoring</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Güncel Piyasa & Strateji</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Canlı verilerle yatırım planlaması ve 6 aylık strateji.</p>
                </button>
                <button onClick={() => handleStart("Ekonominin perde arkasındaki sırları ve zenginlerin servetlerini nasıl koruyup büyüttüklerini, finansal okuryazarlık dersi niteliğinde anlatır mısın?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-emerald-900/10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-emerald-400" aria-hidden="true">school</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Finansal Okuryazarlık</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Ekonominin gizli sırları, servet koruma ve eğitim.</p>
                </button>
                <button onClick={() => handleStart("Aylık gelirimle hem geçinip hem de nasıl agresif bir şekilde birikim yapabilirim? Bana gerçekçi ve hayatımı kolaylaştıracak bir plan kur.")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-emerald-900/10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-emerald-400" aria-hidden="true">account_balance_wallet</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Birikim & Bütçe Planı</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Gerçekçi, agresif ve uygulanabilir tasarruf planları.</p>
                </button>
                <button onClick={() => handleStart("Kripto paralar (Bitcoin vb.), Altın, Gümüş, Hisse Senetleri ve Yatırım Fonları arasındaki farklar nelerdir? Hangisi hangi yatırımcı profiline uygundur?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-emerald-900/10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-emerald-400" aria-hidden="true">pie_chart</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Yatırım Araçları Analizi</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Kripto, Altın, Hisse, Fon karşılaştırması ve risk analizi.</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#030705] relative font-sans">
            {/* Finans Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-6 bg-gradient-to-b from-[#030705] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-[#0a120e]/80 backdrop-blur-xl rounded-2xl px-8 py-3 border border-emerald-900/30 shadow-2xl">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl" aria-hidden="true">account_balance</span>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-widest uppercase">ALPER FİNANS UZMANI</h2>
                        <p className="text-[10px] text-emerald-400/70 font-bold tracking-[0.2em] uppercase mt-0.5">Piyasa Analizi & Finansal Okuryazarlık</p>
                    </div>
                </div>
            </div>

            {/* Arka plan Efekti */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#030705] to-[#030705] pointer-events-none z-0"></div>

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-20">
                <ChatInterface 
                    customLandingPage={CustomLanding} 
                    customPlaceholder="Finansal hedeflerinizi, piyasa analizlerini veya yatırım stratejilerini sorun..."
                />
            </div>
        </div>
    );
};

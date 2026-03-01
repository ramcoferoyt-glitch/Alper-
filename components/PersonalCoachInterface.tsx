
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChatInterface } from './ChatInterface';
import { useAppContext } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/GeminiService';

export const PersonalCoachInterface: React.FC = () => {
    const { addChatMessage, setIsChatProcessing, chatHistory, selectedModel } = useAppContext();

    const handleStart = async (msg: string) => {
        addChatMessage({ id: uuidv4(), role: 'user', text: msg, timestamp: Date.now() });
        setIsChatProcessing(true);
        try {
            const stream = await streamChat(chatHistory.map(m => ({role: m.role, parts: [{text: m.text}]})), msg, [], true, false, undefined, 'personal_coach', 'therapy', undefined, selectedModel);
            let fullText = '';
            for await (const chunk of stream) { fullText += chunk.text || ''; }
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e) {
            addChatMessage({ id: uuidv4(), role: 'model', text: "Hata oluştu.", timestamp: Date.now(), isError: true });
        } finally { setIsChatProcessing(false); }
    };

    const CustomLanding = (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20 shadow-2xl shadow-orange-900/20">
                <span className="material-symbols-outlined text-orange-500 text-5xl">fitness_center</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Kişisel Koç</h2>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                Motivasyon, disiplin, hedef belirleme ve kişisel gelişim yolculuğunuzda yanınızda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <button onClick={() => handleStart("Bugün hiç motivasyonum yok, ertelemekten kurtulmak için bana bir eylem planı çizer misin?")} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl text-left transition-all group">
                    <span className="material-symbols-outlined text-orange-400 mb-3 block">bolt</span>
                    <h3 className="text-white font-bold mb-1">Motivasyon</h3>
                    <p className="text-xs text-gray-500">Ertelemeyi yen ve harekete geç.</p>
                </button>
                <button onClick={() => handleStart("Önümüzdeki 3 ay için kendime yeni hedefler belirlemek istiyorum. Nereden başlamalıyım?")} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl text-left transition-all group">
                    <span className="material-symbols-outlined text-orange-400 mb-3 block">track_changes</span>
                    <h3 className="text-white font-bold mb-1">Hedef Belirleme</h3>
                    <p className="text-xs text-gray-500">Kısa ve uzun vadeli planlar.</p>
                </button>
                <button onClick={() => handleStart("Zamanımı daha verimli kullanmak ve odaklanmak için hangi teknikleri önerirsin?")} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl text-left transition-all group">
                    <span className="material-symbols-outlined text-orange-400 mb-3 block">schedule</span>
                    <h3 className="text-white font-bold mb-1">Zaman Yönetimi</h3>
                    <p className="text-xs text-gray-500">Odaklanma ve verimlilik artışı.</p>
                </button>
                <button onClick={() => handleStart("Yeni bir alışkanlık kazanmak istiyorum ama hep yarıda bırakıyorum. Nasıl kalıcı hale getirebilirim?")} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl text-left transition-all group">
                    <span className="material-symbols-outlined text-orange-400 mb-3 block">self_improvement</span>
                    <h3 className="text-white font-bold mb-1">Alışkanlık Kazanma</h3>
                    <p className="text-xs text-gray-500">Kalıcı ve pozitif rutinler oluştur.</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#1a0f0a] relative font-sans">
            {/* Koç Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#1a0f0a] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-orange-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-orange-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-orange-400">fitness_center</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER KOÇ</h2>
                        <p className="text-[10px] text-orange-300 font-medium tracking-wider uppercase">Potansiyel & Disiplin</p>
                    </div>
                </div>
            </div>

            {/* Arka plan Efekti */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-900/10 via-transparent to-gray-900 pointer-events-none z-0"></div>

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-16">
                <ChatInterface customLandingPage={CustomLanding} />
            </div>
        </div>
    );
};

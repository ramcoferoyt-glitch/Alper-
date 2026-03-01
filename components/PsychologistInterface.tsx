
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/GeminiService';

export const PsychologistInterface: React.FC = () => {
    const { setLivePersona, setMode, psychologistSubMode, setPsychologistSubMode, addChatMessage, setIsChatProcessing, chatHistory, selectedModel } = useAppContext();

    useEffect(() => {
        // Bu bileşen render olduğunda Live Persona'yı otomatik olarak 'psychologist' yap
        setLivePersona('psychologist');
        
        // Temizleme: Bileşenden çıkarken varsayılan asistana dön (isteğe bağlı)
        return () => setLivePersona('assistant');
    }, [setLivePersona]);

    const handleStartLiveTherapy = () => {
        setLivePersona('psychologist');
        setMode('live');
    };

    const handleStart = async (msg: string) => {
        addChatMessage({ id: uuidv4(), role: 'user', text: msg, timestamp: Date.now() });
        setIsChatProcessing(true);
        try {
            const stream = await streamChat(chatHistory.map(m => ({role: m.role, parts: [{text: m.text}]})), msg, [], true, false, undefined, 'psychologist', psychologistSubMode, undefined, selectedModel);
            let fullText = '';
            for await (const chunk of stream) { fullText += chunk.text || ''; }
            addChatMessage({ id: uuidv4(), role: 'model', text: fullText, timestamp: Date.now() });
        } catch (e) {
            addChatMessage({ id: uuidv4(), role: 'model', text: "Hata oluştu.", timestamp: Date.now(), isError: true });
        } finally { setIsChatProcessing(false); }
    };

    const CustomLanding = (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fadeIn font-sans">
            <div className="w-24 h-24 bg-teal-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-teal-500/20 shadow-2xl shadow-teal-900/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-teal-400 text-5xl" aria-hidden="true">psychology</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Psikoloji Uzmanım</h2>
            <p className="text-gray-400 max-w-2xl mb-12 leading-relaxed text-lg">
                Zihinsel sağlığınızı güçlendirin ve iç huzuru bulun. Kelime kelime analiz yapan, yüzde yüz ikna edici, mantıklı ve derinlemesine psikolojik destek sunan profesyonel terapistiniz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <button onClick={() => handleStart("Şu an kendimi çok karmaşık ve çıkmazda hissediyorum. Lütfen yazdıklarımı kelime kelime analiz et ve bana mantıklı, yaratıcı ve gerçekten iyileştirici bir bakış açısı sun.")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-teal-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-teal-900/10">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-teal-400" aria-hidden="true">sentiment_dissatisfied</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Derinlemesine Analiz</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Duygu durumunu detaylı incele ve mantıklı çözümler bul.</p>
                </button>
                <button onClick={() => handleStart("Hayatımda sürekli aynı hataları yapıyorum ve özgüvenimi kaybettim. Bana sahte umutlar vermeden, tamamen gerçekçi ve ikna edici bir şekilde özgüvenimi nasıl yeniden inşa edeceğimi anlatır mısın?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-teal-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-teal-900/10">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-teal-400" aria-hidden="true">self_improvement</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Özgüven & Yeniden İnşa</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Gerçekçi adımlarla kişisel gelişim ve özgüven inşası.</p>
                </button>
                <button onClick={() => handleStart("İlişkimde iletişim tamamen koptu ve karşı tarafı anlayamıyorum. Bir çift terapisti gözüyle, bu durumu nasıl mantıklı ve akıllıca çözebileceğimi adım adım anlatır mısın?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-teal-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-teal-900/10">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-teal-400" aria-hidden="true">forum</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">İlişki & İletişim</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Çift terapisi perspektifiyle sağlıklı iletişim kurma.</p>
                </button>
                <button onClick={() => handleStart("Zihnim hiç susmuyor, sürekli geçmişi veya geleceği düşünmekten uyuyamıyorum. Bana çok yaratıcı ve daha önce duymadığım bir zihinsel rahatlama tekniği öğretir misin?")} className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-teal-500/30 p-8 rounded-3xl text-left transition-all duration-300 group shadow-lg hover:shadow-teal-900/10">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-teal-400" aria-hidden="true">bedtime</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Zihinsel Rahatlama</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Uyku ve anksiyete için yenilikçi sakinleşme teknikleri.</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#020606] relative font-sans">
            {/* Özel Başlık Alanı - Seçenekler */}
            <div className="absolute top-0 left-0 w-full z-30 p-6 bg-gradient-to-b from-[#020606] to-transparent flex flex-col md:flex-row items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-[#0a1212]/80 backdrop-blur-xl rounded-2xl px-8 py-3 border border-teal-900/30 shadow-2xl ml-4 md:ml-48">
                    <span className="material-symbols-outlined text-teal-400 text-2xl" aria-hidden="true">psychology</span>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-widest uppercase">ALPER PSİKOLOJİ UZMANI</h2>
                        <p className="text-[10px] text-teal-400/70 font-bold tracking-[0.2em] uppercase mt-0.5">Klinik Analiz & Terapi</p>
                    </div>
                </div>

                <button
                    onClick={handleStartLiveTherapy}
                    aria-label="Canlı Terapi Başlat"
                    className="pointer-events-auto bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-full shadow-lg shadow-teal-900/30 flex items-center gap-2 font-bold transition-transform hover:scale-105 mr-4 mt-4 md:mt-0"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                    Canlı Terapi
                </button>
            </div>

            {/* Arka plan */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-[#020606] to-[#020606] pointer-events-none z-0" aria-hidden="true"></div>

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-20">
                <ChatInterface 
                    customLandingPage={CustomLanding} 
                    customPlaceholder="Düşüncelerinizi, hislerinizi veya yaşadığınız bir sorunu detaylıca anlatın..."
                />
            </div>
        </div>
    );
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';

export const PsychologistInterface: React.FC = () => {
    const { setLivePersona, setMode, psychologistSubMode, setPsychologistSubMode } = useAppContext();

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

    return (
        <div className="flex flex-col h-full bg-teal-950/20 relative font-sans">
            {/* Özel Başlık Alanı - Seçenekler */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-gray-900 to-transparent flex flex-col md:flex-row items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center bg-gray-900/80 backdrop-blur-md rounded-full p-1 border border-gray-700 shadow-xl ml-4 md:ml-48">
                    <button
                        onClick={() => setPsychologistSubMode('therapy')}
                        aria-label="Terapi Moduna Geç"
                        aria-pressed={psychologistSubMode === 'therapy'}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                            psychologistSubMode === 'therapy' 
                            ? 'bg-teal-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">self_improvement</span>
                        Terapi Modu
                    </button>
                    <button
                        onClick={() => setPsychologistSubMode('academic')}
                        aria-label="Akademi Moduna Geç"
                        aria-pressed={psychologistSubMode === 'academic'}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                            psychologistSubMode === 'academic' 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">school</span>
                        Akademi Modu
                    </button>
                </div>

                <button
                    onClick={handleStartLiveTherapy}
                    aria-label={`Canlı ${psychologistSubMode === 'therapy' ? 'Terapi' : 'Ders'} Başlat`}
                    className="pointer-events-auto bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-full shadow-lg shadow-teal-900/30 flex items-center gap-2 font-bold transition-transform hover:scale-105 mr-4 mt-4 md:mt-0"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                    Canlı {psychologistSubMode === 'therapy' ? 'Terapi' : 'Ders'}
                </button>
            </div>

            {/* Arka plan */}
            <div className={`absolute inset-0 bg-gradient-to-b transition-colors duration-1000 ${
                psychologistSubMode === 'therapy' 
                ? 'from-teal-900/20 to-gray-900' 
                : 'from-blue-900/20 to-gray-900'
            } pointer-events-none z-0`} aria-hidden="true"></div>

            {/* Sohbet Arayüzünü Yeniden Kullanıyoruz */}
            <div className="flex-grow z-10 h-full pt-16">
                <ChatInterface />
            </div>

            {/* Alt Bilgi / Yasal Uyarı */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full text-center px-4">
                <p className="text-[10px] text-teal-500/50 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur inline-block">
                    Dr. Alper bir Yapay Zeka asistanıdır. Tıbbi teşhis koyamaz. Acil durumlarda 112'yi arayın.
                </p>
            </div>
        </div>
    );
};

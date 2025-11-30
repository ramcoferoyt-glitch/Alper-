
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChatInterface } from './ChatInterface';

export const LawyerInterface: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#1c0a0a] relative font-sans">
            {/* Avukat Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#1c0a0a] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-red-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-red-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-red-400">gavel</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER HUKUK</h2>
                        <p className="text-[10px] text-red-300 font-medium tracking-wider uppercase">Adalet & Savunma</p>
                    </div>
                </div>
            </div>

            {/* Arka plan Efekti */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-gray-900 pointer-events-none z-0"></div>

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-16">
                <ChatInterface />
            </div>

            {/* Yasal Uyarı */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full text-center px-4">
                <p className="text-[10px] text-red-500/50 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur inline-block">
                    Hukuki Tavsiye Değildir. Nihai karar yargı mercilerine aittir.
                </p>
            </div>
        </div>
    );
};
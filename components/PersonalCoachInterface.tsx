
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ChatInterface } from './ChatInterface';

export const PersonalCoachInterface: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#1a0f0a] relative font-sans">
            {/* Koç Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#1a0f0a] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-orange-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-orange-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-orange-400">accessibility_new</span>
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
                <ChatInterface />
            </div>
        </div>
    );
};

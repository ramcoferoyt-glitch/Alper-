
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';

export const ConsultantInterface: React.FC = () => {
    const { setIsProfileModalOpen, userProfile } = useAppContext();

    const isProfileEmpty = !userProfile.name || !userProfile.role;

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] relative font-sans">
            {/* Profesyonel Başlık Alanı */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#0a0f1c] to-transparent flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 bg-blue-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-blue-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-yellow-500">business_center</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER DANIŞMAN</h2>
                        <p className="text-[10px] text-blue-300 font-medium tracking-wider uppercase">Stratejik Yönetim & Kariyer</p>
                    </div>
                </div>
            </div>

            {/* Arka plan Efekti */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-gray-900 pointer-events-none z-0"></div>

            {/* Uyarı: Profil Eksikse */}
            {isProfileEmpty && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 animate-fadeIn">
                    <div className="bg-yellow-900/80 backdrop-blur-md border border-yellow-700 text-yellow-100 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                        <span className="material-symbols-outlined text-yellow-400">info</span>
                        <div>
                            <p className="text-sm font-bold mb-1">Daha iyi hizmet için sizi tanımalıyım.</p>
                            <p className="text-xs opacity-90 mb-2">Sektörünüzü ve rolünüzü bilmem, size özel stratejiler geliştirmemi sağlar.</p>
                            <button 
                                onClick={() => setIsProfileModalOpen(true)}
                                className="text-xs bg-white text-black px-3 py-1 rounded-md font-bold hover:bg-gray-200 transition-colors"
                            >
                                Profili Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sohbet Arayüzü */}
            <div className="flex-grow z-10 h-full pt-16">
                <ChatInterface />
            </div>
        </div>
    );
};

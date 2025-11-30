
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';

export const AgentInterface: React.FC = () => {
    const { userProfile, setIsProfileModalOpen } = useAppContext();
    const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');

    const hasBackgroundPermission = userProfile.preferences?.allowBackgroundProcessing;

    return (
        <div className="flex flex-col h-full bg-[#050505] relative font-sans">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#050505] to-transparent flex items-center justify-between pointer-events-none px-8">
                <div className="pointer-events-auto flex items-center gap-3 bg-indigo-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-indigo-800/50 shadow-2xl">
                    <span className="material-symbols-outlined text-indigo-400 animate-pulse">smart_toy</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER AJAN</h2>
                        <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">Otonom Araştırma & Eğitim</p>
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeTab === 'chat' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-gray-800'}`}
                    >
                        Görev Ata
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-gray-800'}`}
                    >
                        Arka Plan Durumu
                    </button>
                </div>
            </div>

            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none z-0"></div>

            {/* Main Content */}
            <div className="flex-grow z-10 h-full pt-20">
                {activeTab === 'chat' ? (
                    <ChatInterface />
                ) : (
                    <div className="p-8 max-w-4xl mx-auto space-y-6">
                        <div className={`p-6 rounded-2xl border ${hasBackgroundPermission ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <span className={`material-symbols-outlined text-3xl ${hasBackgroundPermission ? 'text-green-400' : 'text-red-400'}`}>
                                    {hasBackgroundPermission ? 'check_circle' : 'unpublished'}
                                </span>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Arka Plan İzni {hasBackgroundPermission ? 'Aktif' : 'Pasif'}</h3>
                                    <p className="text-gray-400 text-sm">
                                        {hasBackgroundPermission 
                                            ? 'Alper, uygulama kapalıyken araştırma yapabilir ve size bildirim gönderebilir.' 
                                            : 'Alper şu an sadece uygulama açıkken çalışır.'}
                                    </p>
                                </div>
                            </div>
                            {!hasBackgroundPermission && (
                                <button 
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm"
                                >
                                    İzni Aç
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Daily Briefing Card */}
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-400 text-sm">schedule</span>
                                    Günlük Brifing
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm text-gray-300 border-b border-gray-800 pb-2">
                                        <span>Durum</span>
                                        <span className={userProfile.preferences?.dailyBriefing ? 'text-green-400' : 'text-gray-500'}>
                                            {userProfile.preferences?.dailyBriefing ? 'Zamanlandı (08:00)' : 'Kapalı'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-300 border-b border-gray-800 pb-2">
                                        <span>Kanal</span>
                                        <span>{userProfile.preferences?.notifications?.email ? 'E-Posta' : 'Uygulama İçi'}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Piyasa özeti, randevular ve ilgilendiğiniz haberler her sabah derlenir.
                                    </p>
                                </div>
                            </div>

                            {/* Active Missions (Simulation) */}
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-400 text-sm">manage_search</span>
                                    Aktif Görevler
                                </h4>
                                {hasBackgroundPermission ? (
                                    <div className="space-y-4">
                                        <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-white text-sm font-medium">Kripto Piyasası Takibi</p>
                                                <p className="text-xs text-gray-500">Sürekli • Volatilite alarmı</p>
                                            </div>
                                            <span className="text-green-500 text-xs animate-pulse">Çalışıyor</span>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-white text-sm font-medium">Haber Tarama</p>
                                                <p className="text-xs text-gray-500">Teknoloji & Yapay Zeka</p>
                                            </div>
                                            <span className="text-green-500 text-xs animate-pulse">Çalışıyor</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-24 text-gray-600">
                                        <p className="text-sm">Arka plan izni yok.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

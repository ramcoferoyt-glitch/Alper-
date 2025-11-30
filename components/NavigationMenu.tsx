
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppMode } from '../types';

export const NavigationMenu: React.FC = () => {
    const { mode, setMode, setIsYouTubeModalOpen, setIsProfileModalOpen, userProfile } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleModeChange = (newMode: AppMode) => {
        setMode(newMode);
        setIsOpen(false);
    };

    const handleYouTubeClick = () => {
        setIsYouTubeModalOpen(true);
        setIsOpen(false);
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-50 p-3 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md text-white rounded-full border border-gray-700 hover:border-white/30 transition-all hover:scale-105 group shadow-2xl"
                title={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                aria-label={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                aria-expanded={isOpen}
            >
                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300 text-gray-200" aria-hidden="true">
                    {isOpen ? 'close' : 'menu'}
                </span>
            </button>

            {/* Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex justify-end transition-opacity duration-300">
                    <div className="w-full max-w-sm bg-[#0a0a0a] h-full shadow-2xl border-l border-gray-800 p-0 flex flex-col animate-slideLeft overflow-y-auto" role="dialog" aria-label="Ana Menü">
                        
                        {/* User Profile Card - Premium Header */}
                        <div className="p-6 bg-gradient-to-b from-gray-900 to-transparent border-b border-gray-800">
                            <button 
                                onClick={handleProfileClick}
                                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-2xl flex items-center gap-4 hover:bg-gray-800 hover:border-gray-500 transition-all group text-left shadow-lg"
                                aria-label={`Profil: ${userProfile.name || 'Misafir Kullanıcı'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white/10" aria-hidden="true">
                                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'M'}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors tracking-wide">
                                        {userProfile.name || 'Misafir Kullanıcı'}
                                    </h3>
                                    <p className="text-xs text-gray-400 truncate font-medium">{userProfile.role || 'Ayarlar'}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors" aria-hidden="true">settings</span>
                            </button>
                        </div>

                        {/* Menu Items Container */}
                        <div className="flex-grow p-6 space-y-8" role="menu">
                            
                            {/* Section: Core */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2">Merkez</h3>
                                <MenuItem 
                                    icon="chat_bubble" 
                                    label="Akıllı Sohbet" 
                                    desc="Genel Asistan & Strateji"
                                    isActive={mode === 'chat'} 
                                    onClick={() => handleModeChange('chat')} 
                                    theme="blue"
                                />
                                <MenuItem 
                                    icon="smart_toy" 
                                    label="Alper Ajan" 
                                    desc="Otonom Araştırma & Eğitim"
                                    isActive={mode === 'agent'} 
                                    onClick={() => handleModeChange('agent')} 
                                    theme="purple"
                                />
                            </div>

                            {/* Section: Professional */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2">Profesyonel Araçlar</h3>
                                
                                <MenuItem 
                                    icon="business_center" 
                                    label="Alper Danışman" 
                                    desc="Stratejik İş & Kariyer Yönetimi"
                                    isActive={mode === 'consultant'} 
                                    onClick={() => handleModeChange('consultant')} 
                                    theme="gold"
                                />

                                <MenuItem 
                                    icon="edit_document" 
                                    label="Alper Editör" 
                                    desc="Profesyonel Kitap Yazımı"
                                    isActive={mode === 'editor'} 
                                    onClick={() => handleModeChange('editor')} 
                                    theme="gold"
                                />

                                <MenuItem 
                                    icon="gavel" 
                                    label="Alper Hukuk (Avukat)" 
                                    desc="İltica, Ceza & Hukuki Danışmanlık"
                                    isActive={mode === 'lawyer'} 
                                    onClick={() => handleModeChange('lawyer')} 
                                    theme="red"
                                />

                                <MenuItem 
                                    icon="psychology" 
                                    label="Dr. Alper (Psikolog)" 
                                    desc="Terapi & Akademik Rehberlik"
                                    isActive={mode === 'psychologist'} 
                                    onClick={() => handleModeChange('psychologist')} 
                                    theme="teal"
                                />

                                <MenuItem 
                                    icon="savings" 
                                    label="Alper Finans" 
                                    desc="Yatırım, Borsa & Ekonomi Eğitimi"
                                    isActive={mode === 'finance'} 
                                    onClick={() => handleModeChange('finance')} 
                                    theme="green"
                                />

                                <MenuItem 
                                    icon="accessibility_new" 
                                    label="Alper Koç (Gelişim)" 
                                    desc="Motivasyon, Disiplin & Hedefler"
                                    isActive={mode === 'personal_coach'} 
                                    onClick={() => handleModeChange('personal_coach')} 
                                    theme="orange"
                                />

                                <MenuItem 
                                    icon="auto_stories" 
                                    label="Notebook Asistanı" 
                                    desc="Derinlemesine Kaynak Analizi"
                                    isActive={mode === 'notebook'} 
                                    onClick={() => handleModeChange('notebook')} 
                                    theme="purple"
                                />
                            </div>

                            {/* Section: Creative Studio */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2">Yaratıcı Stüdyo</h3>
                                
                                <MenuItem 
                                    icon="brush" 
                                    label="Sosyal Medya Tasarım" 
                                    desc="YouTube, TikTok & Instagram"
                                    isActive={mode === 'thumbnail'} 
                                    onClick={() => handleModeChange('thumbnail')} 
                                    theme="pink"
                                />
                                
                                <MenuItem 
                                    icon="palette" 
                                    label="Görsel Stüdyosu" 
                                    desc="Yüksek Kalite İmaj Üretimi"
                                    isActive={mode === 'image'} 
                                    onClick={() => handleModeChange('image')} 
                                    theme="indigo"
                                />
                                
                                <MenuItem 
                                    icon="movie_creation" 
                                    label="Video Stüdyosu" 
                                    desc="Sinematik Video Oluşturma"
                                    isActive={mode === 'video'} 
                                    onClick={() => handleModeChange('video')} 
                                    theme="orange"
                                />
                            </div>

                            {/* Section: Discovery */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2">Keşif & Araçlar</h3>
                                <MenuItem 
                                    icon="explore" 
                                    label="Harita ve Keşif" 
                                    desc="Konum Tabanlı Rehberlik"
                                    isActive={mode === 'maps'} 
                                    onClick={() => handleModeChange('maps')} 
                                    theme="green"
                                />
                                
                                <button 
                                    onClick={handleYouTubeClick}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-800 hover:text-white group border border-transparent hover:border-gray-700"
                                    role="menuitem"
                                    aria-label="YouTube Video Analizi"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-900/30 transition-colors">
                                        <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform" aria-hidden="true">smart_display</span>
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="block font-bold text-sm text-gray-300 group-hover:text-white">YouTube Analiz</span>
                                        <span className="block text-[10px] text-gray-500 group-hover:text-gray-400">Video Özeti ve Raporu</span>
                                    </div>
                                </button>
                            </div>

                            {/* Section: Data */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2">Veri</h3>
                                <MenuItem 
                                    icon="database" 
                                    label="Veri Bellek" 
                                    desc="Geçmiş Sohbetler & Bilgi Deposu"
                                    isActive={mode === 'memory'} 
                                    onClick={() => handleModeChange('memory')} 
                                    theme="blue"
                                />
                            </div>
                        </div>
                        
                        {/* Footer Branding */}
                        <div className="p-6 text-center border-t border-gray-900">
                            <p className="text-[10px] text-gray-600 font-medium tracking-widest">POWERED BY ALPER AI</p>
                        </div>
                    </div>
                    
                    {/* Click outside to close */}
                    <div className="flex-grow" onClick={() => setIsOpen(false)} aria-hidden="true"></div>
                </div>
            )}
        </>
    );
};

const MenuItem: React.FC<{ 
    icon: string; 
    label: string; 
    desc: string;
    isActive: boolean; 
    onClick: () => void;
    theme: 'blue' | 'gold' | 'purple' | 'teal' | 'pink' | 'indigo' | 'orange' | 'green' | 'red';
}> = ({ icon, label, desc, isActive, onClick, theme }) => {
    
    const themeColors = {
        blue: { active: 'bg-blue-600 border-blue-500 shadow-blue-900/20', text: 'text-blue-400', hover: 'hover:border-blue-500/30' },
        gold: { active: 'bg-yellow-600 border-yellow-500 shadow-yellow-900/20', text: 'text-yellow-400', hover: 'hover:border-yellow-500/30' },
        purple: { active: 'bg-purple-600 border-purple-500 shadow-purple-900/20', text: 'text-purple-400', hover: 'hover:border-purple-500/30' },
        teal: { active: 'bg-teal-600 border-teal-500 shadow-teal-900/20', text: 'text-teal-400', hover: 'hover:border-teal-500/30' },
        pink: { active: 'bg-pink-600 border-pink-500 shadow-pink-900/20', text: 'text-pink-400', hover: 'hover:border-pink-500/30' },
        indigo: { active: 'bg-indigo-600 border-indigo-500 shadow-indigo-900/20', text: 'text-indigo-400', hover: 'hover:border-indigo-500/30' },
        orange: { active: 'bg-orange-600 border-orange-500 shadow-orange-900/20', text: 'text-orange-400', hover: 'hover:border-orange-500/30' },
        green: { active: 'bg-green-600 border-green-500 shadow-green-900/20', text: 'text-green-400', hover: 'hover:border-green-500/30' },
        red: { active: 'bg-red-800 border-red-700 shadow-red-900/20', text: 'text-red-500', hover: 'hover:border-red-500/30' },
    };

    const colors = themeColors[theme];

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden border
                ${isActive 
                    ? `${colors.active} text-white shadow-lg border-opacity-100` 
                    : `bg-gray-800/30 border-transparent text-gray-400 hover:bg-gray-800 hover:text-white ${colors.hover}`
                }`}
            role="menuitem"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                <span className={`material-symbols-outlined text-xl ${isActive ? 'text-white' : colors.text}`} aria-hidden="true">{icon}</span>
            </div>
            
            <div className="flex flex-col items-start text-left">
                <span className={`font-bold text-sm tracking-wide ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{label}</span>
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-400'}`}>{desc}</span>
            </div>
        </button>
    );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppMode } from '../types';

export const NavigationMenu: React.FC = () => {
    const { mode, setMode, setIsYouTubeModalOpen, setIsProfileModalOpen, userProfile, startNewSession, isPrivateMode, setIsPrivateMode } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleModeChange = (newMode: AppMode) => {
        setMode(newMode);
        setIsOpen(false);
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setIsOpen(false);
    };

    const handleNewChat = () => {
        startNewSession('chat');
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button with Accessibility */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-50 p-3 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md text-white rounded-full border border-gray-700 hover:border-white/30 transition-all hover:scale-105 group shadow-2xl outline-none focus:ring-2 focus:ring-white"
                title={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                aria-label={isOpen ? "Ana menüyü kapat" : "Ana menüyü aç"}
                aria-expanded={isOpen}
            >
                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300 text-gray-200" aria-hidden="true">
                    {isOpen ? 'close' : 'menu'}
                </span>
            </button>

            {/* Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex justify-end transition-opacity duration-300">
                    <div className="w-full max-w-sm bg-[#0a0a0a] h-full shadow-2xl border-l border-gray-800 p-0 flex flex-col animate-slideLeft overflow-y-auto" role="dialog" aria-label="Gezinti Menüsü" aria-modal="true">
                        
                        {/* TOP ACTIONS: NEW CHAT & PRIVATE MODE */}
                        <div className="p-4 bg-gray-950 border-b border-gray-800 space-y-3">
                            <button 
                                onClick={handleNewChat}
                                className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg active:scale-95"
                                aria-label="Yeni Sohbet Başlat"
                            >
                                <span className="material-symbols-outlined text-lg">add_comment</span>
                                YENİ SOHBET
                            </button>

                            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined ${isPrivateMode ? 'text-purple-400' : 'text-gray-500'}`}>
                                        {isPrivateMode ? 'incognito' : 'visibility'}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold ${isPrivateMode ? 'text-purple-400' : 'text-gray-400'}`}>
                                            {isPrivateMode ? 'GİZLİ MOD AKTİF' : 'GİZLİ MOD KAPALI'}
                                        </span>
                                        <span className="text-[8px] text-gray-600 font-medium">Kayıt tutulmaz</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isPrivateMode} 
                                        onChange={(e) => setIsPrivateMode(e.target.checked)} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* User Profile Card */}
                        <div className="p-6 bg-gradient-to-b from-gray-900 to-transparent border-b border-gray-800">
                            <button 
                                onClick={handleProfileClick}
                                className="w-full bg-gray-800/50 border border-gray-700 p-4 rounded-2xl flex items-center gap-4 hover:bg-gray-800 hover:border-gray-500 transition-all group text-left shadow-lg outline-none focus:ring-2 focus:ring-amber-500"
                                aria-label={`Profil Ayarları: ${userProfile.name || 'Misafir Kullanıcı'}. Düzenlemek için tıklayın.`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white/10" aria-hidden="true">
                                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'M'}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors tracking-wide">
                                        {userProfile.name || 'Misafir Kullanıcı'}
                                    </h3>
                                    <p className="text-xs text-gray-400 truncate font-medium">{userProfile.role || 'Profil Düzenle'}</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors" aria-hidden="true">settings</span>
                            </button>
                        </div>

                        {/* Menu Items Container */}
                        <div className="flex-grow p-6 space-y-8" role="menu">
                            
                            {/* Ana Merkez */}
                            <MenuItem 
                                icon="chat_bubble" 
                                label="Merkez (Sohbet)" 
                                desc="Genel Asistan"
                                isActive={mode === 'chat'} 
                                onClick={() => handleModeChange('chat')} 
                                theme="blue"
                            />

                            {/* Kategori 1: Yaratıcı Araçlar */}
                            <div className="space-y-2">
                                <MenuCategoryTitle label="Yaratıcı Araçlar" />
                                <MenuItem icon="palette" label="Görsel Stüdyosu" desc="Görsel Üretim & Düzenleme" isActive={mode === 'image'} onClick={() => handleModeChange('image')} theme="indigo" />
                                <MenuItem icon="movie_creation" label="Video Stüdyosu" desc="Video Üretimi" isActive={mode === 'video'} onClick={() => handleModeChange('video')} theme="orange" />
                                <MenuItem icon="campaign" label="Sosyal İçerik & Metin" desc="Metin & Senaryo" isActive={mode === 'social_content'} onClick={() => handleModeChange('social_content')} theme="pink" />
                                <MenuItem icon="brush" label="Sosyal Medya Tasarım" desc="Kapak & Banner" isActive={mode === 'thumbnail'} onClick={() => handleModeChange('thumbnail')} theme="pink" />
                                <MenuItem icon="edit_document" label="Alper Editör" desc="Kitap & Yazarlık" isActive={mode === 'editor'} onClick={() => handleModeChange('editor')} theme="gold" />
                            </div>

                            {/* Kategori 2: Profesyonel Asistan */}
                            <div className="space-y-2">
                                <MenuCategoryTitle label="Profesyonel Asistan" />
                                <MenuItem icon="gavel" label="Alper Hukuk" desc="Hukuki Rehber" isActive={mode === 'lawyer'} onClick={() => handleModeChange('lawyer')} theme="red" />
                                <MenuItem icon="savings" label="Alper Finans" desc="Ekonomi & Borsa" isActive={mode === 'finance'} onClick={() => handleModeChange('finance')} theme="green" />
                                <MenuItem icon="psychology" label="Dr. Alper" desc="Psikolojik Destek" isActive={mode === 'psychologist'} onClick={() => handleModeChange('psychologist')} theme="teal" />
                                <MenuItem icon="business_center" label="Alper Danışman" desc="İş & Kariyer" isActive={mode === 'consultant'} onClick={() => handleModeChange('consultant')} theme="gold" />
                                <MenuItem icon="smart_toy" label="Alper Agent" desc="Otonom Araştırma" isActive={mode === 'agent'} onClick={() => handleModeChange('agent')} theme="purple" />
                            </div>

                            {/* Kategori 3: Keşfet & Planla */}
                            <div className="space-y-2">
                                <MenuCategoryTitle label="Keşfet & Planla" />
                                <MenuItem icon="explore" label="Harita ve Keşif" desc="Rota & Mekanlar" isActive={mode === 'maps'} onClick={() => handleModeChange('maps')} theme="green" />
                                <MenuItem icon="school" label="Öğren & Geliş" desc="Eğitim Planı" isActive={mode === 'learning'} onClick={() => handleModeChange('learning')} theme="indigo" />
                                <MenuItem icon="accessibility_new" label="Günlük Yaşam" desc="Plan & Bütçe" isActive={mode === 'daily_life'} onClick={() => handleModeChange('daily_life')} theme="orange" />
                                <MenuItem icon="auto_stories" label="Notebook" desc="Kaynak Analizi" isActive={mode === 'notebook'} onClick={() => handleModeChange('notebook')} theme="purple" />
                            </div>

                            {/* Kategori 4: Araçlar & Veri */}
                            <div className="space-y-2">
                                <MenuCategoryTitle label="Araçlar & Veri" />
                                <MenuItem icon="smart_display" label="YouTube Analiz" desc="Video Özeti" isActive={false} onClick={() => { setIsYouTubeModalOpen(true); setIsOpen(false); }} theme="red" />
                                <MenuItem icon="download" label="İndirici" desc="Video & Ses İndir" isActive={mode === 'downloader'} onClick={() => handleModeChange('downloader')} theme="blue" />
                                <MenuItem icon="database" label="Veri Bellek" desc="Geçmiş & Kayıtlar" isActive={mode === 'memory'} onClick={() => handleModeChange('memory')} theme="blue" />
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-6 text-center border-t border-gray-900">
                            <p className="text-[10px] text-gray-600 font-medium tracking-widest" aria-hidden="true">POWERED BY ALPER AI</p>
                        </div>
                    </div>
                    <div className="flex-grow" onClick={() => setIsOpen(false)} aria-hidden="true"></div>
                </div>
            )}
        </>
    );
};

const MenuCategoryTitle: React.FC<{ label: string }> = ({ label }) => (
    <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2 border-b border-gray-800 pb-1 mb-1 mt-4">{label}</h3>
);

const MenuItem: React.FC<{ 
    icon: string; 
    label: string; 
    desc: string;
    isActive: boolean; 
    onClick: () => void;
    theme: 'blue' | 'gold' | 'purple' | 'teal' | 'pink' | 'indigo' | 'orange' | 'green' | 'red';
}> = ({ icon, label, desc, isActive, onClick, theme }) => {
    
    const themeColors = {
        blue: { active: 'bg-blue-600 border-blue-500 shadow-blue-900/20', text: 'text-blue-400' },
        gold: { active: 'bg-yellow-600 border-yellow-500 shadow-yellow-900/20', text: 'text-yellow-400' },
        purple: { active: 'bg-purple-600 border-purple-500 shadow-purple-900/20', text: 'text-purple-400' },
        teal: { active: 'bg-teal-600 border-teal-500 shadow-teal-900/20', text: 'text-teal-400' },
        pink: { active: 'bg-pink-600 border-pink-500 shadow-pink-900/20', text: 'text-pink-400' },
        indigo: { active: 'bg-indigo-600 border-indigo-500 shadow-indigo-900/20', text: 'text-indigo-400' },
        orange: { active: 'bg-orange-600 border-orange-500 shadow-orange-900/20', text: 'text-orange-400' },
        green: { active: 'bg-green-600 border-green-500 shadow-green-900/20', text: 'text-green-400' },
        red: { active: 'bg-red-800 border-red-700 shadow-red-900/20', text: 'text-red-500' },
    };

    const colors = themeColors[theme];

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative border outline-none focus:ring-2 focus:ring-white
                ${isActive 
                    ? `${colors.active} text-white shadow-lg border-opacity-100` 
                    : `bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white`
                }`}
            role="menuitem"
            aria-label={`${label}: ${desc}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : colors.text}`} aria-hidden="true">{icon}</span>
            <div className="flex flex-col items-start text-left">
                <span className={`font-semibold text-xs ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{label}</span>
                <span className={`text-[9px] ${isActive ? 'text-white/80' : 'text-gray-600 group-hover:text-gray-500'}`}>{desc}</span>
            </div>
        </button>
    );
};
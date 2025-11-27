
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppMode } from '../types';

export const NavigationMenu: React.FC = () => {
    const { mode, setMode, setIsYouTubeModalOpen } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleModeChange = (newMode: AppMode) => {
        setMode(newMode);
        setIsOpen(false);
    };

    const handleYouTubeClick = () => {
        setIsYouTubeModalOpen(true);
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-50 p-3 bg-black/50 hover:bg-gray-800 backdrop-blur-md text-white rounded-full border border-gray-700 hover:border-white/50 transition-all hover:scale-105 group shadow-lg"
                title="Menüyü Aç"
                aria-label={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            >
                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300" aria-hidden="true">
                    {isOpen ? 'close' : 'menu'}
                </span>
            </button>

            {/* Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-xs bg-gray-950 h-full shadow-2xl border-l border-gray-800 p-6 flex flex-col animate-slideLeft overflow-y-auto" role="dialog" aria-label="Ana Menü">
                        
                        <div className="mt-16 mb-8 px-2">
                             <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                Alper AI
                            </h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Yaratıcı Stüdyo</p>
                        </div>

                        <div className="space-y-2" role="menu">
                            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2 px-4">Uygulamalar</h3>
                            
                            <MenuItem 
                                icon="chat_bubble" 
                                label="Akıllı Sohbet" 
                                isActive={mode === 'chat'} 
                                onClick={() => handleModeChange('chat')} 
                            />
                            
                            <MenuItem 
                                icon="edit_document" 
                                label="Alper Editör (Kitap)" 
                                isActive={mode === 'editor'} 
                                onClick={() => handleModeChange('editor')} 
                                className="text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20"
                            />

                             <MenuItem 
                                icon="auto_stories" 
                                label="Notebook Asistanı" 
                                isActive={mode === 'notebook'} 
                                onClick={() => handleModeChange('notebook')} 
                            />
                            <MenuItem 
                                icon="brush" 
                                label="Sosyal Medya Tasarımcı" 
                                isActive={mode === 'thumbnail'} 
                                onClick={() => handleModeChange('thumbnail')} 
                            />
                            <MenuItem 
                                icon="palette" 
                                label="Görsel Stüdyosu" 
                                isActive={mode === 'image'} 
                                onClick={() => handleModeChange('image')} 
                            />
                            <MenuItem 
                                icon="movie_creation" 
                                label="Video Stüdyosu" 
                                isActive={mode === 'video'} 
                                onClick={() => handleModeChange('video')} 
                            />
                            <MenuItem 
                                icon="explore" 
                                label="Harita ve Keşif" 
                                isActive={mode === 'maps'} 
                                onClick={() => handleModeChange('maps')} 
                            />
                            
                            <div className="border-t border-gray-800 my-4 pt-4">
                                <button 
                                    onClick={handleYouTubeClick}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-900 hover:text-white group"
                                    role="menuitem"
                                    aria-label="YouTube Video Analizi"
                                >
                                    <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform" aria-hidden="true">smart_display</span>
                                    <span className="font-medium text-sm">YouTube Video Analizi</span>
                                </button>
                            </div>
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
    isActive: boolean; 
    onClick: () => void;
    className?: string;
}> = ({ icon, label, isActive, onClick, className }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
            ${isActive 
                ? 'bg-white text-black shadow-lg shadow-white/5' 
                : className || 'text-gray-400 hover:bg-gray-900 hover:text-white'
            }`}
        role="menuitem"
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
    >
        <span className={`material-symbols-outlined text-xl ${isActive ? 'fill-current' : ''}`} aria-hidden="true">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
    </button>
);


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppMode, AppLanguage } from '../types';

export const NavigationMenu: React.FC = () => {
    const { mode, setMode, startNewSession, language, setLanguage, t, userProfile, updateUserProfile } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [tempName, setTempName] = useState(userProfile.name);
    const [tempInstructions, setTempInstructions] = useState(userProfile.customInstructions || '');

    const handleModeChange = (newMode: AppMode) => {
        startNewSession(newMode);
        setIsOpen(false);
    };

    const saveProfile = () => {
        updateUserProfile({ name: tempName, customInstructions: tempInstructions });
        setIsProfileEditOpen(false);
    };

    const languages: { code: AppLanguage, label: string }[] = [
        { code: 'tr', label: 'Türkçe' },
        { code: 'en', label: 'İngilizce' },
        { code: 'de', label: 'Almanca' },
        { code: 'fr', label: 'Fransızca' },
        { code: 'es', label: 'İspanyolca' },
        { code: 'ru', label: 'Rusça' },
        { code: 'ar', label: 'Arapça' },
        { code: 'it', label: 'İtalyanca' },
        { code: 'zh', label: 'Çince' },
        { code: 'ja', label: 'Japonca' },
        { code: 'pt', label: 'Portekizce' },
        { code: 'ko', label: 'Korece' },
        { code: 'hi', label: 'Hintçe' },
        { code: 'nl', label: 'Hollandaca' },
        { code: 'sv', label: 'İsveççe' }
    ];

    return (
        <>
            {/* Menü Butonu */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-[60] p-4 bg-gray-800/80 hover:bg-gray-700 backdrop-blur-md text-white rounded-full border border-white/10 transition-all shadow-2xl active:scale-90"
                aria-label={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isOpen ? 'close' : 'menu'}</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex justify-end animate-fadeIn">
                    <div className="w-full max-w-sm bg-[#0a0a0a] h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border-l border-white/5 flex flex-col animate-slideLeft">
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 pb-24">
                            <div className="mt-16 space-y-8">
                                
                                {/* PROFİL KARTI */}
                                <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/30" aria-hidden="true">
                                                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                                            </div>
                                            <button 
                                                onClick={() => setIsProfileEditOpen(true)}
                                                className="text-xs bg-white/5 hover:bg-white/10 text-blue-300 px-3 py-1.5 rounded-full border border-white/5 transition-colors flex items-center gap-1"
                                                aria-label="Profili Düzenle"
                                            >
                                                <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                                                Düzenle
                                            </button>
                                        </div>
                                        <h3 className="text-white font-bold text-lg leading-tight">
                                            {userProfile.name || 'Misafir Kullanıcı'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {userProfile.customInstructions || 'Özel talimat yok.'}
                                        </p>
                                    </div>
                                </div>

                                <button onClick={() => { startNewSession('chat'); setIsOpen(false); }} className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl shadow-white/10 active:scale-95">
                                    {t('new_chat')}
                                </button>

                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 pl-2 opacity-50">ARAÇLAR</h3>
                                    <MenuBtn icon="chat" label="Sohbet" active={mode === 'chat'} onClick={() => handleModeChange('chat')} />
                                    <MenuBtn icon="palette" label="Görsel Stüdyo" active={mode === 'image'} onClick={() => handleModeChange('image')} />
                                    <MenuBtn icon="movie" label="Video Stüdyo" active={mode === 'video'} onClick={() => handleModeChange('video')} />
                                    <MenuBtn icon="cloud_download" label="Medya İndirici" active={mode === 'downloader'} onClick={() => handleModeChange('downloader')} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 pl-2 opacity-50">PROFESYONEL ASİSTANLAR</h3>
                                    <MenuBtn icon="smart_toy" label="Ajan Modu" active={mode === 'agent'} onClick={() => handleModeChange('agent')} />
                                    <MenuBtn icon="gavel" label="Avukatım" active={mode === 'lawyer'} onClick={() => handleModeChange('lawyer')} />
                                    <MenuBtn icon="psychology" label="Psikoloğum" active={mode === 'psychologist'} onClick={() => handleModeChange('psychologist')} />
                                    <MenuBtn icon="attach_money" label="Finans ve Ekonomi Uzmanım" active={mode === 'finance'} onClick={() => handleModeChange('finance')} />
                                    <MenuBtn icon="edit_document" label="Metin Editörüm" active={mode === 'editor'} onClick={() => handleModeChange('editor')} />
                                    <MenuBtn icon="explore" label="Gezgin (Haritalar)" active={mode === 'maps'} onClick={() => handleModeChange('maps')} />
                                </div>

                                {/* AYARLAR (Collapsible) */}
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                                        className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl hover:bg-[#161616] transition-all group"
                                        aria-expanded={isSettingsExpanded}
                                        aria-label="Ayarlar Menüsü"
                                    >
                                        <div className="flex items-center gap-3 text-gray-300 group-hover:text-white">
                                            <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                                            <span className="font-bold text-sm">AYARLAR</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${isSettingsExpanded ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>
                                    </button>

                                    {isSettingsExpanded && (
                                        <div className="space-y-3 pl-2 animate-fadeIn">
                                            {/* Dil Seçici */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setIsLangOpen(!isLangOpen)} 
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all text-sm"
                                                    aria-expanded={isLangOpen}
                                                    aria-label="Dil Seçimi"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
                                                        <span>Dil: {languages.find(l => l.code === language)?.label}</span>
                                                    </div>
                                                </button>
                                                {isLangOpen && (
                                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                                                        {languages.map(lang => (
                                                            <button key={lang.code} onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }} className={`w-full text-left px-5 py-3 text-xs font-medium hover:bg-blue-600/20 transition-all ${language === lang.code ? 'text-blue-400 bg-blue-600/10' : 'text-gray-400'}`}>
                                                                {lang.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tema Seçici */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setIsThemeOpen(!isThemeOpen)} 
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all text-sm"
                                                    aria-expanded={isThemeOpen}
                                                    aria-label="Tema Seçimi"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">dark_mode</span>
                                                        <span>Tema: Koyu</span>
                                                    </div>
                                                </button>
                                                {isThemeOpen && (
                                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl">
                                                        <button onClick={() => setIsThemeOpen(false)} className="w-full text-left px-5 py-3 text-xs font-medium text-blue-400 bg-blue-600/10">Koyu (Varsayılan)</button>
                                                        <button onClick={() => setIsThemeOpen(false)} className="w-full text-left px-5 py-3 text-xs font-medium text-gray-400 hover:bg-white/5">Açık</button>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => alert("Gizlilik Politikası: Verileriniz sadece cihazınızda saklanır.")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all text-sm">
                                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">security</span>
                                                <span>Gizlilik Politikası</span>
                                            </button>

                                            <button onClick={() => alert("Kullanım Şartları: Bu uygulama kişisel kullanım içindir.")} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all text-sm">
                                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">gavel</span>
                                                <span>Kullanım Şartları</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* BELLEK & GEÇMİŞ (Taşındı) */}
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 pl-2 opacity-50">BELLEK & GEÇMİŞ</h3>
                                    <MenuBtn icon="history" label="Sohbet Geçmişi" active={mode === 'memory'} onClick={() => handleModeChange('memory')} />
                                </div>

                                {/* Alt Menü (Hakkında ve Çıkış) */}
                                <div className="space-y-2 pt-4 border-t border-white/5 mt-auto">
                                    <button onClick={() => setIsAboutOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                        <span className="material-symbols-outlined" aria-hidden="true">info</span>
                                        <span className="font-bold text-sm">Hakkında</span>
                                    </button>
                                    <button onClick={() => { alert("Çıkış yapıldı."); setIsOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                                        <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                                        <span className="font-bold text-sm">Çıkış Yap</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow" onClick={() => setIsOpen(false)}></div>
                </div>
            )}

            {/* Profil Düzenleme Modalı */}
            {isProfileEditOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setIsProfileEditOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" aria-label="Kapat" title="Kapat">
                            <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                        <h2 className="text-2xl font-black text-white mb-6">Profil Düzenle</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ad Soyad</label>
                                <input 
                                    type="text" 
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Adınız..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Yapay Zeka Talimatları</label>
                                <textarea 
                                    value={tempInstructions}
                                    onChange={(e) => setTempInstructions(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors h-32 resize-none"
                                    placeholder="Alper size nasıl hitap etsin? Hangi tonu kullansın? (Örn: Resmi ol, kısa cevap ver...)"
                                />
                                <p className="text-[10px] text-gray-600 mt-2">Bu talimatlar tüm sohbetlerde geçerli olacaktır.</p>
                            </div>

                            <button 
                                onClick={saveProfile}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                            >
                                KAYDET
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hakkında Modalı */}
            {isAboutOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setIsAboutOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" aria-label="Kapat" title="Kapat">
                            <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-900/40 border border-white/10">
                                <span className="material-symbols-outlined text-white text-5xl" aria-hidden="true">diamond</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter">Alper YZ Profesyonel</h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Sürüm 5.0.1 Seçkin</p>
                        </div>
                        <div className="space-y-6 text-sm text-gray-300 leading-relaxed text-center">
                            <p className="font-medium">Bu uygulama <span className="text-white font-bold">Alper YZ</span> tarafından geliştirilmiştir.</p>
                            <p className="opacity-80">En gelişmiş yapay zeka modelleri (Alper X5 Profesyonel ve X3) kullanılarak, profesyonel ihtiyaçlarınız için özel olarak optimize edilmiştir.</p>
                            
                            <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5 mt-6 text-left">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Sistem Yetenekleri</p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        Hukuk, Finans ve Psikoloji Uzmanlığı
                                    </li>
                                    <li className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                        Görsel ve Video Üretim Stüdyosu
                                    </li>
                                    <li className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Gelişmiş Medya İndirme Araçları
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-10 text-center">
                            <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em]">© 2026 Alper YZ. Tüm hakları saklıdır.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const MenuBtn: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        <span className="font-bold text-sm">{label}</span>
    </button>
);

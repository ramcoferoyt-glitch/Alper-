
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

type Tab = 'profile' | 'notifications' | 'account';

export const ProfileModal: React.FC = () => {
    const { isProfileModalOpen, setIsProfileModalOpen, userProfile, updateUserProfile } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    
    // Form state
    const [name, setName] = useState(userProfile.name);
    const [email, setEmail] = useState(userProfile.email);
    const [phone, setPhone] = useState(userProfile.phone || '');
    const [role, setRole] = useState(userProfile.role);
    const [bio, setBio] = useState(userProfile.bio);
    
    // Preferences
    const [allowBackground, setAllowBackground] = useState(userProfile.preferences?.allowBackgroundProcessing ?? false);
    const [dailyBriefing, setDailyBriefing] = useState(userProfile.preferences?.dailyBriefing ?? false);
    const [notifyEmail, setNotifyEmail] = useState(userProfile.preferences?.notifications?.email ?? false);
    const [notifySms, setNotifySms] = useState(userProfile.preferences?.notifications?.sms ?? false);

    // Sync state when modal opens
    useEffect(() => {
        if (isProfileModalOpen) {
            setName(userProfile.name);
            setEmail(userProfile.email);
            setPhone(userProfile.phone || '');
            setRole(userProfile.role);
            setBio(userProfile.bio);
            setAllowBackground(userProfile.preferences?.allowBackgroundProcessing ?? false);
            setDailyBriefing(userProfile.preferences?.dailyBriefing ?? false);
            setNotifyEmail(userProfile.preferences?.notifications?.email ?? false);
            setNotifySms(userProfile.preferences?.notifications?.sms ?? false);
        }
    }, [isProfileModalOpen, userProfile]);

    const handleSave = () => {
        updateUserProfile({ 
            name, 
            email, 
            phone,
            role, 
            bio,
            preferences: {
                allowBackgroundProcessing: allowBackground,
                dailyBriefing: dailyBriefing,
                notifications: {
                    email: notifyEmail,
                    sms: notifySms,
                    push: true
                },
                theme: 'dark'
            }
        });
        setIsProfileModalOpen(false);
    };

    if (!isProfileModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-fadeIn">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-800 flex flex-col overflow-hidden animate-scaleUp h-[80vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2 rounded-full">manage_accounts</span>
                        Alper Kontrol Merkezi
                    </h2>
                    <button 
                        onClick={() => setIsProfileModalOpen(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex h-full overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-1/3 bg-gray-900/50 border-r border-gray-800 p-4 space-y-2">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">person</span>
                            <span className="text-sm font-bold">Kimlik & Profil</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('account')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'account' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            <span className="text-sm font-bold">Hesap & Güvenlik</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">notifications_active</span>
                            <span className="text-sm font-bold">Bildirimler</span>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="w-2/3 p-8 overflow-y-auto custom-scrollbar bg-black/20">
                        
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-gray-800">
                                        {name ? name.charAt(0).toUpperCase() : 'M'}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400">Profil Resmi</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ad Soyad</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unvan / Meslek</label>
                                    <input 
                                        type="text" 
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Örn: Mimar, Öğrenci..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Biyografi</label>
                                    <textarea 
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                                        placeholder="Alper sizi nasıl tanısın?"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <h3 className="text-white font-bold text-lg mb-4">İletişim Bilgileri</h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-Posta Adresi</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="email@ornek.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Telefon Numarası</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="+90 5XX XXX XX XX"
                                    />
                                </div>
                                <div className="pt-4 border-t border-gray-800">
                                    <h4 className="text-sm font-bold text-red-400 mb-2">Hesap İşlemleri</h4>
                                    <button className="text-xs text-red-500 hover:text-red-400 underline">Hesabımı Sil</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-yellow-500">settings_motion_mode</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Arka Plan İşlemleri</h4>
                                                <p className="text-xs text-gray-400">Alper uygulamadan çıktığınızda da çalışsın.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={allowBackground} onChange={(e) => setAllowBackground(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">* Araştırma, piyasa takibi ve randevu hatırlatmaları için gereklidir.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-white font-bold text-sm">Bildirim Tercihleri</h3>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-300">Günlük E-Posta Özeti</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-300">SMS Uyarıları (Acil)</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <span className="text-sm text-gray-300">Günlük Brifing (Sabah 08:00)</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={dailyBriefing} onChange={(e) => setDailyBriefing(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsProfileModalOpen(false)}
                        className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors font-medium text-sm"
                    >
                        Vazgeç
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all text-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

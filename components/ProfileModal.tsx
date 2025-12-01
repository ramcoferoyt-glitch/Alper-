
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-[#0f0f0f] rounded-3xl shadow-2xl w-full max-w-2xl border border-white/10 flex flex-col overflow-hidden animate-scaleUp h-[85vh] max-h-[800px]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-gray-900 to-black">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-full border border-amber-500/20">shield_person</span>
                        Alper Kimlik Kartı
                    </h2>
                    <button 
                        onClick={() => setIsProfileModalOpen(false)}
                        className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row h-full overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-full sm:w-1/3 bg-black/40 border-b sm:border-b-0 sm:border-r border-white/5 p-4 space-x-2 sm:space-x-0 sm:space-y-2 flex sm:flex-col overflow-x-auto sm:overflow-visible">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex-shrink-0 w-auto sm:w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">person</span>
                            <span className="text-sm font-bold">Kimlik</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('account')}
                            className={`flex-shrink-0 w-auto sm:w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'account' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            <span className="text-sm font-bold">Güvenlik</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-shrink-0 w-auto sm:w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'notifications' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">notifications_active</span>
                            <span className="text-sm font-bold">Bildirimler</span>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="w-full sm:w-2/3 p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-black/20">
                        
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4 border-[#1a1a1a] ring-1 ring-white/10">
                                        {name ? name.charAt(0).toUpperCase() : 'M'}
                                    </div>
                                    <p className="mt-3 text-xs text-gray-400 uppercase tracking-widest font-bold">Profil Resmi</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Ad Soyad</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder-gray-700"
                                        placeholder="İsminiz..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Unvan / Meslek</label>
                                    <input 
                                        type="text" 
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder-gray-700"
                                        placeholder="Örn: Mimar, Öğrenci..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Biyografi</label>
                                    <textarea 
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full h-24 bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none text-sm placeholder-gray-700"
                                        placeholder="Alper sizi nasıl tanısın?"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                                    <h4 className="text-blue-200 text-sm font-bold flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">lock</span>
                                        Veri Güvenliği Garantisi
                                    </h4>
                                    <p className="text-xs text-blue-300/70 leading-relaxed">
                                        Bu uygulama "Yerel Kasa" teknolojisi kullanır. Girdiğiniz bilgiler, telefon numaraları ve e-postalar <strong>asla sunucularımıza yüklenmez</strong>. Sadece bu cihazın hafızasında şifreli olarak tutulur.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">E-Posta Adresi</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                                        placeholder="email@ornek.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Telefon Numarası</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                                        placeholder="+90 5XX XXX XX XX"
                                    />
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <button className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                                        Tüm Verilerimi Sil ve Sıfırla
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-[#111] p-4 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-amber-500">settings_motion_mode</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Arka Plan İşlemleri</h4>
                                                <p className="text-xs text-gray-400">Alper uygulamadan çıktığınızda da çalışsın.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={allowBackground} onChange={(e) => setAllowBackground(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wide opacity-50">Bildirim Kanalları</h3>
                                    
                                    <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-white/5">
                                        <span className="text-sm text-gray-300">Günlük E-Posta Özeti</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-white/5">
                                        <span className="text-sm text-gray-300">SMS Uyarıları (Acil)</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0f0f0f] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        Verileriniz 256-bit mantıksal şifreleme ile korunmaktadır.
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => setIsProfileModalOpen(false)}
                            className="flex-1 sm:flex-none px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm"
                        >
                            Vazgeç
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 sm:flex-none px-8 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all text-sm flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                            <span className="material-symbols-outlined text-lg">save</span>
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

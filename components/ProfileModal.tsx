
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export const ProfileModal: React.FC = () => {
    const { isProfileModalOpen, setIsProfileModalOpen, userProfile, updateUserProfile } = useAppContext();
    
    // Form state
    const [name, setName] = useState(userProfile.name);
    const [email, setEmail] = useState(userProfile.email);
    const [role, setRole] = useState(userProfile.role);
    const [bio, setBio] = useState(userProfile.bio);

    // Sync state when modal opens
    useEffect(() => {
        if (isProfileModalOpen) {
            setName(userProfile.name);
            setEmail(userProfile.email);
            setRole(userProfile.role);
            setBio(userProfile.bio);
        }
    }, [isProfileModalOpen, userProfile]);

    const handleSave = () => {
        updateUserProfile({ name, email, role, bio });
        setIsProfileModalOpen(false);
    };

    if (!isProfileModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-fadeIn">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-800 flex flex-col overflow-hidden animate-scaleUp">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2 rounded-full">person</span>
                        Profil Ayarları
                    </h2>
                    <button 
                        onClick={() => setIsProfileModalOpen(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    
                    {/* Avatar Placeholder */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-gray-800">
                            {name ? name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <p className="mt-3 text-sm text-gray-400">Profil Resmi</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ad Soyad</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Adınız"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unvan / Meslek</label>
                                <input 
                                    type="text" 
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Örn: Tasarımcı"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-Posta</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                placeholder="email@ornek.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Biyografi (Alper sizi tanısın)</label>
                            <textarea 
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                                placeholder="Kendinizden, hedeflerinizden veya ilgi alanlarınızdan bahsedin..."
                            ></textarea>
                        </div>
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
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all text-sm"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

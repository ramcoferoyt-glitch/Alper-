
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useAppContext } from '../context/AppContext';

export const MemoryInterface: React.FC = () => {
    const { savedSessions, deleteSession, loadSessionToChat, userProfile } = useAppContext();

    return (
        <div className="flex flex-col h-full bg-[#0d1117] relative font-sans">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400">database</span>
                        Veri Bellek (Hafıza)
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Alper'in sizin hakkınızda bildiği her şey ve geçmiş oturumlar.
                    </p>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <span className="text-xs text-gray-400 uppercase font-bold">Kapasite</span>
                    <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500 w-[15%]"></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-grow overflow-hidden">
                {/* User Data Summary */}
                <div className="w-1/3 bg-gray-900/50 border-r border-gray-800 p-6 overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-300 uppercase mb-4">Kullanıcı Verileri</h3>
                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">Kimlik</span>
                            <p className="text-white font-bold">{userProfile.name}</p>
                            <p className="text-sm text-gray-400">{userProfile.role}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">Biyografi</span>
                            <p className="text-sm text-gray-300 italic">"{userProfile.bio || 'Henüz girilmedi.'}"</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <span className="text-xs text-gray-500 block mb-1">Tercihler</span>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {userProfile.preferences?.dailyBriefing && <span className="bg-purple-900/50 text-purple-300 text-[10px] px-2 py-1 rounded border border-purple-700">Günlük Brifing</span>}
                                {userProfile.preferences?.allowBackgroundProcessing && <span className="bg-green-900/50 text-green-300 text-[10px] px-2 py-1 rounded border border-green-700">Arka Plan İzni</span>}
                                {!userProfile.preferences?.dailyBriefing && !userProfile.preferences?.allowBackgroundProcessing && <span className="text-xs text-gray-500">Özel tercih yok.</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session List */}
                <div className="w-2/3 p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-bold text-gray-300 uppercase mb-4 flex justify-between">
                        <span>Geçmiş Oturumlar</span>
                        <span className="text-xs text-gray-500">{savedSessions.length} Kayıt</span>
                    </h3>

                    <div className="space-y-3">
                        {savedSessions.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                                <p>Henüz kaydedilmiş sohbet yok.</p>
                            </div>
                        ) : (
                            savedSessions.map(session => (
                                <div key={session.id} className="bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 rounded-xl p-4 transition-all group flex justify-between items-center">
                                    <div className="flex-grow cursor-pointer" onClick={() => loadSessionToChat(session.id)}>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                session.mode === 'lawyer' ? 'bg-red-900 text-red-200' :
                                                session.mode === 'psychologist' ? 'bg-teal-900 text-teal-200' :
                                                session.mode === 'finance' ? 'bg-green-900 text-green-200' :
                                                'bg-blue-900 text-blue-200'
                                            }`}>
                                                {session.mode}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {new Date(session.date).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                        <h4 className="text-white font-bold text-sm mb-1">{session.title}</h4>
                                        <p className="text-xs text-gray-400 line-clamp-1">{session.preview}</p>
                                    </div>
                                    <button 
                                        onClick={() => deleteSession(session.id)}
                                        className="text-gray-600 hover:text-red-400 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Sil"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

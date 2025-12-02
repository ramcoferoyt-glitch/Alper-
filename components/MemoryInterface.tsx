
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useAppContext } from '../context/AppContext';

export const MemoryInterface: React.FC = () => {
    const { savedSessions, deleteSession, loadSessionToChat, userProfile, learnedKnowledge } = useAppContext();

    return (
        <div className="flex flex-col h-full bg-[#050505] relative font-sans">
            {/* Header with Premium Look */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#0a0a0a] to-[#111] flex items-center justify-between shadow-xl z-20">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">database</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-600">
                            Veri Bellek
                        </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
                        Kişisel Veri Kasası & Sohbet Geçmişi
                    </p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Kasa Durumu</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                        <span className="text-xs font-bold text-green-400">Aktif & Şifreli</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
                {/* User Data Summary & Learned Facts */}
                <div className="w-full lg:w-1/3 bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-white/5 p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-extrabold text-gray-500 uppercase mb-6 tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">fingerprint</span>
                        Kullanıcı Kimliği
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Ad Soyad</span>
                            <p className="text-white font-bold text-lg">{userProfile.name || 'Misafir Kullanıcı'}</p>
                            <p className="text-sm text-gray-400 mt-1">{userProfile.role || 'Tanımsız Rol'}</p>
                        </div>

                        {/* LEARNED FACTS */}
                        <div className="bg-gray-900/50 p-5 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-gray-500 block mb-3 uppercase font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-purple-400">psychology</span>
                                Alper'in Öğrendikleri
                            </span>
                            {learnedKnowledge && learnedKnowledge.length > 0 ? (
                                <div className="space-y-2">
                                    {learnedKnowledge.slice(0, 5).map(item => (
                                        <div key={item.id} className="text-xs bg-black/40 p-2 rounded-lg border border-white/5 flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[10px] text-amber-500 mt-0.5">lightbulb</span>
                                            <span className="text-gray-300">{item.fact}</span>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-gray-600 text-center pt-2">
                                        Toplam {learnedKnowledge.length} bilgi parçacığı.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">Henüz yeterince sohbet edilmediği için analiz yapılmadı.</p>
                            )}
                        </div>

                        {/* Privacy Guarantee Badge */}
                        <div className="mt-8 p-5 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                            <span className="material-symbols-outlined text-blue-400 text-2xl">verified_user</span>
                            <div>
                                <h4 className="text-sm font-bold text-blue-200 mb-1">Gizlilik Garantisi</h4>
                                <p className="text-xs text-blue-300/70 leading-relaxed">
                                    Verileriniz sadece bu cihazda, tarayıcınızın <strong>Güvenli Yerel Depolama (IndexedDB)</strong> alanında saklanır. Hiçbir sunucuya yüklenmez, üçüncü şahıslarla paylaşılmaz ve geliştirici tarafından görüntülenemez.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session List */}
                <div className="w-full lg:w-2/3 p-4 lg:p-8 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
                    <h3 className="text-xs font-extrabold text-gray-500 uppercase mb-6 tracking-widest flex justify-between items-center px-2">
                        <span>Geçmiş Oturumlar</span>
                        <span className="bg-white/10 text-white px-2 py-1 rounded text-[10px]">{savedSessions.length} Kayıt</span>
                    </h3>

                    <div className="space-y-4 pb-24">
                        {savedSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl">
                                <span className="material-symbols-outlined text-5xl mb-4 opacity-50">history_edu</span>
                                <p className="font-medium">Henüz kaydedilmiş sohbet yok.</p>
                                <p className="text-sm opacity-50 mt-1">Sohbet ettikçe burası otomatik dolacaktır.</p>
                            </div>
                        ) : (
                            savedSessions.map(session => (
                                <div 
                                    key={session.id} 
                                    className="group relative bg-[#111] hover:bg-[#161616] border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-amber-900/10 cursor-pointer"
                                    onClick={() => loadSessionToChat(session.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-inner ${
                                                session.mode === 'lawyer' ? 'bg-red-900/40 text-red-200 border border-red-800/50' :
                                                session.mode === 'psychologist' ? 'bg-teal-900/40 text-teal-200 border border-teal-800/50' :
                                                session.mode === 'finance' ? 'bg-green-900/40 text-green-200 border border-green-800/50' :
                                                session.mode === 'consultant' ? 'bg-amber-900/40 text-amber-200 border border-amber-800/50' :
                                                'bg-blue-900/40 text-blue-200 border border-blue-800/50'
                                            }`}>
                                                {session.mode === 'chat' ? 'Genel Sohbet' : session.mode.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                {new Date(session.date).toLocaleDateString('tr-TR')} • {new Date(session.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                            className="text-gray-600 hover:text-red-400 p-2 rounded-full hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 z-10"
                                            title="Bu sohbeti kalıcı olarak sil"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                    
                                    <h4 className="text-white font-bold text-base mb-2 group-hover:text-amber-400 transition-colors line-clamp-1 pr-8">
                                        {session.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {session.preview}
                                    </p>
                                    
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500/50 group-hover:text-amber-500 transition-colors uppercase tracking-widest">
                                        <span>Devam Et</span>
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

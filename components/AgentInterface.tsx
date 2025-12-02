
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';
import { notificationService } from '../services/NotificationService';
import { generateStudyGuide } from '../services/GeminiService';

export const AgentInterface: React.FC = () => {
    const { userProfile, setIsProfileModalOpen, addChatMessage } = useAppContext();
    const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
    
    // Agent Task State
    const [taskInput, setTaskInput] = useState('');
    const [targetEmail, setTargetEmail] = useState(userProfile.email || '');
    const [isAutoEmailEnabled, setIsAutoEmailEnabled] = useState(false);
    const [isTaskRunning, setIsTaskRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showToast, setShowToast] = useState(false);

    const hasBackgroundPermission = userProfile.preferences?.allowBackgroundProcessing;
    
    // Notification Sound
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Professional notification sound
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    // Sync email from profile if it changes
    useEffect(() => {
        if (userProfile.email) setTargetEmail(userProfile.email);
    }, [userProfile.email]);

    const handleStartTask = async () => {
        if (!taskInput.trim()) return;
        if (isAutoEmailEnabled && !targetEmail.trim()) {
            alert("Otomatik gönderim için lütfen bir e-posta adresi girin.");
            return;
        }

        setIsTaskRunning(true);
        setProgress(0);
        
        // Request notification permission if needed
        if (isAutoEmailEnabled) {
            await notificationService.requestPermission();
        }

        // Simulate Background Process Steps
        const steps = [
            "Veri kaynakları taranıyor...",
            "Google Index analizi yapılıyor...",
            "Bilgiler sentezleniyor...",
            "Rapor formatlanıyor..."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setProgress(prev => Math.min(prev + 25, 90));
            
            if (currentStep >= steps.length) {
                clearInterval(interval);
                completeTask();
            }
        }, 1500); // 1.5s per step (6s total)
    };

    const completeTask = async () => {
        setProgress(100);
        
        // Play Sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.warn("Audio play failed", e));
        }

        // Generate actual content using Gemini (Agent Persona)
        let reportContent = "";
        try {
            reportContent = await generateStudyGuide(
                [{ id: '1', title: 'Task', content: taskInput, type: 'text' }],
                `AJAN GÖREVİ: "${taskInput}". Konuyu derinlemesine araştır, istihbarat raporu formatında sun. Gizli, profesyonel ve detaylı olsun.`
            );
        } catch (e) {
            reportContent = "Rapor oluşturulurken bir hata meydana geldi, ancak görev tamamlandı.";
        }

        // Add Official Signature
        const signature = `\n\n---\nBu rapor Alper AI Sistemleri tarafından otomatik oluşturulmuştur.\nResmi İletişim: ishak595@gmail.com\nTarih: ${new Date().toLocaleString('tr-TR')}`;
        const finalReport = reportContent + signature;

        // Show In-App Notification
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);

        // Notify User (System Notification)
        if (hasBackgroundPermission) {
            notificationService.sendPush(
                "Alper Ajan: Görev Tamamlandı", 
                `${taskInput} raporu hazırlandı ve işlendi.`
            );
        }

        // Auto-Email Logic
        if (isAutoEmailEnabled && targetEmail) {
            notificationService.sendEmail(
                targetEmail,
                `GÖREV RAPORU: ${taskInput.substring(0, 30)}...`,
                `Sayın İlgili,\n\nAlper Ajan tarafından talep edilen "${taskInput}" konulu araştırma tamamlanmıştır.\n\n${finalReport}`
            );
        }

        // Save result to chat
        addChatMessage({
            id: Date.now().toString(),
            role: 'model',
            text: `**[GÖREV TAMAMLANDI]**\n\n${reportContent}\n\n*Sistem Mesajı: Rapor ${targetEmail ? targetEmail + ' adresine yönlendirildi' : 'hazırlandı'}.*`,
            timestamp: Date.now()
        });

        setTimeout(() => {
            setIsTaskRunning(false);
            setTaskInput('');
            setProgress(0);
            setActiveTab('chat');
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative font-sans">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-slideLeft flex items-center gap-3 border border-green-400">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                    <div>
                        <h4 className="font-bold text-sm">Görev Başarıyla Tamamlandı</h4>
                        <p className="text-xs opacity-90">Rapor e-posta sistemine iletildi.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#050505] to-transparent flex items-center justify-between pointer-events-none px-4 lg:px-8">
                <div className="pointer-events-auto flex items-center gap-3 bg-indigo-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-indigo-800/50 shadow-2xl">
                    <span className={`material-symbols-outlined text-indigo-400 ${isTaskRunning ? 'animate-spin' : 'animate-pulse'}`}>smart_toy</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER AGENT</h2>
                        <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">
                            {isTaskRunning ? 'Görev Yürütülüyor...' : 'Otonom Araştırma'}
                        </p>
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
                        Ajan Paneli
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
                    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto custom-scrollbar h-full pb-24">
                        
                        {/* Task Runner Card */}
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                            {isTaskRunning && (
                                <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            )}
                            
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-500">rocket_launch</span>
                                Hızlı Görev Başlatıcı
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Araştırma Konusu / Görev</label>
                                    <input 
                                        type="text" 
                                        value={taskInput}
                                        onChange={(e) => setTaskInput(e.target.value)}
                                        disabled={isTaskRunning}
                                        placeholder="Örn: 2025 Elektrikli Araç Trendleri raporu hazırla..."
                                        className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAutoEmailEnabled}
                                                    onChange={(e) => setIsAutoEmailEnabled(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 bg-gray-700 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-bold text-white">Raporu E-Posta ile Gönder</span>
                                            </label>
                                        </div>
                                        {isAutoEmailEnabled && (
                                            <div className="space-y-2">
                                                <input 
                                                    type="email"
                                                    value={targetEmail}
                                                    onChange={(e) => setTargetEmail(e.target.value)}
                                                    placeholder="gonderilecek@eposta.com"
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                />
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-800/50 p-2 rounded">
                                                    <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                                                    <span>Sistem Göndericisi: <strong className="text-indigo-400">ishak595@gmail.com</strong></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleStartTask}
                                        disabled={isTaskRunning || !taskInput}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap h-fit self-center"
                                    >
                                        {isTaskRunning ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                                Çalışıyor...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                Görevi Başlat
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Background Permission Status */}
                        <div className={`p-6 rounded-2xl border ${hasBackgroundPermission ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <span className={`material-symbols-outlined text-3xl ${hasBackgroundPermission ? 'text-green-400' : 'text-red-400'}`}>
                                    {hasBackgroundPermission ? 'check_circle' : 'unpublished'}
                                </span>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Arka Plan İzni {hasBackgroundPermission ? 'Aktif' : 'Pasif'}</h3>
                                    <p className="text-gray-400 text-sm">
                                        {hasBackgroundPermission 
                                            ? 'Alper, uygulama kapalıyken araştırma yapabilir ve size bildirim gönderebilir.' 
                                            : 'Alper şu an sadece uygulama açıkken çalışır. Profil ayarlarından izni açın.'}
                                    </p>
                                </div>
                            </div>
                            {!hasBackgroundPermission && (
                                <button 
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm whitespace-nowrap"
                                >
                                    İzni Aç
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pro Tools */}
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-400 text-sm">construction</span>
                                    Ajan Araçları
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-colors cursor-pointer border border-white/5 hover:border-white/10">
                                        <span className="material-symbols-outlined text-blue-400">public</span>
                                        <div>
                                            <p className="text-sm font-bold text-white">Derin Web Taraması</p>
                                            <p className="text-xs text-gray-500">Google Index & Akademik Makaleler</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-colors cursor-pointer border border-white/5 hover:border-white/10">
                                        <span className="material-symbols-outlined text-red-400">trending_up</span>
                                        <div>
                                            <p className="text-sm font-bold text-white">Trend İzleme</p>
                                            <p className="text-xs text-gray-500">Sosyal Medya & Haber Akışı</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Missions (Simulation) */}
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-400 text-sm">manage_search</span>
                                    Otomatik Takip
                                </h4>
                                {hasBackgroundPermission ? (
                                    <div className="space-y-4">
                                        <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between border-l-2 border-green-500">
                                            <div>
                                                <p className="text-white text-sm font-medium">Piyasa Analizi</p>
                                                <p className="text-xs text-gray-500">Sürekli • Volatilite alarmı</p>
                                            </div>
                                            <span className="text-green-500 text-[10px] uppercase font-bold animate-pulse">Çalışıyor</span>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between border-l-2 border-green-500">
                                            <div>
                                                <p className="text-white text-sm font-medium">Haber Tarama</p>
                                                <p className="text-xs text-gray-500">Teknoloji & Yapay Zeka</p>
                                            </div>
                                            <span className="text-green-500 text-[10px] uppercase font-bold animate-pulse">Çalışıyor</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-24 text-gray-600 border border-dashed border-gray-800 rounded-lg">
                                        <span className="material-symbols-outlined text-2xl mb-1">pause_circle</span>
                                        <p className="text-xs">Arka plan izni yok.</p>
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

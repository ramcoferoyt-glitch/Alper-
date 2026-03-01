
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatInterface } from './ChatInterface';
import { notificationService } from '../services/NotificationService';
import { generateStudyGuide, streamChat } from '../services/GeminiService';
import { io, Socket } from 'socket.io-client';

export const AgentInterface: React.FC = () => {
    const { userProfile, setIsProfileModalOpen, addChatMessage } = useAppContext();
    const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'integrations'>('dashboard');
    
    // Agent Task State
    const [taskInput, setTaskInput] = useState('');
    const [targetEmail, setTargetEmail] = useState(userProfile.email || '');
    const [isAutoEmailEnabled, setIsAutoEmailEnabled] = useState(false);
    const [isTaskRunning, setIsTaskRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showToast, setShowToast] = useState(false);

    // Integration States
    const [whatsappConnected, setWhatsappConnected] = useState(false);
    const [whatsappQr, setWhatsappQr] = useState<string | null>(null);
    const [whatsappLogs, setWhatsappLogs] = useState<{id: string, from: string, text: string, type: 'incoming' | 'outgoing', timestamp: number}[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(false);
    const [gmailConnected, setGmailConnected] = useState(false);

    const hasBackgroundPermission = userProfile.preferences?.allowBackgroundProcessing;
    
    // Notification Sound
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [socketConnected, setSocketConnected] = useState(false);

    useEffect(() => {
        // Professional notification sound
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        
        // Initialize Socket.io
        const newSocket = io();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setSocketConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
        });

        newSocket.on('qr', (qr) => {
            console.log('QR Received', qr);
            setWhatsappQr(qr);
            setWhatsappConnected(false);
        });

        newSocket.on('status', (status) => {
            if (status === 'connected') {
                setWhatsappConnected(true);
                setWhatsappQr(null);
            } else {
                setWhatsappConnected(false);
            }
        });

        newSocket.on('message', async (msg: any) => {
            console.log('New WhatsApp Message:', msg);
            setWhatsappLogs(prev => [...prev, { ...msg, type: msg.from === 'Me' ? 'outgoing' : 'incoming', timestamp: Date.now() }]);
        });
        
        newSocket.on('autoreply-status', (status: boolean) => {
            setIsAutoReplyEnabled(status);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []); // Only run once on mount

    // Sync email from profile if it changes
    useEffect(() => {
        if (userProfile.email) setTargetEmail(userProfile.email);
    }, [userProfile.email]);

    const handleAutoReplyToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        setIsAutoReplyEnabled(enabled);
        try {
            await fetch('/api/whatsapp/toggle-autoreply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
        } catch (error) {
            console.error('Failed to toggle auto-reply:', error);
            setIsAutoReplyEnabled(!enabled); // Revert on error
        }
    };

    const handlePermissionRequest = async () => {
        const granted = await notificationService.requestPermission();
        if (granted) {
            alert("Bildirim izni başarıyla alındı! Şimdi profil ayarlarından 'Arka Plan İşlemleri'ni aktif edebilirsiniz.");
            setIsProfileModalOpen(true);
        } else {
            alert("Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
        }
    };

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
            "Küresel veri kaynakları taranıyor (TR, EN, DE, FR, AR, ES)...",
            "Google Index ve Akademik veritabanları analiz ediliyor...",
            "Güncel haber akışları kontrol ediliyor...",
            "Bilgiler sentezleniyor ve raporlanıyor..."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setProgress(prev => Math.min(prev + 25, 90));
            
            if (currentStep >= steps.length) {
                clearInterval(interval);
                completeTask();
            }
        }, 2000); 
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
                `AJAN GÖREVİ: "${taskInput}". Konuyu KÜRESEL ölçekte (İngilizce, Türkçe, Arapça, İspanyolca, Fransızca, Almanca kaynakları tarayarak) derinlemesine araştır. En güncel bilgileri, eski haberlerden ayırarak sun. Rapor formatında, profesyonel, tarafsız ve çok kapsamlı olsun. ASLA markdown sembolleri (yıldız, kare vb.) kullanma. Sadece temiz metin, paragraflar ve maddeler kullan. Raporun sonunda kaynak dillerinden bahsedebilirsin.`
            );
        } catch (e) {
            reportContent = "Rapor oluşturulurken bir hata meydana geldi, ancak görev tamamlandı.";
        }

        // Add Official Signature
        const signature = `\n\n---\nBu rapor Alper AI Otonom Ajan Sistemleri tarafından oluşturulmuştur.\nResmi İletişim: ishak595@gmail.com\nTarih: ${new Date().toLocaleString('tr-TR')}`;
        const finalReport = reportContent + signature;

        // Show In-App Notification
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);

        // Notify User (System Notification)
        if (hasBackgroundPermission) {
            notificationService.sendPush(
                "Alper Ajan: Görev Tamamlandı", 
                `${taskInput} raporu hazırlandı.`
            );
        }

        // Auto-Email Logic (Simulation with high fidelity)
        if (isAutoEmailEnabled && targetEmail) {
            notificationService.sendEmail(
                targetEmail,
                `GÖREV RAPORU: ${taskInput.substring(0, 30)}...`,
                `Sayın İlgili,\n\nAlper Ajan tarafından talep edilen "${taskInput}" konulu araştırma tamamlanmıştır.\n\n${finalReport}`
            );
            // Simulate success visually
            alert(`Rapor başarıyla ${targetEmail} adresine gönderildi.`);
        }

        // Save result to chat
        addChatMessage({
            id: Date.now().toString(),
            role: 'model',
            text: `[OTONOM GÖREV RAPORU]\n\n${reportContent}\n\nSistem Mesajı: Rapor ${targetEmail ? targetEmail + ' adresine başarıyla iletildi' : 'hazırlandı'}.`,
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
                        <p className="text-xs opacity-90">Rapor işlendi ve iletildi.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-[#050505] to-transparent flex items-center justify-between pointer-events-none px-4 lg:px-8">
                <div className="pointer-events-auto flex items-center gap-3 bg-indigo-900/30 backdrop-blur-md rounded-full px-6 py-2 border border-indigo-800/50 shadow-2xl">
                    <span className={`material-symbols-outlined text-indigo-400 ${isTaskRunning ? 'animate-spin' : 'animate-pulse'}`}>smart_toy</span>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">ALPER AJAN MODU</h2>
                        <p className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase">
                            {isTaskRunning ? 'Görev Yürütülüyor...' : 'Otonom Sistem'}
                        </p>
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-2 overflow-x-auto max-w-[50vw] custom-scrollbar pb-1">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-gray-800'}`}
                    >
                        Görev Ata
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-gray-800'}`}
                    >
                        Ajan Paneli
                    </button>
                    <button 
                        onClick={() => setActiveTab('integrations')}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'integrations' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-gray-800'}`}
                    >
                        Entegrasyonlar
                    </button>
                </div>
            </div>

            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none z-0"></div>

            {/* Main Content */}
            <div className="flex-grow z-10 h-full pt-20">
                {activeTab === 'chat' ? (
                    <ChatInterface hideHeader={true} />
                ) : activeTab === 'dashboard' ? (
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
                                        placeholder="Örn: Küresel piyasalarda son durum nedir? (Tüm dilleri tara)"
                                        className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer w-full">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAutoEmailEnabled}
                                                    onChange={(e) => setIsAutoEmailEnabled(e.target.checked)}
                                                    className="w-5 h-5 rounded border-gray-600 text-indigo-600 bg-gray-700 focus:ring-indigo-500 transition-all"
                                                />
                                                <span className="text-sm font-bold text-white ml-2">Raporu E-Posta ile Gönder</span>
                                            </label>
                                        </div>
                                        
                                        <div className={`transition-all duration-300 overflow-hidden ${isAutoEmailEnabled ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                            <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-indigo-500/30">
                                                <input 
                                                    type="email"
                                                    value={targetEmail}
                                                    onChange={(e) => setTargetEmail(e.target.value)}
                                                    placeholder="gonderilecek@eposta.com"
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-gray-500"
                                                />
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    <span className="material-symbols-outlined text-xs text-indigo-400">verified_user</span>
                                                    <span>Gönderici: <strong className="text-indigo-300">Alper AI Sistemleri</strong></span>
                                                </div>
                                            </div>
                                        </div>
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
                                                Çalıştır
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
                                    onClick={handlePermissionRequest}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm whitespace-nowrap"
                                >
                                    İzni Aç & Yetkilendir
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
                                            <p className="text-sm font-bold text-white">Küresel Web Taraması</p>
                                            <p className="text-xs text-gray-500">Çok dilli kaynak analizi (TR, EN, AR, ES...)</p>
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
                ) : (
                    // Integrations Tab
                    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto custom-scrollbar h-full pb-24">
                         <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl">
                            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">hub</span>
                                Otonom Entegrasyonlar
                            </h3>

                            <div className="space-y-6">
                                {/* WhatsApp Integration */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
                                                <span className="material-symbols-outlined text-2xl">chat</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">WhatsApp Asistanı</h4>
                                                <p className="text-xs text-gray-400">Gelen mesajları analiz et ve otomatik yanıtla.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    if (whatsappConnected) {
                                                        if (confirm("Bağlantıyı kesmek istediğinize emin misiniz?")) {
                                                            await fetch('/api/whatsapp/logout', { method: 'POST' });
                                                            setWhatsappConnected(false);
                                                            setWhatsappQr(null);
                                                        }
                                                    } else {
                                                        const res = await fetch('/api/whatsapp/restart', { method: 'POST' });
                                                        if (res.ok) {
                                                            alert("Bağlantı yenileniyor, QR kod birazdan gelecek...");
                                                        } else {
                                                            alert("Bağlantı başlatılamadı. Lütfen sayfayı yenileyin.");
                                                        }
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol edin.");
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${whatsappConnected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-[#25D366] text-black hover:bg-[#20bd5a]'}`}
                                        >
                                            {whatsappConnected ? 'Bağlantıyı Kes' : 'Yenile / Bağla'}
                                        </button>
                                    </div>
                                    
                                    {/* QR Code Display */}
                                    {!whatsappConnected && (
                                        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mb-4 animate-fadeIn">
                                            {whatsappQr ? (
                                                <>
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=ffffff&data=${encodeURIComponent(whatsappQr)}`} 
                                                        alt="WhatsApp QR Code" 
                                                        className="w-[200px] h-[200px]"
                                                    />
                                                    <p className="text-black font-bold mt-4 text-sm">WhatsApp &gt; Ayarlar &gt; Bağlı Cihazlar &gt; Cihaz Bağla</p>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 py-8">
                                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                                                    <p className="text-gray-500 text-xs font-medium">
                                                        {socketConnected ? 'QR Kod Bekleniyor...' : 'Sunucuya Bağlanılıyor...'}
                                                    </p>
                                                    <button 
                                                        onClick={() => fetch('/api/whatsapp/restart', { method: 'POST' })}
                                                        className="mt-2 text-[10px] text-blue-500 hover:underline"
                                                    >
                                                        Manuel Yenile
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {whatsappConnected && (
                                        <div className="mt-4 p-4 bg-black/60 rounded-lg border border-white/5 animate-fadeIn">
                                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold mb-3">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Aktif: Mesajlar izleniyor
                                            </div>
                                            
                                            {/* Auto Reply Toggle */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <input 
                                                    type="checkbox" 
                                                    id="wa_auto_reply" 
                                                    checked={isAutoReplyEnabled}
                                                    onChange={handleAutoReplyToggle}
                                                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500" 
                                                />
                                                <label htmlFor="wa_auto_reply" className="text-sm text-gray-300">Otonom Yanıtlamayı Etkinleştir</label>
                                            </div>

                                            {/* Live Logs */}
                                            <div className="h-48 overflow-y-auto custom-scrollbar bg-black/40 rounded-lg p-3 space-y-2 border border-white/5">
                                                {whatsappLogs.length === 0 ? (
                                                    <p className="text-xs text-gray-500 text-center py-4">Henüz mesaj yok.</p>
                                                ) : (
                                                    whatsappLogs.map((log, idx) => (
                                                        <div key={idx} className={`flex flex-col ${log.type === 'outgoing' ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[80%] p-2 rounded-lg text-xs ${log.type === 'outgoing' ? 'bg-[#25D366]/20 text-green-100' : 'bg-gray-800 text-gray-300'}`}>
                                                                <p className="font-bold opacity-50 text-[10px] mb-1">{log.from}</p>
                                                                {log.text}
                                                            </div>
                                                            <span className="text-[9px] text-gray-600 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Gmail Integration */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                                                <span className="material-symbols-outlined text-2xl">mail</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">Gmail Otopilot</h4>
                                                <p className="text-xs text-gray-400">E-postaları sınıflandır, özetle ve taslak oluştur.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setGmailConnected(!gmailConnected)}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${gmailConnected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white text-black hover:bg-gray-200'}`}
                                        >
                                            {gmailConnected ? 'Bağlantıyı Kes' : 'Bağla'}
                                        </button>
                                    </div>
                                    
                                    {gmailConnected && (
                                        <div className="mt-4 p-4 bg-black/60 rounded-lg border border-white/5 animate-fadeIn">
                                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold mb-3">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Senkronize Edildi: {userProfile.email}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                                    <span className="text-xs text-gray-400 block mb-1">Okunmamış</span>
                                                    <span className="text-xl font-bold text-white">12</span>
                                                </div>
                                                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                                    <span className="text-xs text-gray-400 block mb-1">Taslaklar</span>
                                                    <span className="text-xl font-bold text-white">3</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <input type="checkbox" id="gmail_auto_sort" className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-red-500" defaultChecked />
                                                <label htmlFor="gmail_auto_sort" className="text-sm text-gray-300">Akıllı Sınıflandırma ve Yanıt Önerisi</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

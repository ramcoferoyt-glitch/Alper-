
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppMode, ChatMessage, GeneratedMedia, NotebookSource, NotebookEntry, PsychologistSubMode, UserProfile, SavedSession } from '../types';
import { useAppStoreComplete } from '../hooks/useAppStore';
import { v4 as uuidv4 } from 'uuid';

interface AppUIState {
    mode: AppMode;
    setMode: React.Dispatch<React.SetStateAction<AppMode>>;
    chatHistory: ChatMessage[];
    addChatMessage: (message: ChatMessage) => void;
    clearChat: () => void;
    isChatProcessing: boolean;
    setIsChatProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    gallery: GeneratedMedia[];
    addToGallery: (media: GeneratedMedia) => void;
    userLocation: { latitude: number; longitude: number } | undefined;
    inputImageForVideo: string | null;
    setInputImageForVideo: React.Dispatch<React.SetStateAction<string | null>>;
    isYouTubeModalOpen: boolean;
    setIsYouTubeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    // Notebook State
    notebookSources: NotebookSource[];
    addNotebookSource: (source: NotebookSource) => void;
    removeNotebookSource: (id: string) => void;
    notebookEntries: NotebookEntry[];
    addNotebookEntry: (entry: NotebookEntry) => void;
    // Live Persona State
    livePersona: 'assistant' | 'psychologist';
    setLivePersona: React.Dispatch<React.SetStateAction<'assistant' | 'psychologist'>>;
    psychologistSubMode: PsychologistSubMode;
    setPsychologistSubMode: React.Dispatch<React.SetStateAction<PsychologistSubMode>>;
    // User Profile State
    userProfile: UserProfile;
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    // Memory State
    savedSessions: SavedSession[];
    currentSessionId: string | null;
    startNewSession: (initialMode?: AppMode) => void;
    deleteSession: (id: string) => void;
    loadSessionToChat: (id: string) => void;
}

export type AppContextType = ReturnType<typeof useAppStoreComplete> & AppUIState;

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    email: '',
    role: '',
    bio: '',
    avatar: '',
    preferences: {
        allowBackgroundProcessing: false,
        dailyBriefing: false,
        notifications: {
            email: false,
            sms: false,
            push: true
        },
        theme: 'dark'
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useAppStoreComplete();

    // Initialize chat and gallery state
    const [mode, setMode] = useState<AppMode>('chat');
    
    // User Profile (Load from LocalStorage)
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('alper_user_profile');
        return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('alper_user_profile', JSON.stringify(userProfile));
    }, [userProfile]);

    const updateUserProfile = (newProfile: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...newProfile }));
    };

    // Chat History & Session Management
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    // Initial Welcome Message - Premium Edition
    useEffect(() => {
        // Only set welcome if absolutely no history and no session loaded
        if (chatHistory.length === 0 && !currentSessionId) {
            setChatHistory([{
                id: 'welcome',
                role: 'model',
                text: `**Merhaba. Ben Alper.**
                
Sizin için tasarlanmış kişisel yapay zeka süper uygulamasına hoş geldiniz.

YETENEKLERİM:
• **Yaratıcı:** 4K Görsel, Sinematik Video, Kitap Yazarlığı.
• **Profesyonel:** Hukuk, Finans, Psikoloji ve İş Danışmanlığı.
• **Keşif:** Google Haritalar ile mekan rehberliği ve rota planlama.
• **Canlı:** Sesli ve görüntülü, duygusal zekaya sahip gerçek zamanlı sohbet.

Başlamak için menüden bir mod seçin veya buraya yazın.`,
                timestamp: Date.now()
            }]);
        }
    }, []);

    const [isChatProcessing, setIsChatProcessing] = useState(false);
    const [gallery, setGallery] = useState<GeneratedMedia[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
    const [inputImageForVideo, setInputImageForVideo] = useState<string | null>(null);
    const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
    
    // Notebook State
    const [notebookSources, setNotebookSources] = useState<NotebookSource[]>([]);
    const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);

    // Live Persona State
    const [livePersona, setLivePersona] = useState<'assistant' | 'psychologist'>('assistant');
    const [psychologistSubMode, setPsychologistSubMode] = useState<PsychologistSubMode>('therapy');

    // Memory State (Loaded from LocalStorage)
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
        try {
            const saved = localStorage.getItem('alper_chat_memory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Persist Saved Sessions
    useEffect(() => {
        localStorage.setItem('alper_chat_memory', JSON.stringify(savedSessions));
    }, [savedSessions]);

    // AUTO-SAVE LOGIC
    useEffect(() => {
        if (chatHistory.length <= 1) return;

        const timeoutId = setTimeout(() => {
            const lastMsg = chatHistory[chatHistory.length - 1];
            if (!lastMsg.text) return;

            const firstUserMsg = chatHistory.find(m => m.role === 'user');
            let title = firstUserMsg ? firstUserMsg.text.substring(0, 40) : 'Yeni Sohbet';
            if (title.length >= 40) title += '...';

            const preview = lastMsg.text.substring(0, 60) + '...';

            setSavedSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === currentSessionId);
                
                if (existingIndex !== -1 && currentSessionId) {
                    const updatedSessions = [...prev];
                    updatedSessions[existingIndex] = {
                        ...updatedSessions[existingIndex],
                        date: Date.now(),
                        preview,
                        messages: chatHistory,
                        title: prev[existingIndex].title === 'Yeni Sohbet' ? title : prev[existingIndex].title
                    };
                    const item = updatedSessions.splice(existingIndex, 1)[0];
                    updatedSessions.unshift(item);
                    return updatedSessions;
                } 
                
                if (currentSessionId) {
                     return [{
                        id: currentSessionId,
                        date: Date.now(),
                        mode: mode,
                        title,
                        preview,
                        messages: chatHistory
                    }, ...prev];
                }

                return prev;
            });
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [chatHistory, currentSessionId, mode]);

    const ensureSessionId = () => {
        if (!currentSessionId) {
            const newId = uuidv4();
            setCurrentSessionId(newId);
            return newId;
        }
        return currentSessionId;
    };

    const startNewSession = (initialMode: AppMode = 'chat') => {
        const newId = uuidv4();
        setCurrentSessionId(newId);
        setChatHistory([{
            id: 'welcome',
            role: 'model',
            text: `**Merhaba.** Yeni bir sohbet başlattım. Nasıl yardımcı olabilirim?`,
            timestamp: Date.now()
        }]);
        setMode(initialMode);
    };

    const deleteSession = (id: string) => {
        setSavedSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
            startNewSession();
        }
    };

    const loadSessionToChat = (id: string) => {
        const session = savedSessions.find(s => s.id === id);
        if (session) {
            setCurrentSessionId(session.id);
            setChatHistory(session.messages);
            setMode(session.mode); // This will trigger the UI switch in App.tsx
        }
    };

    const addChatMessage = (message: ChatMessage) => {
        ensureSessionId();
        setChatHistory(prev => [...prev, message]);
    };

    const clearChat = () => {
        startNewSession(mode);
    };

    const addToGallery = (media: GeneratedMedia) => {
        setGallery(prev => [media, ...prev]);
    };

    const addNotebookSource = (source: NotebookSource) => {
        setNotebookSources(prev => [...prev, source]);
    };

    const removeNotebookSource = (id: string) => {
        setNotebookSources(prev => prev.filter(s => s.id !== id));
    };

    const addNotebookEntry = (entry: NotebookEntry) => {
        setNotebookEntries(prev => [entry, ...prev]);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Geolocation access denied or failed.", error);
                }
            );
        }
    }, []);

    const contextValue: AppContextType = {
        ...store,
        mode,
        setMode,
        chatHistory,
        addChatMessage,
        clearChat,
        isChatProcessing,
        setIsChatProcessing,
        gallery,
        addToGallery,
        userLocation,
        inputImageForVideo,
        setInputImageForVideo,
        isYouTubeModalOpen,
        setIsYouTubeModalOpen,
        notebookSources,
        addNotebookSource,
        removeNotebookSource,
        notebookEntries,
        addNotebookEntry,
        livePersona,
        setLivePersona,
        psychologistSubMode,
        setPsychologistSubMode,
        userProfile,
        updateUserProfile,
        isProfileModalOpen,
        setIsProfileModalOpen,
        savedSessions,
        currentSessionId,
        startNewSession,
        deleteSession,
        loadSessionToChat
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext used outside provider");
    return context;
};

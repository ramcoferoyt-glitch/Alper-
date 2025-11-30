
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppMode, ChatMessage, GeneratedMedia, NotebookSource, NotebookEntry, PsychologistSubMode, UserProfile } from '../types';
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
}

export type AppContextType = ReturnType<typeof useAppStoreComplete> & AppUIState;

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_PROFILE: UserProfile = {
    name: 'Misafir Kullanıcı',
    email: '',
    role: 'Yaratıcı',
    bio: '',
    avatar: ''
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useAppStoreComplete();

    // Initialize chat and gallery state if not handled by store directly
    const [mode, setMode] = useState<AppMode>('chat');
    
    // User Profile (Load from LocalStorage)
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('alper_user_profile');
        return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Save profile on change
    useEffect(() => {
        localStorage.setItem('alper_user_profile', JSON.stringify(userProfile));
    }, [userProfile]);

    const updateUserProfile = (newProfile: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...newProfile }));
    };

    // SIMPLIFIED PROFESSIONAL WELCOME MESSAGE
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
        id: 'welcome',
        role: 'model',
        text: `**Merhaba ${userProfile.name !== 'Misafir Kullanıcı' ? userProfile.name : ''}. Ben Alper.**
        
        Zekam ve yaratıcılığım emrine amade. Analiz etmek, tasarlamak, yazmak veya sadece sohbet etmek için buradayım.
        
        _Bugün birlikte neyi gerçeğe dönüştürüyoruz?_`,
        timestamp: Date.now()
    }]);

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

    const addChatMessage = (message: ChatMessage) => {
        setChatHistory(prev => [...prev, message]);
    };

    const clearChat = () => {
        setChatHistory([]);
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

    // Merge the store from useAppStore with the local UI state
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
        setIsProfileModalOpen
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

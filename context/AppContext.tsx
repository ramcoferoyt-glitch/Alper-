/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppMode, ChatMessage, GeneratedMedia, NotebookSource, NotebookEntry, PsychologistSubMode, UserProfile, SavedSession, AIModel, KnowledgeItem } from '../types';
import { useAppStoreComplete } from '../hooks/useAppStore';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/DatabaseService';
import { analyzeAndLearn } from '../services/GeminiService';

interface AppUIState {
    mode: AppMode;
    setMode: React.Dispatch<React.SetStateAction<AppMode>>;
    selectedModel: AIModel;
    setSelectedModel: React.Dispatch<React.SetStateAction<AIModel>>;
    isPrivateMode: boolean;
    setIsPrivateMode: React.Dispatch<React.SetStateAction<boolean>>;
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
    learnedKnowledge: KnowledgeItem[];
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

export const AppProvider: React.FC<{ children: React.Node }> = ({ children }) => {
    const store = useAppStoreComplete();

    // Initialize chat and gallery state
    const [mode, setMode] = useState<AppMode>('chat');
    const [selectedModel, setSelectedModel] = useState<AIModel>('x5'); 
    const [isPrivateMode, setIsPrivateMode] = useState(false);
    
    // User Profile
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
    const [learnedKnowledge, setLearnedKnowledge] = useState<KnowledgeItem[]>([]);

    // Load Knowledge on Mount
    useEffect(() => {
        dbService.getKnowledge().then(k => setLearnedKnowledge(k)).catch(e => console.error(e));
        dbService.getSessions().then(s => setSavedSessions(s)).catch(e => console.error(e));
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

    // Memory State
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

    // AUTO-SAVE & SELF-LEARNING LOGIC (Skipped in Private Mode)
    useEffect(() => {
        if (chatHistory.length <= 1 || !currentSessionId || isPrivateMode) return;

        const timeoutId = setTimeout(async () => {
            const lastMsg = chatHistory[chatHistory.length - 1];
            if (!lastMsg.text) return;

            const firstUserMsg = chatHistory.find(m => m.role === 'user');
            let title = firstUserMsg ? firstUserMsg.text.substring(0, 40) : 'Yeni Sohbet';
            if (title.length >= 40) title += '...';

            const preview = lastMsg.text.substring(0, 60) + '...';

            const updatedSession: SavedSession = {
                id: currentSessionId,
                date: Date.now(),
                mode: mode,
                title,
                preview,
                messages: chatHistory
            };

            await dbService.saveSession(updatedSession);
            
            setSavedSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === currentSessionId);
                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex] = updatedSession;
                    return [updated[existingIndex], ...updated.filter((_, i) => i !== existingIndex)];
                }
                return [updatedSession, ...prev];
            });

            // Self-Learning
            if (chatHistory.length % 4 === 0) {
                const newFacts = await analyzeAndLearn(chatHistory.map(m => ({role: m.role, text: m.text})));
                if (newFacts.length > 0) {
                    for (const fact of newFacts) {
                        await dbService.addKnowledge(fact);
                    }
                    const updatedKnowledge = await dbService.getKnowledge();
                    setLearnedKnowledge(updatedKnowledge);
                }
            }

        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [chatHistory, currentSessionId, mode, isPrivateMode]);

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
        setChatHistory([]);
        setMode(initialMode);
    };

    const deleteSession = async (id: string) => {
        await dbService.deleteSession(id);
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
            setMode(session.mode);
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
        selectedModel,
        setSelectedModel,
        isPrivateMode,
        setIsPrivateMode,
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
        loadSessionToChat,
        learnedKnowledge
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
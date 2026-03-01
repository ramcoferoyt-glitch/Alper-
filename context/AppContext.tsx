
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppMode, ChatMessage, GeneratedMedia, NotebookSource, NotebookEntry, PsychologistSubMode, UserProfile, SavedSession, AIModel, KnowledgeItem, AppLanguage } from '../types';
import { useAppStoreComplete } from '../hooks/useAppStore';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../services/DatabaseService';

interface AppUIState {
    mode: AppMode;
    setMode: React.Dispatch<React.SetStateAction<AppMode>>;
    selectedModel: AIModel;
    setSelectedModel: React.Dispatch<React.SetStateAction<AIModel>>;
    isPrivateMode: boolean;
    setIsPrivateMode: React.Dispatch<React.SetStateAction<boolean>>;
    language: AppLanguage;
    setLanguage: React.Dispatch<React.SetStateAction<AppLanguage>>;
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
    notebookSources: NotebookSource[];
    addNotebookSource: (source: NotebookSource) => void;
    removeNotebookSource: (id: string) => void;
    notebookEntries: NotebookEntry[];
    addNotebookEntry: (entry: NotebookEntry) => void;
    livePersona: 'assistant' | 'psychologist';
    setLivePersona: React.Dispatch<React.SetStateAction<'assistant' | 'psychologist'>>;
    psychologistSubMode: PsychologistSubMode;
    setPsychologistSubMode: React.Dispatch<React.SetStateAction<PsychologistSubMode>>;
    userProfile: UserProfile;
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    savedSessions: SavedSession[];
    currentSessionId: string | null;
    startNewSession: (initialMode?: AppMode) => void;
    deleteSession: (id: string) => void;
    loadSessionToChat: (id: string) => void;
    learnedKnowledge: KnowledgeItem[];
    t: (key: string) => string;
}

export type AppContextType = ReturnType<typeof useAppStoreComplete> & AppUIState;

const AppContext = createContext<AppContextType | null>(null);

const TRANSLATIONS: Partial<Record<AppLanguage, Record<string, string>>> = {
    tr: {
        'greeting': 'Merhaba, ben Alper.',
        'tagline': 'Hepsi bir arada yaratıcı ve profesyonel yapay zeka asistanı.',
        'studio_label': 'Yaratıcı Stüdyo',
        'studio_desc': 'GÖRSEL • VİDEO • METİN • TASARIM',
        'explore_label': 'Keşfet & Planla',
        'explore_desc': 'HARİTA • ROTA • EĞİTİM • YAŞAM',
        'input_placeholder': 'Alper ile konuş...',
        'quick_start': 'HIZLI BAŞLAT',
        'new_chat': 'Yeni Sohbet',
        'pro_mode': 'ALPER X5 PROFESYONEL',
        'fast_mode': 'ALPER X3 HIZLI',
        'thinking': 'Alper düşünüyor...',
        // Buttons
        'btn_tatil': 'Tatil Planla',
        'btn_logo': 'Logo Tasarla',
        'btn_butce': 'Bütçe Yap',
        'btn_metin': 'Metin Yaz',
        'btn_video': 'Video Üret',
        'btn_ders': 'Ders Çalış',
        'btn_sarki': 'Şarkı Sözü',
        'btn_kod': 'Kod Yaz',
        'btn_sunum': 'Sunum Hazırla',
        'btn_hikaye': 'Hikaye Oluştur',
        'btn_email': 'Email Taslağı',
        'btn_blog': 'Blog Yazısı',
        'btn_fikir': 'Fikir Üret',
        'btn_problem': 'Problem Çöz',
        'btn_ozet': 'Özet Çıkar',
        'btn_ceviri': 'Çeviri Yap'
    }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useAppStoreComplete();
    const [mode, setMode] = useState<AppMode>('chat');
    const [selectedModel, setSelectedModel] = useState<AIModel>('x5'); 
    const [isPrivateMode, setIsPrivateMode] = useState(false);
    const [language, setLanguage] = useState<AppLanguage>('tr');
    
    const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS['tr']?.[key] || key;

    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: '', email: '', role: '', bio: '', avatar: '', customInstructions: '',
        preferences: { allowBackgroundProcessing: false, dailyBriefing: false, notifications: { email: false, sms: false, push: true }, theme: 'dark' }
    });

    const updateUserProfile = (updates: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...updates }));
    };
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [learnedKnowledge, setLearnedKnowledge] = useState<KnowledgeItem[]>([]);
    const [isChatProcessing, setIsChatProcessing] = useState(false);
    const [gallery, setGallery] = useState<GeneratedMedia[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
    const [inputImageForVideo, setInputImageForVideo] = useState<string | null>(null);
    const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
    const [notebookSources, setNotebookSources] = useState<NotebookSource[]>([]);
    const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);
    const [livePersona, setLivePersona] = useState<'assistant' | 'psychologist'>('assistant');
    const [psychologistSubMode, setPsychologistSubMode] = useState<PsychologistSubMode>('therapy');
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

    useEffect(() => {
        dbService.getKnowledge().then(k => setLearnedKnowledge(k));
        dbService.getSessions().then(s => setSavedSessions(s));
    }, []);

    const startNewSession = (initialMode: AppMode = 'chat') => { setCurrentSessionId(uuidv4()); setChatHistory([]); setMode(initialMode); };
    const deleteSession = async (id: string) => { await dbService.deleteSession(id); setSavedSessions(prev => prev.filter(s => s.id !== id)); };
    const loadSessionToChat = (id: string) => { const session = savedSessions.find(s => s.id === id); if (session) { setCurrentSessionId(session.id); setChatHistory(session.messages); setMode(session.mode); } };
    const addChatMessage = (message: ChatMessage) => { if (!currentSessionId) setCurrentSessionId(uuidv4()); setChatHistory(prev => [...prev, message]); };

    return (
        <AppContext.Provider value={{
            ...store, mode, setMode, selectedModel, setSelectedModel, isPrivateMode, setIsPrivateMode, language, setLanguage, chatHistory, addChatMessage, clearChat: () => startNewSession(mode), isChatProcessing, setIsChatProcessing, gallery, addToGallery: (m) => setGallery(p => [m, ...p]), userLocation, inputImageForVideo, setInputImageForVideo, isYouTubeModalOpen, setIsYouTubeModalOpen, notebookSources, addNotebookSource: (s) => setNotebookSources(p => [...p, s]), removeNotebookSource: (id) => setNotebookSources(p => p.filter(x => x.id !== id)), notebookEntries, addNotebookEntry: (e) => setNotebookEntries(p => [e, ...p]), livePersona, setLivePersona, psychologistSubMode, setPsychologistSubMode, userProfile, updateUserProfile, isProfileModalOpen, setIsProfileModalOpen, savedSessions, currentSessionId, startNewSession, deleteSession, loadSessionToChat, learnedKnowledge, t
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext used outside provider");
    return context;
};

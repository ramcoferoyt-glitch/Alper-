
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppMode, ChatMessage, GeneratedMedia, NotebookSource, NotebookEntry } from '../types';
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
}

export type AppContextType = ReturnType<typeof useAppStoreComplete> & AppUIState;

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useAppStoreComplete();

    // Initialize chat and gallery state if not handled by store directly
    const [mode, setMode] = useState<AppMode>('chat');
    
    // PREMIUM WELCOME MESSAGE
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
        id: 'welcome',
        role: 'model',
        text: "**Merhaba. Ben Alper.**\n\nStratejik zekan ve yaratıcı partnerin. Senin için ne yapabilirim?\n\n• Analiz yapabilir ve akıl verebilirim.\n• Görsel ve videolar tasarlayabilirim.\n• YouTube içeriklerini özetleyebilirim.\n• Sesli ve görüntülü sohbet edebilirim.",
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
        addNotebookEntry
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
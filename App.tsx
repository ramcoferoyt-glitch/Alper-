
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { NavigationMenu } from './components/NavigationMenu';
import { ChatInterface } from './components/ChatInterface';
import { MediaStudio } from './components/MediaStudio';
import { LiveInterface } from './components/LiveInterface';
import { NotebookInterface } from './components/NotebookInterface';
import { YouTubeStudio } from './components/YouTubeStudio';
import { EditorInterface } from './components/EditorInterface';

const MainContent: React.FC = () => {
    const { mode } = useAppContext();

    return (
        <div className="flex-grow h-full overflow-hidden relative">
            {mode === 'chat' && <ChatInterface />}
            {mode === 'notebook' && <NotebookInterface />}
            {mode === 'maps' && <ChatInterface />} {/* Maps shares Chat UI */}
            {mode === 'image' && <MediaStudio type="image" />}
            {mode === 'video' && <MediaStudio type="video" />}
            {mode === 'thumbnail' && <YouTubeStudio />}
            {mode === 'live' && <LiveInterface />}
            {mode === 'editor' && <EditorInterface />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans relative">
                <NavigationMenu />
                <main className="flex-grow h-full relative bg-gray-900 w-full overflow-hidden">
                    <MainContent />
                </main>
            </div>
        </AppProvider>
    );
};

export default App;

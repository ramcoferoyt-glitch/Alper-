
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SavedSession, KnowledgeItem } from "../types";

const DB_NAME = 'AlperDB_V1';
const DB_VERSION = 1;

class DatabaseService {
    private db: IDBDatabase | null = null;
    private isReady: Promise<void>;

    constructor() {
        this.isReady = this.initDB();
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("AlperDB Init Error:", (event.target as IDBOpenDBRequest).error);
                // Self-healing: Try to delete and recreate if corrupted
                reject((event.target as IDBOpenDBRequest).error);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                console.log("AlperDB Connected Successfully");
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Sessions Store
                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id' });
                }

                // Knowledge Store (The Brain)
                if (!db.objectStoreNames.contains('knowledge')) {
                    const knowledgeStore = db.createObjectStore('knowledge', { keyPath: 'id' });
                    knowledgeStore.createIndex('topic', 'topic', { unique: false });
                }
            };
        });
    }

    // --- Session Management ---

    async saveSession(session: SavedSession): Promise<void> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            const request = store.put(session);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to save session");
        });
    }

    async getSessions(): Promise<SavedSession[]> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by date desc
                const sessions = (request.result as SavedSession[]).sort((a, b) => b.date - a.date);
                resolve(sessions);
            };
            request.onerror = () => reject("Failed to get sessions");
        });
    }

    async deleteSession(id: string): Promise<void> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete session");
        });
    }

    // --- Knowledge / Self-Learning System ---

    async addKnowledge(item: KnowledgeItem): Promise<void> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['knowledge'], 'readwrite');
            const store = transaction.objectStore('knowledge');
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to learn");
        });
    }

    async getKnowledge(): Promise<KnowledgeItem[]> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['knowledge'], 'readonly');
            const store = transaction.objectStore('knowledge');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to retrieve knowledge");
        });
    }

    async clearAllData(): Promise<void> {
        await this.isReady;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB not initialized");
            const transaction = this.db.transaction(['sessions', 'knowledge'], 'readwrite');
            transaction.objectStore('sessions').clear();
            transaction.objectStore('knowledge').clear();
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject("Failed to clear data");
        });
    }
}

export const dbService = new DatabaseService();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import fetch from 'node-fetch';
import ytdl from '@distube/ytdl-core';

import { GoogleGenAI } from "@google/genai";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('status', isConnected ? 'connected' : 'disconnected');
    socket.emit('autoreply-status', isAutoReplyEnabled);
    if (qrCode && !isConnected) {
        socket.emit('qr', qrCode);
    }
});

// Gemini Setup
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PORT = 3000;
const AUTH_FOLDER = 'baileys_auth_info';

// Ensure auth folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER);
}

let sock: any;
let qrCode: string | undefined;
let isConnected = false;
let isAutoReplyEnabled = false; // Server-side state

async function generateReply(prompt: string) {
    try {
        const result = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return result.text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

async function startWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ["Alper AI", "Chrome", "1.0.0"],
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update: any) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                qrCode = qr;
                io.emit('qr', qr);
                console.log('QR Code generated');
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const errorMessage = (lastDisconnect?.error as any)?.message;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                isConnected = false;
                io.emit('status', 'disconnected');
                
                if (errorMessage === 'QR refs attempts ended') {
                    console.log('QR attempts ended. Cleaning up and restarting session...');
                    
                    // Clean up socket
                    if (sock) {
                        sock.end(undefined);
                        sock = undefined;
                    }

                    // Remove auth folder to force new QR
                    try {
                        if (fs.existsSync(AUTH_FOLDER)) {
                            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
                        }
                    } catch (e) {
                        console.error('Failed to remove auth folder:', e);
                    }
                    
                    // Restart with delay
                    setTimeout(startWhatsApp, 3000);
                } else if (shouldReconnect) {
                    setTimeout(startWhatsApp, 5000); // Add delay before reconnect
                }
            } else if (connection === 'open') {
                console.log('Opened connection');
                isConnected = true;
                qrCode = undefined;
                io.emit('status', 'connected');
                io.emit('qr', null);
            }
        });

        sock.ev.on('messages.upsert', async (m: any) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        console.log('New message received:', msg);
                        const msgText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                        
                        io.emit('message', {
                            id: msg.key.id,
                            from: msg.key.remoteJid,
                            pushName: msg.pushName,
                            text: msgText,
                            timestamp: msg.messageTimestamp
                        });

                        // Auto Reply Logic (Server-Side)
                        if (isAutoReplyEnabled && msgText) {
                            try {
                                const reply = await generateReply(
                                    `Sen kullanıcının kişisel WhatsApp asistanısın. Gelen mesaja kullanıcının samimi üslubuyla, kısa ve öz bir yanıt ver. Karşı tarafın mesajındaki tonu ve samimiyeti analiz et ve ona uygun bir dille (ayna etkisi) yanıt ver. Mesaj: "${msgText}". Kullanıcı samimi, kısa ve net konuşur. Emojileri dozunda kullanır. Resmiyetten uzak dur.`
                                );

                                if (reply) {
                                    await sock.sendMessage(msg.key.remoteJid, { text: reply });
                                    io.emit('message', {
                                        id: 'reply-' + Date.now(),
                                        from: 'Me',
                                        text: reply,
                                        type: 'outgoing',
                                        timestamp: Date.now() / 1000
                                    });
                                }
                            } catch (error) {
                                console.error('Auto-reply failed:', error);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to start WhatsApp:', error);
        // Retry after delay
        setTimeout(startWhatsApp, 10000);
    }
}

// Start WhatsApp logic safely with delay
setTimeout(() => {
    startWhatsApp().catch(err => console.error("Fatal WhatsApp Error:", err));
}, 5000);

// API Routes
app.use(express.json());
app.use(cors());

app.get('/api/whatsapp/status', (req, res) => {
    res.json({ isConnected, qrCode, isAutoReplyEnabled });
});

app.post('/api/whatsapp/toggle-autoreply', (req, res) => {
    const { enabled } = req.body;
    isAutoReplyEnabled = enabled;
    io.emit('autoreply-status', isAutoReplyEnabled);
    res.json({ success: true, isAutoReplyEnabled });
});

app.post('/api/whatsapp/send', async (req, res) => {
    const { to, text } = req.body;
    if (!isConnected || !sock) {
        return res.status(503).json({ error: 'WhatsApp not connected' });
    }
    try {
        await sock.sendMessage(to, { text });
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.post('/api/whatsapp/restart', async (req, res) => {
    try {
        if (sock) {
            sock.end(undefined); // Close existing socket
        }
        isConnected = false;
        qrCode = undefined;
        io.emit('status', 'disconnected');
        startWhatsApp(); // Restart
        res.json({ success: true });
    } catch (error) {
        console.error('Restart failed:', error);
        res.status(500).json({ error: 'Restart failed' });
    }
});

app.post('/api/whatsapp/logout', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            startWhatsApp(); // Restart to generate new QR
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Not initialized' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Media Download Routes (Using Cobalt API & oEmbed & ytdl fallback)
app.get('/api/media/info', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Invalid URL' });
    
    try {
        // Try oEmbed for metadata first (Standard, reliable)
        let oembedUrl = '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            oembedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
        } else if (url.includes('instagram.com')) {
             return res.json({ title: 'Instagram İçeriği', thumbnail: 'https://picsum.photos/seed/insta/300/200', duration: 0 });
        } else if (url.includes('tiktok.com')) {
            oembedUrl = `https://www.tiktok.com/oembed?url=${url}`;
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            oembedUrl = `https://publish.twitter.com/oembed?url=${url}`;
        } else {
            // Generic fallback
            return res.json({ title: 'Medya İçeriği', thumbnail: 'https://picsum.photos/seed/media/300/200', duration: 0 });
        }

        if (oembedUrl) {
            const response = await fetch(oembedUrl);
            if (response.ok) {
                const data: any = await response.json();
                return res.json({
                    title: data.title || 'Başlıksız İçerik',
                    thumbnail: data.thumbnail_url || 'https://picsum.photos/seed/media/300/200',
                    duration: 0 
                });
            }
        }
        
        // Fallback if oEmbed fails
        res.json({ title: 'Medya İçeriği', thumbnail: 'https://picsum.photos/seed/media/300/200', duration: 0 });
        
    } catch (e) {
        console.error("Media Info Error:", e);
        res.status(500).json({ error: 'Failed to fetch info' });
    }
});

// New Resolve Endpoint - Returns URL instead of redirecting
app.post('/api/media/resolve', async (req, res) => {
    const { url, format } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Invalid URL' });

    try {
        // 1. Try Cobalt API
        try {
            const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    vQuality: '1080',
                    isAudioOnly: format === 'mp3',
                    aFormat: format === 'mp3' ? 'mp3' : undefined
                })
            });

            const data: any = await cobaltResponse.json();

            if (data.url) {
                return res.json({ url: data.url, method: 'cobalt' });
            } else if (data.picker && data.picker.length > 0) {
                return res.json({ url: data.picker[0].url, method: 'cobalt' });
            }
            // If Cobalt fails, continue to fallback
            console.log("Cobalt failed, trying fallback...", data);
        } catch (cobaltError) {
            console.error("Cobalt API Error:", cobaltError);
        }

        // 2. Fallback: ytdl-core (Only for YouTube)
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const info = await ytdl.getBasicInfo(url);
                const formatFilter = format === 'mp3' ? 'audioonly' : 'videoandaudio';
                const formats = ytdl.filterFormats(info.formats, formatFilter);
                
                if (formats.length > 0) {
                    // Get highest quality
                    const bestFormat = formats[0]; 
                    return res.json({ url: bestFormat.url, method: 'ytdl' });
                }
            } catch (ytdlError) {
                console.error("ytdl Error:", ytdlError);
            }
        }

        throw new Error('İndirme bağlantısı oluşturulamadı. Lütfen daha sonra tekrar deneyin.');

    } catch (e: any) {
        console.error("Resolve Error:", e);
        res.status(500).json({ error: e.message || 'Download failed' });
    }
});

// Legacy Download Route (Redirects) - kept for backward compatibility if needed
app.get('/api/media/download', async (req, res) => {
    // ... (redirect logic if needed, but we prefer resolve now)
    res.status(400).send("Please use /api/media/resolve endpoint");
});

// Vite Middleware
async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        // Serve static files in production (if needed)
        app.use(express.static('dist'));
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

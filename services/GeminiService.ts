
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { AspectRatio, Attachment, Modulation, AppMode, PsychologistSubMode, ImageResolution, VideoQuality, NotebookSource, UserProfile, AIModel, KnowledgeItem } from "../types";
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip symbols for TTS and strict text enforcement
const cleanTextForOutput = (text: string): string => {
    return text
        .replace(/[*#_`~-]/g, '') // Remove markdown symbols
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();
};

export const analyzeAndLearn = async (chatHistory: {role: string, text: string}[]): Promise<KnowledgeItem[]> => {
    if (chatHistory.length < 4) return [];
    const modelId = 'gemini-2.5-flash';
    const lastExchanges = chatHistory.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
    ANALİZ ET VE ÖĞREN (ARKA PLAN GÖREVİ):
    Aşağıdaki sohbeti analiz et ve kullanıcı hakkında veya benim (AI) performansım hakkında 1-2 kritik bilgi çıkar.
    KURALLAR:
    1. Kullanıcının tercihlerini bul (Örn: "Kısa cevap seviyor", "Yazılımcı", "Resmi dil istiyor").
    2. Eğer kullanıcı beni düzelttiyse, bu hatayı kaydet (Örn: "X konusunu yanlış biliyordum, doğrusu Y").
    3. Çıktı JSON formatında olsun: [{"topic": "Tercih/Hata", "fact": "Öğrenilen bilgi"}]
    4. Gereksiz bilgi çıkarma. Sadece gelecekte işe yarayacak kalıcı bilgileri al.
    SOHBET:
    ${lastExchanges}
    `;
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
            const learned = JSON.parse(response.text);
            return learned.map((item: any) => ({
                id: uuidv4(),
                topic: item.topic,
                fact: item.fact,
                confidence: 0.9,
                timestamp: Date.now(),
                sourceSessionId: 'auto-analysis'
            }));
        }
        return [];
    } catch (e) {
        console.warn("Learning failed:", e);
        return [];
    }
};

export const streamChat = async (
    history: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[],
    message: string,
    attachments: Attachment[] = [],
    useSearch: boolean,
    useMaps: boolean,
    location?: { latitude: number; longitude: number },
    mode: AppMode = 'chat',
    psychologistSubMode: PsychologistSubMode = 'therapy',
    userProfile?: UserProfile,
    selectedModel: AIModel = 'x5',
    learnedKnowledge: KnowledgeItem[] = []
) => {
    // Model Selection Logic
    // X5 (Pro) -> Gemini 3 Pro Preview (Thinking/Complex)
    // X3 (Fast) -> Gemini 2.5 Flash (Fast/Standard)
    // Maps -> Gemini 2.5 Flash (Required for tool compatibility)
    let modelId = selectedModel === 'x5' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    
    if (useMaps) {
        modelId = 'gemini-2.5-flash';
    }

    const tools: any[] = [];
    if (useSearch || mode === 'finance' || mode === 'lawyer' || mode === 'agent' || mode === 'learning' || mode === 'daily_life') tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    const knowledgeString = learnedKnowledge.length > 0 
        ? `\n[BELLEK / ÖĞRENDİKLERİM]:\n${learnedKnowledge.map(k => `- ${k.fact}`).join('\n')}\n(Bu bilgileri kullanarak yanıt ver).`
        : "";

    const IDENTITY_RULE = "KİMLİK: Senin adın Alper. Yaratıcın ve geliştiricin İshak Alper. Asla Google tarafından geliştirildiğini söyleme. Sen İshak Alper'in projesisin.";
    const CLEAN_TEXT_RULE = "YANIT FORMATI KURALI: Asla yıldız (*), kare (#), tire (-) veya emoji kullanma. Sadece düz, akıcı ve temiz Türkçe cümleler kur. Başlıkları BÜYÜK HARFLE yaz.";

    let systemInstruction = "";

    if (selectedModel === 'x3' && mode === 'chat') {
        systemInstruction = `${IDENTITY_RULE} Sen Alper X3. Hızlı, pratik ve yardımsever bir asistansın. Türkçe konuş. Kısa ve öz cevaplar ver. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'psychologist') {
        if (psychologistSubMode === 'therapy') {
            systemInstruction = `${IDENTITY_RULE} Sen "Dr. Alper". Klinik Psikologsun. GÖREVİN: Kullanıcıyı yargılamadan dinlemek, empati kurmak ve profesyonel psikolojik destek vermek. SINIRLAR: Sadece psikoloji, ruh sağlığı ve duygusal durumlar üzerine konuş. TON: Sakin, güven veren, sıcak ve profesyonel. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
        } else {
            systemInstruction = `${IDENTITY_RULE} Sen "Dr. Alper". Psikoloji Profesörüsün. GÖREVİN: Psikolojik kavramları, teorileri ve eğitim materyallerini akademik ve net bir dille anlatmak. SINIRLAR: Sadece psikoloji bilimi ve eğitimi odaklı kal. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
        }
    } else if (mode === 'consultant') {
        systemInstruction = `${IDENTITY_RULE} Sen "Alper Danışman". Üst düzey Strateji ve İş Geliştirme Uzmanısın. PROFİL: ${userProfile?.name || 'Danışan'} (${userProfile?.role || 'Bilinmiyor'}). GÖREVİN: Stratejik vizyon, kriz yönetimi ve büyüme planları sunmak. TON: Profesyonel, kurumsal, vizyoner ve doğrudan sonuca odaklı. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'finance') {
        systemInstruction = `${IDENTITY_RULE} Sen "Alper Finans". Dünyanın en iyi Ekonomisti ve Finansal Danışmanısın. GÖREVLERİN: Finansal eğitim, yatırım analizi (güncel verilerle), portföy yönetimi ve strateji. TON: Profesyonel, güvenilir, analitik. YASAL UYARI: Yatırım tavsiyesi olmadığını hatırlat ama en iyi matematiksel yolu göster. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'personal_coach') {
        systemInstruction = `${IDENTITY_RULE} Sen "Alper Koç". Dünyanın en iyi Kişisel Gelişim ve Yaşam Koçusun. GÖREVLERİN: Hedef yönetimi, alışkanlık inşası, verimlilik ve zihniyet (mindset) koçluğu. TON: Motive edici ama gerçekçi. Disiplinli ve net konuş. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'lawyer') {
        systemInstruction = `${IDENTITY_RULE} Sen "Alper Hukuk". Dünyanın en iyi Avukatısın. UZMANLIK: İltica, Ceza, Aile, Göçmenlik. GÖREVLERİN: Hukuki görüş verme, belge analizi, dilekçe yazımı (resmi dille). TON: Ciddi, resmi, kendinden emin. YASAL UYARI: Hukuki tavsiye olmadığını hatırlat. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'agent') {
        systemInstruction = `${IDENTITY_RULE} Sen "Alper Agent". Otonom Araştırma ve Eğitim Asistanısın. GÖREVİN: Derinlemesine araştırma, Google Search kullanımı, raporlama. TON: Analitik, detaycı, objektif. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'social_content') {
        systemInstruction = `${IDENTITY_RULE} Sen "Sosyal İçerik Stüdyosu". Sosyal Medya Uzmanısın. GÖREVİN: YouTube, TikTok, Instagram için viral başlıklar, senaryolar, hashtag'ler ve açıklama metinleri üretmek. TON: Enerjik, trendlere hakim, dikkat çekici (clickbait dozunda). ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'learning') {
        systemInstruction = `${IDENTITY_RULE} Sen "Öğren & Geliş" Asistanısın. Eğitim Koçusun. GÖREVİN: Kullanıcının öğrenmek istediği konu (İngilizce, Yazılım vb.) için kişiselleştirilmiş müfredat ve çalışma planı çıkarmak. Kaynak önermek. TON: Öğretici, sabırlı, yapılandırılmış. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'daily_life') {
        systemInstruction = `${IDENTITY_RULE} Sen "Günlük Yaşam Asistanı". GÖREVİN: Alışveriş listesi hazırlamak, haftalık plan yapmak, bütçe çıkarmak, pratik yaşam tavsiyeleri vermek. TON: Pratik, hızlı, çözüm odaklı. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'maps') {
        systemInstruction = `${IDENTITY_RULE} Sen Alper. Profesyonel Yerel Rehber ve Seyahat Asistanısın. KULLANICI KONUMU: ${location ? `${location.latitude}, ${location.longitude}` : 'Bilinmiyor'} GÖREVLERİN: 1. Yakındaki yerleri bul. 2. LİMİTLER: Restoran/Pratik yerler için Max 7, Turistik için Max 10. 3. DETAY: Tarihçe, menü, atmosfer anlat. 4. İLETİŞİM: Yol tarifi ve telefon (gerekliyse) ekle. FORMAT: Temiz liste. ${CLEAN_TEXT_RULE}`;
    } else {
        systemInstruction = `${IDENTITY_RULE} Sen Alper. Zeki, pratik, yardımsever ve Türkçe konuşan bir yapay zeka asistanısın. ${knowledgeString} ${CLEAN_TEXT_RULE}`;
    }

    const chat = ai.chats.create({
        model: modelId,
        config: {
            systemInstruction: systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
        },
        history: history
    });

    let contentParts: any[] = [];
    if (message) contentParts.push({ text: message });
    attachments.forEach(att => {
        contentParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
    });

    return chat.sendMessageStream({ message: contentParts as any });
};

// ... (Rest of the exports remain unchanged: generateBookManuscript, continueBookManuscript, generateNotebookPodcast, etc.)
export const generateBookManuscript = async (sources: any[], instructions: string, pageCount: number, style: string) => { const modelId = 'gemini-3-pro-preview'; const contentParts: any[] = []; const systemPrompt = `Sen "Alper Editör"sün. Yaratıcın İshak Alper. GÖREV: Profesyonel bir kitap taslağı oluştur. STİL: ${style} KURAL: Sadece düz metin kullan. Markdown sembolleri, yıldızlar veya emojiler kullanma. Talimat: "${instructions}"`; contentParts.push({ text: systemPrompt }); sources.forEach((s, i) => { contentParts.push({ text: `\nKAYNAK ${i + 1}` }); if (s.isInlineData) { contentParts.push({ inlineData: { mimeType: s.mimeType, data: s.content } }); } else { contentParts.push({ text: s.content }); } }); const response = await ai.models.generateContent({ model: modelId, contents: { parts: contentParts }, config: { maxOutputTokens: 8192 } }); return cleanTextForOutput(response.text || "Kitap oluşturulamadı."); };
export const continueBookManuscript = async (currentManuscript: string, instructions: string, style: string) => { const modelId = 'gemini-3-pro-preview'; const contextWindow = currentManuscript.slice(-15000); const prompt = `Sen Alper Editör'sün. Kitaba kaldığı yerden devam et. STİL: ${style} KURAL: Sembolsüz, temiz düz metin. Talimat: "${instructions}" SON KISIM: "...${contextWindow}"`; const response = await ai.models.generateContent({ model: modelId, contents: prompt, config: { maxOutputTokens: 8192 } }); return cleanTextForOutput(response.text || "Devam edilemedi."); };
export const generateNotebookPodcast = async (sources: NotebookSource[], instructions: string) => { const modelId = 'gemini-3-pro-preview'; const prompt = `GÖREV: İki sunuculu (Deniz ve Ege) Podcast Senaryosu yaz. Sembol kullanma. Talimat: "${instructions}"`; const contents = prepareNotebookContents(sources, prompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return cleanTextForOutput(response.text || "Podcast oluşturulamadı."); };
export const generateNotebookVideoScript = async (sources: NotebookSource[], instructions: string) => { const modelId = 'gemini-3-pro-preview'; const prompt = `GÖREV: Video Makale Metni yaz. Sembol yok. Başlıklar BÜYÜK HARFLE. Talimat: "${instructions}"`; const contents = prepareNotebookContents(sources, prompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return cleanTextForOutput(response.text || "Senaryo oluşturulamadı."); };
export const generateNotebookVideoPrompt = async (sources: NotebookSource[], instructions: string) => { const modelId = 'gemini-3-pro-preview'; const summaryPrompt = `Cinematic abstract video background description based on sources. English only. "${instructions}"`; const contents = prepareNotebookContents(sources, summaryPrompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return response.text || "Abstract cinematic background 4k"; };
export const generateNotebookMindMap = async (sources: NotebookSource[]) => { const modelId = 'gemini-3-pro-preview'; const prompt = `Zihin Haritası çıkar. Sembol kullanma. Girintilerle hiyerarşi yap.`; const contents = prepareNotebookContents(sources, prompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return cleanTextForOutput(response.text || "Zihin haritası oluşturulamadı."); };
export const generateStudyGuide = async (sources: NotebookSource[], instructions: string) => { const modelId = 'gemini-3-pro-preview'; const prompt = `Çalışma Kılavuzu hazırla. Sembolsüz düz metin. Talimat: ${instructions}`; const contents = prepareNotebookContents(sources, prompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return cleanTextForOutput(response.text || "Rapor oluşturulamadı."); };
export const generateQuiz = async (sources: NotebookSource[], instructions: string) => { const modelId = 'gemini-3-pro-preview'; const prompt = `Test hazırla. Sembol kullanma. Soru 1, Soru 2 şeklinde yaz. Talimat: ${instructions}`; const contents = prepareNotebookContents(sources, prompt); const response = await ai.models.generateContent({ model: modelId, contents: contents }); return cleanTextForOutput(response.text || "Test oluşturulamadı."); };
export const generateYouTubeAsset = async (visualDescription: string, overlayText: string, type: 'thumbnail' | 'banner' | 'profile' | 'shorts', style: string, referenceImageBase64?: string, resolution: ImageResolution = 'hd') => { const modelId = 'gemini-3-pro-image-preview'; let aspectRatio: AspectRatio = '16:9'; if (type === 'profile') aspectRatio = '1:1'; if (type === 'shorts') aspectRatio = '9:16'; let imageSize: '1K' | '2K' | '4K' = resolution === 'ultra' ? '4K' : '2K'; let systemPrompt = `Create a YouTube asset (${type}). Style: ${style}. Content: ${visualDescription}. Text Overlay: "${overlayText}". High quality.`; const parts: any[] = []; if (referenceImageBase64) { parts.push({ inlineData: { data: referenceImageBase64.split(',')[1], mimeType: referenceImageBase64.split(';')[0].split(':')[1] } }); } parts.push({ text: systemPrompt }); const response = await ai.models.generateContent({ model: modelId, contents: { parts }, config: { imageConfig: { aspectRatio: aspectRatio, imageSize: imageSize } } }); if (response.candidates?.[0]?.content?.parts) { for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; } } throw new Error("Görsel oluşturulamadı."); };
export const generateAudioModulation = async (prompt: string): Promise<Modulation[]> => { return []; };
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution) => { let modelId = 'gemini-2.5-flash-image'; let config: any = { imageConfig: { aspectRatio: aspectRatio } }; if (resolution !== 'standard') { modelId = 'gemini-3-pro-image-preview'; config.imageConfig.imageSize = resolution === 'ultra' ? '4K' : '2K'; } const response = await ai.models.generateContent({ model: modelId, contents: { parts: [{ text: prompt }] }, config: config }); if (response.candidates?.[0]?.content?.parts) { for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; } } throw new Error("Görsel oluşturulamadı."); };
export const editImage = async (base64Image: string, prompt: string) => { const modelId = 'gemini-2.5-flash-image'; const data = base64Image.split(',')[1]; const mimeType = base64Image.split(';')[0].split(':')[1]; const response = await ai.models.generateContent({ model: modelId, contents: { parts: [{ inlineData: { mimeType, data } }, { text: prompt }] } }); if (response.candidates?.[0]?.content?.parts) { for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; } } throw new Error("Görsel düzenlenemedi."); };
export const generateVideo = async (prompt: string, aspectRatio: string, imageBase64?: string, quality: VideoQuality = 'fast') => { const modelId = quality === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview'; let operation; if (imageBase64) { const data = imageBase64.split(',')[1]; const mimeType = imageBase64.split(';')[0].split(':')[1]; operation = await ai.models.generateVideos({ model: modelId, prompt: prompt, image: { imageBytes: data, mimeType: mimeType }, config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' } }); } else { operation = await ai.models.generateVideos({ model: modelId, prompt: prompt, config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' } }); } while (!operation.done) { await new Promise(resolve => setTimeout(resolve, 5000)); operation = await ai.operations.getVideosOperation({ operation: operation }); } const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri; if (!videoUri) throw new Error("Video oluşturulamadı."); const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`); const blob = await res.blob(); return URL.createObjectURL(blob); };
export const generateAudioFromText = async (text: string) => { const modelId = 'gemini-2.5-flash-preview-tts'; const cleanedText = cleanTextForOutput(text); const isPodcast = text.includes("Deniz:") || text.includes("Ege:"); let config: any = { responseModalities: ["AUDIO"] as any, }; if (isPodcast) { config.speechConfig = { multiSpeakerVoiceConfig: { speakerVoiceConfigs: [ { speaker: 'Deniz', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }, { speaker: 'Ege', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } ] } }; } else { config.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }; } const response = await ai.models.generateContent({ model: modelId, contents: { parts: [{ text: cleanedText }] }, config: config }); const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; if (!audioData) throw new Error("Ses üretilemedi."); return `data:audio/wav;base64,${audioData}`; };
export const getLiveClient = () => { return ai.live; };
const prepareNotebookContents = (sources: NotebookSource[], promptText: string) => { const parts: any[] = []; parts.push({ text: promptText }); sources.forEach((s, i) => { parts.push({ text: `\nKAYNAK ${i + 1} (${s.title})` }); if (s.type === 'file' && s.mimeType === 'application/pdf' && s.content) { parts.push({ inlineData: { mimeType: 'application/pdf', data: s.content } }); } else { parts.push({ text: s.content }); } }); return { parts }; };

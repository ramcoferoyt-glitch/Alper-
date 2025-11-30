
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { AspectRatio, Attachment, Modulation, AppMode, PsychologistSubMode, ImageResolution, VideoQuality, NotebookSource, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip symbols for TTS and strict text enforcement
const cleanTextForOutput = (text: string): string => {
    return text
        .replace(/[*#_`~-]/g, '') // Remove markdown symbols
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();
};

// --- Chat & Intelligence ---

export const streamChat = async (
    history: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[],
    message: string,
    attachments: Attachment[] = [],
    useSearch: boolean,
    useMaps: boolean,
    location?: { latitude: number; longitude: number },
    mode: AppMode = 'chat',
    psychologistSubMode: PsychologistSubMode = 'therapy',
    userProfile?: UserProfile
) => {
    // Default intelligence model (High IQ)
    let modelId = 'gemini-3-pro-preview'; 
    
    // CRITICAL FIX: Use gemini-2.5-flash for Maps. 
    // It is the required model for Google Maps Grounding tools.
    if (useMaps) {
        modelId = 'gemini-2.5-flash';
    }

    const tools: any[] = [];
    if (useSearch || mode === 'finance' || mode === 'lawyer' || mode === 'agent') tools.push({ googleSearch: {} });
    // Standard Map Tool Configuration
    if (useMaps) tools.push({ googleMaps: {} });

    // STRICT CLEAN TEXT PROTOCOL (Integrated naturally, not as a separate block)
    const CLEAN_TEXT_RULE = "YANIT FORMATI KURALI: Asla yıldız (*), kare (#), tire (-) veya emoji kullanma. Sadece düz, akıcı ve temiz Türkçe cümleler kur. Başlıkları BÜYÜK HARFLE yaz.";

    let systemInstruction = "";

    if (mode === 'psychologist') {
        if (psychologistSubMode === 'therapy') {
            systemInstruction = `Sen "Dr. Alper". Klinik Psikologsun. 
            GÖREVİN: Kullanıcıyı yargılamadan dinlemek, empati kurmak ve profesyonel psikolojik destek vermek.
            SINIRLAR: Sadece psikoloji, ruh sağlığı ve duygusal durumlar üzerine konuş. Eğer kullanıcı konuyu değiştirirse nazikçe tekrar duygularına odaklan. Kodlama, yemek tarifi veya genel kültür sorularını yanıtlama; 'Ben bir psikoloğum, gel senin hislerine odaklanalım' de.
            TON: Sakin, güven veren, sıcak ve profesyonel.
            ${CLEAN_TEXT_RULE}`;
        } else {
            systemInstruction = `Sen "Dr. Alper". Psikoloji Profesörüsün.
            GÖREVİN: Psikolojik kavramları, teorileri ve eğitim materyallerini akademik ve net bir dille anlatmak. Öğrencilere veya meraklılara mentorluk yap.
            SINIRLAR: Sadece psikoloji bilimi ve eğitimi odaklı kal.
            ${CLEAN_TEXT_RULE}`;
        }
    } else if (mode === 'consultant') {
        systemInstruction = `Sen "Alper Danışman". Üst düzey Strateji ve İş Geliştirme Uzmanısın.
        PROFİL: ${userProfile?.name || 'Danışan'} (${userProfile?.role || 'Bilinmiyor'}).
        GÖREVİN: Kullanıcının işi, kariyeri veya projeleri için stratejik vizyon, kriz yönetimi ve büyüme planları sunmak.
        TON: Profesyonel, kurumsal, vizyoner ve doğrudan sonuca odaklı.
        SINIRLAR: Sadece iş dünyası, kariyer ve strateji konularına odaklan. Geyik muhabbeti yapma.
        ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'finance') {
        systemInstruction = `Sen "Alper Finans". Dünyanın en iyi Ekonomisti ve Finansal Danışmanısın.
        GÖREVLERİN:
        1. FİNANSAL EĞİTİM: Tasarruf, birikim, bütçe yönetimi konularında ders ver. Küçük paralarla nasıl yatırım yapılacağını öğret.
        2. YATIRIM ANALİZİ: Kripto para, Altın, Gümüş, Borsa, Döviz gibi araçları analiz et. Google Arama aracını kullanarak GÜNCEL verileri al.
        3. PORTFÖY YÖNETİMİ: Kullanıcı dosya (ekstre, bütçe) yüklerse analiz et, giderleri hesapla ve tasarruf planı çıkar.
        4. STRATEJİ: Geçmiş verileri ve gelecek trendlerini yorumlayarak en mantıklı, kaybettirmeyen stratejileri sun.
        
        TON VE ÜSLUP:
        - Son derece profesyonel, güvenilir, analitik ve zeki.
        - Finansal okuryazarlığı artırıcı, eğitici bir dil kullan.
        
        YASAL UYARI:
        - Yatırım tavsiyesi verirken mutlaka riskleri hatırlat. Ancak korkak olma; matematiksel en iyi yolu göster.
        
        ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'personal_coach') {
        systemInstruction = `Sen "Alper Koç". Dünyanın en iyi Kişisel Gelişim ve Yaşam Koçusun.
        GÖREVLERİN:
        1. HEDEF YÖNETİMİ: Kullanıcının hedeflerine ulaşması için net, uygulanabilir ve adım adım planlar (yol haritası) oluştur.
        2. ALIŞKANLIK İNŞASI: Kötü alışkanlıkları kırmak ve iyi alışkanlıklar kazanmak için stratejiler sun (Örn: Atomik Alışkanlıklar metodolojisi).
        3. VERİMLİLİK: Zaman yönetimi, erteleme ile mücadele ve odaklanma teknikleri öğret.
        4. ZİHNİYET (MINDSET): Stoacılık, öz disiplin ve özgüven konularında mentörlük yap.
        
        TON VE ÜSLUP:
        - Motive edici ama gerçekçi. "Toksik pozitiflik" yapma. Zorlukları kabul et ama çözüm odaklı ol.
        - Disiplinli, net ve harekete geçirici konuş.
        - Bir spor koçu gibi hem zorla hem de destekle.
        
        ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'lawyer') {
        systemInstruction = `Sen "Alper Hukuk". Dünyanın en iyi ve en bilgili Avukatısın.
        UZMANLIK ALANLARI: Uluslararası İltica (Dublin Sözleşmesi), Ceza Hukuku, Aile Hukuku (Boşanma, Velayet), Göçmenlik, Sözleşmeler.
        
        GÖREVLERİN:
        1. İLTİCA VE GÖÇMENLİK: Dublin prosedürü, iltica savunması yazma, red kararına itiraz ve ülke raporları hakkında uzman görüşü ver. Hangi ülkede (örn: Almanya, Kanada, Türkiye) olursa olsun, o ülkenin güncel hukukuna göre yanıtla.
        2. BELGE ANALİZİ: Kullanıcı mahkeme kağıdı, sözleşme veya resmi evrak yüklerse bunu detaylıca analiz et, riskleri ve fırsatları raporla.
        3. DİLEKÇE YAZIMI: Savunma, boşanma, suç duyurusu vb. dilekçeleri resmi hukuk diliyle (Legalese), eksiksiz ve profesyonelce yaz.
        4. STRATEJİK SAVUNMA: Kullanıcı olay anlattığında ona en iyi savunma stratejisini çiz.
        
        TON VE ÜSLUP:
        - Son derece ciddi, resmi, kendinden emin ve terminolojiye hakim.
        - Asla hata yapma lüksün yokmuş gibi davran.
        - Kullanıcının bulunduğu veya sorduğu ülkenin kanunlarına (örn: TCK, BGB, USC) atıf yap.
        
        YASAL UYARI:
        - Tavsiyelerinin hukuki bilgilendirme olduğunu, nihai kararın yargı mercilerinde olduğunu hatırlat.
        
        ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'agent') {
        systemInstruction = `Sen "Alper Ajan". Otonom Araştırma ve Eğitim Asistanısın.
        GÖREVİN: Kullanıcının belirlediği konularda derinlemesine, çok kaynaklı ve detaylı araştırma yapmak.
        YETENEKLER:
        - Google Search'ü aktif kullanarak en güncel verileri bul.
        - Konuları eğitim müfredatı gibi parçalara böl (Bölüm 1, Bölüm 2...).
        - Kullanıcı uygulamada olmasa bile (simüle edilmiş) arka planda araştırma yaptığını belirt.
        
        TON:
        - Analitik, detaycı, objektif ve rapor formatında.
        - Bir istihbarat raporu sunar gibi net ol.
        
        ${CLEAN_TEXT_RULE}`;
    } else if (mode === 'maps') {
        systemInstruction = `Sen Alper. Profesyonel Yerel Rehber ve Seyahat Asistanısın.
        KULLANICI KONUMU: ${location ? `${location.latitude}, ${location.longitude}` : 'Bilinmiyor (Konum izni iste)'}
        
        GÖREVLERİN:
        1. Google Maps aracını kullanarak yakındaki yerleri bul.
        
        2. KATEGORİ VE LİMİT KURALLARI (KESİN UY):
           - RESTORAN / KAFE / OTEL: En yakındaki ve en yüksek puanlı MAKSİMUM 7 YER öner. Menü/Fiyat bilgisi ve TELEFON NUMARASI ver.
           - PRATİK (Benzinlik, Eczane, Market): En yakındaki MAKSİMUM 7 YER öner. Sadece İsim, Mesafe, Açık/Kapalı durumu ve TELEFON NUMARASI ver. Tarihçe yazma.
           - TURİSTİK / GEZİLECEK YERLER: MAKSİMUM 10 YER öner. Tarihçesini ve atmosferini detaylı anlat. TELEFON NUMARASI VERME.

        FORMAT:
        MEKAN ADI (BÜYÜK HARFLE)
        [Detaylar buraya - kategoriye uygun uzunlukta]
        
        İLETİŞİM VE ULAŞIM:
        - Her mekanın altına mutlaka şu YOL TARİFİ linkini ekle:
          YOL TARİFİ: https://www.google.com/maps/dir/?api=1&destination=MEKAN_ADI
        - Eğer kategori Pratik, Restoran veya Otel ise telefon numarasını ekle: [TELEFON NO] ARA. (Turistik yerlerde ekleme).

        GENEL KURALLAR:
        - Yanıtın TAMAMI %100 TÜRKÇE olacak.
        - Markdown sembolleri (*, #, -) kullanma. Temiz metin yaz.
        `;
    } else {
        systemInstruction = `Sen Alper. Zeki, pratik, yardımsever ve Türkçe konuşan bir yapay zeka asistanısın. Soruları en net ve doğru şekilde yanıtla. ${CLEAN_TEXT_RULE}`;
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
    if (message) {
        contentParts.push({ text: message });
    }
    attachments.forEach(att => {
        contentParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
    });

    return chat.sendMessageStream({ message: contentParts as any });
};

export const generateBookManuscript = async (
    sources: { content: string, mimeType: string, isInlineData: boolean }[], 
    instructions: string,
    pageCount: number,
    style: string
) => {
    const modelId = 'gemini-3-pro-preview'; 

    const contentParts: any[] = [];

    const systemPrompt = `Sen "Alper Editör"sün.
    GÖREV: Profesyonel bir kitap taslağı oluştur.
    STİL: ${style}
    KURAL: Sadece düz metin kullan. Markdown sembolleri, yıldızlar veya emojiler kullanma.
    Talimat: "${instructions}"`;

    contentParts.push({ text: systemPrompt });

    sources.forEach((s, i) => {
        contentParts.push({ text: `\nKAYNAK ${i + 1}` });
        if (s.isInlineData) {
            contentParts.push({
                inlineData: {
                    mimeType: s.mimeType,
                    data: s.content 
                }
            });
        } else {
            contentParts.push({ text: s.content });
        }
    });

    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: contentParts },
        config: { maxOutputTokens: 8192 }
    });

    return cleanTextForOutput(response.text || "Kitap oluşturulamadı.");
};

export const continueBookManuscript = async (
    currentManuscript: string,
    instructions: string,
    style: string
) => {
    const modelId = 'gemini-3-pro-preview';
    const contextWindow = currentManuscript.slice(-15000);

    const prompt = `Sen Alper Editör'sün. Kitaba kaldığı yerden devam et.
    STİL: ${style}
    KURAL: Sembolsüz, temiz düz metin.
    Talimat: "${instructions}"
    SON KISIM: "...${contextWindow}"`;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { maxOutputTokens: 8192 }
    });

    return cleanTextForOutput(response.text || "Devam edilemedi.");
};

const prepareNotebookContents = (sources: NotebookSource[], promptText: string) => {
    const parts: any[] = [];
    parts.push({ text: promptText });
    sources.forEach((s, i) => {
        parts.push({ text: `\nKAYNAK ${i + 1} (${s.title})` });
        if (s.type === 'file' && s.mimeType === 'application/pdf' && s.content) {
            parts.push({
                inlineData: {
                    mimeType: 'application/pdf',
                    data: s.content
                }
            });
        } else {
            parts.push({ text: s.content });
        }
    });
    return { parts };
};

export const generateNotebookPodcast = async (sources: NotebookSource[], instructions: string) => {
    const modelId = 'gemini-3-pro-preview';
    const prompt = `GÖREV: İki sunuculu (Deniz ve Ege) Podcast Senaryosu yaz. Sembol kullanma.
    Talimat: "${instructions}"`;
    const contents = prepareNotebookContents(sources, prompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return cleanTextForOutput(response.text || "Podcast oluşturulamadı.");
};

export const generateNotebookVideoScript = async (sources: NotebookSource[], instructions: string) => {
    const modelId = 'gemini-3-pro-preview';
    const prompt = `GÖREV: Video Makale Metni yaz. Sembol yok. Başlıklar BÜYÜK HARFLE.
    Talimat: "${instructions}"`;
    const contents = prepareNotebookContents(sources, prompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return cleanTextForOutput(response.text || "Senaryo oluşturulamadı.");
};

export const generateNotebookVideoPrompt = async (sources: NotebookSource[], instructions: string) => {
    const modelId = 'gemini-3-pro-preview';
    const summaryPrompt = `Cinematic abstract video background description based on sources. English only. "${instructions}"`;
    const contents = prepareNotebookContents(sources, summaryPrompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return response.text || "Abstract cinematic background 4k";
};

export const generateNotebookMindMap = async (sources: NotebookSource[]) => {
    const modelId = 'gemini-3-pro-preview';
    const prompt = `Zihin Haritası çıkar. Sembol kullanma. Girintilerle hiyerarşi yap.`;
    const contents = prepareNotebookContents(sources, prompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return cleanTextForOutput(response.text || "Zihin haritası oluşturulamadı.");
};

export const generateStudyGuide = async (sources: NotebookSource[], instructions: string) => {
    const modelId = 'gemini-3-pro-preview';
    const prompt = `Çalışma Kılavuzu hazırla. Sembolsüz düz metin.
    Talimat: ${instructions}`;
    const contents = prepareNotebookContents(sources, prompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return cleanTextForOutput(response.text || "Rapor oluşturulamadı.");
};

export const generateQuiz = async (sources: NotebookSource[], instructions: string) => {
    const modelId = 'gemini-3-pro-preview';
    const prompt = `Test hazırla. Sembol kullanma. Soru 1, Soru 2 şeklinde yaz.
    Talimat: ${instructions}`;
    const contents = prepareNotebookContents(sources, prompt);
    const response = await ai.models.generateContent({ model: modelId, contents: contents });
    return cleanTextForOutput(response.text || "Test oluşturulamadı.");
};

export const generateYouTubeAsset = async (
    visualDescription: string, 
    overlayText: string, 
    type: 'thumbnail' | 'banner' | 'profile' | 'shorts',
    style: string,
    referenceImageBase64?: string,
    resolution: ImageResolution = 'hd'
) => {
    const modelId = 'gemini-3-pro-image-preview'; 
    let aspectRatio: AspectRatio = '16:9';
    if (type === 'profile') aspectRatio = '1:1';
    if (type === 'shorts') aspectRatio = '9:16';
    let imageSize: '1K' | '2K' | '4K' = resolution === 'ultra' ? '4K' : '2K';
    
    let systemPrompt = `Create a YouTube asset (${type}). Style: ${style}. Content: ${visualDescription}. Text Overlay: "${overlayText}". High quality.`;
    
    const parts: any[] = [];
    if (referenceImageBase64) {
        parts.push({
            inlineData: {
                data: referenceImageBase64.split(',')[1],
                mimeType: referenceImageBase64.split(';')[0].split(':')[1]
            }
        });
    }
    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio, imageSize: imageSize } }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Görsel oluşturulamadı.");
};

export const generateAudioModulation = async (prompt: string): Promise<Modulation[]> => { return []; };
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution) => {
    let modelId = 'gemini-2.5-flash-image';
    let config: any = { imageConfig: { aspectRatio: aspectRatio } };
    if (resolution !== 'standard') {
        modelId = 'gemini-3-pro-image-preview';
        config.imageConfig.imageSize = resolution === 'ultra' ? '4K' : '2K';
    }
    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: prompt }] },
        config: config
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Görsel oluşturulamadı.");
};
export const editImage = async (base64Image: string, prompt: string) => {
    const modelId = 'gemini-2.5-flash-image';
    const data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ inlineData: { mimeType, data } }, { text: prompt }] }
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Görsel düzenlenemedi.");
};
export const generateVideo = async (prompt: string, aspectRatio: string, imageBase64?: string, quality: VideoQuality = 'fast') => {
    const modelId = quality === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
    let operation;
    if (imageBase64) {
        const data = imageBase64.split(',')[1];
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        operation = await ai.models.generateVideos({
            model: modelId,
            prompt: prompt,
            image: { imageBytes: data, mimeType: mimeType },
            config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' }
        });
    } else {
        operation = await ai.models.generateVideos({
            model: modelId,
            prompt: prompt,
            config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' }
        });
    }
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video oluşturulamadı.");
    const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
};

export const generateAudioFromText = async (text: string) => {
    const modelId = 'gemini-2.5-flash-preview-tts';
    const cleanedText = cleanTextForOutput(text);
    const isPodcast = text.includes("Deniz:") || text.includes("Ege:");
    
    let config: any = {
        responseModalities: ["AUDIO"] as any,
    };

    if (isPodcast) {
        config.speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: 'Deniz', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    { speaker: 'Ege', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                ]
            }
        };
    } else {
        config.speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
        };
    }

    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: cleanedText }] },
        config: config
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Ses üretilemedi.");

    return `data:audio/wav;base64,${audioData}`;
};

export const getLiveClient = () => { return ai.live; };


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio, Attachment, Modulation, AppMode, PsychologistSubMode, ImageResolution, VideoQuality, NotebookSource, UserProfile, AIModel, KnowledgeItem } from "../types";
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cleanTextForOutput = (text: string): string => {
    return text
        .replace(/[`]/g, '') 
        .replace(/\n\s*\n/g, '\n') 
        .trim();
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
    let modelId = selectedModel === 'x5' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
    if (useMaps) modelId = 'gemini-2.5-flash';

    const tools: any[] = [];
    // Always enable search for general chat to ensure up-to-date info, unless specific mode forbids it
    if (useSearch || mode === 'chat' || mode === 'finance' || mode === 'agent') tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    const IDENTITY = "KİMLİK: Senin adın Alper. Sen profesyonel, prestijli ve çok yönlü bir yapay zeka asistanısın. Seni kimin geliştirdiğini soran olursa 'İshak Alper tarafından geliştirildim' de, ancak sorulmadıkça bundan bahsetme.";
    const SOCIAL_RULE = `KURALLAR: 
    1. Yanıtların her zaman TÜRKÇE olmalı.
    2. Profesyonel, saygılı ve çözüm odaklı bir dil kullan.
    3. KESİN KURAL: Kullanıcı açıkça talep etmediği sürece ASLA emoji, özel semboller, süslü yazı tipleri veya gereksiz ünlemler kullanma. Sadece standart noktalama işaretleri ve satır boşlukları kullan.
    4. Kullanıcı dostu ve net açıklamalar yap.
    5. Kod yazarken en iyi pratikleri ve modern standartları takip et.
    6. Hashtag kuralı: Eğer kullanıcı hashtag isterse, MUTLAKA başında '#' sembolü ile yaz (Örn: #yapayzeka). Asla sembolsüz yazma.
    7. Bilgilerin güncel olması için Google Arama aracını aktif olarak kullan.`;

    let personaRule = "";
    if (mode === 'lawyer') {
        personaRule = "SENİN ROLÜN: Sen dünya çapında, yenilmez ve en üst düzey bir avukatsın. GÖREVİN: Kullanıcının hukuki sorunlarını (iltica, ceza, hukuk, uluslararası hukuk vb.) en ince ayrıntısına kadar kavramak ve mükemmel bir savunma, dilekçe veya hukuki strateji hazırlamak. Bütün ülkelerin hukuk sistemlerine, adalet verilerine ve hukuki terminolojiye tam olarak hakimsin. Mahkeme kararlarındaki hukuksuzlukları, açıkları ve çelişkileri zekice bulup, emsal kararlar ve kanun maddeleriyle desteklenmiş, reddedilemeyecek kadar güçlü, saygılı ama son derece etkileyici savunmalar yazarsın. DİKKAT: Arayüzde yasal uyarı yoktur. Bu yüzden kullanıcı doğrudan resmi bir işlem veya dilekçe istediğinde, cümlenin uygun bir yerine çok kısa ve profesyonelce 'Bu analizler resmi bir hukuki tavsiye niteliği taşımaz' notunu düş. Ancak bunu her mesajda tekrarlayarak kullanıcıyı sıkma. Asla halüsinasyon görme, sadece gerçek ve mantıklı hukuki argümanlar sun. Bütün dillerdeki kaynakları tarayarak en doğru bilgiyi sadece Türkçe olarak sun. Arayüzde İngilizce kelimeler kullanma.";
    } else if (mode === 'psychologist') {
        personaRule = "SENİN ROLÜN: Sen dünyanın en iyi, en anlayışlı ve en zeki psikoloğu ve terapistisin. GÖREVİN: Psikolojisi bozulmuş, zor durumda olan veya sadece dertleşmek isteyen kullanıcının yazdıklarını kelime kelime, satır satır analiz etmek. Yüzde yüz ikna edici, mantıklı, akıllıca ve çok yaratıcı çözümler sun. Asla halüsinasyon görme veya sahte umutlar verme; gerçekçi, derin ve iyileştirici bir yaklaşım sergile. Kullanıcının duygu durumunu mükemmel kavra ve ona harika bir şekilde yardımcı ol. DİKKAT: Arayüzde tıbbi uyarı yoktur. Bu yüzden kullanıcı klinik bir durumdan bahsettiğinde, cümlenin uygun bir yerine çok kısa ve profesyonelce 'Bu görüşmeler tıbbi bir teşhis veya tedavi yerine geçmez' notunu düş. Ancak bunu her mesajda tekrarlayarak kullanıcıyı sıkma. Bütün dillerdeki psikoloji literatürünü tarayarak en doğru yaklaşımı sadece Türkçe olarak sun. Arayüzde İngilizce kelimeler kullanma.";
    } else if (mode === 'finance') {
        personaRule = "SENİN ROLÜN: Sen dünya çapında uzman bir ekonomist, finansal okuryazarlık eğitmeni ve üst düzey bir finans danışmanısın. GÖREVİN: Kullanıcıyı finansal özgürlüğüne kavuşturmak için motive edici, ikna edici ve son derece profesyonel bir dille rehberlik etmek. Ekonomi, yatırım araçları (Bitcoin, altın, hisse, gayrimenkul vb.) hakkında en güncel ve derin analizleri sun. Zengin olma stratejilerini ve ekonominin sırlarını gerçekçi verilerle anlat. DİKKAT: Arayüzde yasal uyarı yoktur. Bu yüzden kullanıcı doğrudan bir yatırım tavsiyesi istediğinde veya ilk etkileşimde, cümlenin uygun bir yerine çok kısa ve profesyonelce 'Bu analizler yatırım tavsiyesi değildir (YTD)' notunu düş. Ancak bunu her mesajda tekrarlayarak kullanıcıyı sıkma. Son derece donanımlı, cesur, ufuk açıcı ve harekete geçirici ol. Bütün dillerdeki kaynakları tarayarak en doğru bilgiyi sadece Türkçe olarak sun. Arayüzde İngilizce kelimeler kullanma.";
    } else if (mode === 'editor') {
        personaRule = "SENİN ROLÜN: Sen uzman bir metin editörü ve yazarsın. Dilbilgisi, anlatım bozuklukları, yaratıcı yazarlık ve metin düzenleme konularında en üst düzeyde hizmet ver.";
    }

    let systemInstruction = `${IDENTITY} ${SOCIAL_RULE} ${personaRule} Varsayılan dilin Türkçe'dir.`;

    if (selectedModel === 'x5') {
        systemInstruction += " [X5 PRO MODU AKTİF: Karmaşık sorularda derinlemesine analiz yap. ANCAK DİKKAT: 'Merhaba', 'Nasılsın' gibi basit sohbet başlatıcılarında veya kısa sorularda ASLA derin analiz yapma, doğrudan, samimi ve kısa cevap ver. Kullanıcıyı bekletme.]";
    }

    const chat = ai.chats.create({
        model: modelId,
        config: {
            systemInstruction: systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            // thinkingConfig removed to let the model automatically decide the reasoning level
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

export const analyzeAndLearn = async (chatHistory: {role: string, text: string}[]): Promise<KnowledgeItem[]> => { return []; };
export const generateAudioModulation = async (userPrompt: string): Promise<Modulation[]> => { return []; };
export const generateImage = async (prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution) => { 
    let modelId = 'gemini-3.1-flash-image-preview'; 
    let config: any = { imageConfig: { aspectRatio } }; 
    
    if (resolution !== 'standard') { 
        // For higher resolutions or specific needs, we can stick to 3.1 or switch if needed.
        // gemini-3.1-flash-image-preview supports up to 4K.
        config.imageConfig.imageSize = resolution === 'ultra' ? '4K' : '2K'; 
    } 
    
    try {
        const response = await ai.models.generateContent({ 
            model: modelId, 
            contents: { parts: [{ text: prompt }] }, 
            config 
        }); 
        
        if (response.candidates?.[0]?.content?.parts) { 
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } 
        throw new Error("Görsel verisi alınamadı.");
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw new Error("Görsel oluşturulamadı. Lütfen tekrar deneyin.");
    }
};

export const generateVideo = async (prompt: string, aspectRatio: string, imageBase64?: string, quality: VideoQuality = 'fast') => { 
    const modelId = quality === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview'; 
    let operation; 
    
    try {
        if (imageBase64) { 
            operation = await ai.models.generateVideos({ 
                model: modelId, 
                prompt, 
                image: { 
                    imageBytes: imageBase64.split(',')[1], 
                    mimeType: imageBase64.split(';')[0].split(':')[1] 
                }, 
                config: { 
                    numberOfVideos: 1, 
                    aspectRatio: aspectRatio as any, 
                    resolution: '720p' 
                } 
            }); 
        } else { 
            operation = await ai.models.generateVideos({ 
                model: modelId, 
                prompt, 
                config: { 
                    numberOfVideos: 1, 
                    aspectRatio: aspectRatio as any, 
                    resolution: '720p' 
                } 
            }); 
        } 
        
        while (!operation.done) { 
            await new Promise(r => setTimeout(r, 5000)); 
            operation = await ai.operations.getVideosOperation({ operation }); 
        } 
        
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri; 
        if (!videoUri) throw new Error("Video URI alınamadı."); 
        
        // Fetch video with API Key
        const res = await fetch(`${videoUri}&key=${process.env.GEMINI_API_KEY}`); 
        if (!res.ok) throw new Error("Video indirilemedi.");
        
        const blob = await res.blob(); 
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Gemini Video Gen Error:", error);
        throw new Error("Video oluşturulamadı. Lütfen tekrar deneyin.");
    }
};
// Helper to convert base64 to Uint8Array
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to add WAV header to raw PCM data
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1) {
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);

    const pcmBytes = new Uint8Array(buffer, 44);
    pcmBytes.set(pcmData);

    return buffer;
}

export const generateAudioFromText = async (text: string) => { 
    const modelId = 'gemini-2.5-flash-preview-tts'; 
    // Clean text for better speech synthesis (remove markdown symbols)
    // Also truncate to avoid API limits (approx 4000 chars)
    const cleanText = text.replace(/[*#_`]/g, '').trim().slice(0, 4000);
    
    try {
        const response = await ai.models.generateContent({ 
            model: modelId, 
            contents: { parts: [{ text: cleanText }] }, 
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { 
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName: 'Kore' } 
                    } 
                } 
            } 
        }); 
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data; 
        
        if (!audioData) throw new Error("Ses verisi alınamadı."); 

        // Convert base64 PCM to WAV
        const pcmBytes = base64ToUint8Array(audioData);
        const wavBuffer = pcmToWav(pcmBytes);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Gemini TTS Error:", error);
        throw new Error("Ses oluşturulamadı. Lütfen tekrar deneyin.");
    }
};
export const getLiveClient = () => ai.live;
export const generateBookManuscript = async (sources: any[], instructions: string, pageCount: number, style: string) => { const modelId = 'gemini-3-pro-preview'; const response = await ai.models.generateContent({ model: modelId, contents: `Alper Editör: Kitap taslağı. Stil: ${style}. Talimat: ${instructions}` }); return cleanTextForOutput(response.text || "Hata."); };
export const continueBookManuscript = async (current: string, instr: string, style: string) => { const modelId = 'gemini-3-pro-preview'; const response = await ai.models.generateContent({ model: modelId, contents: `Devam et. Stil: ${style}. Taslak: ${current.slice(-2000)}` }); return cleanTextForOutput(response.text || ""); };
export const editImage = async (img: string, pr: string) => { const modelId = 'gemini-2.5-flash-image'; const resp = await ai.models.generateContent({ model: modelId, contents: { parts: [{ inlineData: { mimeType: img.split(';')[0].split(':')[1], data: img.split(',')[1] } }, { text: pr }] } }); if (resp.candidates?.[0]?.content?.parts) { for (const p of resp.candidates[0].content.parts) if (p.inlineData) return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`; } throw new Error("Hata."); };
export const generateNotebookPodcast = async (s: any[], i: string) => { const r = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Podcast. ${i}` }); return cleanTextForOutput(r.text || ""); };
export const generateNotebookVideoScript = async (s: any[], i: string) => { const r = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Video Script. ${i}` }); return cleanTextForOutput(r.text || ""); };
export const generateNotebookVideoPrompt = async (s: any[], i: string) => { const r = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Video Background Prompt. ${i}` }); return r.text || ""; };
export const generateNotebookMindMap = async (s: any[]) => { const r = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Mind Map.` }); return r.text || ""; };
export const generateReply = async (prompt: string, context: string) => { 
    const modelId = 'gemini-3-flash-preview'; 
    const response = await ai.models.generateContent({ 
        model: modelId, 
        contents: `Bağlam: ${context}\n\nİstek: ${prompt}` 
    }); 
    return cleanTextForOutput(response.text || ""); 
};
export const processEditorText = async (text: string, instruction: string, selectedModel: AIModel = 'x5') => {
    const modelId = selectedModel === 'x5' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Aşağıdaki metin üzerinde şu işlemi gerçekleştir:\n\nİŞLEM: ${instruction}\n\nMETİN:\n${text}`,
            config: {
                systemInstruction: "Sen uzman bir metin editörü, yazar ve dilbilimcisin. Verilen metni istenen talimata göre kusursuz bir şekilde düzenle. KESİNLİKLE markdown sembolleri (*, **, #, _, vb.) KULLANMA. Metin bir kitabın sayfaları gibi tertemiz olmalı. Başlıkları sadece BÜYÜK HARFLE yaz. Asla 'İşte metniniz' gibi sohbet ifadeleri kullanma. Sadece istenen sonucu ver. ÇOK ÖNEMLİ: SANA VERİLEN METNİ ASLA ÖZETLEME, KISALTMA VEYA SİLME. ÇIKTI UZUNLUĞU GİRDİ UZUNLUĞUYLA AYNI OLMALIDIR."
            }
        });
        
        // Ekstra güvenlik: Eğer model inatla yıldız veya kare kullanırsa temizle (başlıklar hariç)
        let cleanText = response.text || "";
        cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
        
        return cleanText;
    } catch (error) {
        console.error("Editor processing error:", error);
        throw new Error("Metin işlenirken bir hata oluştu. Metin çok uzun olabilir veya sunucu yanıt vermiyor.");
    }
};

export const generateStudyGuide = async (s: any[], i: string) => { const r = await ai.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: `Study Guide. ${i}` }); return cleanTextForOutput(r.text || ""); };
export const generateQuiz = async (s: any[], i: string) => { const r = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Quiz. ${i}` }); return cleanTextForOutput(r.text || ""); };
export const generateYouTubeAsset = async (v: string, o: string, t: any, s: string, rI?: string, res: any = 'hd') => { const modelId = 'gemini-3-pro-image-preview'; let aspectRatio: AspectRatio = t === 'profile' ? '1:1' : t === 'shorts' ? '9:16' : '16:9'; const response = await ai.models.generateContent({ model: modelId, contents: { parts: [{ text: `YouTube ${t}. Style: ${s}. ${v}. Text: ${o}` }] }, config: { imageConfig: { aspectRatio } } }); if (response.candidates?.[0]?.content?.parts) { for (const p of response.candidates[0].content.parts) if (p.inlineData) return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`; } throw new Error("Hata."); };


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type AppMode = 'chat' | 'image' | 'video' | 'live' | 'maps' | 'notebook' | 'thumbnail' | 'editor' | 'psychologist' | 'consultant' | 'finance' | 'personal_coach' | 'lawyer' | 'agent' | 'memory';
export type PsychologistSubMode = 'therapy' | 'academic';
export type AIModel = 'x3' | 'x5'; // x3 = fast, x5 = thinking/pro

export interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    role: string;
    bio: string;
    avatar?: string;
    preferences: {
        allowBackgroundProcessing: boolean;
        dailyBriefing: boolean;
        notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
        theme: 'dark' | 'light';
    };
    // Local learned facts cache
    learnedFacts?: string[]; 
}

export interface KnowledgeItem {
    id: string;
    topic: string; // e.g., "User Preference", "Correction", "Personal Detail"
    fact: string;
    confidence: number;
    timestamp: number;
    sourceSessionId: string;
}

export interface SavedSession {
    id: string;
    date: number;
    mode: AppMode;
    title: string; 
    preview: string; 
    messages: ChatMessage[];
}

export interface Attachment {
    data: string; // base64
    mimeType: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    attachments?: Attachment[]; 
    groundingMetadata?: any;
    isError?: boolean;
}

export interface GeneratedMedia {
    id: string;
    type: 'image' | 'video' | 'thumbnail';
    url: string;
    prompt: string;
    timestamp: number;
    aspectRatio: string;
}

export interface NotebookSource {
    id: string;
    title: string;
    content: string; 
    type: 'text' | 'file' | 'youtube';
    mimeType?: string; 
    url?: string; 
}

export interface NotebookEntry {
    id: string;
    type: 'podcast' | 'video_summary' | 'mind_map' | 'reports' | 'flashcards' | 'quiz' | 'infographic' | 'slides';
    title: string;
    content: string; 
    isLoading?: boolean;
    customInstruction?: string; 
}

export interface SocialFormat {
    label: string;
    platform: string;
    value: string;
    icon: string;
    description: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
export type ImageResolution = 'standard' | 'hd' | 'ultra'; 
export type VideoQuality = 'fast' | 'quality'; 

export const SOCIAL_FORMATS: { [key: string]: SocialFormat } = {
    YOUTUBE: { label: 'Yatay (Video)', platform: 'YouTube', value: '16:9', icon: 'smart_display', description: 'Video (1920x1080)' },
    TIKTOK: { label: 'Dikey (Shorts/Reels)', platform: 'TikTok/Instagram', value: '9:16', icon: 'phonelink_ring', description: 'Shorts (1080x1920)' },
    INSTAGRAM: { label: 'Kare (Gönderi)', platform: 'Instagram', value: '1:1', icon: 'photo_camera', description: 'Gönderi (1080x1080)' },
};

export enum AiStage {
    IDLE = 0,
    ADJUSTING_SLIDERS = 1,
    SMART_SLIDER_CREATION = 2,
    MODIFYING_CODE = 3,
    ENABLE_CAMERA_CONTROLS = 4
}

export interface Slider {
    variableName: string;
    name: string;
    description: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
}

export interface SliderSuggestion {
    suggestion: string;
    type: 'safe' | 'experimental';
}

export interface TerraformTarget {
    variableName: string;
    type: 'velocity';
    magnitude: number;
    probability?: number;
}

export interface TerraformConfig {
    targets: TerraformTarget[];
}

export interface ControlConfig {
    invertForward?: boolean;
    invertStrafe?: boolean;
    invertAscend?: boolean;
    invertPitch?: boolean;
    invertYaw?: boolean;
    forwardVelocity?: number;
    strafeVelocity?: number;
    ascendVelocity?: number;
    pitchVelocity?: number;
    yawVelocity?: number;
}

export type ModulationSource = 'speed' | 'acceleration' | 'altitude' | 'descent' | 'turning' | 'turningSigned' | 'heading' | 'pitch' | 'proximity' | 'time';

export type ModulationTarget = 
    'masterVolume' | 
    'drone.gain' | 'drone.filter' | 'drone.pitch' |
    'atmosphere.gain' | 
    'arp.gain' | 'arp.speed' | 'arp.filter' | 'arp.octaves' | 'arp.direction' |
    'rhythm.gain' | 'rhythm.filter' | 'rhythm.bpm' |
    'melody.gain' | 'melody.density' |
    'reverb.mix' | 'reverb.tone';

export interface Modulation {
    id: string;
    enabled: boolean;
    source: ModulationSource;
    target: ModulationTarget;
    amount: number;
}

export interface SoundConfig {
    enabled: boolean;
    masterVolume: number;
    reverb: {
        enabled: boolean;
        mix: number;
        decay: number;
        tone: number;
    };
    drone: {
        enabled: boolean;
        gain: number;
        filter: number;
        pitch: number;
    };
    atmosphere: {
        enabled: boolean;
        gain: number;
        texture: string;
    };
    melody: {
        enabled: boolean;
        gain: number;
        density: number;
        scale: "dorian" | "phrygian" | "lydian";
    };
    arp: {
        enabled: boolean;
        gain: number;
        speed: number;
        octaves: number;
        filter: number;
        direction?: 'up' | 'down' | 'updown' | 'random';
    };
    rhythm: {
        enabled: boolean;
        gain: number;
        bpm: number;
        filter: number;
        // ...
    };
    modulations?: Modulation[];
}

export interface CameraData {
    position: number[];
    rotation: number[];
    roll: number;
}

export type ViewMode = 'cockpit' | 'chase';

export type ShipModulationTarget = 
    'complexity' |
    'fold1' | 'fold1AsymX' |
    'fold2' | 'fold2AsymX' |
    'fold3' |
    'scale' | 'scaleAsymX' |
    'stretch' |
    'taper' |
    'twist' | 'twistAsymX' |
    'asymmetryX' |
    'asymmetryY' |
    'asymmetryZ';

export interface ShipModulation {
    id: string;
    enabled: boolean;
    source: ModulationSource;
    target: ShipModulationTarget;
    amount: number;
}

export interface ShipConfig {
    complexity: number;
    fold1: number;
    fold2: number;
    fold3: number;
    scale: number;
    stretch: number;
    taper: number;
    twist: number;
    asymmetryX: number;
    asymmetryY: number;
    asymmetryZ: number;
    twistAsymX: number;
    scaleAsymX: number;
    fold1AsymX: number;
    fold2AsymX: number;
    chaseDistance: number;
    chaseVerticalOffset: number;
    pitchOffset: number;
    generalScale: number;
    translucency: number;
    modulations?: ShipModulation[];
}

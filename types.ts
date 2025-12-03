
export enum ViewMode {
  IDEATION = 'IDEATION',
  STRUCTURE = 'STRUCTURE',
  EDITOR = 'EDITOR',
  ETHICS = 'ETHICS',
  VISUAL_STUDIO = 'VISUAL_STUDIO',
  RESEARCH = 'RESEARCH',
  PUBLISH = 'PUBLISH'
}

export enum ContentFormat {
  JOURNALISM = 'Journalism',
  FICTION = 'Fiction',
  NON_FICTION = 'Non-fiction',
  POETRY = 'Poetry',
  DRAMA = 'Drama',
  GRAPHIC_NOVEL = 'Graphic Novel'
}

export enum OutlineDepth {
  BRIEF = 'Brief',
  DETAILED = 'Detailed',
  COMPREHENSIVE = 'Comprehensive'
}

export interface ContentConcept {
  headline: string;
  summary: string;
  angle: string;
  format: ContentFormat;
  language?: string;
}

export interface ArticleIdea extends ContentConcept {} // Backward compatibility if needed

export interface EthicsIssue {
  type: 'bias' | 'verification' | 'tone' | 'privacy' | 'truthfulness' | 'independence';
  severity: 'high' | 'medium' | 'low';
  text: string;
  suggestion: string;
}

export interface EthicsReport {
  score: number;
  summary: string;
  issues: EthicsIssue[];
  positiveNotes: string[];
}

export interface DeepAnalysisReport {
  type: 'plot' | 'pacing' | 'character' | 'style';
  score: number;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ProofreadItem {
  original: string;
  suggestion: string;
  reason: string;
  type: 'grammar' | 'spelling' | 'style' | 'passive_voice';
}

export interface PlagiarismResult {
  originalityScore: number;
  sources: { title: string; uri: string }[];
  analysis: string;
}

export interface EditorState {
  title: string;
  content: string;
  lastUpdated: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  archetype: string;
  backstory: string;
  motivation: string;
  visualDescription: string;
  portraitUrl?: string;
}

export interface CoverAnalysis {
  score: number;
  marketability: string;
  critique: string;
  suggestions: string[];
}

// --- RESEARCH CENTER TYPES ---

export enum ResearchAgentType {
  GOOGLE = 'Google (Facts)',
  AMAZON = 'Amazon (Market)',
  PERPLEXITY = 'Perplexity (Deep Dive)',
  YOUTUBE = 'YouTube (Trends)',
  GOOGLE_NEWS = 'Google News',
  WALMART = 'Walmart (Retail)',
  SHOPIFY = 'Shopify (E-com)'
}

export interface ResearchResult {
  query: string;
  agent: ResearchAgentType;
  summary: string;
  keyInsights: string[];
  sources: { title: string; uri: string }[];
}

export interface CompetitorReport {
  target: string;
  weaknesses: string[];
  marketGaps: string[];
  strategy: string; // "How to outperform"
  outmaneuverTactics: string[];
  sources?: { title: string; uri: string }[];
}

export interface BioTimelineEvent {
  date: string;
  event: string;
  significance: string;
}

export interface InterviewGuide {
  subject: string;
  angle: string;
  questions: { phase: string; question: string; purpose: string }[];
}

// --- PUBLISHING TYPES ---

export interface ReadabilityMetrics {
  gradeLevel: string; // e.g. "8th Grade"
  score: number; // 0-100 (Flesch reading ease)
  complexSentenceCount: number;
  estimatedReadingTime: string;
  suggestions: string[];
}

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface AudiobookTrack {
  id: string;
  title: string;
  voice: VoiceName;
  duration: number; // in seconds
  url: string; // blob url
  createdAt: Date;
}

// --- VISUAL STUDIO TYPES ---
export type ImageResolution = '1K' | '2K' | '4K';

// --- MANUSCRIPT MANAGEMENT ---

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  type: 'creation' | 'edit' | 'ai_assist' | 'system' | 'visual' | 'audio';
  details?: string;
}

export interface Manuscript {
  id: string;
  title: string;
  content: string;
  outline: string;
  format: ContentFormat;
  language: string;
  lastUpdated: Date;
  history: HistoryEntry[];
  coverImage?: string;
}

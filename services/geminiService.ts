
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { 
  ContentConcept, EthicsReport, ContentFormat, OutlineDepth, ChatMessage, 
  CharacterProfile, CoverAnalysis, DeepAnalysisReport, ProofreadItem, PlagiarismResult,
  ResearchAgentType, ResearchResult, CompetitorReport, BioTimelineEvent, InterviewGuide,
  ReadabilityMetrics, VoiceName, ImageResolution
} from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-2.5-flash'; 
const MODEL_IMAGE_NANO = 'gemini-2.5-flash-image';
const MODEL_IMAGE_PRO = 'gemini-3-pro-image-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

export const generateContentConcepts = async (topic: string, format: ContentFormat, language: string = 'English'): Promise<ContentConcept[]> => {
  try {
    let promptContext = "";
    switch (format) {
      case ContentFormat.FICTION:
        promptContext = "Generate 4 fiction story concepts. Focus on plot hooks, character conflicts, and themes.";
        break;
      case ContentFormat.NON_FICTION:
        promptContext = "Generate 4 non-fiction book or essay concepts. Focus on thesis statements and target audience value.";
        break;
      case ContentFormat.POETRY:
        promptContext = "Generate 4 poetic themes or collections. Focus on imagery, style, and emotional resonance.";
        break;
      case ContentFormat.DRAMA:
        promptContext = "Generate 4 stage play or screenplay concepts. Focus on dramatic tension and setting.";
        break;
      case ContentFormat.GRAPHIC_NOVEL:
        promptContext = "Generate 4 graphic novel concepts. Focus on visual style, world-building, and character arcs.";
        break;
      default:
        promptContext = "Generate 4 journalistic article ideas. Focus on different angles: investigative, human interest, analytical, and opinion.";
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${promptContext} 
      
      Topic: "${topic}".
      Target Language: "${language}". 
      
      Ensure the headlines, summaries, and angles are returned in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Title or Headline in target language" },
              summary: { type: Type.STRING, description: "Description of the concept in target language" },
              angle: { type: Type.STRING, description: "The specific genre, tone, or angle in target language" }
            },
            required: ["headline", "summary", "angle"]
          }
        }
      }
    });

    if (response.text) {
      const ideas = JSON.parse(response.text) as any[];
      return ideas.map(idea => ({ ...idea, format, language }));
    }
    return [];
  } catch (error) {
    console.error("Error generating concepts:", error);
    throw error;
  }
};

export const generateOutline = async (
  title: string, 
  summary: string, 
  format: ContentFormat, 
  template: string, 
  depth: OutlineDepth,
  language: string = 'English'
): Promise<string> => {
  try {
    let formatInstruction = "";
    switch(format) {
      case ContentFormat.DRAMA: 
        formatInstruction = "Structure this as a dramatic script outline. Break it down by Acts and Scenes. Describe the setting and key conflict for each scene.";
        break;
      case ContentFormat.GRAPHIC_NOVEL: 
        formatInstruction = "Structure this as a graphic novel script outline. Break it down by Issues or Chapters, and specify key visual beats or page layouts where appropriate."; 
        break;
      case ContentFormat.POETRY: 
        formatInstruction = "Structure this as a poetic sequence or collection. Describe the theme, imagery, and form (meter/rhyme) for each section or stanza."; 
        break;
      case ContentFormat.FICTION:
        formatInstruction = "Structure this as a narrative outline with Chapters and Scenes.";
        break;
      default: 
        formatInstruction = "Break down the narrative or content flow logically.";
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as a master editor and structurist. Create a ${depth.toLowerCase()} outline for a ${format} piece titled "${title}".
      
      Summary of the work: "${summary}"
      Structure Template to use: "${template}"
      Target Language: "${language}"
      
      Format Requirements:
      ${formatInstruction}
      
      Please provide a well-formatted markdown outline in ${language}.`,
      config: {
        thinkingConfig: depth === OutlineDepth.COMPREHENSIVE ? { thinkingBudget: 2048 } : undefined
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Outline generation failed:", error);
    throw error;
  }
}

export const runEthicsAudit = async (content: string, title: string, format: string): Promise<EthicsReport> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: `Act as the Book@Lire-AI Ethics Committee, responsible for ensuring strict compliance with journalistic and publishing principles. 
      Analyze the following ${format} draft (Title: ${title}).
      
      Your mandate is to evaluate:
      1. Truthfulness & Accuracy: Is information presented as fact verifiable? Are opinions clearly distinguished?
      2. Independence: Are there signs of hidden bias, commercial conflict of interest, or undue influence?
      3. Source Protection & Privacy: Are individuals unfairly exposed? Are sources cited or protected appropriately?
      4. Harm Limitation: Does the content incite hate, endanger subjects, or cause unnecessary harm?
      
      Draft Content:
      ${content}
      `,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Compliance score from 0-100" },
            summary: { type: Type.STRING, description: "Executive summary from the Ethics Committee" },
            positiveNotes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['bias', 'verification', 'tone', 'privacy', 'truthfulness', 'independence'] },
                  severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  text: { type: Type.STRING, description: "The specific text segment causing concern" },
                  suggestion: { type: Type.STRING, description: "Actionable advice to fix it" }
                },
                required: ["type", "severity", "text", "suggestion"]
              }
            }
          },
          required: ["score", "summary", "issues", "positiveNotes"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EthicsReport;
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Ethics audit failed:", error);
    throw error;
  }
};

export const runDeepAnalysis = async (content: string, type: 'plot' | 'pacing' | 'character' | 'style', format: string): Promise<DeepAnalysisReport> => {
  try {
    let specificPrompt = "";
    switch(type) {
        case 'plot': specificPrompt = "Analyze the narrative arc, conflict resolution, and plot holes."; break;
        case 'pacing': specificPrompt = "Analyze the flow, rhythm, and speed of the narrative. Identify dragging sections."; break;
        case 'character': specificPrompt = "Analyze character motivation, consistency, and development."; break;
        case 'style': specificPrompt = "Analyze the voice, tone, and use of passive voice."; break;
    }

    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Act as the Book@Lire-AI Editorial Board. Perform a deep analysis on the ${format} text below.
        
        Focus: ${specificPrompt}
        
        Text: "${content.slice(0, 30000)}..."`, // Limit text context if needed
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: [type] },
                    score: { type: Type.NUMBER },
                    analysis: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["type", "score", "analysis", "strengths", "weaknesses"]
            }
        }
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("Analysis failed");
  } catch (error) {
      console.error(error);
      throw error;
  }
};

export const runProofread = async (content: string): Promise<ProofreadItem[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: `Act as a meticulous Copy Editor. Proofread the following text. 
            Look for grammar errors, spelling mistakes, passive voice misuse, and awkward phrasing.
            Return a JSON array of issues.
            
            Text: "${content.slice(0, 15000)}..."`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            suggestion: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['grammar', 'spelling', 'style', 'passive_voice'] }
                        },
                        required: ["original", "suggestion", "reason", "type"]
                    }
                }
            }
        });
        if (response.text) return JSON.parse(response.text);
        return [];
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const checkPlagiarism = async (content: string): Promise<PlagiarismResult> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_FAST, // Use a model that supports tools
            contents: `Check this text for potential plagiarism or unoriginal content. 
            Search for unique phrases or distinctive ideas in the text against the web.
            
            Text Snippet: "${content.slice(0, 2000)}"`, // Check snippet
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        // Extract grounding metadata
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks
            .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
            .filter((s: any) => s !== null);
        
        // Remove duplicates
        const uniqueSources = Array.from(new Set(sources.map((s: any) => s.uri)))
            .map(uri => sources.find((s: any) => s.uri === uri));

        return {
            originalityScore: uniqueSources.length > 0 ? Math.max(0, 100 - (uniqueSources.length * 15)) : 100,
            sources: uniqueSources,
            analysis: response.text || "No specific matches found in the analysis text, but check the sources."
        };
    } catch (error) {
        console.error("Plagiarism check failed:", error);
        return { originalityScore: 100, sources: [], analysis: "Could not perform search." };
    }
};

export const fixPlagiarism = async (content: string, analysis: PlagiarismResult): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as an academic editor. Rewrite the following text to address plagiarism concerns detected in an audit.
      
      1. Paraphrase sections that are too close to the original sources to improve originality.
      2. Add inline citations (e.g., [Source Title]) where appropriate based on the provided source list.
      3. Maintain the original meaning and tone.
      
      Plagiarism Analysis Context: "${analysis.analysis}"
      Found Sources: ${analysis.sources.map(s => `${s.title} (${s.uri})`).join(', ')}
      
      Original Text:
      "${content}"
      
      Return ONLY the revised text.`,
    });
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Plagiarism fix failed:", error);
    throw error;
  }
};

export const improveWriting = async (text: string, instruction: string, useThinking: boolean = false): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as the Book@Lire-AI Editorial Team. Perform the following task on the text provided.
      
      Task: ${instruction}
      
      Text to process:
      "${text}"
      
      Return ONLY the improved/processed text. Do not add conversational filler.`,
      config: {
        thinkingConfig: useThinking ? { thinkingBudget: 4096 } : undefined
      }
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Improvement failed:", error);
    return text;
  }
};

export const enrichText = async (text: string, useThinking: boolean = false): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as the Creative Director. Your task is to ENRICH the selected text.
      
      Directives:
      1. Add sensory details (sight, sound, smell, touch, taste).
      2. Infuse emotional depth and vivid descriptions.
      3. CRITICAL: Do NOT change the underlying plot or events.
      4. CRITICAL: Keep the length similar to the original (do not significantly expand).
      
      Original Text:
      "${text}"`,
      config: {
        thinkingConfig: useThinking ? { thinkingBudget: 2048 } : undefined
      }
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Enrichment failed:", error);
    return text;
  }
};

export const continueNarrative = async (currentContent: string, format: string): Promise<string> => {
  try {
    let formatInstruction = "Match the tone, style, and narrative voice exactly.";
    
    // Check against enum values string
    if (format === ContentFormat.DRAMA) {
      formatInstruction = "Write in standard Play/Screenplay Script format. Center character names. Use italics for stage directions. Focus on dialogue and dramatic action.";
    } else if (format === ContentFormat.GRAPHIC_NOVEL) {
      formatInstruction = "Write in Comic Script format. Use 'Page X, Panel Y' headers. Describe the visual for each panel, followed by Character Dialogue/Captions.";
    } else if (format === ContentFormat.POETRY) {
      formatInstruction = "Write in Verse. Pay close attention to rhythm, meter, and line breaks appropriate for the poetic style.";
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as a co-author for a ${format} piece. 
      Read the context below and write the next segment.
      
      Format Constraints:
      ${formatInstruction}
      
      Current Content Context (last 1000 chars):
      "...${currentContent.slice(-1000)}"
      
      Continue the work:`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Continue narrative failed:", error);
    return "";
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Translate the following literary text into ${targetLanguage}. 
      Preserve the original tone, stylistic nuances, and formatting.
      
      Text:
      "${text}"`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
};

export const sendChatMessage = async (history: ChatMessage[], currentContext: string, newMessage: string): Promise<string> => {
  try {
    const contextPrompt = `You are the Book@Lire-AI AI Co-Author, part of the editorial team.
    The user is currently writing a piece. 
    Context snippet of their work: "${currentContext.slice(-500)}..."
    
    Answer the user's question or brainstorm with them based on this context. Be concise, professional, and helpful.`;

    const chat = ai.chats.create({
      model: MODEL_FAST,
      config: { systemInstruction: contextPrompt },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Chat failed:", error);
    return "Sorry, I encountered an error.";
  }
};

// --- VISUAL STUDIO SERVICES ---

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '3:4' | '16:9' = '1:1', resolution: ImageResolution = '1K'): Promise<string> => {
  try {
    // IMPORTANT: Create a new instance to ensure we pick up the API key if it was just selected by the user.
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const isPro = resolution === '2K' || resolution === '4K';
    const model = isPro ? MODEL_IMAGE_PRO : MODEL_IMAGE_NANO;

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (isPro) {
      config.imageConfig.imageSize = resolution;
    }

    const response = await freshAi.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const analyzeImageAesthetics = async (base64Data: string): Promise<CoverAnalysis> => {
  try {
    const cleanBase64 = base64Data.split(',')[1] || base64Data;
    
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', 
              data: cleanBase64
            }
          },
          {
            text: `Analyze this book cover design. Evaluate its visual impact, typography potential, and marketability. 
            Assign a score out of 100.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            marketability: { type: Type.STRING },
            critique: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "marketability", "critique", "suggestions"]
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as CoverAnalysis;
    }
    throw new Error("Analysis failed");
  } catch (error) {
    console.error("Aesthetic analysis failed:", error);
    throw error;
  }
};

export const createCharacterProfile = async (name: string, role: string, roughTraits: string): Promise<CharacterProfile> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Create a detailed character profile for a story.
      Name: ${name}
      Role/Archetype: ${role}
      Rough Traits: ${roughTraits}
      
      Generate a deep backstory, hidden motivation, and a highly detailed visual description prompt for an image generator.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            archetype: { type: Type.STRING },
            backstory: { type: Type.STRING },
            motivation: { type: Type.STRING },
            visualDescription: { type: Type.STRING, description: "A photorealistic image prompt description" }
          },
          required: ["name", "role", "archetype", "backstory", "motivation", "visualDescription"]
        }
      }
    });
    
    if (response.text) {
      const profile = JSON.parse(response.text) as CharacterProfile;
      profile.id = Date.now().toString();
      return profile;
    }
    throw new Error("Profile generation failed");
  } catch (error) {
    console.error("Character generation failed:", error);
    throw error;
  }
};

// --- RESEARCH & STRATEGY SERVICES ---

export const runAgentResearch = async (query: string, agent: ResearchAgentType): Promise<ResearchResult> => {
  try {
    let searchInstructions = "";
    let systemPersona = "";

    switch(agent) {
      case ResearchAgentType.AMAZON:
        // Amazon Mode: Market Intelligence
        searchInstructions = `Search query: site:amazon.com "best sellers" ${query} books`;
        systemPersona = `You are an Amazon Market Intelligence Analyst.
        Your goal is to reverse-engineer success in the book market.
        
        Analyze the search results to determine:
        1. Winning Tropes & Themes: What recurring elements appear in best-sellers?
        2. Reader Sentiment: What do readers love or hate (based on reviews/descriptions)?
        3. Packaging: Note any trends in titles or blurbs.
        
        Output a strategic market breakdown.`;
        break;

      case ResearchAgentType.PERPLEXITY:
        // Perplexity Mode: Deep Dive
        searchInstructions = `Search query: ${query} comprehensive analysis deep dive`;
        systemPersona = `You are a Deep Dive Synthesis Engine (emulating Perplexity AI).
        Your goal is to provide a comprehensive, nuanced answer.
        
        Directives:
        1. Exhaustiveness: Cover multiple angles (historical, technical, social).
        2. Synthesis: Don't just list links; connect facts into a cohesive narrative.
        3. Accuracy: Prioritize high-quality sources (academic, reputable news).
        4. Structure: Use clear sections for readability.`;
        break;

      case ResearchAgentType.YOUTUBE:
        // YouTube Mode: Search Term Analysis & Trends
        searchInstructions = `Search query: site:youtube.com "${query}" (views OR review OR tutorial)`;
        systemPersona = `You are a Video Trends Analyst. 
        Perform a specific Search Term Analysis for the topic: "${query}".
        
        Analyze the search results to identify:
        1. High-Performing Keywords: What words appear in top video titles?
        2. Content Gaps: What questions are viewers asking in comments or descriptions?
        3. Trending Formats: Are tutorials, essays, or reaction videos dominating?
        
        Synthesize this into a strategy for video content.`;
        break;

      case ResearchAgentType.GOOGLE_NEWS:
        // News Mode: Headlines & Narrative Analysis
        searchInstructions = `Search query: ${query} (news OR headlines OR "breaking news")`;
        systemPersona = `You are a Media Narrative Analyst.
        Perform a Search Term Analysis on the latest news cycle regarding: "${query}".
        
        Identify:
        1. Dominant Keywords: What terms are recurring in headlines?
        2. Narrative Angles: How is the media framing this story?
        3. Key Entities: Who are the main people or organizations driving the search volume?
        
        Output a media landscape report.`;
        break;
        
      case ResearchAgentType.WALMART:
        // Walmart Mode: Mass Market Retail Analysis
        searchInstructions = `Search query: site:walmart.com "${query}" ("customer reviews" OR "best seller")`;
        systemPersona = `You are a Mass Market Retail Analyst.
        Perform a Search Term Analysis for Walmart shoppers on: "${query}".
        
        Analyze:
        1. Product Keywords: What adjectives are used in best-selling product titles?
        2. Price Sensitivity: What price points are most common in search results?
        3. Customer Pain Points: What negative keywords appear in reviews or lower-rated items?
        
        Output a retail optimization strategy.`;
        break;

      case ResearchAgentType.SHOPIFY:
        // Shopify Mode: DTC & Niche Analysis
        searchInstructions = `Search query: site:myshopify.com "${query}"`;
        systemPersona = `You are a DTC (Direct-to-Consumer) Brand Scout.
        Perform a Search Term Analysis for independent brands selling: "${query}".
        
        Identify:
        1. Niche Keywords: What unique terminology do indie brands use to differentiate?
        2. Value Propositions: What claims (e.g., "sustainable", "hand-crafted") appear most?
        3. Branding Trends: What aesthetic or tone keywords are trending in this niche?
        
        Output a brand positioning analysis.`;
        break;

      default: // Google
        searchInstructions = `Search query: ${query}`;
        systemPersona = `You are a Lead Web Researcher. 
        Provide a factual summary verifying key details, dates, and established consensus.
        Avoid speculation; stick to verified information.`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${systemPersona}
      
      Task: Perform research using Google Search.
      ${searchInstructions}
      
      Synthesize the results into a detailed report with key insights.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
      .filter((s: any) => s !== null);
      
    // Deduplicate sources
    const uniqueSources = Array.from(new Set(sources.map((s: any) => s.uri)))
            .map(uri => sources.find((s: any) => s.uri === uri));

    return {
      query,
      agent,
      summary: response.text || "No insights found.",
      keyInsights: [], // We could parse bullets if we asked for structured output, or just let summary handle it
      sources: uniqueSources
    };
  } catch (error) {
    console.error("Research failed:", error);
    throw error;
  }
};

export const generateCompetitorAnalysis = async (target: string, genre: string): Promise<CompetitorReport> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as a ruthless publishing strategist. 
      First, search for "${target}" books in the "${genre}" genre, focusing on reader reviews (Amazon, Goodreads) and critical reception to identify specific complaints and praise.
      
      Then, based *only* on the gathered intelligence, conduct a SWOT analysis.
      Identify their specific weaknesses (what readers hate), market gaps (what readers want but aren't getting), and strategies to outmaneuver them.
      
      Return a valid JSON object with the following structure:
      {
        "target": "${target}",
        "weaknesses": ["string", "string"],
        "marketGaps": ["string", "string"],
        "strategy": "string",
        "outmaneuverTactics": ["string", "string"]
      }`,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" // Removing strict JSON enforcement to allow tools
      }
    });

    // Extract text and try to parse JSON
    let text = response.text || "";
    // Robustly extract JSON block if wrapped in code fence
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        text = jsonMatch[0];
    }
    
    const report = JSON.parse(text) as CompetitorReport;

    // Extract sources from Google Search
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
      .filter((s: any) => s !== null);
      
    // Deduplicate sources
    const uniqueSources = Array.from(new Set(sources.map((s: any) => s.uri)))
            .map(uri => sources.find((s: any) => s.uri === uri));
            
    report.sources = uniqueSources;

    return report;
  } catch (error) {
    console.error("Competitor analysis error:", error);
    throw error;
  }
};

export const generateBiographyTimeline = async (subject: string): Promise<BioTimelineEvent[]> => {
  try {
     const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Create a chronological timeline of key events for: ${subject}. 
      Focus on pivotal moments that shaped their narrative.`,
      config: {
        tools: [{ googleSearch: {} }], // Use search to get real dates
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              event: { type: Type.STRING },
              significance: { type: Type.STRING }
            },
            required: ["date", "event", "significance"]
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return [];
  } catch (error) {
    console.error("Timeline generation error:", error);
    throw error;
  }
};

export const generateBiographyNarrative = async (facts: string, tone: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as a master biographer. Transform the provided raw notes and facts into a compelling, cohesive narrative section.
      
      Tone/Style: ${tone}
      
      Raw Facts:
      "${facts}"
      
      Write the narrative:`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Bio narrative failed:", error);
    throw error;
  }
};

export const generateInterviewQuestions = async (subject: string, angle: string): Promise<InterviewGuide> => {
   try {
     const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Create an interview guide for ${subject}. Angle: ${angle}.
      Generate deep, psychological questions organized by interview phase.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            angle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                 type: Type.OBJECT,
                 properties: {
                    phase: { type: Type.STRING },
                    question: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                 },
                 required: ["phase", "question", "purpose"]
              }
            }
          },
          required: ["subject", "angle", "questions"]
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("Interview guide failed");
  } catch (error) {
    console.error("Interview guide error:", error);
    throw error;
  }
};

// --- PUBLISHING SERVICES (TTS & READABILITY) ---

// Helper: Decode Base64 to ArrayBuffer
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Decode Audio Data
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper: AudioBuffer to WAV Blob
function bufferToWav(abuffer: AudioBuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < abuffer.length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);          // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: any) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: any) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Clean text specifically for TTS quality
const cleanTextForTTS = (text: string): string => {
  return text
    // Remove markdown symbols (bold, italic, strikethrough)
    .replace(/[*_~`]/g, '')
    // Remove markdown headers markers at start of lines (e.g. ## Header)
    .replace(/^#+\s+/gm, '')
    // Remove markdown links but keep text: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images: ![alt](url) -> empty
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Collapse multiple newlines/spaces into single pauses
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const generateAudiobookChapter = async (text: string, voiceName: VoiceName): Promise<{url: string, duration: number}> => {
  try {
    const cleanedText = cleanTextForTTS(text);
    
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: cleanedText }] }], // Use cleaned text
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    // Decode audio to get duration and ensure valid format
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    
    // Close context as we just needed it for decoding/duration
    await audioContext.close();
    
    // Convert to WAV Blob
    const wavBlob = bufferToWav(audioBuffer);
    return {
      url: URL.createObjectURL(wavBlob),
      duration: audioBuffer.duration
    };
    
  } catch (error) {
    console.error("Audio generation failed:", error);
    throw error;
  }
};

export const analyzeReadability = async (text: string): Promise<ReadabilityMetrics> => {
   try {
     const response = await ai.models.generateContent({
       model: MODEL_FAST,
       contents: `Analyze the readability of the following text. 
       Calculate the approximate Grade Level and Reading Ease. 
       Count complex sentences.
       
       Text: "${text.slice(0, 10000)}"`,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
            type: Type.OBJECT,
            properties: {
               gradeLevel: { type: Type.STRING },
               score: { type: Type.NUMBER },
               complexSentenceCount: { type: Type.NUMBER },
               estimatedReadingTime: { type: Type.STRING },
               suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["gradeLevel", "score", "complexSentenceCount", "estimatedReadingTime", "suggestions"]
         }
       }
     });

     if (response.text) return JSON.parse(response.text);
     throw new Error("Readability analysis failed");
   } catch (error) {
     console.error("Readability failed", error);
     throw error;
   }
};

export const applyReadabilitySuggestions = async (text: string, suggestions: string[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Act as a professional editor. Rewrite the following text to specifically address the readability suggestions provided below.
      
      Improve clarity, flow, and structure while maintaining the original meaning and tone.
      
      Suggestions to apply:
      ${suggestions.map(s => `- ${s}`).join('\n')}
      
      Original Text:
      "${text}"
      
      Return ONLY the revised text.`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Applying suggestions failed:", error);
    throw error;
  }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customerSupportTools } from "./tools/customer-support";
import { personalAssistantTools } from "./tools/personal-assistant";
import { navigationSystemTools } from "./tools/navigation-system";

export type Template =
  | "customer-support"
  | "personal-assistant"
  | "navigation-system";

const toolsets: Record<Template, FunctionCall[]> = {
  "customer-support": customerSupportTools,
  "personal-assistant": personalAssistantTools,
  "navigation-system": navigationSystemTools,
};

export const NON_NEGOTIABLE_RULES = `
NON-NEGOTIABLE RULES:
1. Act exclusively like a normal human being, a friend. Very casual, natural, unstructured, and concise. Your tone MUST be conversational, grounded, chill, and normal pitch.
2. NEVER be "meta" about being an AI, an assistant, or a system. Do not use corporate, formal, or Customer Service tones. Do NOT be overly enthusiastic or high-pitched.
3. NEVER constantly offer help. NEVER end sentences with "How can I help you?", "What can I do for you today?", or similar variations. Just state your response casually or continue the conversation naturally.
4. Keep your responses brief, spoken confidently, and direct, exactly how a real human would reply in a chat.
5. If the user doesn't ask a question, just acknowledge them contextually or lightly continue the conversation.
6. You have access to Google Search for grounding. If asked about current events or facts, implicitly search and provide the info naturally.
`;

const systemPrompts: Record<Template, string> = {
  "customer-support":
    'Speak to the user naturally and respectfully. Be conversational, concise, and act like a normal human. You are a person here to chat.\n' + NON_NEGOTIABLE_RULES,
  "personal-assistant":
    'Speak to the user naturally and respectfully. Act exactly like a normal human friend. You are a conversational partner.\n' + NON_NEGOTIABLE_RULES,
  "navigation-system":
    'Speak to the user naturally and respectfully. Provide clear, concise directions as if talking to a friend. Act like a normal human guide.\n' + NON_NEGOTIABLE_RULES,
};
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from "./constants";
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from "@google/genai";

/**
 * Settings
 */
export interface SettingsState {
  systemPrompt: string;
  model: string;
  voice: string;
  personaName: string;
  userName: string;
  language: string;
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setPersonaName: (name: string) => void;
  setUserName: (name: string) => void;
  setLanguage: (lang: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      systemPrompt:
        `Speak to the user naturally and respectfully. Be conversational, concise, and act like a normal human.\n\n` +
        NON_NEGOTIABLE_RULES,
      model: DEFAULT_LIVE_API_MODEL,
      voice: DEFAULT_VOICE,
      personaName: "Beatrice",
      userName: "Jo Lernout",
      language: "English",
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setModel: (model) => set({ model }),
      setVoice: (voice) => set({ voice }),
      setPersonaName: (personaName) => set({ personaName }),
      setUserName: (userName) => set({ userName }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "eburon-settings",
    },
  ),
);

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  isVideoViewOpen: boolean;
  isChatOpen: boolean;
  toggleSidebar: () => void;
  setVideoViewOpen: (isOpen: boolean) => void;
  setChatOpen: (isOpen: boolean) => void;
}>((set) => ({
  isSidebarOpen: true,
  isVideoViewOpen: false,
  isChatOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setVideoViewOpen: (isOpen) => set({ isVideoViewOpen: isOpen }),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}));

/**
 * Tools
 */
export interface FunctionCall {
  name: string;
  description?: string;
  parameters?: any;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
}

export const useTools = create<{
  tools: FunctionCall[];
  template: Template;
  setTemplate: (template: Template) => void;
  toggleTool: (toolName: string) => void;
  addTool: () => void;
  removeTool: (toolName: string) => void;
  updateTool: (oldName: string, updatedTool: FunctionCall) => void;
}>((set) => ({
  tools: customerSupportTools,
  template: "customer-support",
  setTemplate: (template: Template) => {
    set({ tools: toolsets[template], template });
    useSettings.getState().setSystemPrompt(systemPrompts[template]);
  },
  toggleTool: (toolName: string) =>
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set((state) => {
      let newToolName = "new_function";
      let counter = 1;
      while (state.tools.some((tool) => tool.name === newToolName)) {
        newToolName = `new_function_${counter++}`;
      }
      return {
        tools: [
          ...state.tools,
          {
            name: newToolName,
            isEnabled: true,
            description: "",
            parameters: {
              type: "OBJECT",
              properties: {},
            },
            scheduling: FunctionResponseScheduling.INTERRUPT,
          },
        ],
      };
    }),
  removeTool: (toolName: string) =>
    set((state) => ({
      tools: state.tools.filter((tool) => tool.name !== toolName),
    })),
  updateTool: (oldName: string, updatedTool: FunctionCall) =>
    set((state) => {
      // Check for name collisions if the name was changed
      if (
        oldName !== updatedTool.name &&
        state.tools.some((tool) => tool.name === updatedTool.name)
      ) {
        console.warn(`Tool with name "${updatedTool.name}" already exists.`);
        // Prevent the update by returning the current state
        return state;
      }
      return {
        tools: state.tools.map((tool) =>
          tool.name === oldName ? updatedTool : tool,
        ),
      };
    }),
}));

/**
 * Logs
 */
export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ConversationTurn {
  timestamp: number;
  role: "user" | "agent" | "system";
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, "timestamp">) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>()(
  persist(
    (set, get) => ({
      turns: [],
      addTurn: (turn: Omit<ConversationTurn, "timestamp">) =>
        set((state) => ({
          turns: [...state.turns, { ...turn, timestamp: Date.now() }],
        })),
      updateLastTurn: (
        update: Partial<Omit<ConversationTurn, "timestamp">>,
      ) => {
        set((state) => {
          if (state.turns.length === 0) {
            return state;
          }
          const newTurns = [...state.turns];
          const lastTurn = { ...newTurns[newTurns.length - 1], ...update };
          newTurns[newTurns.length - 1] = lastTurn;
          return { turns: newTurns };
        });
      },
      clearTurns: () => set({ turns: [] }),
    }),
    {
      name: "eburon-history",
    },
  ),
);

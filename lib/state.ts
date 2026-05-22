/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { customerSupportTools } from './tools/customer-support';
import { personalAssistantTools } from './tools/personal-assistant';
import { navigationSystemTools } from './tools/navigation-system';

export type Template = 'customer-support' | 'personal-assistant' | 'navigation-system';

const toolsets: Record<Template, FunctionCall[]> = {
  'customer-support': customerSupportTools,
  'personal-assistant': personalAssistantTools,
  'navigation-system': navigationSystemTools,
};

const systemPrompts: Record<Template, string> = {
  'customer-support': 'You must start speaking to the user with respect and always obey. Be conversational, natural, and concise. You are a person here to help.',
  'personal-assistant': 'You must start speaking to the user with respect and always obey. Be proactive, efficient, and relatable. You are a supportive human partner.',
  'navigation-system': 'You must start speaking to the user with respect and always obey. Provide clear, natural directions as if talking to a friend. You are a local guide.',
};
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

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
    set => ({
      systemPrompt: `You must start speaking to the user with respect and always obey.`,
      model: DEFAULT_LIVE_API_MODEL,
      voice: DEFAULT_VOICE,
      personaName: 'Beatrice',
      userName: 'Jo Lernout',
      language: 'English',
      setSystemPrompt: prompt => set({ systemPrompt: prompt }),
      setModel: model => set({ model }),
      setVoice: voice => set({ voice }),
      setPersonaName: personaName => set({ personaName }),
      setUserName: userName => set({ userName }),
      setLanguage: language => set({ language }),
    }),
    {
      name: 'eburon-settings',
    }
  )
);

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  isVideoViewOpen: boolean;
  toggleSidebar: () => void;
  setVideoViewOpen: (isOpen: boolean) => void;
}>(set => ({
  isSidebarOpen: true,
  isVideoViewOpen: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setVideoViewOpen: isOpen => set({ isVideoViewOpen: isOpen }),
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
}>(set => ({
  tools: customerSupportTools,
  template: 'customer-support',
  setTemplate: (template: Template) => {
    set({ tools: toolsets[template], template });
    useSettings.getState().setSystemPrompt(systemPrompts[template]);
  },
  toggleTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set(state => {
      let newToolName = 'new_function';
      let counter = 1;
      while (state.tools.some(tool => tool.name === newToolName)) {
        newToolName = `new_function_${counter++}`;
      }
      return {
        tools: [
          ...state.tools,
          {
            name: newToolName,
            isEnabled: true,
            description: '',
            parameters: {
              type: 'OBJECT',
              properties: {},
            },
            scheduling: FunctionResponseScheduling.INTERRUPT,
          },
        ],
      };
    }),
  removeTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.filter(tool => tool.name !== toolName),
    })),
  updateTool: (oldName: string, updatedTool: FunctionCall) =>
    set(state => {
      // Check for name collisions if the name was changed
      if (
        oldName !== updatedTool.name &&
        state.tools.some(tool => tool.name === updatedTool.name)
      ) {
        console.warn(`Tool with name "${updatedTool.name}" already exists.`);
        // Prevent the update by returning the current state
        return state;
      }
      return {
        tools: state.tools.map(tool =>
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
  role: 'user' | 'agent' | 'system';
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>()(
  persist(
    (set, get) => ({
      turns: [],
      addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
        set(state => ({
          turns: [...state.turns, { ...turn, timestamp: Date.now() }],
        })),
      updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
        set(state => {
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
      name: 'eburon-history',
    }
  )
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from "react";
import PopUp from "../popup/PopUp";
import { VisualizerOrb } from "../../VisualizerOrb";
import { LiveConnectConfig, Modality, LiveServerContent } from "@google/genai";
import { useLiveAPIContext } from "../../../contexts/LiveAPIContext";
import {
  useSettings,
  useLogStore,
  useTools,
  useUI,
  ConversationTurn,
  NON_NEGOTIABLE_RULES,
} from "@/lib/state";
import { BIBLE_PERSONALITY } from "@/lib/prompts";

const formatTimestamp = (ts: number) => {
  const date = new Date(ts);
  const pad = (num: number, size = 2) => num.toString().padStart(size, "0");
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const renderContent = (text: string) => {
  // Split by ```json...``` code blocks
  const parts = text.split(/(`{3}json\n[\s\S]*?\n`{3})/g);

  return parts.map((part, index) => {
    if (part.startsWith("```json")) {
      const jsonContent = part.replace(/^`{3}json\n|`{3}$/g, "");
      return (
        <pre key={index}>
          <code>{jsonContent}</code>
        </pre>
      );
    }

    // Split by **bold** text
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
      }
      return boldPart;
    });
  });
};

export default function StreamingConsole() {
  const { client, setConfig, connected } = useLiveAPIContext();
  const { systemPrompt, voice, personaName, userName, language } =
    useSettings();
  const { isVideoViewOpen, isChatOpen } = useUI();
  const { tools } = useTools();
  const turns = useLogStore((state) => state.turns);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState("");

  // Set the configuration for the Live API
  useEffect(() => {
    const functionDeclarations = tools
      .filter((tool) => tool.isEnabled)
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

    const enabledTools: any[] = [];

    if (functionDeclarations.length > 0) {
      enabledTools.push({ functionDeclarations });
    }

    // Add Google Search grounding
    enabledTools.push({ googleSearch: {} });

    // Generate a summary of history for context
    const historyContext =
      turns.length > 0
        ? `\n\n[CONTEXTUAL MEMORY FROM PAST CONVERSATIONS]\n${turns
            .slice(-30)
            .map((t) => `${t.role}: ${t.text}`)
            .join(
              "\n",
            )}\n\n[INSTRUCTION]: You have access to the above history. If this is a new session (the current conversation is just starting), pick a random topic or interesting detail from the history to briefly mention or ask about in your first response to show you remember the Boss. Keep it natural and casual.`
        : "";

    const videoContext = isVideoViewOpen
      ? "\n\n[SYSTEM]: The Boss has enabled video/screen sharing. You can see what the Boss sees through the video feed. Acknowledge what you see naturally. Do not refer to yourself as an AI, just act as a helpful human assistant who can now see."
      : "";

    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [
          {
            text: NON_NEGOTIABLE_RULES + "\n\n" + BIBLE_PERSONALITY,
          },
          {
            text: `Your name is ${personaName}. You are helping ${userName}. Please communicate primarily in ${language}. Handle the user with respect as "Boss".`,
          },
          {
            text: systemPrompt + historyContext + videoContext,
          },
        ],
      },
      tools: enabledTools,
    };

    setConfig(config);
  }, [
    setConfig,
    systemPrompt,
    tools,
    voice,
    personaName,
    userName,
    language,
    turns,
    isVideoViewOpen,
  ]);

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === "user" && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
        });
      } else {
        addTurn({ role: "user", text, isFinal });
      }
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === "agent" && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
        });
      } else {
        addTurn({ role: "agent", text, isFinal });
      }
    };

    // FIX: The 'content' event provides a single LiveServerContent object.
    // The function signature is updated to accept one argument, and groundingMetadata is extracted from it.
    const handleContent = (serverContent: LiveServerContent) => {
      const text =
        serverContent.modelTurn?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(" ") ?? "";
      const groundingChunks = serverContent.groundingMetadata?.groundingChunks;

      if (!text && !groundingChunks) return;

      const turns = useLogStore.getState().turns;
      const last = turns.at(-1);

      if (last?.role === "agent" && !last.isFinal) {
        const updatedTurn: Partial<ConversationTurn> = {
          text: last.text + text,
        };
        if (groundingChunks) {
          updatedTurn.groundingChunks = [
            ...(last.groundingChunks || []),
            ...groundingChunks,
          ];
        }
        updateLastTurn(updatedTurn);
      } else {
        addTurn({ role: "agent", text, isFinal: false, groundingChunks });
      }
    };

    const handleTurnComplete = () => {
      const last = useLogStore.getState().turns.at(-1);
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
      }
    };

    client.on("inputTranscription", handleInputTranscription);
    client.on("outputTranscription", handleOutputTranscription);
    client.on("content", handleContent);
    client.on("turncomplete", handleTurnComplete);

    return () => {
      client.off("inputTranscription", handleInputTranscription);
      client.off("outputTranscription", handleOutputTranscription);
      client.off("content", handleContent);
      client.off("turncomplete", handleTurnComplete);
    };
  }, [client]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !connected) return;

    const text = textInput;
    setTextInput("");

    // Send the user input as a real-time message
    client.send([{ text }]);

    // Optimistically add the turn so it shows in the chat
    useLogStore.getState().addTurn({
      role: "user",
      text,
      isFinal: true,
    });
  };

  return (
    <div className={`transcription-container ${isChatOpen ? "chat-open" : ""}`}>
      <VisualizerOrb />

      {isChatOpen && (
        <div className="chat-overlay">
          <div className="transcription-view" ref={scrollRef}>
            {turns.length === 0 ? (
              <div className="chat-empty-state">
                No transcriptions yet. Start talking or typing!
              </div>
            ) : (
              turns.map((t, i) => (
                <div
                  key={i}
                  className={`transcription-entry ${t.role} ${
                    !t.isFinal ? "interim" : ""
                  }`}
                >
                  <div className="transcription-header">
                    <div className="transcription-source">
                      {t.role === "user"
                        ? "You"
                        : t.role === "agent"
                          ? personaName
                          : "System"}
                    </div>
                    <div className="transcription-timestamp">
                      {formatTimestamp(t.timestamp)}
                    </div>
                  </div>
                  <div className="transcription-text-content">
                    {renderContent(t.text)}
                  </div>
                  {t.groundingChunks && t.groundingChunks.length > 0 && (
                    <div className="grounding-chunks">
                      <strong>Sources:</strong>
                      <ul>
                        {t.groundingChunks
                          .filter((chunk) => chunk.web)
                          .map((chunk, index) => (
                            <li key={index}>
                              <a
                                href={chunk.web!.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {chunk.web!.title || chunk.web!.uri}
                              </a>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="chat-input-container">
            <form onSubmit={handleTextInputSubmit} className="chat-input-form">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  connected ? "Type a message..." : "Connect to chat..."
                }
                disabled={!connected}
                className="chat-text-input"
              />
              <button
                type="submit"
                disabled={!connected || !textInput.trim()}
                className="chat-send-button"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

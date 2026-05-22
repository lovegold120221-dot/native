/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { FunctionCall, useSettings, useUI, useTools, useLogStore } from '@/lib/state';
import c from 'classnames';
import { DEFAULT_LIVE_API_MODEL, AVAILABLE_VOICES, VOICE_ALIASES } from '@/lib/constants';
import { LANGUAGES } from '@/lib/languages';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useState } from 'react';
import ToolEditorModal from './ToolEditorModal';

const AVAILABLE_MODELS = [
  DEFAULT_LIVE_API_MODEL
];

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const {
    systemPrompt,
    model,
    voice,
    personaName,
    userName,
    language,
    setSystemPrompt,
    setModel,
    setVoice,
    setPersonaName,
    setUserName,
    setLanguage
  } = useSettings();
  const { tools, toggleTool, addTool, removeTool, updateTool } = useTools();
  const { turns, clearTurns } = useLogStore();
  const { connected } = useLiveAPIContext();

  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [editingTool, setEditingTool] = useState<FunctionCall | null>(null);

  const handleSaveTool = (updatedTool: FunctionCall) => {
    if (editingTool) {
      updateTool(editingTool.name, updatedTool);
    }
    setEditingTool(null);
  };

  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-header">
          <div className="sidebar-tabs">
            <button 
              className={c('tab-button', { active: activeTab === 'settings' })}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button 
              className={c('tab-button', { active: activeTab === 'history' })}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
          <button onClick={toggleSidebar} className="close-button">
            <span className="icon">close</span>
          </button>
        </div>
        <div className="sidebar-content">
          {activeTab === 'settings' ? (
            <>
              <div className="sidebar-section">
                <fieldset disabled={connected}>
                  <label>
                    Persona Name
                    <input
                      type="text"
                      value={personaName}
                      onChange={e => setPersonaName(e.target.value)}
                      placeholder="e.g. Beatrice"
                      className="settings-input"
                    />
                  </label>
                  <label>
                    How to call You
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. Joe Lernout"
                      className="settings-input"
                    />
                  </label>
                  <label>
                    Language
                    <select value={language} onChange={e => setLanguage(e.target.value)}>
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    System Prompt
                    <textarea
                      value={systemPrompt}
                      onChange={e => setSystemPrompt(e.target.value)}
                      rows={10}
                      placeholder="Describe the role and personality of the AI..."
                    />
                  </label>
                  <label>
                    Model
                    <select value={model} onChange={e => setModel(e.target.value)}>
                      {/* This is an experimental model name that should not be removed from the options. */}
                      {AVAILABLE_MODELS.map(m => (
                        <option key={m} value={m}>
                          {m === DEFAULT_LIVE_API_MODEL ? 'Eburon Worker' : m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Voice
                    <select value={voice} onChange={e => setVoice(e.target.value)}>
                      {AVAILABLE_VOICES.map(v => (
                        <option key={v} value={v}>
                          {VOICE_ALIASES[v] || v}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>
              </div>
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Tools</h4>
                <div className="tools-list">
                  {tools.map(tool => (
                    <div key={tool.name} className="tool-item">
                      <label className="tool-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id={`tool-checkbox-${tool.name}`}
                          checked={tool.isEnabled}
                          onChange={() => toggleTool(tool.name)}
                          disabled={connected}
                        />
                        <span className="checkbox-visual"></span>
                      </label>
                      <label
                        htmlFor={`tool-checkbox-${tool.name}`}
                        className="tool-name-text"
                      >
                        {tool.name}
                      </label>
                      <div className="tool-actions">
                        <button
                          onClick={() => setEditingTool(tool)}
                          disabled={connected}
                          aria-label={`Edit ${tool.name}`}
                        >
                          <span className="icon">edit</span>
                        </button>
                        <button
                          onClick={() => removeTool(tool.name)}
                          disabled={connected}
                          aria-label={`Delete ${tool.name}`}
                        >
                          <span className="icon">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTool}
                  className="add-tool-button"
                  disabled={connected}
                >
                  <span className="icon">add</span> Add function call
                </button>
              </div>
            </>
          ) : (
            <div className="sidebar-section history-section">
              <div className="history-header">
                <h4 className="sidebar-section-title">Conversation History</h4>
                <button 
                  onClick={clearTurns} 
                  className="clear-history-button"
                  disabled={turns.length === 0}
                >
                  Clear All
                </button>
              </div>
              <div className="history-list">
                {turns.length === 0 ? (
                  <p className="empty-history">No history yet.</p>
                ) : (
                  turns.map((turn, index) => (
                    <div key={index} className={`history-item role-${turn.role}`}>
                      <div className="history-meta">
                        <span className="history-role">{turn.role === 'agent' ? personaName : turn.role}</span>
                        <span className="history-time">
                          {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="history-text">{turn.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
      {editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSaveTool}
        />
      )}
    </>
  );
}

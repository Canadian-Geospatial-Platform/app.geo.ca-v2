// src/lib/geochat/stores/chat-stores.ts

import { writable, get } from 'svelte/store';
import { sendChatMessage, loadChatSession, verifyChatHistory } from '$lib/geochat/api/chat-api';
import {
  type ChatHistory,
  generateSessionId,
  loadHistory,
  saveHistory,
  getSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from '$lib/geochat/session/chat-session';
import { formatMarkdown, escapeHtml } from '$lib/geochat/utils/markdown';

import enTranslations from '$lib/geochat/i18n/en/translations.json';
import frTranslations from '$lib/geochat/i18n/fr/translations.json';

const translations = {
  en: enTranslations,
  fr: frTranslations,
};

// ==========================
// Types
// ==========================

export interface ChatRecord {
  uuid: string;

  rank: number;

  title_display: string;
  title_en: string;
  title_fr: string;

  description_display: string;
  description_en: string;
  description_fr: string;

  publisher: {
    en: string;
    fr: string;
  };

  geometry_type?: string;

  geometry?: {
    type: string;
    coordinates: number[][][];
  };

  relevance_score: number;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  html: string;

  records?: ChatRecord[];

  languageMismatch?: boolean;
  collapsed?: boolean;
  expandable?: boolean;
  isCurrent?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  records: ChatRecord[];
  history: ChatHistory[];

  activeSessionId: string | undefined;

  isThinking: boolean;
  initialized: boolean;
}

interface HistoryMessage {
  role: string;
  text: string;
  records?: ChatRecord[];
}

interface HistorySession {
  history: HistoryMessage[];
}

// ==========================
// Store
// ==========================

function createChatStore() {
  const initialState: ChatState = {
    messages: [],
    records: [],
    history: [],
    activeSessionId: undefined,
    isThinking: false,
    initialized: false,
  };

  const store = writable(initialState);

  const { subscribe, update } = store;

  // ==========================
  // Collapse Previous Bot Message
  // ==========================

  function collapseLastBotMessage(messages: ChatMessage[]) {
    const botMessages = messages.filter((m) => m.role === 'bot');

    if (botMessages.length === 0) {
      return;
    }

    const lastBotMessage = botMessages[botMessages.length - 1];

    if (lastBotMessage.expandable) {
      lastBotMessage.collapsed = true;
    }

    lastBotMessage.isCurrent = false;
  }

  function collapseHistoryMessages(messages: ChatMessage[]) {
    const botMessages = messages.filter((m) => m.role === 'bot');

    if (botMessages.length === 0) {
      return;
    }

    // collapse all expandable bot messages
    botMessages.forEach((m) => {
      if (m.expandable) {
        m.collapsed = true;
      }

      m.isCurrent = false;
    });

    // keep the newest bot message expanded
    const lastBotMessage = botMessages[botMessages.length - 1];

    lastBotMessage.collapsed = false;
    lastBotMessage.isCurrent = true;
  }

  function toggleMessage(message: ChatMessage) {
    update((state) => {
      const updatedMessages = [...state.messages];

      // Collapse every expandable bot message and clear current
      updatedMessages.forEach((m) => {
        if (m.role === 'bot') {
          if (m.expandable) {
            m.collapsed = true;
          }
          m.isCurrent = false;
        }
      });

      // Expand the selected message
      message.collapsed = false;
      message.isCurrent = true;

      return {
        ...state,
        messages: updatedMessages,
        records: message.records ?? [],
      };
    });
  }

  // ==========================
  // Initialize Chat
  // ==========================

  async function initializeChat(lang: 'en' | 'fr') {
    if (get(store).initialized) {
      return;
    }

    let history = loadHistory();

    // Use the shared cookie to restore the active chat when navigating between geo.ca and app.geo.ca
    const sessionCookie = getSessionCookie();

    // Verify local history sessions and the cookie session.
    const sessionIds = [...history.map((chat) => chat.sessionId), sessionCookie?.sessionId].filter((id): id is string => !!id);

    let validSet = new Set<string>();

    if (sessionIds.length > 0) {
      try {
        const { valid_session_ids } = await verifyChatHistory(sessionIds);

        validSet = new Set(valid_session_ids);

        // Remove invalid sessions from local history.
        history = history.filter((chat) => !chat.sessionId || validSet.has(chat.sessionId));
      } catch (err) {
        console.error('Chat history verification failed:', err);
      }
    }

    // Determine the active chat.
    let activeChat: ChatHistory | undefined;

    if (sessionCookie?.sessionId && validSet.has(sessionCookie.sessionId)) {
      activeChat = history.find((chat) => chat.sessionId === sessionCookie.sessionId);

      // Cookie session is valid but isn't in local history.
      if (!activeChat) {
        history.unshift(sessionCookie);
        activeChat = sessionCookie;
      }
    } else if (sessionIds.length > 0) {
      activeChat = history[0];
    }

    saveHistory(history);

    update((state) => ({
      ...state,
      history,
      activeSessionId: activeChat?.sessionId,
    }));

    if (!activeChat?.sessionId) {
      showMessage(lang, history.length === 0 ? 'welcomeMessage' : 'newChatMessage');

      update((state) => ({
        ...state,
        initialized: true,
      }));

      return;
    }

    await loadChat(lang, activeChat);

    update((state) => ({
      ...state,
      initialized: true,
    }));
  }

  // ==========================
  // Load Active Chat
  // ==========================

  async function loadChat(lang: 'en' | 'fr', activeChat: ChatHistory) {
    // New chat placeholder (no session created yet)
    if (!activeChat.sessionId) {
      showMessage(lang, 'newChatMessage');
      return;
    }

    update((state) => ({
      ...state,
      activeSessionId: activeChat.sessionId,
      isThinking: true,
    }));

    try {
      const data = await loadChatSession(activeChat.sessionId);

      const historyMessages: ChatMessage[] = [];

      if (data.sessions && Array.isArray(data.sessions)) {
        data.sessions.forEach((session: HistorySession) => {
          if (!Array.isArray(session.history)) return;

          session.history.forEach((msg: HistoryMessage) => {
            if (!msg?.text) return;

            if (msg.role === 'user') {
              historyMessages.push({
                role: 'user',
                html: escapeHtml(msg.text),
              });
            } else if (msg.role === 'assistant') {
              historyMessages.push({
                role: 'bot',
                html: formatMarkdown(msg.text),
                records: msg.records,
                expandable: msg.text.length > 400,
                collapsed: msg.text.length > 400,
              });
            }
          });
        });
      }

      collapseHistoryMessages(historyMessages);

      if (historyMessages.length === 0) {
        showMessage(lang, 'welcomeMessage');
        return;
      }

      const currentBot = historyMessages.find((m) => m.isCurrent);

      update((state) => ({
        ...state,
        messages: historyMessages,
        records: currentBot?.records ?? [],
        isThinking: false,
      }));

      // Store the active chat in the shared session cookie.
      setSessionCookie(activeChat);
    } catch (err) {
      console.error(err);

      showMessage(lang, 'errorMessage');
    }
  }

  // ==========================
  // Send Message
  // ==========================

  async function sendMessage(message: string, lang: 'en' | 'fr') {
    const trimmed = message.trim();
    if (!trimmed) return;

    // add user message
    update((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          role: 'user',
          html: escapeHtml(trimmed),
        },
      ],
      records: [],
      isThinking: true,
    }));

    try {
      const state = get(store);

      let activeChat = state.activeSessionId
        ? state.history.find((chat: ChatHistory) => chat.sessionId === state.activeSessionId)
        : state.history[0];

      if (!activeChat) {
        activeChat = {
          title: 'New Chat',
        };
      }

      const isNewChat = !activeChat.sessionId;
      const sessionId = activeChat.sessionId ?? generateSessionId();

      const data = await sendChatMessage(sessionId, trimmed, lang);

      const responseText = data.answer_markdown;
      const formatted = formatMarkdown(responseText);

      let history = state.history;

      // First successful message - promote placeholder to a real chat
      if (isNewChat) {
        const updatedChat = {
          ...activeChat,
          sessionId,
          title: trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed,
        };

        history = [updatedChat, ...state.history.filter((chat) => chat.title !== 'New Chat')];

        saveHistory(history);

        setSessionCookie(updatedChat);
      } else {
        // Existing chat - move it to the top and remove New Chat placeholder
        history = state.history.filter((chat) => chat.sessionId !== activeChat.sessionId && chat.title !== 'New Chat');

        history.unshift(activeChat);

        saveHistory(history);

        setSessionCookie(activeChat);
      }

      update((state) => {
        const updatedMessages = [...state.messages];

        collapseLastBotMessage(updatedMessages);

        const isLongMessage = responseText.length > 400;

        updatedMessages.push({
          role: 'bot',
          html: formatted,
          records: data.records,
          languageMismatch: data.type === 'language_mismatch',
          collapsed: false,
          expandable: isLongMessage,
          isCurrent: true,
        });

        return {
          ...state,
          messages: updatedMessages,
          records: data.records ?? [],
          history,
          activeSessionId: sessionId,
          isThinking: false,
        };
      });
    } catch (err) {
      console.error(err);

      update((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            role: 'bot',
            html: translations[lang].errorMessage,
            collapsed: false,
          },
        ],
        records: [],
        isThinking: false,
      }));
    }
  }

  // ==========================
  // Start New Chat
  // ==========================

  function newChat(lang: 'en' | 'fr'): ChatHistory[] {
    let history = [...get(store).history];

    // Remove any existing New Chat placeholders
    history = history.filter((chat) => chat.title !== 'New Chat');

    // Add exactly one New Chat placeholder at the beginning
    history.unshift({
      title: 'New Chat',
    });

    saveHistory(history);

    update((state) => ({
      ...state,
      history,
      activeSessionId: undefined,
      messages: [],
      records: [],
    }));

    showMessage(lang, 'newChatMessage');

    return history;
  }

  // ==========================
  // Display Bot Message
  // ==========================

  function showMessage(lang: 'en' | 'fr', message: 'welcomeMessage' | 'newChatMessage' | 'errorMessage') {
    update((state) => ({
      ...state,
      messages: [
        {
          role: 'bot',
          html: formatMarkdown(translations[lang][message]),
          records: [],
          expandable: false,
          collapsed: false,
          isCurrent: true,
        },
      ],
      records: [],
      isThinking: false,
    }));
  }

  // ==========================
  // Select and load chat
  // ==========================

  async function selectChat(chat: ChatHistory, lang: 'en' | 'fr') {
    update((state) => ({
      ...state,
      activeSessionId: chat.sessionId,
      messages: [],
      records: [],
    }));

    await loadChat(lang, chat);
  }

  // ==========================
  // Delete chat
  // ==========================

  async function deleteChat(chat: ChatHistory, lang: 'en' | 'fr') {
    const state = get(store);

    const isActiveChat = state.activeSessionId === chat.sessionId;
    const sessionCookie = getSessionCookie();
    const isCookieChat = sessionCookie?.sessionId === chat.sessionId;

    if (isCookieChat) {
      clearSessionCookie();
    }

    const history = state.history.filter((h) => h.sessionId !== chat.sessionId && h.title !== 'New Chat');

    saveHistory(history);

    // Deleted an inactive chat
    if (!isActiveChat) {
      update((state) => ({
        ...state,
        history,
      }));
      return;
    }

    // No chats left
    if (history.length === 0) {
      clearSessionCookie();

      update((state) => ({
        ...state,
        history,
        activeSessionId: undefined,
        messages: [],
        records: [],
        isThinking: false,
      }));

      showMessage(lang, 'newChatMessage');
      return;
    }

    // Deleted active chat - load the next chat
    update((state) => ({
      ...state,
      history,
    }));

    if (history.length > 0) {
      await loadChat(lang, history[0]);
    } else {
      showMessage(lang, 'newChatMessage');
    }
  }

  return {
    subscribe,
    sendMessage,
    initializeChat,
    toggleMessage,
    newChat,
    selectChat,
    deleteChat,
  };
}

// ==========================
// Export Store
// ==========================

export const chatStore = createChatStore();

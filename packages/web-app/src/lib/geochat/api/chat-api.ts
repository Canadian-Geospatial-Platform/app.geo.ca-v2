// src/lib/geochat/api/chat-api.ts

import { getGeoChatConfig } from '$lib/geochat/geochat-config';

// ==========================
// Chat API
// ==========================

export async function sendChatMessage(sessionId: string, message: string, lang: string) {
  const { chatApiUrl: CHAT_API_URL } = getGeoChatConfig();
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: sessionId,
      message,
      lang,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

// ==========================
// Load Chat History API
// ==========================

export async function loadChatSession(sessionId: string, limit = 25) {
  const params = new URLSearchParams({
    session_id: sessionId,
    limit: String(limit),
  });

  const { chatHistoryUrl: CHAT_HISTORY_URL } = getGeoChatConfig();
  const response = await fetch(`${CHAT_HISTORY_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

// ==========================
// Warm Up API
// ==========================

let warmupSent = false;

export function warmUpChat(): void {
  if (warmupSent) return;
  warmupSent = true;

  //console.log('warmup sent');

  const { chatWarmupUrl } = getGeoChatConfig();

  fetch(chatWarmupUrl, {
    method: 'GET',
    keepalive: true,
  }).catch(() => {
    // Ignore errors
  });
}

// ==========================
// Verify Chat History API
// ==========================

export async function verifyChatHistory(sessionIds: string[]): Promise<{ valid_session_ids: string[] }> {
  const { chatHistoryVerifyUrl } = getGeoChatConfig();

  const response = await fetch(chatHistoryVerifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_ids: sessionIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat history verification failed: ${response.status}`);
  }

  return response.json();
}

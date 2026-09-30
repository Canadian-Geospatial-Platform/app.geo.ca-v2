const browser = typeof window !== 'undefined';

const HISTORY_KEY = 'geochat-history';

const SESSION_COOKIE = 'geochat-session-id';

export interface ChatHistory {
  sessionId?: string;
  title: string;
}

export function loadHistory(): ChatHistory[] {
  const json = localStorage.getItem(HISTORY_KEY);

  if (!json) {
    return [];
  }

  try {
    return JSON.parse(json) as ChatHistory[];
  } catch (err) {
    console.error('Unable to load chat history', err);

    localStorage.removeItem(HISTORY_KEY);

    return [];
  }
}

export function saveHistory(history: ChatHistory[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function generateSessionId(): string {
  if (browser && window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;

    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

export function getSessionCookie(): ChatHistory | undefined {
  if (!browser) {
    return undefined;
  }

  const row = document.cookie.split('; ').find((row) => row.startsWith(`${SESSION_COOKIE}=`));

  if (!row) {
    return undefined;
  }

  try {
    return JSON.parse(decodeURIComponent(row.split('=')[1])) as ChatHistory;
  } catch (err) {
    console.error('Unable to read session cookie', err);
    return undefined;
  }
}

export function setSessionCookie(chat: ChatHistory): void {
  if (!browser) {
    return;
  }

  const value = encodeURIComponent(JSON.stringify(chat));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  const cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax${secure}`;

  console.trace('SET SESSION COOKIE', chat);

  if (window.location.hostname === 'geo.ca' || window.location.hostname.endsWith('.geo.ca')) {
    document.cookie = `${cookie}; domain=geo.ca`;
  } else {
    document.cookie = cookie;
  }
}

export function clearSessionCookie(): void {
  if (!browser) {
    return;
  }

  const cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;

  if (window.location.hostname === 'geo.ca' || window.location.hostname.endsWith('.geo.ca')) {
    document.cookie = `${cookie}; domain=geo.ca`;
  } else {
    document.cookie = cookie;
  }
}

export interface GeoChatConfig {
  appUrl?: string;
  chatApiUrl: string;
  chatHistoryUrl: string;
  chatWarmupUrl: string;
  chatHistoryVerifyUrl: string;
}

let config: GeoChatConfig;

export function setGeoChatConfig(newConfig: GeoChatConfig) {
  config = newConfig;
}

export function getGeoChatConfig(): GeoChatConfig {
  return config;
}

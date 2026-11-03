import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  AUTH_STATUS_ALLOWED_ORIGINS: { schema: (value) => value ?? '' },
});

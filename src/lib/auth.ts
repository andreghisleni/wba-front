import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
  plugins: [adminClient(), organizationClient()],
  baseURL: (import.meta.env.VITE_API_URL as string).concat('/auth/api'),
});

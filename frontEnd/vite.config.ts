import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    // prod에서만 Sentry sourcemap 업로드
    ...(process.env.NODE_ENV === 'production'
      ? [
          sentryVitePlugin({
            org: 'venivivi',
            project: 'javascript-react',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            silent: false,
          }),
        ]
      : []),
  ],
  build: {
    sourcemap: true, // Sentry에 필요
  },
});

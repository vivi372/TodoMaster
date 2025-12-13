import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

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
  resolve: {
    alias: {
      // path.resolve()를 사용하여 @를 프로젝트 루트의 /src 폴더로 매핑합니다.
      '@': path.resolve(__dirname, './src'),
    },
  },
});

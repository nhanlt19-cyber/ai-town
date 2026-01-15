import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ai-town',
  plugins: [react()],
  server: {
    // Cho phép tất cả các host (không chặn theo hostname)
    // CẢNH BÁO: Chỉ nên dùng trong môi trường dev / demo.
    allowedHosts: [/^.*$/],
  },
});

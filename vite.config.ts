import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ai-town',
  plugins: [react()],
  server: {
    // Cho phép dev server lắng nghe trên tất cả địa chỉ và chấp nhận mọi host
    // CẢNH BÁO: Chỉ dùng cho môi trường dev / demo
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O Portal em produção é servido pelo próprio backend (Express serve a
// pasta frontend/dist). Em desenvolvimento com "vite dev" (opcional, para
// quem for mexer no código), o proxy abaixo repassa /api para o backend
// rodando na porta 3333.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  build: {
    outDir: 'dist',
  },
});

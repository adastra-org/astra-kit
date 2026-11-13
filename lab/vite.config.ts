import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Lab solo para desarrollo: `bun run lab` desde la raíz. No se publica.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

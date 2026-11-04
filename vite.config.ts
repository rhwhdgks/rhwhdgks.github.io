import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base path so it works on both https://<user>.github.io/ and https://<user>.github.io/<repo>/
  base: './',
})


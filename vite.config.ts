import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './', // تایید اینکه فایل‌ها در ریشه هستند
  build: {
    outDir: 'dist',
  }
})
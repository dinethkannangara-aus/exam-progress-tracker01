import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/exam-progress-tracker01/',
  plugins: [react()],
})

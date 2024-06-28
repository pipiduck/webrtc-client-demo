import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __USER_IDENTITY__: JSON.stringify(process.env.NAME)
  },
  plugins: [react()],
})

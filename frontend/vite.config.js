import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind IPv4 + IPv6. Node resolves 'localhost' to ::1 first, which makes Vite
    // listen on IPv6-only and makes http://127.0.0.1:3000 fail with ERR_CONNECTION_REFUSED.
    host: true,
    port: 3000,
  }
})

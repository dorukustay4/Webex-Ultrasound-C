import { defineConfig } from 'vite'

export default defineConfig({
  // Development server configuration
  server: {
    port: 3000,
    open: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        'auth-callback': 'auth-callback.html',
        'role-selection': 'role-selection.html'
      }
    }
  },
  
  // Handle dependencies
  optimizeDeps: {
    include: ['webex']
  }
})

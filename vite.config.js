import { defineConfig } from 'vite'

export default defineConfig({
  // Development server configuration
  server: {
    port: 3000,
    open: 'src/pages/index.html'
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/pages/index.html',
        login: 'src/pages/login.html',
        'auth-callback': 'src/pages/auth-callback.html',
        'role-selection': 'src/pages/role-selection.html',
        home: 'src/pages/home.html'
      }
    }
  },
  
  // Handle dependencies
  optimizeDeps: {
    include: ['webex']
  }
})

import { defineConfig } from 'vite'

export default defineConfig({
  // Set the root to the current directory
  root: '.',
  
  // Public directory for static assets
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    open: 'src/pages/index.html'
  },
  
  // Define global variables for Node.js compatibility
  define: {
    global: 'globalThis',
    'process.env': {}
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
        home: 'src/pages/home.html',
        profile: 'src/pages/profile.html',
        library: 'src/pages/library.html',
        'webex-demo': 'src/pages/webex-demo.html'
      }
    }
  },
  
  // Handle dependencies
  optimizeDeps: {
    include: ['webex'],
    exclude: ['@webex/internal-plugin-device']
  },
  
  // Resolve configuration for Node.js modules
  resolve: {
    alias: {
      // Polyfill Node.js modules
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  }
})

import { defineConfig } from 'vite'

export default defineConfig({
  // Set the root to the current directory
  root: '.',
  
  // Public directory for static assets
  publicDir: 'public',
  
  // Development server configuration for Electron app
  server: {
    port: 3000,
    strictPort: true,  // Force port 3000 or fail
    open: false  // Disable auto-opening browser since we're using Electron
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
        main: 'index.html',
        'login-clean': 'src/pages/login-clean.html',
        'login-oauth': 'src/pages/login-oauth.html',
        'login-simple': 'src/pages/login-simple.html',
        'home-clean': 'src/pages/home-clean.html',
        'profile-clean': 'src/pages/profile-clean.html',
        'video-call': 'src/pages/video-call.html',
        'oauth-callback': 'src/pages/oauth-callback.html',
        'oauth-callback-simple': 'src/pages/oauth-callback-simple.html'
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

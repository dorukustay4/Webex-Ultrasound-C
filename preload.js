const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigate: (page) => ipcRenderer.invoke('navigate', page),
  
  // Webex-related APIs
  webexOAuth: (authUrl) => ipcRenderer.invoke('webex-oauth', authUrl),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Media device access
  getMediaDevices: () => ipcRenderer.invoke('get-media-devices'),
  
  // Window management for video calls
  openVideoWindow: (options) => ipcRenderer.invoke('open-video-window', options),
  closeVideoWindow: () => ipcRenderer.invoke('close-video-window'),
  
  // Screen capture for ultrasound sharing
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  
  // Notification system
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // File operations for annotations
  saveAnnotationData: (data) => ipcRenderer.invoke('save-annotation-data', data),
  loadAnnotationData: () => ipcRenderer.invoke('load-annotation-data'),
  
  // Database operations
  dbSaveSession: (sessionData) => ipcRenderer.invoke('db-save-session', sessionData),
  dbSaveImage: (imageData) => ipcRenderer.invoke('db-save-image', imageData),
  dbSaveAnnotation: (annotationData) => ipcRenderer.invoke('db-save-annotation', annotationData),
  dbGetSessions: () => ipcRenderer.invoke('db-get-sessions'),
  dbGetSessionDetails: (sessionId) => ipcRenderer.invoke('db-get-session-details', sessionId),
  dbDeleteSession: (sessionId) => ipcRenderer.invoke('db-delete-session', sessionId),
  
  // App lifecycle
  onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
  onBeforeUnload: (callback) => ipcRenderer.on('before-unload', callback)
});

// Enhanced logging for development
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devAPI', {
    log: (...args) => console.log('[Renderer]', ...args),
    error: (...args) => console.error('[Renderer]', ...args),
    warn: (...args) => console.warn('[Renderer]', ...args)
  });
}

console.log('🔗 Preload script loaded - Enhanced IPC bridge ready for Webex integration');

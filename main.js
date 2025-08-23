/*
Project Goal:
Regional Anesthesia Annotation Platform - A specialized Electron application for annotating 
ultrasound images in ultrasound-guided regional anesthesia procedures.

Functional Requirements:
- Electron-based desktop application
- Local VGG Image Annotator integration
- Specialized annotation attributes for nerve blocks
- Image upload and annotation workflow
- Export functionality for research and documentation

Clean, focused code structure for medical annotation workflow.
*/


const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const DatabaseManager = require('./src/database/db-manager');

// Keep a global reference of the window object and database
let mainWindow;
let dbManager;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'assets/icon.png') // Optional: add an icon
  });

  // Load the home page from the development server
  const startUrl = 'http://localhost:3000/';
  
  console.log('Loading Regional Anesthesia Annotation Platform from:', startUrl);
  
  // Enable basic permissions for local file access and notifications
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['notifications'];
    
    if (allowedPermissions.includes(permission)) {
      console.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      console.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });
  
  // Handle permission checks for local development
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const allowedPermissions = ['notifications'];
    
    // Allow basic permissions for localhost development
    if (requestingOrigin === 'http://localhost:3000' && allowedPermissions.includes(permission)) {
      console.log(`Allowing ${permission} access for localhost`);
      return true;
    }
    
    return false;
  });
  
  // Load the URL with detailed logging
  console.log('🔄 Attempting to load URL:', startUrl);
  
  // Add navigation listeners for debugging
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('📡 Started loading page...');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });
  
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('🔄 Navigated to:', url);
  });
  
  mainWindow.loadURL(startUrl).catch(error => {
    console.error('❌ Failed to load URL:', error);
  });
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('✅ App window ready to show');
    mainWindow.show();
    
    // Optional: Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });
  
  // Handle failed load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', validatedURL);
    console.error('❌ Error:', errorDescription);
    
    // Show error page with instructions
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>🔧 Development Server Required</title>
          <style>
            body { 
              font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              text-align: center; 
              background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%);
              color: #e2e8f0;
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(20, 20, 20, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              max-width: 600px;
            }
            h1 { 
              color: #3b82f6; 
              margin-bottom: 20px; 
              font-size: 2rem;
            }
            .steps {
              text-align: left;
              background: rgba(15, 15, 15, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .step {
              margin: 10px 0;
              padding: 10px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .step:last-child {
              border-bottom: none;
            }
            .command {
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.3);
              padding: 10px;
              font-family: 'Courier New', monospace;
              border-radius: 4px;
              color: #60a5fa;
              margin: 5px 0;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.3);
              padding: 15px;
              border-radius: 8px;
              color: #fca5a5;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Development Server Required</h1>
            <p>The Regional Anesthesia Annotation Platform needs a running development server.</p>
            
            <div class="warning">
              <strong>⚠️ Error:</strong> Could not connect to http://localhost:3000
            </div>
            
            <div class="steps">
              <div class="step">
                <strong>Step 1:</strong> Open a terminal/command prompt
              </div>
              <div class="step">
                <strong>Step 2:</strong> Navigate to the project folder
              </div>
              <div class="step">
                <strong>Step 3:</strong> Start the development server:
                <div class="command">npm run dev</div>
              </div>
              <div class="step">
                <strong>Step 4:</strong> In another terminal, start Electron:
                <div class="command">npm run electron</div>
              </div>
            </div>
            
            <p><strong>💡 Tip:</strong> Make sure both commands are running simultaneously!</p>
            
            <button onclick="location.reload()" style="
              background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              margin-top: 20px;
            ">🔄 Retry Connection</button>
          </div>
        </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    mainWindow.show();
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Handle page title updates
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    mainWindow.setTitle(`Regional Anesthesia Annotation Platform - ${title}`);
  });
  
  // Log when navigation occurs
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('🔄 Navigated to:', url);
  });
}

// IPC Handlers for Application Features
function setupIPCHandlers() {
  // Navigation handler
  ipcMain.handle('navigate', async (event, page) => {
    try {
      let targetUrl;
      
      // Construct the proper URL for the development server
      if (page.startsWith('http')) {
        targetUrl = page;
      } else {
        // Remove .html extension if present and build the localhost URL
        const pageName = page.replace('.html', '');
        targetUrl = `http://localhost:3000/src/pages/${pageName}.html`;
      }
      
      console.log('🔄 Navigating to:', targetUrl);
      await mainWindow.loadURL(targetUrl);
      
      return { success: true, url: targetUrl };
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Get system information
  ipcMain.handle('get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome
    };
  });

  // Show system notifications
  ipcMain.handle('show-notification', async (event, title, body) => {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          icon: path.join(__dirname, 'assets/icon.png') // Optional
        });
        notification.show();
        return { success: true };
      }
      return { success: false, error: 'Notifications not supported' };
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
      return { success: false, error: error.message };
    }
  });

  // Save annotation data
  ipcMain.handle('save-annotation-data', async (event, data) => {
    try {
      const dataPath = path.join(app.getPath('userData'), 'annotations');
      await fs.mkdir(dataPath, { recursive: true });
      
      const filename = `annotation_${Date.now()}.json`;
      const filepath = path.join(dataPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      console.log('💾 Annotation data saved:', filepath);
      return { success: true, filepath };
    } catch (error) {
      console.error('❌ Failed to save annotation data:', error);
      return { success: false, error: error.message };
    }
  });

  // Load annotation data
  ipcMain.handle('load-annotation-data', async () => {
    try {
      const dataPath = path.join(app.getPath('userData'), 'annotations');
      const files = await fs.readdir(dataPath);
      
      const annotations = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = path.join(dataPath, file);
          const data = await fs.readFile(filepath, 'utf8');
          annotations.push({
            filename: file,
            data: JSON.parse(data),
            modified: (await fs.stat(filepath)).mtime
          });
        }
      }
      
      return { success: true, annotations };
    } catch (error) {
      console.error('❌ Failed to load annotation data:', error);
      return { success: false, error: error.message, annotations: [] };
    }
  });

  // Database IPC Handlers
  // Save session to database
  ipcMain.handle('db-save-session', async (event, sessionData) => {
    try {
      console.log('🔄 IPC Handler: db-save-session called');
      console.log('📊 Session data received:', sessionData);
      
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      
      const result = await dbManager.saveSession(sessionData);
      console.log('✅ IPC Handler: Session saved successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('❌ IPC Handler: Failed to save session:', error);
      console.error('❌ Error details:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  });

  // Save image to database
  ipcMain.handle('db-save-image', async (event, imageData) => {
    try {
      console.log('🔄 IPC Handler: db-save-image called');
      console.log('📊 Image data received:', {
        id: imageData.id,
        sessionId: imageData.sessionId,
        filename: imageData.filename,
        hasData: !!imageData.data,
        dataLength: imageData.data ? imageData.data.length : 0
      });
      
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      
      const result = await dbManager.saveImage(imageData);
      console.log('✅ IPC Handler: Image saved successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('❌ IPC Handler: Failed to save image:', error);
      console.error('❌ Error details:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  });

  // Save annotation to database
  ipcMain.handle('db-save-annotation', async (event, annotationData) => {
    try {
      console.log('🔄 IPC Handler: db-save-annotation called');
      console.log('📊 Annotation data received:', {
        id: annotationData.id,
        sessionId: annotationData.sessionId,
        imageId: annotationData.imageId,
        annotationType: annotationData.annotationType,
        hasPoints: !!annotationData.points
      });
      
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      
      const result = await dbManager.saveAnnotation(annotationData);
      console.log('✅ IPC Handler: Annotation saved successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('❌ IPC Handler: Failed to save annotation:', error);
      console.error('❌ Error details:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  });

  // Get all sessions
  ipcMain.handle('db-get-sessions', async () => {
    try {
      console.log('🔄 IPC Handler: db-get-sessions called');
      
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      
      const sessions = await dbManager.getAllSessions();
      console.log('✅ IPC Handler: Retrieved sessions successfully');
      console.log(`📊 Found ${sessions.length} sessions in database`);
      
      sessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          title: session.title,
          attendees: session.attendees,
          category: session.category,
          total_annotations: session.total_annotations,
          actual_annotations: session.actual_annotations,
          actual_images: session.actual_images,
          annotated_images: session.annotated_images,
          status: session.status
        });
      });
      
      return { success: true, sessions };
    } catch (error) {
      console.error('❌ IPC Handler: Failed to get sessions:', error);
      console.error('❌ Error details:', error.message, error.stack);
      return { success: false, error: error.message, sessions: [] };
    }
  });

  // Get session details
  ipcMain.handle('db-get-session-details', async (event, sessionId) => {
    try {
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      const sessionDetails = await dbManager.getSessionDetails(sessionId);
      return { 
        success: true, 
        session: sessionDetails?.session,
        annotations: sessionDetails?.annotations || [],
        images: sessionDetails?.images || []
      };
    } catch (error) {
      console.error('❌ Failed to get session details:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete session
  ipcMain.handle('db-delete-session', async (event, sessionId) => {
    console.log('📨 IPC: Received delete session request for:', sessionId);
    console.log('📨 IPC: Session ID type:', typeof sessionId);
    console.log('📨 IPC: dbManager available:', !!dbManager);
    
    try {
      if (!dbManager) {
        console.error('❌ IPC: Database not initialized');
        throw new Error('Database not initialized');
      }
      
      console.log('📨 IPC: Calling dbManager.deleteSession...');
      const result = await dbManager.deleteSession(sessionId);
      console.log('📨 IPC: dbManager.deleteSession result:', result);
      
      // Return the result directly since deleteSession already returns the proper format
      return result;
    } catch (error) {
      console.error('❌ IPC: Failed to delete session:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete annotation
  ipcMain.handle('db-delete-annotation', async (event, annotationId) => {
    console.log('📨 IPC: Received delete annotation request for:', annotationId);
    console.log('📨 IPC: Annotation ID type:', typeof annotationId);
    console.log('📨 IPC: dbManager available:', !!dbManager);
    
    try {
      if (!dbManager) {
        console.error('❌ IPC: Database not initialized');
        throw new Error('Database not initialized');
      }
      
      console.log('📨 IPC: Calling dbManager.deleteAnnotation...');
      const result = await dbManager.deleteAnnotation(annotationId);
      console.log('📨 IPC: dbManager.deleteAnnotation result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ IPC: Failed to delete annotation:', error);
      return { success: false, error: error.message };
    }
  });

  // Get annotation statistics for charts
  ipcMain.handle('db-get-annotation-stats', async (event) => {
    try {
      if (!dbManager) {
        throw new Error('Database not initialized');
      }
      const stats = await dbManager.getAnnotationStats();
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Failed to get annotation stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Database health check
  ipcMain.handle('db-health-check', async (event) => {
    console.log('📨 IPC: Received database health check request');
    
    try {
      if (!dbManager) {
        console.error('❌ IPC: Database not initialized');
        throw new Error('Database not initialized');
      }
      
      const result = await dbManager.checkDatabaseHealth();
      console.log('📨 IPC: Database health check result:', result);
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ IPC: Database health check failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Get unique doctors/attendees for dropdown
  ipcMain.handle('db-get-unique-doctors', async (event) => {
    console.log('📨 IPC: Received get unique doctors request');
    
    try {
      if (!dbManager) {
        console.error('❌ IPC: Database not initialized');
        throw new Error('Database not initialized');
      }
      
      const doctors = await dbManager.getUniqueDoctors();
      console.log('📨 IPC: Returning unique doctors:', doctors);
      return { success: true, doctors };
    } catch (error) {
      console.error('❌ IPC: Get unique doctors failed:', error);
      return { success: false, error: error.message, doctors: [] };
    }
  });

  console.log('🔧 IPC handlers set up for annotation platform with database support');
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  console.log('🎯 Electron app ready');
  
  // Initialize database
  try {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    console.log('📊 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
  
  // Set up IPC handlers for annotation platform
  setupIPCHandlers();
  
  // Create main window
  createWindow();
  
  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when windows are closed
  if (process.platform !== 'darwin') {
    console.log('👋 All windows closed, quitting app');
    // Close database connection
    if (dbManager) {
      dbManager.close();
    }
    app.quit();
  }
});

// App quit handler
app.on('before-quit', () => {
  console.log('🔚 App is quitting, cleaning up...');
  if (dbManager) {
    dbManager.close();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow navigation within localhost
    if (parsedUrl.origin === 'http://localhost:3000') {
      console.log('✅ Allowing navigation to:', navigationUrl);
      return;
    }
    
    // Block external navigation
    console.log('🚫 Blocking navigation to external URL:', navigationUrl);
    navigationEvent.preventDefault();
  });
  
  contents.on('new-window', (event, navigationUrl) => {
    // Prevent new windows
    event.preventDefault();
    console.log('🚫 Blocked new window:', navigationUrl);
  });
});

console.log('🚀 Regional Anesthesia Annotation Platform starting...');
console.log('📁 App path:', app.getAppPath());
console.log('🔧 Node.js version:', process.version);
console.log('⚡ Electron version:', process.versions.electron);
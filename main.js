/*
Project Goal:
Integrate Webex SDK into an Electron-based web application to support a telemedicine call with four video windows:
1. Expert Supervisor's video
2. Resident Doctor's video
3. Ultrasound feed shared by the Resident
4. Annotation window for Expert to view snapshots and tag nerves

Functional Requirements:
- Use Webex JavaScript SDK for video calling
- Set up Electron to display these four windows simultaneously
- Enable screen sharing or video feed for ultrasound
- Include annotation functionality using VGG Image Annotator (or similar) in one window

Please implement step-by-step with clean and reusable code structure.
*/


const { app, BrowserWindow, ipcMain, desktopCapturer, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Keep a global reference of the window object
let mainWindow;

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
      webSecurity: false, // Allow embedded OAuth webviews
      allowRunningInsecureContent: false,
      webviewTag: true, // Enable webview tag for embedded OAuth
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'assets/icon.png') // Optional: add an icon
  });

  // Load the login page from the development server
  const startUrl = 'http://localhost:3000/src/pages/login-simple.html';
  
  console.log('Loading Ultrasound Webex app from:', startUrl);
  
  // Enable media permissions for camera, microphone, and screen capture
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['camera', 'microphone', 'display-capture', 'notifications'];
    
    if (allowedPermissions.includes(permission)) {
      console.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      console.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });
  
  // Handle media access requests
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const allowedPermissions = ['camera', 'microphone', 'display-capture', 'notifications'];
    
    // Allow media permissions for localhost development
    if (requestingOrigin === 'http://localhost:3000' && allowedPermissions.includes(permission)) {
      console.log(`Allowing ${permission} access for localhost`);
      return true;
    }
    
    return false;
  });
  
  // Load the URL
  mainWindow.loadURL(startUrl);
  
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
            <p>The Electron app needs a running development server to load the web pages.</p>
            
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
    mainWindow.setTitle(`Ultrasound Webex - ${title}`);
  });
  
  // Log when navigation occurs
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('🔄 Navigated to:', url);
  });
}

// IPC Handlers for Webex Integration
function setupIPCHandlers() {
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

  // Get available media devices
  ipcMain.handle('get-media-devices', async () => {
    try {
      // This will be handled by the renderer process using navigator.mediaDevices
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to get media devices:', error);
      return { success: false, error: error.message };
    }
  });

  // Get screen sources for screen sharing
  ipcMain.handle('get-screen-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 320, height: 240 }
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('❌ Failed to get screen sources:', error);
      return [];
    }
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

  // Handle opening external URLs (for OAuth)
  ipcMain.handle('open-external', async (event, url) => {
    try {
      console.log('🔗 Opening external URL:', url);
      const { shell } = require('electron');
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to open external URL:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('📡 IPC handlers set up for Webex integration');
}

// Enable media access globally
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('allow-http-screen-capture');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('auto-select-desktop-capture-source', 'Screen');

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('🎯 Electron app ready');
  
  // Set up IPC handlers for Webex integration
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
    app.quit();
  }
});

// Security: Prevent navigation to external URLs (except for OAuth)
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow navigation within localhost
    if (parsedUrl.origin === 'http://localhost:3000') {
      console.log('✅ Allowing navigation to:', navigationUrl);
      return;
    }
    
    // Allow Webex OAuth URLs for embedded webviews
    if (parsedUrl.hostname.includes('webex.com') || 
        parsedUrl.hostname.includes('webexapis.com') ||
        parsedUrl.hostname.includes('idbroker-eu.webex.com')) {
      console.log('🔐 Allowing Webex OAuth URL for embedded webview:', navigationUrl);
      return;
    }
    
    // Block other external navigation
    console.log('🚫 Blocking navigation to external URL:', navigationUrl);
    navigationEvent.preventDefault();
  });
  
  contents.on('new-window', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow Webex OAuth URLs for embedded webviews
    if (parsedUrl.hostname.includes('webex.com') || 
        parsedUrl.hostname.includes('webexapis.com') ||
        parsedUrl.hostname.includes('idbroker-eu.webex.com')) {
      console.log('🔐 Allowing Webex OAuth new window for embedded webview:', navigationUrl);
      return;
    }
    
    // Prevent other new windows
    event.preventDefault();
    console.log('🚫 Blocked new window:', navigationUrl);
  });
});

console.log('🚀 Ultrasound Webex Electron app starting...');
console.log('📁 App path:', app.getAppPath());
console.log('🔧 Node.js version:', process.version);
console.log('⚡ Electron version:', process.versions.electron);
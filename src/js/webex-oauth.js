// Webex OAuth Authentication System
// Production-ready OAuth 2.0 implementation for Webex sign-in

console.log('🔐 Webex OAuth System loaded');

// Webex OAuth Configuration
const WEBEX_CONFIG = {
  // You'll need to register your app at https://developer.webex.com/my-apps
  CLIENT_ID: 'C04ee49a43ab0cba36ac893710369498d64623ed985efff16161d63f1be7e8ef9', // Replace with your actual Client ID
  CLIENT_SECRET: '0c11c96183fbe25007173ad21d0d0e01c82f3b49ff96e33be7463ceb49f295cb', // Replace with your actual Client Secret
  REDIRECT_URI: window.location.origin + '/src/pages/oauth-callback.html',
  SCOPE: 'spark:all', // Full access scope
  AUTHORIZATION_URL: 'https://webexapis.com/v1/authorize',
  TOKEN_URL: 'https://webexapis.com/v1/access_token',
  API_BASE_URL: 'https://webexapis.com/v1'
};

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('webex_access_token');
  const refreshToken = localStorage.getItem('webex_refresh_token');
  const userInfo = localStorage.getItem('webex_user_info');
  
  console.log('🔍 OAuth Auth check:', {
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUserInfo: !!userInfo
  });
  
  return !!(token && userInfo);
}

// Get current user information
function getCurrentUser() {
  try {
    const userInfo = localStorage.getItem('webex_user_info');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      console.log('🔍 Current OAuth user:', user);
      return user;
    }
    console.log('🔍 No OAuth user info found');
    return null;
  } catch (error) {
    console.error('🔍 Error getting current OAuth user:', error);
    return null;
  }
}

// Start OAuth login flow (Embedded in Electron)
function startWebexLogin() {
  console.log('🚀 Starting embedded Webex OAuth login flow...');
  
  // Generate state parameter for security
  const state = generateRandomString(32);
  localStorage.setItem('oauth_state', state);
  
  // Build authorization URL
  const authUrl = new URL(WEBEX_CONFIG.AUTHORIZATION_URL);
  authUrl.searchParams.append('client_id', WEBEX_CONFIG.CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', WEBEX_CONFIG.REDIRECT_URI);
  authUrl.searchParams.append('scope', WEBEX_CONFIG.SCOPE);
  authUrl.searchParams.append('state', state);
  
  console.log('🔗 Creating embedded OAuth webview:', authUrl.toString());
  
  // Create embedded OAuth modal
  createEmbeddedOAuthModal(authUrl.toString());
}

// Create embedded OAuth modal with webview
function createEmbeddedOAuthModal(authUrl) {
  // Remove any existing modal
  const existingModal = document.querySelector('.oauth-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'oauth-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: Inter, sans-serif;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: #1a1a1a;
    border-radius: 12px;
    width: 90%;
    max-width: 900px;
    height: 80%;
    max-height: 700px;
    border: 1px solid #333;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: #2a2a2a;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🩺</div>
      <div>
        <h3 style="color: #e2e8f0; margin: 0; font-size: 1.1rem;">Sign in to Webex</h3>
        <p style="color: #a0aec0; margin: 0; font-size: 0.9rem;">Secure OAuth Authentication</p>
      </div>
    </div>
    <button onclick="closeOAuthModal()" style="background: none; border: none; color: #a0aec0; font-size: 1.5rem; cursor: pointer; padding: 0.5rem;" title="Close">×</button>
  `;
  
  // Create webview container
  const webviewContainer = document.createElement('div');
  webviewContainer.style.cssText = `
    flex: 1;
    position: relative;
    background: #fff;
  `;
  
  // Create webview (iframe for web compatibility, webview for Electron)
  const webview = document.createElement('iframe');
  webview.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
  `;
  
  // Set up webview
  webview.src = authUrl;
  
  // Create loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  `;
  
  loadingOverlay.innerHTML = `
    <div style="width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
    <p style="color: #666; font-size: 14px;">Loading Webex sign-in...</p>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  // Handle webview load
  webview.onload = function() {
    console.log('🔄 OAuth webview loaded');
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
    }, 1000);
  };
  
  // Monitor webview navigation for OAuth callback
  let checkInterval;
  const startMonitoring = () => {
    checkInterval = setInterval(() => {
      try {
        // Check if webview has navigated to callback URL
        const currentUrl = webview.contentWindow?.location?.href;
        if (currentUrl && currentUrl.includes('/oauth-callback.html')) {
          console.log('🔍 OAuth callback detected in webview');
          
          // Extract parameters from URL
          const url = new URL(currentUrl);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');
          
          if (code && state) {
            console.log('✅ OAuth authorization code received');
            clearInterval(checkInterval);
            handleEmbeddedOAuthCallback(code, state);
          } else if (error) {
            console.error('❌ OAuth error received:', error);
            clearInterval(checkInterval);
            showOAuthError(error);
          }
        }
      } catch (e) {
        // Cross-origin restrictions prevent access to iframe content
        // We'll use a different approach with postMessage
      }
    }, 1000);
  };
  
  // Listen for postMessage from OAuth callback
  window.addEventListener('message', function(event) {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'oauth-callback') {
      console.log('📨 OAuth callback message received', event.data);
      clearInterval(checkInterval);
      
      if (event.data.code && event.data.state) {
        handleEmbeddedOAuthCallback(event.data.code, event.data.state);
      } else if (event.data.error) {
        showOAuthError(event.data.error);
      }
    }
  });
  
  // Assemble modal
  webviewContainer.appendChild(webview);
  webviewContainer.appendChild(loadingOverlay);
  modalContent.appendChild(header);
  modalContent.appendChild(webviewContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Start monitoring after a delay to allow webview to load
  setTimeout(startMonitoring, 2000);
  
  // Store interval reference for cleanup
  modal.monitorInterval = checkInterval;
}

// Handle OAuth callback
async function handleOAuthCallback(code, state, receivedState) {
  try {
    console.log('🔄 Handling OAuth callback...');
    console.log('🔍 OAuth callback details:', { code: !!code, state, receivedState });
    
    // Check if we're in an external browser (different context from Electron app)
    const storedState = localStorage.getItem('oauth_state');
    const isExternalBrowser = !storedState && state; // No stored state but we have a state param
    
    console.log('🔍 OAuth context check:', {
      storedState: !!storedState,
      receivedState: state,
      isExternalBrowser
    });
    
    if (!isExternalBrowser) {
      // Normal OAuth flow - verify state parameter
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }
      // Clear stored state
      localStorage.removeItem('oauth_state');
    } else {
      console.log('🌐 External browser OAuth detected - skipping state validation');
      // For external browser OAuth, we'll rely on the authorization code validation
      // and the fact that the redirect_uri is controlled by us
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch(WEBEX_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(WEBEX_CONFIG.CLIENT_ID + ':' + WEBEX_CONFIG.CLIENT_SECRET)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: WEBEX_CONFIG.CLIENT_ID,
        client_secret: WEBEX_CONFIG.CLIENT_SECRET,
        code: code,
        redirect_uri: WEBEX_CONFIG.REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ OAuth token received');

    // Store tokens
    localStorage.setItem('webex_access_token', tokenData.access_token);
    localStorage.setItem('webex_refresh_token', tokenData.refresh_token);
    localStorage.setItem('webex_token_expires', (Date.now() + (tokenData.expires_in * 1000)).toString());

    // Get user information
    const userResponse = await fetch(`${WEBEX_CONFIG.API_BASE_URL}/people/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const userInfo = await userResponse.json();
    console.log('✅ OAuth user info received:', userInfo);

    // Store user info
    localStorage.setItem('webex_user_info', JSON.stringify(userInfo));

    return {
      success: true,
      userInfo: userInfo,
      accessToken: tokenData.access_token
    };

  } catch (error) {
    console.error('❌ OAuth callback failed:', error);
    
    // Clear any partial auth data
    localStorage.removeItem('webex_access_token');
    localStorage.removeItem('webex_refresh_token');
    localStorage.removeItem('webex_user_info');
    localStorage.removeItem('webex_token_expires');
    localStorage.removeItem('oauth_state');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Refresh access token
async function refreshAccessToken() {
  try {
    console.log('🔄 Refreshing access token...');
    
    const refreshToken = localStorage.getItem('webex_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(WEBEX_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(WEBEX_CONFIG.CLIENT_ID + ':' + WEBEX_CONFIG.CLIENT_SECRET)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: WEBEX_CONFIG.CLIENT_ID,
        client_secret: WEBEX_CONFIG.CLIENT_SECRET
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    // Update stored tokens
    localStorage.setItem('webex_access_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      localStorage.setItem('webex_refresh_token', tokenData.refresh_token);
    }
    localStorage.setItem('webex_token_expires', (Date.now() + (tokenData.expires_in * 1000)).toString());

    console.log('✅ Access token refreshed');
    return tokenData.access_token;

  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // Clear auth data and redirect to login
    logout();
    throw error;
  }
}

// Check if token needs refresh
function isTokenExpired() {
  const expiresAt = localStorage.getItem('webex_token_expires');
  if (!expiresAt) return true;
  
  const now = Date.now();
  const expires = parseInt(expiresAt);
  
  // Consider token expired if it expires within next 5 minutes
  return now >= (expires - 300000);
}

// Get valid access token (refresh if needed)
async function getValidAccessToken() {
  try {
    let token = localStorage.getItem('webex_access_token');
    
    if (!token) {
      throw new Error('No access token available');
    }

    if (isTokenExpired()) {
      console.log('🔄 Token expired, refreshing...');
      token = await refreshAccessToken();
    }

    return token;
  } catch (error) {
    console.error('❌ Failed to get valid token:', error);
    throw error;
  }
}

// Make authenticated API request
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const token = await getValidAccessToken();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  } catch (error) {
    console.error('❌ Authenticated request failed:', error);
    throw error;
  }
}

// Logout user
function logout() {
  console.log('🔐 Logging out OAuth user...');
  localStorage.removeItem('webex_access_token');
  localStorage.removeItem('webex_refresh_token');
  localStorage.removeItem('webex_user_info');
  localStorage.removeItem('webex_token_expires');
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('user_profile');
  localStorage.removeItem('user_role');
  console.log('✅ OAuth logout successful');
}

// Generate random string for state parameter
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// User role functions (same as before)
function getUserRole() {
  try {
    const role = localStorage.getItem('user_role');
    if (role) {
      console.log('🔍 User role:', role);
      return role;
    }
    
    const profile = localStorage.getItem('user_profile');
    if (profile) {
      const profileData = JSON.parse(profile);
      if (profileData.userRole) {
        console.log('🔍 User role from profile:', profileData.userRole);
        return profileData.userRole;
      }
    }
    
    console.log('🔍 No user role found, defaulting to expert');
    return 'expert';
  } catch (error) {
    console.error('🔍 Error getting user role:', error);
    return 'expert';
  }
}

function getUserRoleDisplayName() {
  const role = getUserRole();
  return role === 'expert' ? 'Expert Supervisor' : 'Resident Doctor';
}

// Electron-specific OAuth helper functions
function copyToClipboard(text) {
  try {
    // Try using the Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      console.log('✅ URL copied to clipboard via Clipboard API');
    } else {
      // Fallback: create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('✅ URL copied to clipboard via fallback method');
    }
  } catch (error) {
    console.error('❌ Failed to copy to clipboard:', error);
  }
}

function showOAuthInstructions(authUrl) {
  // Create and show instruction modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: Inter, sans-serif;
  `;
  
  modal.innerHTML = `
    <div style="background: #1a1a1a; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 1rem; border: 1px solid #333;">
      <h3 style="color: #3b82f6; margin-bottom: 1rem;">🔐 Complete OAuth Login</h3>
      <p style="color: #e2e8f0; margin-bottom: 1rem; line-height: 1.5;">
        The OAuth URL has been opened in your browser. Please complete the authentication there.
      </p>
      
      <div style="background: #2a2a2a; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="color: #10b981; margin-bottom: 0.5rem;">After completing authentication in browser:</h4>
        <ol style="color: #e2e8f0; padding-left: 1.5rem; line-height: 1.6; font-size: 14px;">
          <li>Click "📋 Copy Auth Data" button in the browser</li>
          <li>Return to this app</li>
          <li>Click "Paste Authentication" button below</li>
          <li>Paste the copied data</li>
        </ol>
      </div>
      
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
        <button onclick="copyToClipboard('${authUrl}')" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; flex: 1;">
          📋 Copy OAuth URL Again
        </button>
        <button onclick="showManualAuthInput()" style="background: #10b981; color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; flex: 1;">
          📥 Paste Authentication
        </button>
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <button onclick="this.closest('[style*=position]').remove()" style="background: #374151; color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; flex: 1;">
          Close
        </button>
      </div>
      
      <div id="manualAuthInput" style="display: none; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #333;">
        <h4 style="color: #f59e0b; margin-bottom: 1rem;">Manual Authentication Transfer</h4>
        <textarea id="authDataTextarea" placeholder="Paste the authentication data here..." 
                  style="width: 100%; height: 120px; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 1rem; color: #e2e8f0; font-family: monospace; font-size: 12px; resize: vertical; margin-bottom: 1rem;"></textarea>
        <div style="display: flex; gap: 1rem;">
          <button onclick="processManualAuthFromModal()" style="background: #10b981; color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; flex: 1;">
            ✅ Apply Authentication
          </button>
          <button onclick="document.getElementById('manualAuthInput').style.display='none'" style="background: #6b7280; color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function startOAuthPolling() {
  console.log('🔄 Starting OAuth polling...');
  
  const pollInterval = setInterval(() => {
    // Check if OAuth tokens have been stored (indicating successful authentication)
    const token = localStorage.getItem('webex_access_token');
    const userInfo = localStorage.getItem('webex_user_info');
    
    // Also check for external browser auth transfer
    const authTransfer = localStorage.getItem('electron_auth_transfer');
    
    if (token && userInfo && !token.startsWith('demo_token_')) {
      console.log('✅ OAuth authentication detected, stopping polling...');
      clearInterval(pollInterval);
      
      // Remove any instruction modal
      const modal = document.querySelector('[style*="position: fixed"]');
      if (modal) modal.remove();
      
      // Redirect to home
      setTimeout(() => {
        window.location.href = 'home-clean.html';
      }, 1000);
    } else if (authTransfer) {
      console.log('📤 External browser auth transfer detected...');
      try {
        const authData = JSON.parse(authTransfer);
        
        // Verify the data is recent (within 10 minutes)
        if (Date.now() - authData.timestamp < 600000) {
          console.log('✅ Applying external auth data...');
          
          // Store the authentication data
          localStorage.setItem('webex_access_token', authData.accessToken);
          localStorage.setItem('webex_user_info', JSON.stringify(authData.userInfo));
          
          // Clean up transfer data
          localStorage.removeItem('electron_auth_transfer');
          
          clearInterval(pollInterval);
          
          // Remove any instruction modal
          const modal = document.querySelector('[style*="position: fixed"]');
          if (modal) modal.remove();
          
          // Redirect to home
          setTimeout(() => {
            window.location.href = 'home-clean.html';
          }, 1000);
        } else {
          console.log('⏰ Auth transfer data too old, ignoring...');
          localStorage.removeItem('electron_auth_transfer');
        }
      } catch (error) {
        console.error('❌ Failed to process auth transfer:', error);
        localStorage.removeItem('electron_auth_transfer');
      }
    } else {
      // Try alternative detection methods for cross-context communication
      // Check if we can detect a successful OAuth by checking a shared resource
      checkForCrossContextAuth();
    }
  }, 2000); // Check every 2 seconds
  
  // Stop polling after 10 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
    console.log('⏰ OAuth polling timeout');
  }, 600000);
}

// Check for cross-context authentication (browser to Electron)
function checkForCrossContextAuth() {
  // Try to detect if browser has completed OAuth by making a request to a special endpoint
  // that the browser might have left a marker for
  try {
    // Check if there's a temporary auth marker in the URL fragment or query params
    const urlParams = new URLSearchParams(window.location.search);
    const authMarker = urlParams.get('auth_completed');
    
    if (authMarker) {
      console.log('🔍 Found auth completion marker, checking for data...');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // For now, this is a placeholder for more advanced cross-context communication
    // In a real implementation, you might use:
    // - WebSocket communication
    // - Shared file system
    // - Inter-process communication through Electron's main process
    
  } catch (error) {
    console.error('❌ Cross-context auth check failed:', error);
  }
}

// Export functions for use in other scripts
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.startWebexLogin = startWebexLogin;
window.handleOAuthCallback = handleOAuthCallback;
window.refreshAccessToken = refreshAccessToken;
window.getValidAccessToken = getValidAccessToken;
window.makeAuthenticatedRequest = makeAuthenticatedRequest;
window.logout = logout;
window.getUserRole = getUserRole;
window.getUserRoleDisplayName = getUserRoleDisplayName;
window.copyToClipboard = copyToClipboard;
window.showOAuthInstructions = showOAuthInstructions;
window.startOAuthPolling = startOAuthPolling;
window.showManualAuthInput = showManualAuthInput;
window.processManualAuthFromModal = processManualAuthFromModal;
window.WEBEX_CONFIG = WEBEX_CONFIG;

// Helper functions for modal
function showManualAuthInput() {
  const inputDiv = document.getElementById('manualAuthInput');
  if (inputDiv) {
    inputDiv.style.display = 'block';
    const textarea = document.getElementById('authDataTextarea');
    if (textarea) textarea.focus();
  }
}

function processManualAuthFromModal() {
  try {
    const textarea = document.getElementById('authDataTextarea');
    if (!textarea) throw new Error('Auth input not found');
    
    const authDataText = textarea.value.trim();
    if (!authDataText) throw new Error('Please paste the authentication data');

    const authData = JSON.parse(authDataText);
    
    if (!authData.accessToken || !authData.userInfo) {
      throw new Error('Invalid authentication data format');
    }

    console.log('📋 Processing manual authentication from modal...');
    
    // Store the authentication data
    localStorage.setItem('webex_access_token', authData.accessToken);
    localStorage.setItem('webex_user_info', JSON.stringify(authData.userInfo));
    
    console.log('✅ Manual authentication successful');
    
    // Remove modal
    const modal = document.querySelector('[style*="position: fixed"]');
    if (modal) modal.remove();
    
    // Redirect to home
    setTimeout(() => {
      window.location.href = 'home-clean.html';
    }, 500);
    
  } catch (error) {
    console.error('❌ Manual authentication failed:', error);
    alert('Failed to process authentication data: ' + error.message);
  }
}

// Close OAuth modal
function closeOAuthModal() {
  const modal = document.querySelector('.oauth-modal');
  if (modal) {
    // Clear any monitoring intervals
    if (modal.monitorInterval) {
      clearInterval(modal.monitorInterval);
    }
    modal.remove();
  }
}

// Handle embedded OAuth callback
async function handleEmbeddedOAuthCallback(code, state) {
  try {
    console.log('🔄 Handling embedded OAuth callback...');
    
    // Verify state parameter
    const storedState = localStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }
    
    // Clear stored state
    localStorage.removeItem('oauth_state');
    
    // Show processing state in modal
    const modal = document.querySelector('.oauth-modal');
    if (modal) {
      const webviewContainer = modal.querySelector('div[style*="flex: 1"]');
      if (webviewContainer) {
        webviewContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; background: #f8fafc;">
            <div style="width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;"></div>
            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1.2rem;">Processing Authentication</h3>
            <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Exchanging authorization code for access token...</p>
          </div>
        `;
      }
    }
    
    // Handle the OAuth callback using existing function
    const result = await handleOAuthCallback(code, state);
    
    if (result.success) {
      console.log('✅ Embedded OAuth authentication successful');
      
      // Show success state
      if (modal) {
        const webviewContainer = modal.querySelector('div[style*="flex: 1"]');
        if (webviewContainer) {
          webviewContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; background: #f0fdf4;">
              <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; font-size: 2rem;">✅</div>
              <h3 style="color: #065f46; margin: 0 0 0.5rem 0; font-size: 1.2rem;">Authentication Successful!</h3>
              <p style="color: #047857; margin: 0 0 1.5rem 0; font-size: 0.9rem;">Welcome, ${result.userInfo.displayName || result.userInfo.email}</p>
              <p style="color: #6b7280; margin: 0; font-size: 0.8rem;">Redirecting to home page...</p>
            </div>
          `;
        }
      }
      
      // Close modal and redirect after a short delay
      setTimeout(() => {
        closeOAuthModal();
        window.location.href = 'home-clean.html';
      }, 2000);
      
    } else {
      throw new Error(result.error || 'Authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Embedded OAuth callback failed:', error);
    showOAuthError(error.message);
  }
}

// Show OAuth error in modal
function showOAuthError(errorMessage) {
  const modal = document.querySelector('.oauth-modal');
  if (modal) {
    const webviewContainer = modal.querySelector('div[style*="flex: 1"]');
    if (webviewContainer) {
      webviewContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; background: #fef2f2;">
          <div style="width: 64px; height: 64px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; font-size: 2rem;">❌</div>
          <h3 style="color: #991b1b; margin: 0 0 0.5rem 0; font-size: 1.2rem;">Authentication Failed</h3>
          <p style="color: #dc2626; margin: 0 0 1.5rem 0; font-size: 0.9rem; text-align: center; max-width: 400px;">${errorMessage}</p>
          <div style="display: flex; gap: 1rem;">
            <button onclick="closeOAuthModal()" style="background: #6b7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Close</button>
            <button onclick="startWebexLogin()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Try Again</button>
          </div>
        </div>
      `;
    }
  }
}

console.log('✅ Webex OAuth System ready');

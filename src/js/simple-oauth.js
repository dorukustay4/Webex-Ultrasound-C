// Simple OAuth using external browser - guaranteed to work
console.log('🔐 Simple OAuth System loaded');

// Webex OAuth Configuration
const SIMPLE_WEBEX_CONFIG = {
  CLIENT_ID: 'C04ee49a43ab0cba36ac893710369498d64623ed985efff16161d63f1be7e8ef9',
  CLIENT_SECRET: '0c11c96183fbe25007173ad21d0d0e01c82f3b49ff96e33be7463ceb49f295cb',
  REDIRECT_URI: window.location.origin + '/src/pages/oauth-callback-simple.html',
  SCOPE: 'spark:all spark:kms meeting:controls_write meeting:schedules_read meeting:participants_read meeting:controls_read meeting:participants_write meeting:schedules_write',
  AUTHORIZATION_URL: 'https://webexapis.com/v1/authorize',
  TOKEN_URL: 'https://webexapis.com/v1/access_token'
};

// Generate random string for OAuth state
function generateSimpleRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Debug function to show current redirect URI and registration instructions
function showRedirectUriInfo() {
  const currentUri = SIMPLE_WEBEX_CONFIG.REDIRECT_URI;
  const possibleUris = [
    'http://localhost:3000/src/pages/oauth-callback-simple.html',
    'http://localhost:3000/oauth-callback-simple.html',
    'http://127.0.0.1:3000/src/pages/oauth-callback-simple.html',
    'http://127.0.0.1:3000/oauth-callback-simple.html'
  ];
  
  console.log('🔗 Current Redirect URI:', currentUri);
  console.log('📋 Possible Redirect URIs to register:', possibleUris);
  
  alert(`Current Redirect URI: ${currentUri}\n\nRegister this URI in your Webex app settings:\n1. Go to https://developer.webex.com/my-apps\n2. Edit your app\n3. Add this exact URI to "Redirect URI(s)": ${currentUri}\n4. Save changes\n\nOther possible URIs to try:\n${possibleUris.join('\n')}`);
}

// Start simple OAuth flow - opens in external browser
function startSimpleWebexLogin() {
  console.log('🚀 Starting simple Webex OAuth login...');
  
  try {
    // Generate state parameter for security
    const state = generateSimpleRandomString(32);
    localStorage.setItem('oauth_state', state);
    
    // Also store state with timestamp for debugging
    const stateInfo = {
      state: state,
      timestamp: Date.now(),
      context: 'electron-app'
    };
    localStorage.setItem('oauth_state_info', JSON.stringify(stateInfo));
    console.log('🔐 OAuth state generated:', stateInfo);
    
    // Build authorization URL
    const authUrl = new URL(SIMPLE_WEBEX_CONFIG.AUTHORIZATION_URL);
    authUrl.searchParams.append('client_id', SIMPLE_WEBEX_CONFIG.CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', SIMPLE_WEBEX_CONFIG.REDIRECT_URI);
    authUrl.searchParams.append('scope', SIMPLE_WEBEX_CONFIG.SCOPE);
    authUrl.searchParams.append('state', state);
    
    console.log('🔗 Opening OAuth URL in external browser:', authUrl.toString());
    
    // Show user instructions
    showSimpleOAuthInstructions();
    
    // Open in external browser
    if (window.electronAPI && window.electronAPI.openExternal) {
      // Electron environment
      window.electronAPI.openExternal(authUrl.toString());
    } else {
      // Web environment
      window.open(authUrl.toString(), '_blank');
    }
    
    // Start listening for authentication result
    startSimpleAuthListener();
    
  } catch (error) {
    console.error('❌ Failed to start simple OAuth:', error);
    alert('Failed to start OAuth: ' + error.message);
  }
}

// Show instructions to user
function showSimpleOAuthInstructions() {
  // Remove existing instructions
  const existing = document.querySelector('.simple-oauth-instructions');
  if (existing) existing.remove();
  
  // Create instructions overlay
  const overlay = document.createElement('div');
  overlay.className = 'simple-oauth-instructions';
  overlay.style.cssText = `
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
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    text-align: center;
    color: #e2e8f0;
  `;
  
  content.innerHTML = `
    <h3 style="color: #3b82f6; margin-bottom: 1rem;">🔐 Webex Authentication</h3>
    <p style="margin-bottom: 1.5rem; line-height: 1.5;">
      A browser window should have opened for Webex sign-in.<br>
      <strong>Complete the authentication in your browser</strong>, then return to this app.
    </p>
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Tip:</strong> If no browser opened, check if pop-ups are blocked or try the manual token method instead.
      </p>
    </div>
    <button onclick="hideSimpleOAuthInstructions()" style="
      background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
      border: none;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 1rem;
    ">Got it!</button>
    <button onclick="cancelSimpleOAuth()" style="
      background: #374151;
      border: none;
      color: #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
    ">Cancel</button>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

// Hide instructions
function hideSimpleOAuthInstructions() {
  const overlay = document.querySelector('.simple-oauth-instructions');
  if (overlay) overlay.remove();
}

// Cancel OAuth
function cancelSimpleOAuth() {
  hideSimpleOAuthInstructions();
  stopSimpleAuthListener();
  localStorage.removeItem('oauth_state');
}

// Start listening for authentication result
function startSimpleAuthListener() {
  console.log('👂 Starting auth listener...');
  
  // Listen for localStorage changes (from callback page)
  window.addEventListener('storage', handleSimpleStorageChange);
  
  // Also poll for changes (fallback)
  window.simpleAuthCheckInterval = setInterval(() => {
    const authResult = localStorage.getItem('simple_oauth_result');
    if (authResult) {
      handleSimpleAuthResult(JSON.parse(authResult));
    }
  }, 1000);
}

// Stop auth listener
function stopSimpleAuthListener() {
  window.removeEventListener('storage', handleSimpleStorageChange);
  if (window.simpleAuthCheckInterval) {
    clearInterval(window.simpleAuthCheckInterval);
    window.simpleAuthCheckInterval = null;
  }
}

// Handle storage changes
function handleSimpleStorageChange(event) {
  if (event.key === 'simple_oauth_result') {
    const authResult = JSON.parse(event.newValue);
    handleSimpleAuthResult(authResult);
  }
}

// Handle authentication result
function handleSimpleAuthResult(result) {
  console.log('📨 Simple OAuth result received:', result);
  
  // Stop listening
  stopSimpleAuthListener();
  hideSimpleOAuthInstructions();
  
  // Clear result from storage
  localStorage.removeItem('simple_oauth_result');
  
  if (result.success) {
    console.log('✅ Simple OAuth successful!');
    
    // Store authentication data
    localStorage.setItem('webex_access_token', result.access_token);
    localStorage.setItem('webex_user_info', JSON.stringify(result.user_info));
    
    // Redirect to home page
    window.location.href = 'home-clean.html';
    
  } else {
    console.error('❌ Simple OAuth failed:', result.error);
    alert('Authentication failed: ' + result.error);
  }
}

// Export the simple login function
window.startSimpleWebexLogin = startSimpleWebexLogin;
window.hideSimpleOAuthInstructions = hideSimpleOAuthInstructions;
window.cancelSimpleOAuth = cancelSimpleOAuth;
window.showRedirectUriInfo = showRedirectUriInfo;

console.log('✅ Simple OAuth System ready');
console.log('🔗 Current Redirect URI:', SIMPLE_WEBEX_CONFIG.REDIRECT_URI);
console.log('💡 Call showRedirectUriInfo() to see registration instructions');

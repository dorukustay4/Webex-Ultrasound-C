// Webex OAuth Authentication
console.log('Auth.js loaded successfully!');

// Webex OAuth Configuration
const WEBEX_CONFIG = {
  // Replace these with your actual Webex Integration credentials
  clientId: 'C97348067c381458de8ac4de0f6fb00227f607050d698c5161dabbb1e0ee579f8', // Get this from developer.webex.com/my-apps
  redirectUri: window.location.origin + '/auth-callback.html', // Must be registered in your integration
  scope: 'spark:messages_read spark:messages_write spark:rooms_read spark:people_read meeting:schedules_read meeting:schedules_write',
  
  // OAuth endpoints
  authUrl: 'https://webexapis.com/v1/authorize',
  tokenUrl: 'https://webexapis.com/v1/access_token'
};

// Generate a random state parameter for security
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Generate PKCE code verifier and challenge for enhanced security
async function generatePKCE() {
  // Generate code verifier
  const codeVerifier = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
  
  // Generate code challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
}

// Main login function
window.loginWithWebex = async function() {
  console.log('Login with Webex clicked!');
  
  const loginBtn = document.getElementById('webex-login-btn');
  const errorDiv = document.getElementById('error-message');
  
  // Show loading state
  loginBtn.classList.add('loading');
  loginBtn.innerHTML = '<div class="spinner"></div> Redirecting to Webex...';
  errorDiv.style.display = 'none';
  
  try {
    // Check if we have the client ID configured
    if (WEBEX_CONFIG.clientId === 'YOUR_CLIENT_ID_HERE') {
      throw new Error('Webex Integration not configured. Please set your Client ID in auth.js');
    }
    
    // Generate state parameter for security
    const state = generateState();
    
    // Store state in localStorage for later verification
    localStorage.setItem('webex_state', state);
    
    // Build authorization URL (using implicit flow for browser-only apps)
    const authParams = new URLSearchParams({
      response_type: 'token',  // Changed from 'code' to 'token'
      client_id: WEBEX_CONFIG.clientId,
      redirect_uri: WEBEX_CONFIG.redirectUri,
      scope: WEBEX_CONFIG.scope,
      state: state
      // Removed PKCE params as they're not needed for implicit flow
    });
    
    const authUrl = `${WEBEX_CONFIG.authUrl}?${authParams.toString()}`;
    
    console.log('Redirecting to:', authUrl);
    
    // Redirect to Webex OAuth page
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
    
    // Reset button
    loginBtn.classList.remove('loading');
    loginBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
      </svg>
      Sign in with Webex
    `;
  }
};

// Continue as guest function
window.continueAsGuest = function() {
  console.log('Continue as guest clicked!');
  
  // Store guest mode flag
  localStorage.setItem('webex_auth_mode', 'guest');
  localStorage.removeItem('webex_access_token');
  localStorage.removeItem('webex_user_info');
  
  // Redirect to main app
  window.location.href = 'index.html';
};

// Exchange authorization code for access token
async function exchangeCodeForToken(code, state) {
  const storedState = localStorage.getItem('webex_state');
  const codeVerifier = localStorage.getItem('webex_code_verifier');
  
  // Verify state parameter
  if (state !== storedState) {
    throw new Error('Invalid state parameter. Possible CSRF attack.');
  }
  
  // Exchange code for token
  const tokenParams = {
    grant_type: 'authorization_code',
    client_id: WEBEX_CONFIG.clientId,
    code: code,
    redirect_uri: WEBEX_CONFIG.redirectUri,
    code_verifier: codeVerifier
  };
  
  const response = await fetch(WEBEX_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(tokenParams)
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }
  
  return await response.json();
}

// Get user information from Webex API
async function getUserInfo(accessToken) {
  const response = await fetch('https://webexapis.com/v1/people/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user information');
  }
  
  return await response.json();
}

// Handle OAuth callback (should be called from auth-callback.html)
window.handleOAuthCallback = async function() {
  // For implicit flow, the token is in the URL fragment (after #)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const state = hashParams.get('state');
  const error = hashParams.get('error');
  
  // Also check URL parameters (in case of error)
  const urlParams = new URLSearchParams(window.location.search);
  const urlError = urlParams.get('error');
  
  if (error || urlError) {
    console.error('OAuth error:', error || urlError);
    alert('Authentication failed: ' + (error || urlError));
    window.location.href = 'login.html';
    return;
  }
  
  if (!accessToken) {
    console.error('No access token received');
    alert('Authentication failed: No access token received');
    window.location.href = 'login.html';
    return;
  }
  
  // Verify state parameter
  const storedState = localStorage.getItem('webex_state');
  if (state !== storedState) {
    console.error('Invalid state parameter');
    alert('Authentication failed: Invalid state parameter. Possible CSRF attack.');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Get user information using the access token
    const userInfo = await getUserInfo(accessToken);
    
    // Store authentication data (note: implicit flow doesn't provide refresh token)
    localStorage.setItem('webex_access_token', accessToken);
    localStorage.setItem('webex_user_info', JSON.stringify(userInfo));
    localStorage.setItem('webex_auth_mode', 'authenticated');
    
    // Get expires_in from hash params
    const expiresIn = hashParams.get('expires_in');
    if (expiresIn) {
      localStorage.setItem('webex_token_expires', Date.now() + (parseInt(expiresIn) * 1000));
    }
    
    // Clean up temporary storage
    localStorage.removeItem('webex_state');
    
    console.log('Authentication successful!', userInfo);
    
    // Redirect to main app
    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('Failed to get user info:', error);
    alert('Authentication failed: ' + error.message);
    window.location.href = 'login.html';
  }
};

// Check if user is authenticated
window.isAuthenticated = function() {
  const token = localStorage.getItem('webex_access_token');
  const expires = localStorage.getItem('webex_token_expires');
  
  if (!token || !expires) {
    return false;
  }
  
  // Check if token is expired
  if (Date.now() >= parseInt(expires)) {
    // Token expired, try to refresh
    return false; // For now, just return false. TODO: Implement refresh token logic
  }
  
  return true;
};

// Get current user info
window.getCurrentUser = function() {
  const userInfo = localStorage.getItem('webex_user_info');
  return userInfo ? JSON.parse(userInfo) : null;
};

// Logout function
window.logout = function() {
  // Clear all authentication data
  localStorage.removeItem('webex_access_token');
  localStorage.removeItem('webex_refresh_token');
  localStorage.removeItem('webex_user_info');
  localStorage.removeItem('webex_auth_mode');
  localStorage.removeItem('webex_token_expires');
  
  // Redirect to login page
  window.location.href = 'login.html';
};

// Make authenticated API calls
window.makeWebexAPICall = async function(endpoint, options = {}) {
  const token = localStorage.getItem('webex_access_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(`https://webexapis.com/v1${endpoint}`, {
    ...options,
    ...defaultOptions
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    logout();
    throw new Error('Authentication expired. Please log in again.');
  }
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

console.log('Auth.js configuration loaded. Please set your Webex Client ID in WEBEX_CONFIG.');

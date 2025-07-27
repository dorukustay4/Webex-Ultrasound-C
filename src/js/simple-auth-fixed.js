// Simple Authentication System
// Ultra-simple auth without complex redirects or returnTo parameters

console.log('🔐 Simple Auth System loaded');

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('webex_access_token');
  const userInfo = localStorage.getItem('webex_user_info');
  
  console.log('🔍 Auth check - Token exists:', !!token);
  console.log('🔍 Auth check - User info exists:', !!userInfo);
  
  return !!(token && userInfo);
}

// Get current user information
function getCurrentUser() {
  try {
    const userInfo = localStorage.getItem('webex_user_info');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      console.log('🔍 Current user:', user);
      return user;
    }
    console.log('🔍 No user info found');
    return null;
  } catch (error) {
    console.error('🔍 Error getting current user:', error);
    return null;
  }
}

// Get user's role from profile
function getUserRole() {
  try {
    const role = localStorage.getItem('user_role');
    if (role) {
      console.log('🔍 User role:', role);
      return role;
    }
    
    // Fallback: check profile data
    const profile = localStorage.getItem('user_profile');
    if (profile) {
      const profileData = JSON.parse(profile);
      if (profileData.userRole) {
        console.log('🔍 User role from profile:', profileData.userRole);
        return profileData.userRole;
      }
    }
    
    console.log('🔍 No user role found, defaulting to expert');
    return 'expert'; // Default to expert for development
  } catch (error) {
    console.error('🔍 Error getting user role:', error);
    return 'expert'; // Default fallback
  }
}

// Get user's role display name
function getUserRoleDisplayName() {
  const role = getUserRole();
  return role === 'expert' ? 'Expert Supervisor' : 'Resident Doctor';
}

// Authenticate user with token or user object (for demo mode)
async function authenticate(tokenOrUser) {
  try {
    console.log('🔐 Authenticating user...');
    
    // Check if it's a demo user object or real token
    if (typeof tokenOrUser === 'object' && tokenOrUser.email) {
      // Demo mode - simple user object
      console.log('🎭 Demo mode authentication');
      localStorage.setItem('webex_user_info', JSON.stringify(tokenOrUser));
      localStorage.setItem('webex_access_token', 'demo_token_' + Date.now());
      console.log('✅ Demo authentication successful');
      return {
        success: true,
        userInfo: tokenOrUser
      };
    }
    
    // Real Webex token authentication
    const token = tokenOrUser;
    console.log('🔐 Authenticating with Webex token...');
    
    // Validate token with Webex API
    const response = await fetch('https://webexapis.com/v1/people/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Webex API error:', response.status, errorText);
      return {
        success: false,
        error: `Authentication failed: ${response.status} - ${response.statusText}`
      };
    }

    const userInfo = await response.json();
    console.log('✅ Authentication successful:', userInfo);

    // Store token and user info
    localStorage.setItem('webex_access_token', token);
    localStorage.setItem('webex_user_info', JSON.stringify(userInfo));

    return {
      success: true,
      userInfo: userInfo
    };
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    
    // Clear any existing auth data
    localStorage.removeItem('webex_access_token');
    localStorage.removeItem('webex_user_info');
    
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
}

// Logout user
function logout() {
  console.log('🔐 Logging out user...');
  localStorage.removeItem('webex_access_token');
  localStorage.removeItem('webex_user_info');
  localStorage.removeItem('user_profile');
  localStorage.removeItem('user_role');
  console.log('✅ Logout successful');
}

// Get access token
function getAccessToken() {
  return localStorage.getItem('webex_access_token');
}

// Make authenticated request
async function makeAuthenticatedRequest(url, options = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
}

// Initialize Webex SDK
async function initializeWebex() {
  console.log('🚀 Initializing Webex SDK...');
  
  try {
    // Check authentication first
    if (!isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const token = getAccessToken();
    
    // Check if it's demo mode
    if (token && token.startsWith('demo_token_')) {
      console.log('🎭 Demo mode - creating mock WebexManager');
      const WebexManager = window.WebexManager;
      if (WebexManager) {
        const manager = new WebexManager();
        // Set demo mode state
        manager.isAuthenticated = true;
        manager.webex = null; // This indicates demo mode
        console.log('✅ Demo WebexManager created');
        return manager;
      } else {
        throw new Error('WebexManager not loaded');
      }
    }

    // Real Webex initialization
    console.log('🔐 Real Webex initialization...');
    if (typeof WebexManager === 'undefined') {
      throw new Error('WebexManager not loaded');
    }

    const manager = new WebexManager();
    await manager.initialize();
    await manager.authenticate(token);
    
    console.log('✅ Webex SDK initialized successfully');
    return manager;
    
  } catch (error) {
    console.error('❌ Failed to initialize Webex:', error);
    throw error;
  }
}

// Get WebexManager instance
function getWebexManager() {
  return window.webexManager || null;
}

// Check if Webex is ready for video calls
function isWebexReady() {
  const manager = getWebexManager();
  return manager && manager.isAuthenticated;
}

// Switch to demo mode
async function switchToDemo() {
  console.log('🎭 Switching to demo mode...');
  
  // Create demo user
  const demoUser = {
    id: 'demo_user_' + Date.now(),
    email: 'demo@ultrasound-webex.local',
    displayName: 'Demo User',
    firstName: 'Demo',
    lastName: 'User',
    avatar: null,
    created: new Date().toISOString()
  };

  // Authenticate with demo user
  const result = await authenticate(demoUser);
  console.log('✅ Demo mode activated:', result);
  return result;
}

// Use Personal Access Token (PAT) for development
async function usePersonalAccessToken(token) {
  console.log('🔐 Using Personal Access Token for development...');
  
  try {
    if (!token) {
      // Prompt user for token if not provided
      token = prompt(`
🔐 WEBEX PERSONAL ACCESS TOKEN

To get your personal access token:
1. Go to https://developer.webex.com/docs/getting-started
2. Scroll down to "Your Personal Access Token"
3. Copy the token and paste it below

Note: Personal tokens expire in 12 hours.

Enter your Personal Access Token:`);
      
      if (!token) {
        return { success: false, error: 'No token provided' };
      }
    }
    
    // Clean the token (remove whitespace)
    token = token.trim();
    
    // Validate the token format
    if (token.length < 50) {
      return { 
        success: false, 
        error: 'Token seems too short. Please ensure you copied the complete token.' 
      };
    }
    
    console.log('🔐 Validating Personal Access Token...');
    
    // Test the token by making a request to get user info
    const response = await fetch('https://webexapis.com/v1/people/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token validation failed:', response.status, errorText);
      return {
        success: false,
        error: `Token validation failed: ${response.status} - ${response.statusText}`
      };
    }

    const userInfo = await response.json();
    console.log('✅ Personal Access Token validated successfully');
    console.log('👤 User info:', userInfo.displayName, userInfo.emails[0]);

    // Store the token and user info
    localStorage.setItem('webex_access_token', token);
    localStorage.setItem('webex_user_info', JSON.stringify(userInfo));
    
    // Also store a flag indicating this is a PAT (not OAuth token)
    localStorage.setItem('auth_method', 'personal_access_token');

    return {
      success: true,
      userInfo: userInfo,
      authMethod: 'personal_access_token'
    };
    
  } catch (error) {
    console.error('❌ Personal Access Token authentication failed:', error);
    
    // Clear any existing auth data
    localStorage.removeItem('webex_access_token');
    localStorage.removeItem('webex_user_info');
    localStorage.removeItem('auth_method');
    
    return {
      success: false,
      error: error.message || 'Personal Access Token authentication failed'
    };
  }
}

// Export functions for use in other scripts
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getUserRole = getUserRole;
window.getUserRoleDisplayName = getUserRoleDisplayName;
window.authenticate = authenticate;
window.logout = logout;
window.getAccessToken = getAccessToken;
window.makeAuthenticatedRequest = makeAuthenticatedRequest;
window.initializeWebex = initializeWebex;
window.getWebexManager = getWebexManager;
window.isWebexReady = isWebexReady;
window.switchToDemo = switchToDemo;
window.usePersonalAccessToken = usePersonalAccessToken;

console.log('✅ Simple Auth System ready');

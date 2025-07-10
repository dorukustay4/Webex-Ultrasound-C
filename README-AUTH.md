# Webex Annotator Pro - Authentication Setup Guide

## Overview
This guide will help you set up Webex OAuth authentication for the Webex Annotator Pro application.

## Features
- **Webex OAuth Integration**: Users can sign in with their Webex accounts
- **Guest Mode**: Users can also continue without authentication for basic features
- **PKCE Security**: Enhanced security with Proof Key for Code Exchange
- **User Profile**: Display authenticated user's name, email, and avatar
- **Session Management**: Automatic token refresh and logout functionality

## Setup Steps

### 1. Create a Webex Integration

1. Go to [Webex for Developers](https://developer.webex.com/)
2. Sign in with your Webex account
3. Click on your avatar → "My Webex Apps"
4. Click "Create a New App" → "Create an Integration"
5. Fill in the required information:
   - **Integration name**: `Webex Annotator Pro`
   - **Description**: `Advanced medical annotation tool with Webex integration`
   - **Logo**: Upload your app logo
   - **Redirect URI(s)**: Add these URLs:
     - `http://localhost:8000/auth-callback.html` (for development)
     - `https://yourdomain.com/auth-callback.html` (for production)
   - **Scopes**: Select the following scopes:
     - `spark:messages_read` - Read messages
     - `spark:messages_write` - Send messages
     - `spark:rooms_read` - Access spaces/rooms
     - `spark:people_read` - Read user profiles
     - `meeting:schedules_read` - View meetings
     - `meeting:schedules_write` - Create/manage meetings

6. Click "Add Integration"
7. **IMPORTANT**: Copy your `Client ID` and `Client Secret` immediately (the secret is only shown once!)

### 2. Configure Your Application

1. Open `auth.js` in your project
2. Find the `WEBEX_CONFIG` object at the top of the file
3. Replace `'YOUR_CLIENT_ID_HERE'` with your actual Client ID from step 1
4. Update the `redirectUri` if deploying to a different domain

```javascript
const WEBEX_CONFIG = {
  clientId: 'C1234567890abcdef...', // Your actual Client ID here
  redirectUri: window.location.origin + '/auth-callback.html',
  scope: 'spark:messages_read spark:messages_write spark:rooms_read spark:people_read meeting:schedules_read meeting:schedules_write',
  // ... rest of config
};
```

### 3. Test Your Integration

1. Start a local web server (required for OAuth):
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx http-server -p 8000
   
   # Option 3: VS Code Live Server extension
   ```

2. Open `http://localhost:8000/login.html`
3. Click "Sign in with Webex"
4. You should be redirected to Webex for authentication
5. After signing in, you'll be redirected back to your app

### 4. Production Deployment

1. Update the redirect URI in your Webex Integration settings to match your production domain
2. Update the `redirectUri` in `auth.js` to your production URL
3. Ensure your production server serves the application over HTTPS (required for OAuth)

## File Structure

```
├── login.html              # Login page with Webex OAuth button
├── auth-callback.html      # OAuth callback handler
├── auth.js                 # Authentication logic and API calls
├── index.html              # Main application (requires authentication)
├── index.js                # Main application logic
├── style.css               # Styles including user info header
└── README-AUTH.md          # This setup guide
```

## Security Features

- **PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception attacks
- **State Parameter**: Prevents CSRF attacks
- **Token Expiration**: Automatic handling of expired tokens
- **Secure Storage**: Tokens stored in localStorage (consider upgrading to secure HTTP-only cookies for production)

## API Integration

The application includes helper functions for making authenticated Webex API calls:

```javascript
// Example: Send a message to a space
const message = await makeWebexAPICall('/messages', {
  method: 'POST',
  body: JSON.stringify({
    roomId: 'space-id-here',
    text: 'Hello from Webex Annotator Pro!'
  })
});

// Example: Get user's spaces
const spaces = await makeWebexAPICall('/rooms');
```

## Troubleshooting

### Common Issues

1. **"Webex Integration not configured" error**:
   - Make sure you've replaced `YOUR_CLIENT_ID_HERE` with your actual Client ID in `auth.js`

2. **"Invalid redirect URI" error**:
   - Ensure the redirect URI in your integration settings exactly matches the one in your app
   - Include the protocol (http:// or https://)

3. **OAuth callback page doesn't work**:
   - Make sure `auth-callback.html` is accessible at your redirect URI
   - Check browser console for JavaScript errors

4. **Token expired errors**:
   - The current implementation doesn't auto-refresh tokens
   - Users will need to log in again when tokens expire (typically 12 hours)

### Development vs Production

**Development** (localhost):
- Use `http://localhost:8000/auth-callback.html` as redirect URI
- Client secret can be stored in code (not recommended for production)

**Production**:
- Use `https://yourdomain.com/auth-callback.html` as redirect URI
- Implement server-side token exchange to keep client secret secure
- Consider implementing refresh token logic

## Next Steps

1. **Enhance Security**: Implement server-side token exchange for production
2. **Refresh Tokens**: Add automatic token refresh functionality
3. **Error Handling**: Improve error messages and fallback scenarios
4. **User Experience**: Add loading states and better feedback
5. **Integration Features**: Use Webex APIs to enhance the annotation tool (e.g., save annotations to Webex spaces)

## Need Help?

- [Webex for Developers Documentation](https://developer.webex.com/docs)
- [OAuth 2.0 Authorization Code Flow](https://developer.webex.com/docs/integrations)
- [Webex Developer Support](https://developer.webex.com/support)

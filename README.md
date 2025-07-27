# Ultrasound Webex - Telemedicine Application

A modern Electron-based telemedicine application that integrates Webex video calling with role-based authentication for expert supervisors and resident doctors.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm package manager

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   # Double-click start-app.bat OR run manually:
   npm run dev     # Terminal 1: Development server
   npm run electron # Terminal 2: Electron app
   ```

## 🔐 Authentication

The application supports two authentication methods:

### OAuth Authentication (Recommended)
- Click "Sign in with Webex" 
- Authenticate using your Webex credentials in the browser
- Automatic redirect to home page after successful authentication

### Personal Access Token (Development)
- Use your Webex personal access token for development/testing
- Go to [developer.webex.com](https://developer.webex.com) to get your token

## 👥 Role-Based System

**Expert Supervisor:**
- Full meeting control
- Auto-enable video on join
- Can create and manage meetings

**Resident Doctor:**
- Standard meeting access
- Video settings user-controlled

## 📁 Project Structure

```
├── main.js                    # Electron main process
├── preload.js                # Electron preload script
├── package.json              # Project dependencies
├── vite.config.js            # Development server config
├── start-app.bat             # Quick start script
├── src/
│   ├── pages/                # HTML pages
│   │   ├── login-oauth.html  # OAuth login page
│   │   ├── login-clean.html  # Token login page
│   │   ├── home-clean.html   # Main dashboard
│   │   ├── profile-clean.html # User profile
│   │   ├── video-call.html   # Video call interface
│   │   ├── oauth-callback.html # OAuth callback (embedded)
│   │   └── oauth-callback-simple.html # OAuth callback (external browser)
│   ├── js/                   # JavaScript modules
│   │   ├── simple-auth-fixed.js # Authentication system
│   │   ├── simple-oauth.js   # External browser OAuth
│   │   ├── webex-oauth.js    # Embedded OAuth system
│   │   ├── webex-manager.js  # Webex SDK wrapper
│   │   └── webex-integration.js # Meeting integration
│   └── styles/               # CSS stylesheets
│       ├── style.css         # General styles
│       └── home-style.css    # Home page styles
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start Vite development server
- `npm run electron` - Start Electron application
- `npm run build` - Build for production
- `npm start` - Quick start (runs start-app.bat)

### Key Features
- **Meeting Creation:** Generate meeting IDs and links
- **Video Integration:** Webex SDK integration for video calls
- **Role Management:** Expert/Resident role selection and persistence
- **OAuth Security:** Secure authentication with Webex APIs
- **Copy Functionality:** Easy sharing of meeting details
- **Auto-Video:** Role-based automatic video enabling

## 🔧 Configuration

OAuth credentials are configured in `src/js/webex-oauth.js`:
- Client ID and Secret are already configured
- Redirect URIs point to localhost callback pages
- Scopes set to `spark:all` for full Webex access

## 📝 Usage

1. **Login:** Choose OAuth or token authentication
2. **Set Role:** Select Expert Supervisor or Resident Doctor
3. **Create Meeting:** Generate meeting ID and link
4. **Join Call:** Click to join with role-appropriate settings
5. **Profile:** Manage user settings and role preferences

## 🚨 Troubleshooting

**"Could not connect to localhost:3000":**
- Ensure development server is running (`npm run dev`)
- Check that port 3000 is available

**OAuth not working:**
- Verify internet connection
- Check that OAuth credentials are configured
- Clear browser cache and localStorage

**Electron not starting:**
- Close all Electron processes
- Restart both development server and Electron app
- Check Node.js version compatibility

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with:** Electron, Webex SDK, Vite, HTML5, CSS3, Vanilla JavaScript

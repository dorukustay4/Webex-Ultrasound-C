# UltraAnnotate - Local Ultrasound Annotation Platform

A modern Electron-based annotation platform designed for ultrasound experts to annotate medical imagery locally while sharing their screens through any web conferencing tool to educate trainees and collaborate with peers.

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

## 🎯 Key Features

- **Local Processing**: All annotation data stays on your machine - no cloud dependencies
- **Universal Screen Sharing**: Works with any web conferencing platform (Zoom, Teams, Google Meet, etc.)
- **Expert-Focused Design**: Purpose-built interface for efficient ultrasound annotation workflows
- **Real-time Collaboration**: Share annotated images instantly while maintaining video calls in your preferred platform
- **Educational Tools**: Specialized features for training scenarios and peer consultation

## 🔧 Usage

1. **Start the Application**: Launch the UltraAnnotate platform locally
2. **Create Session**: Set up annotation session with patient/case information  
3. **Load Images**: Import ultrasound images for annotation
4. **Annotate**: Use professional annotation tools to mark and measure
5. **Share Screen**: Use any web conferencing tool to share your annotated screen with trainees or peers

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

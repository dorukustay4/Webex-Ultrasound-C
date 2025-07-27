// Enhanced Meeting Creation and Video Call Manager
// Handles Webex meeting creation, popup display, and multi-window video interface

console.log('Enhanced Meeting Manager loaded');

// Global variables
let currentMeeting = null;
let webexInstance = null;
let localStream = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

// Initialize Webex SDK for meeting management
async function initializeMeetingManager() {
  try {
    console.log('Initializing Meeting Manager...');
    
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const token = getAccessToken();
    
    // Initialize Webex SDK
    if (typeof Webex !== 'undefined') {
      webexInstance = new Webex({
        credentials: {
          access_token: token
        }
      });
      
      await webexInstance.meetings.register();
      console.log('Webex SDK initialized for meetings');
      return true;
    } else {
      console.warn('Webex SDK not loaded, using demo mode');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize meeting manager:', error);
    return false;
  }
}

// Create a new Webex meeting
async function createMeeting(options = {}) {
  try {
    console.log('Creating new Webex meeting...');
    
    const meetingOptions = {
      title: options.title || 'Ultrasound Telemedicine Session',
      agenda: options.agenda || 'Medical ultrasound consultation with expert supervision',
      allowJoinBeforeHost: true,
      allowAnyUserToBeCoHost: false,
      enabledAutoRecordMeeting: false,
      allowAuthenticatedDevices: false,
      ...options
    };

    let meetingInfo;
    
    if (webexInstance && !getAccessToken().startsWith('demo_token_')) {
      // Real Webex meeting creation
      console.log('Creating real Webex meeting...');
      
      const meeting = await webexInstance.meetings.create();
      
      meetingInfo = {
        id: meeting.id,
        meetingNumber: meeting.meetingNumber || generateMeetingNumber(),
        sipUri: meeting.sipUri,
        meetingLink: meeting.meetingInfo?.meetingLink || `https://meet.webex.com/meet/${meeting.id}`,
        password: meeting.password,
        hostKey: meeting.hostKey,
        title: meetingOptions.title,
        agenda: meetingOptions.agenda,
        createdAt: new Date().toISOString(),
        meeting: meeting // Store the actual meeting object
      };
    } else {
      // Demo meeting creation
      console.log('Creating demo meeting...');
      
      const demoId = generateMeetingNumber();
      meetingInfo = {
        id: `demo_${demoId}`,
        meetingNumber: demoId,
        sipUri: `demo_sip_${demoId}@demo.webex.com`,
        meetingLink: `https://demo.webex.com/meet/${demoId}`,
        password: Math.random().toString(36).substring(2, 8).toUpperCase(),
        hostKey: Math.random().toString(36).substring(2, 12).toUpperCase(),
        title: meetingOptions.title,
        agenda: meetingOptions.agenda,
        createdAt: new Date().toISOString(),
        isDemo: true
      };
    }

    console.log('Meeting created successfully:', meetingInfo);
    return meetingInfo;
    
  } catch (error) {
    console.error('Failed to create meeting:', error);
    throw error;
  }
}

// Generate a random meeting number
function generateMeetingNumber() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// Show meeting creation popup
function showMeetingPopup(meetingInfo) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('meeting-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup HTML
  const popup = document.createElement('div');
  popup.id = 'meeting-popup';
  popup.innerHTML = `
    <div class="meeting-popup-overlay">
      <div class="meeting-popup-content">
        <div class="meeting-popup-header">
          <h2>Meeting Created Successfully!</h2>
          <button class="popup-close-btn" onclick="closeMeetingPopup()">&times;</button>
        </div>
        
        <div class="meeting-popup-body">
          <div class="meeting-info-section">
            <h3>Meeting Details</h3>
            <div class="meeting-detail-item">
              <label>Meeting Title:</label>
              <span>${meetingInfo.title}</span>
            </div>
            <div class="meeting-detail-item">
              <label>Meeting ID:</label>
              <div class="copyable-field">
                <span>${meetingInfo.meetingNumber}</span>
                <button onclick="copyToClipboard('${meetingInfo.meetingNumber}')" class="copy-btn">COPY</button>
              </div>
            </div>
            <div class="meeting-detail-item">
              <label>Meeting Link:</label>
              <div class="copyable-field">
                <input type="text" value="${meetingInfo.meetingLink}" readonly id="meeting-link-input">
                <button onclick="copyMeetingLink()" class="copy-btn">COPY</button>
              </div>
            </div>
            ${meetingInfo.password ? `
            <div class="meeting-detail-item">
              <label>Password:</label>
              <div class="copyable-field">
                <span>${meetingInfo.password}</span>
                <button onclick="copyToClipboard('${meetingInfo.password}')" class="copy-btn">COPY</button>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="meeting-popup-footer">
          <button class="popup-btn secondary" onclick="closeMeetingPopup()">Close</button>
          <button class="popup-btn primary" onclick="joinMultiWindowCall('${meetingInfo.id}')">
            Join Call
          </button>
        </div>
      </div>
    </div>
  `;

  // Add popup styles
  const style = document.createElement('style');
  style.textContent = `
    .meeting-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    }

    .meeting-popup-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    }

    .meeting-popup-header {
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meeting-popup-header h2 {
      color: #e2e8f0;
      font-size: 1.5rem;
      margin: 0;
    }

    .popup-close-btn {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 2rem;
      cursor: pointer;
      padding: 0.5rem;
      line-height: 1;
      transition: color 0.2s;
    }

    .popup-close-btn:hover {
      color: #ef4444;
    }

    .meeting-popup-body {
      padding: 2rem;
    }

    .meeting-info-section {
      margin-bottom: 2rem;
    }

    .meeting-info-section h3 {
      color: #3b82f6;
      font-size: 1.2rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meeting-detail-item {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .meeting-detail-item label {
      color: #9ca3af;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .copyable-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(15, 15, 15, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .copyable-field span {
      flex: 1;
      color: #e2e8f0;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .copyable-field input {
      flex: 1;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      outline: none;
    }

    .copy-btn {
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .meeting-actions-section h3 {
      color: #10b981;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .meeting-actions-section p {
      color: #d1d5db;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin-bottom: 1.5rem;
    }

    .feature-list li {
      color: #d1d5db;
      padding: 0.5rem 0;
      border-left: 3px solid #10b981;
      padding-left: 1rem;
      margin-bottom: 0.5rem;
      background: rgba(16, 185, 129, 0.05);
      border-radius: 0 6px 6px 0;
    }

    .meeting-popup-footer {
      padding: 1.5rem 2rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .popup-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .popup-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
      color: white;
    }

    .popup-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .popup-btn.secondary {
      background: rgba(75, 85, 99, 0.3);
      border: 1px solid rgba(75, 85, 99, 0.5);
      color: #9ca3af;
    }

    .popup-btn.secondary:hover {
      background: rgba(75, 85, 99, 0.5);
      color: #e2e8f0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  // Add to page
  document.head.appendChild(style);
  document.body.appendChild(popup);

  // Store meeting info globally
  window.currentMeetingInfo = meetingInfo;
}

// Close meeting popup
function closeMeetingPopup() {
  const popup = document.getElementById('meeting-popup');
  if (popup) {
    popup.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => popup.remove(), 300);
  }
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Copied to clipboard!');
  }
}

// Copy meeting link specifically
function copyMeetingLink() {
  const input = document.getElementById('meeting-link-input');
  if (input) {
    copyToClipboard(input.value);
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    z-index: 10001;
    animation: slideInRight 0.3s ease-out;
  `;
  toast.textContent = message;
  
  const keyframes = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = keyframes;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 2000);
}

// Join multi-window call
async function joinMultiWindowCall(meetingId) {
  try {
    console.log('Joining multi-window call:', meetingId);
    
    closeMeetingPopup();
    
    // Show loading
    showToast('Preparing multi-window interface...');
    
    // Navigate to video call page with meeting info
    const meetingInfo = window.currentMeetingInfo;
    const params = new URLSearchParams({
      meetingId: meetingInfo.id,
      meetingNumber: meetingInfo.meetingNumber,
      sipUri: meetingInfo.sipUri,
      meetingLink: meetingInfo.meetingLink,
      isHost: 'true'
    });
    
    // Redirect to multi-window video call page
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const videoCallUrl = `${basePath}/video-call-multi.html?${params.toString()}`;
    
    console.log('Current path:', currentPath);
    console.log('Base path:', basePath);
    console.log('Video call URL:', videoCallUrl);
    
    window.location.href = videoCallUrl;
    
  } catch (error) {
    console.error('Failed to join call:', error);
    showToast('Failed to join call. Please try again.');
  }
}

// Enhanced startCall function to replace the existing one
async function enhancedStartCall() {
  try {
    console.log('Enhanced Start Call initiated...');
    
    // Show loading state
    const startButton = document.querySelector('.action-btn.primary');
    if (startButton) {
      const originalText = startButton.innerHTML;
      startButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          Creating Meeting...
        </div>
      `;
      startButton.disabled = true;
      
      // Add spin animation
      const spinStyle = document.createElement('style');
      spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(spinStyle);
      
      setTimeout(() => {
        startButton.innerHTML = originalText;
        startButton.disabled = false;
        spinStyle.remove();
      }, 10000); // Reset after 10 seconds if something goes wrong
    }
    
    // Initialize meeting manager
    await initializeMeetingManager();
    
    // Create meeting
    const meetingInfo = await createMeeting({
      title: 'Ultrasound Telemedicine Session',
      agenda: 'Expert-supervised ultrasound examination with real-time collaboration and annotation tools'
    });
    
    // Reset button state
    if (startButton) {
      const originalText = startButton.querySelector('div') ? 
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 12V15C15 15.5523 15.4477 16 16 16C16.5523 16 17 15.5523 17 15V12H15Z" fill="currentColor"/>
          <path d="M3 12V15C3 15.5523 3.44772 16 4 16C4.55228 16 5 15.5523 5 15V12H3Z" fill="currentColor"/>
          <path d="M10 2C7.79086 2 6 3.79086 6 6V12C6 14.2091 7.79086 16 10 16C12.2091 16 14 14.2091 14 12V6C14 3.79086 12.2091 2 10 2Z" fill="currentColor"/>
        </svg>
        <div style="font-weight: 600;">Start Call</div>` : startButton.innerHTML;
      startButton.innerHTML = originalText;
      startButton.disabled = false;
    }
    
    // Show meeting popup
    showMeetingPopup(meetingInfo);
    
  } catch (error) {
    console.error('Enhanced start call failed:', error);
    
    // Reset button
    const startButton = document.querySelector('.action-btn.primary');
    if (startButton) {
      startButton.disabled = false;
    }
    
    // Show error
    let errorMessage = 'Failed to create meeting. ';
    if (error.message.includes('not authenticated')) {
      errorMessage += 'Please ensure you are logged in with a valid Webex token.';
    } else if (error.message.includes('SDK')) {
      errorMessage += 'Webex SDK initialization failed. Please refresh the page and try again.';
    } else {
      errorMessage += 'Please check your internet connection and try again.';
    }
    
    alert(errorMessage);
    
    // Fall back to demo mode if auth fails
    if (error.message.includes('not authenticated') || error.message.includes('Authorization')) {
      if (confirm('Would you like to try demo mode instead?')) {
        try {
          await switchToDemo();
          await enhancedStartCall();
        } catch (demoError) {
          console.error('Demo mode failed too:', demoError);
        }
      }
    }
  }
}

// Export functions
window.enhancedStartCall = enhancedStartCall;
window.createMeeting = createMeeting;
window.showMeetingPopup = showMeetingPopup;
window.closeMeetingPopup = closeMeetingPopup;
window.copyToClipboard = copyToClipboard;
window.copyMeetingLink = copyMeetingLink;
window.joinMultiWindowCall = joinMultiWindowCall;

console.log('Enhanced Meeting Manager ready');

// webex-sdk.js - Real Webex SDK Implementation
import Webex from 'webex';

console.log('🚀 Loading Webex SDK...');

// SDK instance
let webexInstance = null;
let isInitialized = false;

// Initialize Webex SDK
export async function initializeWebexSDK() {
  try {
    console.log('🔧 Initializing Webex SDK...');
    
    // Get access token from authentication
    const accessToken = localStorage.getItem('webex_access_token');
    
    if (accessToken) {
      console.log('✅ Access token found, initializing with authentication');
      
      // Initialize with access token
      webexInstance = Webex.init({
        credentials: {
          access_token: accessToken
        },
        config: {
          logger: {
            level: 'info'
          },
          meetings: {
            reconnection: {
              enabled: true
            }
          }
        }
      });
      
      // Wait for SDK to be ready
      await webexInstance.internal.device.register();
      
      console.log('✅ Webex SDK initialized with authentication');
      isInitialized = true;
      return webexInstance;
      
    } else {
      console.log('⚠️ No access token found, initializing in guest mode');
      
      // Initialize without authentication for basic features
      webexInstance = Webex.init({
        config: {
          logger: {
            level: 'info'
          }
        }
      });
      
      console.log('✅ Webex SDK initialized in guest mode');
      isInitialized = true;
      return webexInstance;
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Webex SDK:', error);
    isInitialized = false;
    throw error;
  }
}

// Get current SDK instance
export function getWebexInstance() {
  if (!isInitialized || !webexInstance) {
    throw new Error('Webex SDK not initialized. Call initializeWebexSDK() first.');
  }
  return webexInstance;
}

// Check if SDK is initialized
export function isWebexInitialized() {
  return isInitialized && webexInstance !== null;
}

// Real meeting functions using Webex SDK
export const webexMeetings = {
  // Create a new meeting
  async create(options = {}) {
    try {
      const webex = getWebexInstance();
      
      const meetingOptions = {
        title: options.title || 'Ultrasound Consultation',
        agenda: options.agenda || 'Medical ultrasound consultation session',
        password: options.password,
        ...options
      };
      
      console.log('Creating meeting with options:', meetingOptions);
      const meeting = await webex.meetings.create(meetingOptions.destination);
      
      console.log('✅ Meeting created:', meeting);
      return {
        id: meeting.id,
        sipUri: meeting.sipUri,
        meetingLink: meeting.meetingInfo?.meetingLink || `https://meet.webex.com/meet/${meeting.id}`,
        meetingNumber: meeting.meetingNumber || meeting.id.substring(0, 10).toUpperCase(),
        password: meeting.password
      };
      
    } catch (error) {
      console.error('❌ Failed to create meeting:', error);
      throw error;
    }
  },

  // Join a meeting
  async join(destination, options = {}) {
    try {
      const webex = getWebexInstance();
      
      console.log('Joining meeting:', destination);
      const meeting = await webex.meetings.create(destination);
      
      // Set up meeting options
      const joinOptions = {
        pin: options.pin,
        moderator: options.moderator || false,
        ...options
      };
      
      await meeting.join(joinOptions);
      
      console.log('✅ Successfully joined meeting');
      
      // Set up event listeners for the meeting
      setupMeetingEvents(meeting);
      
      return meeting;
      
    } catch (error) {
      console.error('❌ Failed to join meeting:', error);
      throw error;
    }
  },

  // List user's meetings
  async list() {
    try {
      const webex = getWebexInstance();
      const meetings = await webex.meetings.list();
      
      console.log('✅ Retrieved meetings list:', meetings);
      return meetings;
      
    } catch (error) {
      console.error('❌ Failed to list meetings:', error);
      throw error;
    }
  }
};

// Set up meeting event listeners
function setupMeetingEvents(meeting) {
  // Media events
  meeting.on('media:ready', (media) => {
    console.log('🎥 Media ready:', media.type);
    
    if (media.type === 'localVideo') {
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = media.stream;
      }
    } else if (media.type === 'remoteVideo') {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) {
        remoteVideo.srcObject = media.stream;
      }
    }
  });

  // Meeting events
  meeting.on('meeting:joined', () => {
    console.log('✅ Meeting joined successfully');
    // Update UI to show meeting controls
    if (window.showMeetingControls) {
      window.showMeetingControls();
    }
  });

  meeting.on('meeting:left', () => {
    console.log('👋 Left meeting');
    // Update UI to hide meeting controls
    if (window.hideMeetingControls) {
      window.hideMeetingControls();
    }
  });

  // Participant events
  meeting.on('participant:joined', (participant) => {
    console.log('👤 Participant joined:', participant.identity);
    // Update participant count
    if (window.updateParticipantCount) {
      window.updateParticipantCount(meeting.participants.length + 1);
    }
  });

  meeting.on('participant:left', (participant) => {
    console.log('👋 Participant left:', participant.identity);
    // Update participant count
    if (window.updateParticipantCount) {
      window.updateParticipantCount(meeting.participants.length);
    }
  });
}

// Export for global access (backward compatibility)
export function createGlobalWebexObject() {
  return {
    meetings: webexMeetings,
    init: initializeWebexSDK,
    getInstance: getWebexInstance,
    isInitialized: isWebexInitialized
  };
}

console.log('✅ Webex SDK module loaded successfully');

// Webex SDK Integration Module
// Handles authentication, meeting creation, and call management

console.log('🎯 Webex SDK module loading...');

// Global Webex instance
let webexInstance = null;
let currentMeeting = null;

// Webex SDK Configuration
const WEBEX_CONFIG = {
  clientId: process.env.WEBEX_CLIENT_ID || 'your-webex-client-id',
  clientSecret: process.env.WEBEX_CLIENT_SECRET || 'your-webex-client-secret',
  redirectUri: process.env.WEBEX_REDIRECT_URI || 'http://localhost:3000/auth-callback',
  scope: 'spark:kms spark:people_read spark:rooms_read spark:rooms_write spark:memberships_read spark:memberships_write spark:messages_read spark:messages_write meeting:schedules_read meeting:schedules_write meeting:recordings_read meeting:participants_read'
};

// Initialize Webex SDK
async function initializeWebex() {
  try {
    console.log('🔧 Initializing Webex SDK...');
    
    // Check if running in browser environment
    if (typeof window !== 'undefined' && window.Webex) {
      webexInstance = window.Webex.init({
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
      
      console.log('✅ Webex SDK initialized successfully');
      return webexInstance;
    } else {
      console.error('❌ Webex SDK not found in global scope');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Webex SDK:', error);
    return null;
  }
}

// Authenticate with Webex (simplified for demo)
async function authenticateWebex(accessToken) {
  try {
    console.log('🔐 Authenticating with Webex...');
    
    if (!webexInstance) {
      webexInstance = await initializeWebex();
    }
    
    if (!webexInstance) {
      throw new Error('Webex SDK not initialized');
    }
    
    // Set access token
    await webexInstance.credentials.set({
      access_token: accessToken
    });
    
    // Get user info
    const user = await webexInstance.people.get('me');
    console.log('✅ Webex authentication successful:', user.displayName);
    
    return {
      success: true,
      user: user,
      webex: webexInstance
    };
  } catch (error) {
    console.error('❌ Webex authentication failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create a new meeting
async function createMeeting(options = {}) {
  try {
    console.log('📅 Creating new meeting...');
    
    if (!webexInstance) {
      throw new Error('Webex not authenticated');
    }
    
    const meetingOptions = {
      title: options.title || 'Ultrasound Consultation',
      start: options.start || new Date().toISOString(),
      end: options.end || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      invitees: options.invitees || [],
      ...options
    };
    
    const meeting = await webexInstance.meetings.create(meetingOptions);
    console.log('✅ Meeting created:', meeting.id);
    
    return {
      success: true,
      meeting: meeting,
      joinUrl: meeting.sipUri || meeting.webLink
    };
  } catch (error) {
    console.error('❌ Failed to create meeting:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Join an existing meeting
async function joinMeeting(meetingIdOrUrl) {
  try {
    console.log('🔗 Joining meeting:', meetingIdOrUrl);
    
    if (!webexInstance) {
      throw new Error('Webex not authenticated');
    }
    
    // Create meeting object
    currentMeeting = webexInstance.meetings.create();
    
    // Join the meeting
    await currentMeeting.join({
      resourceId: meetingIdOrUrl,
      moderator: false
    });
    
    console.log('✅ Successfully joined meeting');
    
    // Set up meeting event listeners
    setupMeetingEventListeners(currentMeeting);
    
    return {
      success: true,
      meeting: currentMeeting
    };
  } catch (error) {
    console.error('❌ Failed to join meeting:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Set up meeting event listeners
function setupMeetingEventListeners(meeting) {
  console.log('🎧 Setting up meeting event listeners...');
  
  // Meeting events
  meeting.on('meeting:self:left', () => {
    console.log('👋 Left the meeting');
    currentMeeting = null;
    // Notify UI that meeting ended
    notifyUI('meeting:ended');
  });
  
  meeting.on('meeting:self:joined', () => {
    console.log('🎉 Joined the meeting successfully');
    notifyUI('meeting:joined');
  });
  
  meeting.on('media:ready', (media) => {
    console.log('📹 Media ready:', media.type);
    // Handle media streams
    if (media.type === 'remoteVideo') {
      attachVideoStream('remote-video', media.stream);
    } else if (media.type === 'localVideo') {
      attachVideoStream('local-video', media.stream);
    }
  });
  
  meeting.on('media:stopped', (media) => {
    console.log('⏹️ Media stopped:', media.type);
    notifyUI('media:stopped', { type: media.type });
  });
  
  // Participant events
  meeting.on('meeting:participantAdded', (participant) => {
    console.log('👤 Participant joined:', participant.displayName);
    notifyUI('participant:joined', participant);
  });
  
  meeting.on('meeting:participantLeft', (participant) => {
    console.log('👤 Participant left:', participant.displayName);
    notifyUI('participant:left', participant);
  });
}

// Attach video stream to HTML element
function attachVideoStream(elementId, stream) {
  try {
    const videoElement = document.getElementById(elementId);
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.play();
      console.log(`📺 Video stream attached to ${elementId}`);
    }
  } catch (error) {
    console.error('❌ Failed to attach video stream:', error);
  }
}

// Start local video
async function startLocalVideo() {
  try {
    if (!currentMeeting) {
      throw new Error('No active meeting');
    }
    
    console.log('📹 Starting local video...');
    await currentMeeting.getMediaStreams({ video: true });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to start local video:', error);
    return { success: false, error: error.message };
  }
}

// Stop local video
async function stopLocalVideo() {
  try {
    if (!currentMeeting) {
      throw new Error('No active meeting');
    }
    
    console.log('📹 Stopping local video...');
    await currentMeeting.stopVideo();
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to stop local video:', error);
    return { success: false, error: error.message };
  }
}

// Mute/unmute audio
async function toggleAudio(mute = null) {
  try {
    if (!currentMeeting) {
      throw new Error('No active meeting');
    }
    
    const shouldMute = mute !== null ? mute : !currentMeeting.audio.isMuted();
    
    if (shouldMute) {
      await currentMeeting.muteAudio();
      console.log('🔇 Audio muted');
    } else {
      await currentMeeting.unmuteAudio();
      console.log('🔊 Audio unmuted');
    }
    
    return { success: true, muted: shouldMute };
  } catch (error) {
    console.error('❌ Failed to toggle audio:', error);
    return { success: false, error: error.message };
  }
}

// Leave meeting
async function leaveMeeting() {
  try {
    if (!currentMeeting) {
      console.log('ℹ️ No active meeting to leave');
      return { success: true };
    }
    
    console.log('👋 Leaving meeting...');
    await currentMeeting.leave();
    currentMeeting = null;
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to leave meeting:', error);
    return { success: false, error: error.message };
  }
}

// Notify UI of events
function notifyUI(event, data = null) {
  try {
    // Send event to renderer process if in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.sendWebexEvent(event, data);
    }
    
    // Dispatch custom event for web
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webex-event', {
        detail: { event, data }
      }));
    }
    
    console.log('📢 UI notified:', event, data);
  } catch (error) {
    console.error('❌ Failed to notify UI:', error);
  }
}

// Get current meeting status
function getMeetingStatus() {
  if (!currentMeeting) {
    return {
      inMeeting: false,
      meeting: null
    };
  }
  
  return {
    inMeeting: true,
    meeting: {
      id: currentMeeting.id,
      title: currentMeeting.title,
      participants: currentMeeting.participants ? currentMeeting.participants.size : 0,
      audioMuted: currentMeeting.audio ? currentMeeting.audio.isMuted() : false,
      videoMuted: currentMeeting.video ? !currentMeeting.video.isEnabled() : true
    }
  };
}

// Demo mode functions (for testing without real Webex credentials)
const demoMode = {
  async createMeeting(options = {}) {
    console.log('🎭 Demo: Creating meeting...', options);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoMeeting = {
      id: 'demo-meeting-' + Date.now(),
      title: options.title || 'Demo Meeting',
      joinUrl: 'https://demo.webex.com/meet/demo-room',
      sipUri: 'demo@webex.com'
    };
    
    return {
      success: true,
      meeting: demoMeeting,
      joinUrl: demoMeeting.joinUrl
    };
  },
  
  async joinMeeting(meetingIdOrUrl) {
    console.log('🎭 Demo: Joining meeting...', meetingIdOrUrl);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful join
    notifyUI('meeting:joined');
    
    return {
      success: true,
      meeting: { id: 'demo-meeting', title: 'Demo Meeting' }
    };
  }
};

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeWebex,
    authenticateWebex,
    createMeeting,
    joinMeeting,
    startLocalVideo,
    stopLocalVideo,
    toggleAudio,
    leaveMeeting,
    getMeetingStatus,
    demoMode
  };
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
  window.WebexIntegration = {
    initializeWebex,
    authenticateWebex,
    createMeeting,
    joinMeeting,
    startLocalVideo,
    stopLocalVideo,
    toggleAudio,
    leaveMeeting,
    getMeetingStatus,
    demoMode
  };
}

console.log('✅ Webex SDK integration module loaded');

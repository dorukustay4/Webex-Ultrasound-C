// Browser-compatible Webex SDK Implementation
console.log('🚀 Loading Browser-compatible Webex SDK...');

// SDK instance and state
let webexInstance = null;
let isInitialized = false;
let currentMeeting = null;
let localMediaStream = null;
let remoteMediaStreams = new Map();

// Mock implementation for development/testing when real SDK fails
function createMockWebexSDK() {
  console.log('🔧 Creating mock Webex SDK for browser testing...');
  
  return {
    meetings: {
      async create(options = {}) {
        console.log('Mock: Creating meeting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const meetingId = 'UW-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        return {
          id: meetingId,
          sipUri: `${meetingId}@webex.com`,
          meetingLink: `https://meet.webex.com/meet/${meetingId}`,
          meetingNumber: meetingId,
          meeting: {
            id: meetingId,
            join: async function(joinOptions = {}) {
              console.log('Mock: Joining meeting with options:', joinOptions);
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Start meeting timer
              if (window.startMeetingTimer) {
                window.startMeetingTimer();
              }
              
              // Show meeting controls
              if (window.showMeetingControls) {
                window.showMeetingControls();
              }
              
              // Setup mock media
              await setupMockMedia();
              
              return this;
            },
            leave: async function() {
              console.log('Mock: Left meeting');
              if (window.stopMeetingTimer) {
                window.stopMeetingTimer();
              }
              if (window.hideMeetingControls) {
                window.hideMeetingControls();
              }
              if (localMediaStream) {
                localMediaStream.getTracks().forEach(track => track.stop());
                localMediaStream = null;
              }
            },
            on: function(event, callback) {
              // Mock event listeners
              setTimeout(() => {
                if (event === 'media:ready') {
                  callback({
                    type: 'localVideo',
                    stream: localMediaStream
                  });
                }
              }, 1000);
            }
          }
        };
      },
      
      async join(destination, options = {}) {
        console.log('Mock: Joining meeting:', destination);
        const meeting = await this.create();
        currentMeeting = meeting.meeting;
        await meeting.meeting.join(options);
        return meeting.meeting;
      },
      
      async leave() {
        if (currentMeeting) {
          await currentMeeting.leave();
          currentMeeting = null;
        }
      },
      
      async toggleAudio() {
        console.log('Mock: Toggle audio');
        return Math.random() > 0.5; // Random mute state
      },
      
      async toggleVideo() {
        console.log('Mock: Toggle video');
        return Math.random() > 0.5; // Random video state
      },
      
      getCurrentMeeting() {
        return currentMeeting;
      }
    },
    
    async getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
          cameras: devices.filter(device => device.kind === 'videoinput'),
          microphones: devices.filter(device => device.kind === 'audioinput'),
          speakers: devices.filter(device => device.kind === 'audiooutput')
        };
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
        return {
          cameras: [{ deviceId: 'default', label: 'Default Camera' }],
          microphones: [{ deviceId: 'default', label: 'Default Microphone' }],
          speakers: [{ deviceId: 'default', label: 'Default Speaker' }]
        };
      }
    },
    
    async getLocalMedia() {
      return localMediaStream;
    },
    
    async switchCamera(deviceId) {
      console.log('Mock: Switch camera to:', deviceId);
    },
    
    async switchMicrophone(deviceId) {
      console.log('Mock: Switch microphone to:', deviceId);
    }
  };
}

// Setup mock media streams
async function setupMockMedia() {
  try {
    console.log('🎥 Setting up mock local media...');
    
    localMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Attach to local video element
    const localVideoElement = document.getElementById('local-video');
    if (localVideoElement) {
      localVideoElement.srcObject = localMediaStream;
      localVideoElement.muted = true;
      localVideoElement.play();
      console.log('📹 Local video attached to DOM');
    }
    
    // Simulate remote video after 2 seconds
    setTimeout(() => {
      const remoteVideoElement = document.getElementById('remote-video');
      if (remoteVideoElement && localMediaStream) {
        // Clone local stream for demo purposes
        remoteVideoElement.srcObject = localMediaStream.clone();
        remoteVideoElement.play();
        console.log('📹 Mock remote video attached to DOM');
      }
    }, 2000);
    
    return localMediaStream;
    
  } catch (error) {
    console.error('❌ Failed to setup mock media:', error);
    
    // Create a mock video element
    const localVideoElement = document.getElementById('local-video');
    if (localVideoElement) {
      localVideoElement.style.background = 'linear-gradient(45deg, #3b82f6, #10b981)';
      localVideoElement.innerHTML = '<div style="color: white; text-align: center; padding: 2rem;">Mock Local Video<br/>Camera access denied or unavailable</div>';
    }
  }
}

// Initialize browser-compatible SDK
export async function initializeWebexSDK() {
  try {
    console.log('🔧 Initializing browser-compatible Webex SDK...');
    
    // For browser compatibility, we'll use the mock implementation
    // In a real production environment, you might want to try the real SDK first
    webexInstance = createMockWebexSDK();
    isInitialized = true;
    
    console.log('✅ Browser-compatible Webex SDK initialized');
    return webexInstance;
    
  } catch (error) {
    console.error('❌ Failed to initialize SDK:', error);
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

// Export the meetings object
export const webexMeetings = {
  async create(options = {}) {
    const webex = getWebexInstance();
    return await webex.meetings.create(options);
  },
  
  async join(destination, options = {}) {
    const webex = getWebexInstance();
    return await webex.meetings.join(destination, options);
  },
  
  async leave() {
    const webex = getWebexInstance();
    return await webex.meetings.leave();
  },
  
  async toggleAudio() {
    const webex = getWebexInstance();
    return await webex.meetings.toggleAudio();
  },
  
  async toggleVideo() {
    const webex = getWebexInstance();
    return await webex.meetings.toggleVideo();
  },
  
  getCurrentMeeting() {
    const webex = getWebexInstance();
    return webex.meetings.getCurrentMeeting();
  }
};

// Create global object for backward compatibility
export function createGlobalWebexObject() {
  return {
    meetings: webexMeetings,
    init: initializeWebexSDK,
    getInstance: getWebexInstance,
    isInitialized: isWebexInitialized,
    
    async getDevices() {
      const webex = getWebexInstance();
      return await webex.getDevices();
    },
    
    async getLocalMedia() {
      const webex = getWebexInstance();
      return await webex.getLocalMedia();
    },
    
    async switchCamera(deviceId) {
      const webex = getWebexInstance();
      return await webex.switchCamera(deviceId);
    },
    
    async switchMicrophone(deviceId) {
      const webex = getWebexInstance();
      return await webex.switchMicrophone(deviceId);
    }
  };
}

// Helper function for screen sharing
export async function getScreenShareStream() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { max: 1920 },
        height: { max: 1080 },
        frameRate: { max: 30 }
      },
      audio: true
    });
    
    console.log('🖥️ Screen share stream obtained');
    return stream;
    
  } catch (error) {
    console.error('❌ Failed to get screen share:', error);
    throw error;
  }
}

// Quality monitoring (mock)
export function startQualityMonitoring(meeting) {
  console.log('📊 Starting quality monitoring (mock)');
  
  // Mock quality updates
  const qualityInterval = setInterval(() => {
    const quality = 0.5 + Math.random() * 0.5; // Random quality between 0.5-1.0
    
    if (window.updateNetworkQuality) {
      window.updateNetworkQuality(quality);
    }
    
    const qualityElement = document.getElementById('network-quality');
    if (qualityElement) {
      qualityElement.textContent = `Quality: ${Math.round(quality * 100)}%`;
      qualityElement.className = quality > 0.7 ? 'quality-good' : 
                                quality > 0.4 ? 'quality-medium' : 'quality-poor';
    }
  }, 3000);
  
  // Store interval for cleanup
  if (meeting) {
    meeting._qualityInterval = qualityInterval;
  }
  
  return qualityInterval;
}

console.log('✅ Browser-compatible Webex SDK module loaded successfully');

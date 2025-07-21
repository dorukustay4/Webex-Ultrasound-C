// webex-sdk.js - Real Webex SDK Implementation
import Webex from 'webex';

console.log('🚀 Loading Webex SDK...');

// SDK instance and state
let webexInstance = null;
let isInitialized = false;
let currentMeeting = null;
let localMediaStream = null;
let remoteMediaStreams = new Map();

// Initialize Webex SDK with access token
export async function initializeWebexSDK() {
  try {
    console.log('🔧 Initializing Webex SDK...');
    
    // Get access token from authentication
    const accessToken = localStorage.getItem('webex_access_token');
    
    if (!accessToken) {
      throw new Error('No access token found. Please authenticate first.');
    }

    console.log('✅ Access token found, initializing with authentication');
    
    // Initialize Webex SDK with access token
    webexInstance = Webex.init({
      credentials: {
        access_token: accessToken
      },
      config: {
        logger: {
          level: 'debug'
        },
        meetings: {
          reconnection: {
            enabled: true
          },
          enableRtcMetrics: true,
          enableNetworkLogging: true
        }
      }
    });
    
    // Wait for device registration
    console.log('🔌 Registering device...');
    await webexInstance.internal.device.register();
    
    // Initialize meetings plugin
    console.log('📞 Initializing meetings...');
    await webexInstance.meetings.register();
    
    console.log('✅ Webex SDK initialized successfully');
    isInitialized = true;
    
    return webexInstance;
    
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
        password: meeting.password,
        meeting: meeting // Return the actual meeting object for further use
      };
      
    } catch (error) {
      console.error('❌ Failed to create meeting:', error);
      throw error;
    }
  },

  // Join a meeting with full media setup
  async join(destination, options = {}) {
    try {
      const webex = getWebexInstance();
      
      console.log('🔗 Joining meeting:', destination);
      
      // Create meeting object
      const meeting = await webex.meetings.create(destination);
      currentMeeting = meeting;
      
      // Setup media before joining
      console.log('🎥 Setting up local media...');
      await setupLocalMedia(meeting);
      
      // Join the meeting
      const joinOptions = {
        pin: options.pin,
        moderator: options.moderator || false,
        sendAudio: true,
        sendVideo: true,
        receiveAudio: true,
        receiveVideo: true,
        ...options
      };
      
      console.log('🚪 Joining meeting with options:', joinOptions);
      await meeting.join(joinOptions);
      
      console.log('✅ Successfully joined meeting');
      
      // Set up event listeners for the meeting
      setupMeetingEvents(meeting);
      
      // Start media after joining
      await startSendingMedia(meeting);
      
      return meeting;
      
    } catch (error) {
      console.error('❌ Failed to join meeting:', error);
      throw error;
    }
  },

  // Leave current meeting
  async leave() {
    try {
      if (currentMeeting) {
        console.log('👋 Leaving meeting...');
        await currentMeeting.leave();
        
        // Stop local media
        if (localMediaStream) {
          localMediaStream.getTracks().forEach(track => track.stop());
          localMediaStream = null;
        }
        
        // Clear remote streams
        remoteMediaStreams.clear();
        
        currentMeeting = null;
        console.log('✅ Successfully left meeting');
      }
    } catch (error) {
      console.error('❌ Failed to leave meeting:', error);
      throw error;
    }
  },

  // Toggle audio
  async toggleAudio() {
    try {
      if (currentMeeting) {
        const isAudioMuted = await currentMeeting.isAudioMuted();
        if (isAudioMuted) {
          await currentMeeting.unmuteAudio();
          console.log('🔊 Audio unmuted');
        } else {
          await currentMeeting.muteAudio();
          console.log('🔇 Audio muted');
        }
        return !isAudioMuted;
      }
    } catch (error) {
      console.error('❌ Failed to toggle audio:', error);
      throw error;
    }
  },

  // Toggle video
  async toggleVideo() {
    try {
      if (currentMeeting) {
        const isVideoMuted = await currentMeeting.isVideoMuted();
        if (isVideoMuted) {
          await currentMeeting.unmuteVideo();
          console.log('📹 Video unmuted');
        } else {
          await currentMeeting.muteVideo();
          console.log('📹 Video muted');
        }
        return !isVideoMuted;
      }
    } catch (error) {
      console.error('❌ Failed to toggle video:', error);
      throw error;
    }
  },

  // Get current meeting
  getCurrentMeeting() {
    return currentMeeting;
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

// Setup local media streams
async function setupLocalMedia(meeting) {
  try {
    console.log('🎥 Setting up local media...');
    
    // Get user media
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
    
    console.log('✅ Local media stream obtained');
    
    // Attach to local video element
    const localVideoElement = document.getElementById('local-video');
    if (localVideoElement) {
      localVideoElement.srcObject = localMediaStream;
      localVideoElement.muted = true; // Prevent feedback
      localVideoElement.play();
      console.log('📹 Local video attached to DOM');
    }
    
    return localMediaStream;
    
  } catch (error) {
    console.error('❌ Failed to setup local media:', error);
    throw error;
  }
}

// Start sending media to the meeting
async function startSendingMedia(meeting) {
  try {
    if (localMediaStream && meeting) {
      console.log('📤 Starting to send media...');
      
      // Add local stream to meeting
      await meeting.addMedia({
        localShare: {
          video: localMediaStream.getVideoTracks()[0],
          audio: localMediaStream.getAudioTracks()[0]
        }
      });
      
      console.log('✅ Media sending started');
    }
  } catch (error) {
    console.error('❌ Failed to start sending media:', error);
    throw error;
  }
}

// Attach remote media stream to DOM
function attachRemoteMedia(stream, participantId) {
  try {
    console.log('📥 Attaching remote media for participant:', participantId);
    
    // Store the stream
    remoteMediaStreams.set(participantId, stream);
    
    // Find available remote video element
    const remoteVideoElement = document.getElementById('remote-video') || 
                               document.querySelector('.video-participant:not(.local-room) video');
    
    if (remoteVideoElement) {
      remoteVideoElement.srcObject = stream;
      remoteVideoElement.play();
      console.log('📹 Remote video attached to DOM');
      
      // Hide placeholder if exists
      const placeholder = document.querySelector('.video-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to attach remote media:', error);
  }
}

// Set up comprehensive meeting event listeners
function setupMeetingEvents(meeting) {
  console.log('🎧 Setting up meeting event listeners...');
  
  // Meeting state events
  meeting.on('meeting:stateChanged', (event) => {
    console.log('📊 Meeting state changed:', event.currentState, event.previousState);
    
    // Update UI based on meeting state
    if (window.updateMeetingState) {
      window.updateMeetingState(event.currentState);
    }
  });

  // Media events
  meeting.on('media:ready', (media) => {
    console.log('🎥 Media ready:', media.type);
    
    if (media.type === 'remoteVideo') {
      attachRemoteMedia(media.stream, media.participantId);
    } else if (media.type === 'remoteAudio') {
      console.log('🔊 Remote audio stream ready');
      // Audio streams are typically handled automatically
    } else if (media.type === 'localVideo') {
      console.log('📹 Local video confirmed');
    }
  });

  meeting.on('media:stopped', (media) => {
    console.log('⏹️ Media stopped:', media.type);
    
    if (media.type === 'remoteVideo') {
      // Remove from DOM and cleanup
      const participantId = media.participantId;
      remoteMediaStreams.delete(participantId);
      
      const remoteVideoElement = document.getElementById('remote-video');
      if (remoteVideoElement) {
        remoteVideoElement.srcObject = null;
      }
    }
  });

  // Meeting lifecycle events
  meeting.on('meeting:joined', () => {
    console.log('✅ Meeting joined successfully');
    
    // Update UI to show meeting controls
    if (window.showMeetingControls) {
      window.showMeetingControls();
    }
    
    // Start meeting timer
    if (window.startMeetingTimer) {
      window.startMeetingTimer();
    }
  });

  meeting.on('meeting:left', () => {
    console.log('👋 Left meeting');
    
    // Update UI to hide meeting controls
    if (window.hideMeetingControls) {
      window.hideMeetingControls();
    }
    
    // Stop meeting timer
    if (window.stopMeetingTimer) {
      window.stopMeetingTimer();
    }
    
    // Cleanup
    currentMeeting = null;
  });

  // Participant events
  meeting.on('member:added', (participant) => {
    console.log('👤 Participant joined:', participant.identity);
    
    // Update participant count
    if (window.updateParticipantCount) {
      window.updateParticipantCount(meeting.members.membersCollection.length);
    }
  });

  meeting.on('member:removed', (participant) => {
    console.log('👋 Participant left:', participant.identity);
    
    // Update participant count
    if (window.updateParticipantCount) {
      window.updateParticipantCount(meeting.members.membersCollection.length);
    }
    
    // Clean up their media
    remoteMediaStreams.delete(participant.id);
  });

  // Audio/Video mute events
  meeting.on('meeting:receiveAudio:changed', (event) => {
    console.log('🔊 Audio receive changed:', event.receiveAudio);
  });

  meeting.on('meeting:receiveVideo:changed', (event) => {
    console.log('📹 Video receive changed:', event.receiveVideo);
  });

  // Network quality events
  meeting.on('network:quality', (event) => {
    console.log('📶 Network quality:', event.networkQualityIndex);
    
    // Update UI with network quality indicator
    if (window.updateNetworkQuality) {
      window.updateNetworkQuality(event.networkQualityIndex);
    }
  });

  // Error handling
  meeting.on('error', (error) => {
    console.error('❌ Meeting error:', error);
    
    // Show error to user
    if (window.showMeetingError) {
      window.showMeetingError(error.message);
    }
  });

  console.log('✅ Meeting event listeners setup complete');
}

// Export for global access (backward compatibility)
export function createGlobalWebexObject() {
  return {
    meetings: webexMeetings,
    init: initializeWebexSDK,
    getInstance: getWebexInstance,
    isInitialized: isWebexInitialized,
    
    // Media control functions
    async getLocalMedia() {
      return localMediaStream;
    },
    
    async getRemoteStreams() {
      return Array.from(remoteMediaStreams.values());
    },
    
    // Device management
    async getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
          cameras: devices.filter(device => device.kind === 'videoinput'),
          microphones: devices.filter(device => device.kind === 'audioinput'),
          speakers: devices.filter(device => device.kind === 'audiooutput')
        };
      } catch (error) {
        console.error('❌ Failed to enumerate devices:', error);
        return { cameras: [], microphones: [], speakers: [] };
      }
    },
    
    // Utility functions
    async switchCamera(deviceId) {
      try {
        if (!currentMeeting) return;
        
        // Stop current video track
        if (localMediaStream) {
          const videoTrack = localMediaStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
          }
        }
        
        // Get new video stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false
        });
        
        // Replace video track
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (localMediaStream) {
          localMediaStream.removeTrack(localMediaStream.getVideoTracks()[0]);
          localMediaStream.addTrack(newVideoTrack);
        }
        
        // Update local video element
        const localVideoElement = document.getElementById('local-video');
        if (localVideoElement) {
          localVideoElement.srcObject = localMediaStream;
        }
        
        console.log('📹 Camera switched successfully');
        
      } catch (error) {
        console.error('❌ Failed to switch camera:', error);
        throw error;
      }
    },
    
    async switchMicrophone(deviceId) {
      try {
        if (!currentMeeting) return;
        
        // Stop current audio track
        if (localMediaStream) {
          const audioTrack = localMediaStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.stop();
          }
        }
        
        // Get new audio stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { deviceId: { exact: deviceId } }
        });
        
        // Replace audio track
        const newAudioTrack = newStream.getAudioTracks()[0];
        if (localMediaStream) {
          localMediaStream.removeTrack(localMediaStream.getAudioTracks()[0]);
          localMediaStream.addTrack(newAudioTrack);
        }
        
        console.log('🎤 Microphone switched successfully');
        
      } catch (error) {
        console.error('❌ Failed to switch microphone:', error);
        throw error;
      }
    }
  };
}

// Helper function to get screen share stream
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

// Quality monitoring
export function startQualityMonitoring(meeting) {
  if (!meeting) return;
  
  const qualityInterval = setInterval(() => {
    // Get network stats
    meeting.getNetworkQualityIndex()
      .then(quality => {
        console.log('📊 Network Quality Index:', quality);
        
        // Update UI with quality indicator
        const qualityElement = document.getElementById('network-quality');
        if (qualityElement) {
          qualityElement.textContent = `Quality: ${quality}`;
          qualityElement.className = quality > 0.7 ? 'quality-good' : 
                                    quality > 0.4 ? 'quality-medium' : 'quality-poor';
        }
      })
      .catch(error => {
        console.log('Quality monitoring error:', error);
      });
  }, 5000); // Check every 5 seconds
  
  // Store interval ID for cleanup
  meeting._qualityInterval = qualityInterval;
}

console.log('✅ Webex SDK module loaded successfully');

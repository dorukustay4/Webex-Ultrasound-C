/**
 * Webex SDK Manager for Ultrasound Telemedicine Application
 * 
 * Features:
 * - Webex SDK initialization and authentication
 * - Video call management with 4-window layout support
 * - Screen sharing for ultrasound feed
 * - Meeting controls and participant management
 */

class WebexManager {
  constructor() {
    this.webex = null;
    this.currentMeeting = null;
    this.isAuthenticated = false;
    this.localVideo = null;
    this.remoteVideos = new Map();
    this.screenShare = null;
    this.mediaDevices = {
      camera: null,
      microphone: null,
      speaker: null
    };
    
    console.log('🎥 WebexManager initialized');
  }

  /**
   * Check if running in demo mode
   */
  isDemoMode() {
    return this.webex === null && this.isAuthenticated;
  }

  /**
   * Initialize Webex SDK
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Webex SDK...');
      
      // Check if Webex SDK is loaded
      if (typeof Webex === 'undefined') {
        throw new Error('Webex SDK not loaded. Make sure to include the Webex SDK script before this module.');
      }
      
      // Initialize with configuration
      this.webex = new Webex({
        config: {
          logger: {
            level: 'info'
          },
          meetings: {
            deviceType: 'WEB',
            reconnection: {
              enabled: true
            }
          }
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ Webex SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Webex SDK:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with access token
   */
  async authenticate(accessToken) {
    try {
      console.log('🔐 Authenticating with Webex...');
      
      if (!this.webex) {
        throw new Error('Webex SDK not initialized');
      }

      // Check if this is a demo token
      if (accessToken && accessToken.startsWith('demo_token_')) {
        console.log('🎭 Demo mode detected - skipping Webex authentication');
        this.isAuthenticated = true;
        
        // Return mock user info for demo
        return {
          id: 'demo_user_id',
          emails: ['demo@hospital.com'],
          displayName: 'Demo User',
          nickName: 'Demo User',
          firstName: 'Demo',
          lastName: 'User'
        };
      }

      // Real Webex authentication
      await this.webex.authorization.requestAccessTokenFromJwt({
        jwt: accessToken
      });

      // Wait for registration
      await this.webex.internal.device.register();
      
      this.isAuthenticated = true;
      console.log('✅ Authentication successful');
      
      // Get user information
      const userInfo = await this.webex.people.get('me');
      console.log('👤 User info:', userInfo);
      
      return userInfo;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      this.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Set up event listeners for Webex SDK
   */
  setupEventListeners() {
    if (!this.webex) return;

    // Meeting events
    this.webex.meetings.on('meeting:added', (addedMeetingEvent) => {
      console.log('🎯 Meeting added:', addedMeetingEvent);
      this.handleMeetingAdded(addedMeetingEvent.meeting);
    });

    // Device events
    this.webex.meetings.on('media:ready', (media) => {
      console.log('🎬 Media ready:', media);
    });

    console.log('📡 Event listeners set up');
  }

  /**
   * Handle meeting added event
   */
  async handleMeetingAdded(meeting) {
    this.currentMeeting = meeting;
    
    // Set up meeting event listeners
    meeting.on('meeting:stateChanged', (payload) => {
      console.log('🔄 Meeting state changed:', payload);
    });

    meeting.on('meeting:membersUpdate', (payload) => {
      console.log('👥 Members updated:', payload);
      this.handleMembersUpdate(payload);
    });

    meeting.on('meeting:media:remoteVideoAvailable', (payload) => {
      console.log('📹 Remote video available:', payload);
      this.handleRemoteVideo(payload);
    });

    meeting.on('meeting:media:remoteAudioAvailable', (payload) => {
      console.log('🔊 Remote audio available:', payload);
    });

    meeting.on('meeting:media:localShare:started', (payload) => {
      console.log('🖥️ Screen share started:', payload);
    });

    meeting.on('meeting:media:localShare:stopped', (payload) => {
      console.log('🛑 Screen share stopped:', payload);
    });
  }

  /**
   * Create or join a meeting
   */
  async createMeeting(destination) {
    try {
      console.log('🎯 Creating/joining meeting:', destination);
      
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated');
      }

      // Create meeting
      const meeting = await this.webex.meetings.create(destination);
      this.currentMeeting = meeting;
      
      console.log('✅ Meeting created successfully');
      return meeting;
    } catch (error) {
      console.error('❌ Failed to create meeting:', error);
      throw error;
    }
  }

  /**
   * Join the meeting with media
   */
  async joinMeeting(options = {}) {
    try {
      if (!this.currentMeeting) {
        throw new Error('No meeting available to join');
      }

      console.log('🚪 Joining meeting...');

      // Get media constraints for telemedicine setup
      const mediaConstraints = {
        allowMediaInLobby: true,
        video: {
          enabled: true,
          constraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        },
        audio: {
          enabled: true,
          constraints: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        },
        ...options
      };

      // Join with media
      await this.currentMeeting.join(mediaConstraints);
      
      // Get local media streams
      await this.setupLocalMedia();
      
      console.log('✅ Successfully joined meeting');
      return this.currentMeeting;
    } catch (error) {
      console.error('❌ Failed to join meeting:', error);
      throw error;
    }
  }

  /**
   * Set up local media (camera, microphone)
   */
  async setupLocalMedia() {
    try {
      if (!this.currentMeeting) return;

      // Get local video stream
      const localVideoStream = this.currentMeeting.mediaProperties.mediaDirection.sendVideo 
        ? this.currentMeeting.mediaProperties.videoStream 
        : null;

      if (localVideoStream) {
        this.localVideo = localVideoStream;
        console.log('📹 Local video stream ready');
        
        // Emit event for UI to handle
        this.emitEvent('localVideoReady', { stream: localVideoStream });
      }

      // Get local audio stream
      const localAudioStream = this.currentMeeting.mediaProperties.mediaDirection.sendAudio 
        ? this.currentMeeting.mediaProperties.audioStream 
        : null;

      if (localAudioStream) {
        console.log('🎤 Local audio stream ready');
        this.emitEvent('localAudioReady', { stream: localAudioStream });
      }

    } catch (error) {
      console.error('❌ Failed to setup local media:', error);
    }
  }

  /**
   * Handle remote video streams
   */
  handleRemoteVideo(payload) {
    const { stream, member } = payload;
    
    if (stream && member) {
      this.remoteVideos.set(member.id, {
        stream,
        member,
        type: 'camera'
      });
      
      console.log(`📹 Remote video added for member: ${member.displayName}`);
      
      // Emit event for UI to handle
      this.emitEvent('remoteVideoAdded', {
        memberId: member.id,
        stream,
        member,
        type: 'camera'
      });
    }
  }

  /**
   * Handle members update
   */
  handleMembersUpdate(payload) {
    const { members } = payload;
    
    // Emit event for UI to update participant list
    this.emitEvent('membersUpdated', { members });
  }

  /**
   * Start screen sharing (for ultrasound feed)
   */
  async startScreenShare() {
    try {
      // Demo mode simulation
      if (this.isDemoMode()) {
        console.log('🎭 Demo mode - simulating screen share start');
        return true;
      }

      if (!this.currentMeeting) {
        throw new Error('No active meeting');
      }

      console.log('🖥️ Starting screen share for ultrasound feed...');

      // Start screen sharing
      await this.currentMeeting.shareScreen();
      
      console.log('✅ Screen share started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    try {
      // Demo mode simulation
      if (this.isDemoMode()) {
        console.log('🎭 Demo mode - simulating screen share stop');
        return;
      }

      if (!this.currentMeeting) return;

      await this.currentMeeting.stopShare();
      console.log('🛑 Screen share stopped');
    } catch (error) {
      console.error('❌ Failed to stop screen share:', error);
    }
  }

  /**
   * Leave the current meeting
   */
  async leaveMeeting() {
    try {
      if (!this.currentMeeting) return;

      console.log('🚪 Leaving meeting...');
      
      await this.currentMeeting.leave();
      
      // Clean up
      this.currentMeeting = null;
      this.localVideo = null;
      this.remoteVideos.clear();
      
      console.log('✅ Left meeting successfully');
    } catch (error) {
      console.error('❌ Failed to leave meeting:', error);
    }
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo() {
    try {
      // Demo mode simulation with visual feedback
      if (this.isDemoMode()) {
        console.log('🎭 Demo mode - simulating video toggle');
        
        // Toggle camera state
        const wasEnabled = this.mediaDevices.camera;
        this.mediaDevices.camera = !wasEnabled;
        
        // Simulate actual video feed in demo mode
        await this.simulateVideoFeed(!wasEnabled);
        
        console.log(`📹 Demo video ${this.mediaDevices.camera ? 'enabled' : 'disabled'}`);
        return this.mediaDevices.camera;
      }

      if (!this.currentMeeting) {
        console.warn('⚠️ No active meeting for video toggle');
        return false;
      }

      const isVideoEnabled = this.currentMeeting.mediaProperties.mediaDirection.sendVideo;
      
      if (isVideoEnabled) {
        await this.currentMeeting.muteVideo();
        console.log('📹 Video muted');
      } else {
        await this.currentMeeting.unmuteVideo();
        console.log('📹 Video unmuted');
      }
      
      return !isVideoEnabled;
    } catch (error) {
      console.error('❌ Failed to toggle video:', error);
      return false;
    }
  }

  /**
   * Simulate video feed for demo mode
   */
  async simulateVideoFeed(enable) {
    try {
      const videoElement = document.getElementById('local-video') || document.querySelector('.video-self video');
      
      if (!videoElement) {
        console.log('📹 No local video element found for simulation');
        return;
      }

      if (enable) {
        // Create a simple demo video feed
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add demo text
        ctx.fillStyle = 'white';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DEMO VIDEO FEED', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Expert Supervisor', canvas.width / 2, canvas.height / 2 + 15);
        
        // Convert to video stream (for demo purposes, we'll use the canvas as a background)
        const stream = canvas.captureStream();
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        
        // Hide placeholder
        const placeholder = videoElement.parentNode.querySelector('.video-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
        
        console.log('📹 Demo video feed enabled');
      } else {
        // Disable video feed
        if (videoElement.srcObject) {
          videoElement.srcObject.getTracks().forEach(track => track.stop());
          videoElement.srcObject = null;
        }
        videoElement.style.display = 'none';
        
        // Show placeholder
        const placeholder = videoElement.parentNode.querySelector('.video-placeholder');
        if (placeholder) {
          placeholder.style.display = 'flex';
        }
        
        console.log('📹 Demo video feed disabled');
      }
    } catch (error) {
      console.error('❌ Failed to simulate video feed:', error);
    }
  }

  /**
   * Toggle audio on/off
   */
  async toggleAudio() {
    try {
      // Demo mode simulation
      if (this.isDemoMode()) {
        console.log('🎭 Demo mode - simulating audio toggle');
        // Simulate audio state toggle
        this.mediaDevices.microphone = !this.mediaDevices.microphone;
        return this.mediaDevices.microphone;
      }

      if (!this.currentMeeting) return false;

      const isAudioEnabled = this.currentMeeting.mediaProperties.mediaDirection.sendAudio;
      
      if (isAudioEnabled) {
        await this.currentMeeting.muteAudio();
        console.log('🎤 Audio muted');
      } else {
        await this.currentMeeting.unmuteAudio();
        console.log('🎤 Audio unmuted');
      }
      
      return !isAudioEnabled;
    } catch (error) {
      console.error('❌ Failed to toggle audio:', error);
      return false;
    }
  }

  /**
   * Get available media devices
   */
  async getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      
      this.mediaDevices = { cameras, microphones, speakers };
      
      console.log('🎛️ Media devices:', this.mediaDevices);
      return this.mediaDevices;
    } catch (error) {
      console.error('❌ Failed to get media devices:', error);
      return null;
    }
  }

  /**
   * Switch camera device
   */
  async switchCamera(deviceId) {
    try {
      if (!this.currentMeeting) return;

      await this.currentMeeting.updateVideo({ deviceId });
      console.log('📹 Switched to camera:', deviceId);
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
    }
  }

  /**
   * Switch microphone device
   */
  async switchMicrophone(deviceId) {
    try {
      if (!this.currentMeeting) return;

      await this.currentMeeting.updateAudio({ deviceId });
      console.log('🎤 Switched to microphone:', deviceId);
    } catch (error) {
      console.error('❌ Failed to switch microphone:', error);
    }
  }

  /**
   * Get meeting info
   */
  getMeetingInfo() {
    if (!this.currentMeeting) return null;

    return {
      id: this.currentMeeting.id,
      sipUri: this.currentMeeting.sipUri,
      state: this.currentMeeting.state,
      participants: this.currentMeeting.members?.membersCollection?.members || {},
      localMedia: {
        video: this.currentMeeting.mediaProperties.mediaDirection.sendVideo,
        audio: this.currentMeeting.mediaProperties.mediaDirection.sendAudio
      }
    };
  }

  /**
   * Event emission system for UI integration
   */
  emitEvent(eventName, data) {
    const event = new CustomEvent(`webex:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    console.log('🧹 Cleaning up WebexManager...');
    
    if (this.currentMeeting) {
      this.leaveMeeting();
    }
    
    this.webex = null;
    this.isAuthenticated = false;
    this.localVideo = null;
    this.remoteVideos.clear();
  }
}

// Export for use in other modules
window.WebexManager = WebexManager;

// Auto-initialize when script loads
console.log('📦 Webex Manager loaded and ready for initialization');

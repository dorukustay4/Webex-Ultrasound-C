// Camera and Media Device Utilities
// Handles camera access, streaming, and video element management

console.log('Camera utilities loaded');

class CameraManager {
  constructor() {
    this.currentStream = null;
    this.videoElement = null;
    this.constraints = {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 }
      },
      audio: true
    };
  }

  /**
   * Request camera and microphone access
   * @param {Object} customConstraints - Custom media constraints
   * @returns {Promise<MediaStream>} - The media stream
   */
  async requestCameraAccess(customConstraints = null) {
    try {
      console.log('Requesting camera access...');
      
      // Use custom constraints or default ones
      const constraints = customConstraints || this.constraints;
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted successfully');
      console.log('Stream tracks:', stream.getTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled
      })));

      // Store the current stream
      this.currentStream = stream;
      
      return stream;
      
    } catch (error) {
      console.error('Failed to access camera:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to access camera. ';
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage += 'Permission denied. Please allow camera access and try again.';
          break;
        case 'NotFoundError':
          errorMessage += 'No camera found. Please connect a camera device.';
          break;
        case 'NotReadableError':
          errorMessage += 'Camera is already in use by another application.';
          break;
        case 'OverconstrainedError':
          errorMessage += 'Camera constraints cannot be satisfied. Trying with basic settings...';
          // Try with basic constraints
          return this.requestCameraAccess({ video: true, audio: true });
        case 'SecurityError':
          errorMessage += 'Camera access blocked due to security restrictions.';
          break;
        default:
          errorMessage += error.message || 'Unknown error occurred.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Stream camera feed to a video element
   * @param {string|HTMLVideoElement} videoElementOrSelector - Video element or CSS selector
   * @param {Object} customConstraints - Custom media constraints
   * @returns {Promise<HTMLVideoElement>} - The video element with stream
   */
  async streamToVideo(videoElementOrSelector, customConstraints = null) {
    try {
      // Get or find the video element
      let videoElement;
      if (typeof videoElementOrSelector === 'string') {
        videoElement = document.querySelector(videoElementOrSelector);
        if (!videoElement) {
          throw new Error(`Video element not found: ${videoElementOrSelector}`);
        }
      } else if (videoElementOrSelector instanceof HTMLVideoElement) {
        videoElement = videoElementOrSelector;
      } else {
        throw new Error('Invalid video element provided');
      }

      // Request camera access if we don't have a stream
      if (!this.currentStream) {
        await this.requestCameraAccess(customConstraints);
      }

      // Set up the video element
      videoElement.srcObject = this.currentStream;
      videoElement.autoplay = true;
      videoElement.playsinline = true; // Important for mobile devices
      videoElement.muted = true; // Prevent audio feedback

      // Store reference to video element
      this.videoElement = videoElement;

      // Handle video events
      videoElement.addEventListener('loadedmetadata', () => {
        console.log(`Video metadata loaded: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      });

      videoElement.addEventListener('loadeddata', () => {
        console.log('Video data loaded and ready to play');
      });

      videoElement.addEventListener('error', (event) => {
        console.error('Video element error:', event);
      });

      // Start playing
      try {
        await videoElement.play();
        console.log('Video stream started successfully');
      } catch (playError) {
        console.warn('Autoplay failed, user interaction required:', playError);
      }

      return videoElement;

    } catch (error) {
      console.error('Failed to stream to video element:', error);
      throw error;
    }
  }

  /**
   * Get available camera devices
   * @returns {Promise<Array>} - List of video input devices
   */
  async getAvailableCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Device enumeration not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} camera devices:`, videoDevices);
      
      return videoDevices;
    } catch (error) {
      console.error('Failed to get camera devices:', error);
      return [];
    }
  }

  /**
   * Switch to a different camera
   * @param {string} deviceId - Camera device ID
   * @returns {Promise<MediaStream>} - New media stream
   */
  async switchCamera(deviceId) {
    try {
      console.log('Switching to camera:', deviceId);
      
      // Stop current stream
      this.stopStream();

      // Request new stream with specific device
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: this.constraints.audio
      };

      const newStream = await this.requestCameraAccess(constraints);

      // Update video element if exists
      if (this.videoElement) {
        this.videoElement.srcObject = newStream;
      }

      return newStream;
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }

  /**
   * Toggle video track on/off
   * @param {boolean} enabled - Enable or disable video
   */
  toggleVideo(enabled = null) {
    if (!this.currentStream) {
      console.warn('No active stream to toggle');
      return false;
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('No video track found');
      return false;
    }

    // Toggle or set specific state
    const newState = enabled !== null ? enabled : !videoTrack.enabled;
    videoTrack.enabled = newState;
    
    console.log(`Video ${newState ? 'enabled' : 'disabled'}`);
    return newState;
  }

  /**
   * Toggle audio track on/off
   * @param {boolean} enabled - Enable or disable audio
   */
  toggleAudio(enabled = null) {
    if (!this.currentStream) {
      console.warn('No active stream to toggle');
      return false;
    }

    const audioTrack = this.currentStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('No audio track found');
      return false;
    }

    // Toggle or set specific state
    const newState = enabled !== null ? enabled : !audioTrack.enabled;
    audioTrack.enabled = newState;
    
    console.log(`Audio ${newState ? 'enabled' : 'disabled'}`);
    return newState;
  }

  /**
   * Stop the current media stream
   */
  stopStream() {
    if (this.currentStream) {
      console.log('Stopping media stream');
      this.currentStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track: ${track.label}`);
      });
      this.currentStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Get stream information
   * @returns {Object} - Stream details
   */
  getStreamInfo() {
    if (!this.currentStream) {
      return null;
    }

    const tracks = this.currentStream.getTracks();
    return {
      id: this.currentStream.id,
      active: this.currentStream.active,
      tracks: tracks.map(track => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings ? track.getSettings() : null
      }))
    };
  }
}

// Create a global instance
const cameraManager = new CameraManager();

// Convenience functions for easy use
window.requestCameraAccess = (constraints) => cameraManager.requestCameraAccess(constraints);
window.streamToVideo = (element, constraints) => cameraManager.streamToVideo(element, constraints);
window.getAvailableCameras = () => cameraManager.getAvailableCameras();
window.switchCamera = (deviceId) => cameraManager.switchCamera(deviceId);
window.toggleVideo = (enabled) => cameraManager.toggleVideo(enabled);
window.toggleAudio = (enabled) => cameraManager.toggleAudio(enabled);
window.stopCameraStream = () => cameraManager.stopStream();
window.getCameraStreamInfo = () => cameraManager.getStreamInfo();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CameraManager, cameraManager };
}

console.log('Camera utilities ready - Use requestCameraAccess() and streamToVideo() functions');

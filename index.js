// Enhanced Webex Annotator with full meeting features
console.log('JavaScript file loaded successfully!');

// Meeting state variables
let currentMeeting = null;
let createdMeetingInfo = null;
let localStream = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isScreenSharing = false;
let meetingStartTime = null;
let meetingTimer = null;
let participantCount = 1;

// Device management
let availableDevices = {
  cameras: [],
  microphones: [],
  speakers: []
};

// Mock webex object for testing with enhanced features
const webex = {
  meetings: {
    create: async function(destination) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (destination) {
        // Joining a meeting
        return {
          id: 'mock-meeting-' + Math.random().toString(36).substr(2, 9),
          sipUri: 'mock@example.webex.com',
          join: async function() {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Joined meeting:', destination);
            
            // Start meeting timer
            meetingStartTime = Date.now();
            startMeetingTimer();
            
            // Show meeting controls
            showMeetingControls();
            
            // Initialize media
            await initializeMedia();
          },
          leave: async function() {
            console.log('Left meeting');
            stopMeetingTimer();
            hideMeetingControls();
            stopLocalStream();
          },
          on: function(event, callback) {
            // Mock media ready event after 2 seconds
            setTimeout(() => {
              if (event === 'media:ready') {
                callback({
                  type: 'remoteVideo',
                  stream: null // Would be actual stream in real implementation
                });
              }
            }, 2000);
          }
        };
      } else {
        // Creating a new meeting
        const meetingId = Math.random().toString(36).substr(2, 9);
        return {
          id: meetingId,
          sipUri: `${meetingId}@example.webex.com`,
          meetingInfo: {
            meetingLink: `https://meet.webex.com/meet/${meetingId}`
          },
          meetingNumber: meetingId.substring(0, 10).toUpperCase()
        };
      }
    }
  }
};

// Create Meeting Function
window.createMeeting = async function () {
  console.log('Create meeting button clicked!');
  
  const createBtn = document.querySelector('.create-btn');
  const meetingInfoCard = document.getElementById('meeting-info');
  
  if (!createBtn) {
    console.error('Create button not found!');
    return;
  }
  
  // Add loading state
  createBtn.classList.add('loading');
  createBtn.innerHTML = '<span>Creating Meeting...</span>';
  
  try {
    // Create a new meeting
    console.log('Creating meeting...');
    const meeting = await webex.meetings.create();
    
    // Get meeting details
    const meetingInfo = {
      id: meeting.id,
      sipUri: meeting.sipUri,
      meetingLink: meeting.meetingInfo?.meetingLink || `https://meet.webex.com/meet/${meeting.id}`,
      meetingNumber: meeting.meetingNumber || meeting.id.substring(0, 10)
    };
    
    createdMeetingInfo = meetingInfo;
    console.log('Meeting created:', meetingInfo);
    
    // Display meeting information
    const linkInput = document.getElementById('meeting-link');
    const idInput = document.getElementById('meeting-id');
    const sipInput = document.getElementById('meeting-sip');
    
    if (linkInput) linkInput.value = meetingInfo.meetingLink;
    if (idInput) idInput.value = meetingInfo.meetingNumber;
    if (sipInput) sipInput.value = meetingInfo.sipUri;
    
    // Show meeting info card
    if (meetingInfoCard) {
      meetingInfoCard.style.display = 'block';
    }
    
    // Update button state
    createBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
      </svg>
      Meeting Created
    `;
    createBtn.classList.remove('loading');
    
    console.log('Meeting created successfully:', meetingInfo);
  } catch (error) {
    console.error('Failed to create meeting:', error);
    resetCreateButton();
    alert('Failed to create meeting. Please check your connection and try again.');
  }
};

// Join Meeting Function
window.joinMeeting = async function () {
  console.log('Join meeting button clicked!');
  
  const joinBtn = document.querySelector('.join-btn');
  const videoElement = document.getElementById('remote-video');
  const placeholder = document.querySelector('.video-placeholder');
  
  if (!joinBtn) {
    console.error('Join button not found!');
    return;
  }
  
  // Add loading state
  joinBtn.classList.add('loading');
  joinBtn.innerHTML = '<span>Connecting...</span>';
  
  try {
    const destination = prompt('Enter Meeting Link or SIP:');
    if (!destination) {
      resetJoinButton();
      return;
    }

    console.log('Joining meeting:', destination);
    const meeting = await webex.meetings.create(destination);
    await meeting.join();
    currentMeeting = meeting;

    // Display remote media (mock for testing)
    meeting.on('media:ready', (media) => {
      console.log('Media ready:', media);
      if (media.type === 'remoteVideo') {
        // For testing, just show a colored background
        if (videoElement) {
          videoElement.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
          videoElement.classList.add('active');
        }
        if (placeholder) {
          placeholder.classList.add('hidden');
        }
      }
    });

    // Update button state
    joinBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
      </svg>
      Connected
    `;
    joinBtn.classList.remove('loading');
    
    // Update participant count
    updateParticipantCount(2);
    
  } catch (error) {
    console.error('Failed to join meeting:', error);
    resetJoinButton();
    alert('Failed to join meeting. Please check your meeting link and try again.');
  }
};

// Join Created Meeting Function
window.joinCreatedMeeting = async function () {
  console.log('Join created meeting button clicked!');
  
  if (!createdMeetingInfo) {
    alert('No meeting created yet. Please create a meeting first.');
    return;
  }
  
  const joinCreatedBtn = document.querySelector('.join-created-btn');
  const videoElement = document.getElementById('remote-video');
  const placeholder = document.querySelector('.video-placeholder');
  
  if (!joinCreatedBtn) {
    console.error('Join created button not found!');
    return;
  }
  
  // Add loading state
  joinCreatedBtn.classList.add('loading');
  joinCreatedBtn.innerHTML = '<span>Joining...</span>';
  
  try {
    console.log('Joining created meeting:', createdMeetingInfo);
    const meeting = await webex.meetings.create(createdMeetingInfo.sipUri);
    await meeting.join();
    currentMeeting = meeting;

    // Display remote media (mock for testing)
    meeting.on('media:ready', (media) => {
      console.log('Media ready:', media);
      if (media.type === 'remoteVideo') {
        // For testing, just show a colored background
        if (videoElement) {
          videoElement.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
          videoElement.classList.add('active');
        }
        if (placeholder) {
          placeholder.classList.add('hidden');
        }
      }
    });

    // Update button state
    joinCreatedBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
      </svg>
      Joined Meeting
    `;
    joinCreatedBtn.classList.remove('loading');
    
    // Update participant count
    updateParticipantCount(1);
    
  } catch (error) {
    console.error('Failed to join created meeting:', error);
    resetJoinCreatedButton();
    alert('Failed to join the created meeting. Please try again.');
  }
};

// Copy to Clipboard Function
window.copyToClipboard = async function (elementId) {
  console.log('Copy to clipboard clicked for:', elementId);
  
  const input = document.getElementById(elementId);
  if (!input) {
    console.error('Input element not found:', elementId);
    return;
  }
  
  const copyBtn = input.parentElement.querySelector('.copy-btn');
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else {
      // Fallback: select the text
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      document.execCommand('copy');
    }
    
    console.log('Copied to clipboard:', input.value);
    
    // Visual feedback
    if (copyBtn) {
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z" fill="currentColor"/>
        </svg>
      `;
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H10C10.5523 14 11 13.5523 11 13V11M6 1H14C14.5523 1 15 1.44772 15 2V10C15 10.5523 14.5523 11 14 11H6C5.44772 11 5 10.5523 5 10V2C5 1.44772 5.44772 1 6 1Z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        `;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert('Failed to copy to clipboard. Please try selecting and copying manually.');
  }
};

// Enhanced Meeting Features

// Initialize media devices and streams
async function initializeMedia() {
  try {
    console.log('Initializing media...');
    
    // Get user media for local video
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Display local video
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.classList.remove('hidden');
      }
      
      // Enumerate available devices
      await enumerateDevices();
      
      console.log('Media initialized successfully');
    } else {
      console.warn('Media devices not supported');
      // For testing, show mock local video
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.style.background = 'linear-gradient(45deg, #4299e1, #3182ce)';
        localVideo.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to initialize media:', error);
    // Show error state but continue
    alert('Camera/microphone access denied. Some features may not work.');
  }
}

// Enumerate available media devices
async function enumerateDevices() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      availableDevices.cameras = devices.filter(device => device.kind === 'videoinput');
      availableDevices.microphones = devices.filter(device => device.kind === 'audioinput');
      availableDevices.speakers = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('Available devices:', availableDevices);
      
      // Populate device selectors
      populateDeviceSelectors();
    }
  } catch (error) {
    console.error('Failed to enumerate devices:', error);
  }
}

// Populate device selection dropdowns
function populateDeviceSelectors() {
  const cameraSelect = document.getElementById('camera-select');
  const micSelect = document.getElementById('microphone-select');
  const speakerSelect = document.getElementById('speaker-select');
  
  if (cameraSelect) {
    cameraSelect.innerHTML = '<option value="default">Default Camera</option>';
    availableDevices.cameras.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });
  }
  
  if (micSelect) {
    micSelect.innerHTML = '<option value="default">Default Microphone</option>';
    availableDevices.microphones.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Microphone ${index + 1}`;
      micSelect.appendChild(option);
    });
  }
  
  if (speakerSelect) {
    speakerSelect.innerHTML = '<option value="default">Default Speaker</option>';
    availableDevices.speakers.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Speaker ${index + 1}`;
      speakerSelect.appendChild(option);
    });
  }
}

// Toggle mute/unmute
window.toggleMute = function() {
  console.log('Toggle mute clicked');
  
  const muteBtn = document.getElementById('mute-btn');
  
  if (isAudioEnabled) {
    // Mute
    isAudioEnabled = false;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = false);
    }
    
    muteBtn.classList.add('muted');
    muteBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1C8.89543 1 8 1.89543 8 3V10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10V3C12 1.89543 11.1046 1 10 1Z" stroke="currentColor" stroke-width="2"/>
        <path d="M5 8V10C5 12.7614 7.23858 15 10 15C12.7614 15 15 12.7614 15 10V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10 15V19M10 19H6M10 19H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M3 3L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    muteBtn.title = 'Unmute';
    console.log('Microphone muted');
  } else {
    // Unmute
    isAudioEnabled = true;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = true);
    }
    
    muteBtn.classList.remove('muted');
    muteBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1C8.89543 1 8 1.89543 8 3V10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10V3C12 1.89543 11.1046 1 10 1Z" stroke="currentColor" stroke-width="2"/>
        <path d="M5 8V10C5 12.7614 7.23858 15 10 15C12.7614 15 15 12.7614 15 10V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10 15V19M10 19H6M10 19H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    muteBtn.title = 'Mute';
    console.log('Microphone unmuted');
  }
};

// Toggle video on/off
window.toggleVideo = function() {
  console.log('Toggle video clicked');
  
  const videoBtn = document.getElementById('video-btn');
  const localVideo = document.getElementById('local-video');
  
  if (isVideoEnabled) {
    // Turn off video
    isVideoEnabled = false;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = false);
    }
    
    if (localVideo) {
      localVideo.classList.add('hidden');
    }
    
    videoBtn.classList.add('muted');
    videoBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5C2 3.89543 2.89543 3 4 3H11C12.1046 3 13 3.89543 13 5V15C13 16.1046 12.1046 17 11 17H4C2.89543 17 2 16.1046 2 15V5Z" stroke="currentColor" stroke-width="2"/>
        <path d="M13 7L18 4V16L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 3L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    videoBtn.title = 'Turn Camera On';
    console.log('Video turned off');
  } else {
    // Turn on video
    isVideoEnabled = true;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = true);
    }
    
    if (localVideo) {
      localVideo.classList.remove('hidden');
    }
    
    videoBtn.classList.remove('muted');
    videoBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5C2 3.89543 2.89543 3 4 3H11C12.1046 3 13 3.89543 13 5V15C13 16.1046 12.1046 17 11 17H4C2.89543 17 2 16.1046 2 15V5Z" stroke="currentColor" stroke-width="2"/>
        <path d="M13 7L18 4V16L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    videoBtn.title = 'Turn Camera Off';
    console.log('Video turned on');
  }
};

// Toggle screen sharing
window.toggleScreenShare = async function() {
  console.log('Toggle screen share clicked');
  
  const screenBtn = document.getElementById('screen-btn');
  const remoteVideo = document.getElementById('remote-video');
  
  if (!isScreenSharing) {
    try {
      // Start screen sharing
      console.log('Starting screen share...');
      
      // For testing, simulate screen sharing
      if (remoteVideo) {
        remoteVideo.style.background = 'linear-gradient(45deg, #f093fb, #f5576c)';
        remoteVideo.classList.add('active');
      }
      
      isScreenSharing = true;
      screenBtn.classList.add('active');
      screenBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="16" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M8 21H12M10 17V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 9L10 6L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      screenBtn.title = 'Stop Sharing';
      
      console.log('Screen sharing started');
      
      // In real implementation, you would use:
      // const screenStream = await navigator.mediaDevices.getDisplayMedia({video: true});
      // remoteVideo.srcObject = screenStream;
      
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      alert('Screen sharing not supported or permission denied.');
    }
  } else {
    // Stop screen sharing
    isScreenSharing = false;
    screenBtn.classList.remove('active');
    screenBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="16" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M8 21H12M10 17V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 9L10 12L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    screenBtn.title = 'Share Screen';
    
    if (remoteVideo) {
      remoteVideo.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
    }
    
    console.log('Screen sharing stopped');
  }
};

// Leave meeting
window.leaveMeeting = async function() {
  console.log('Leave meeting clicked');
  
  const confirmed = confirm('Are you sure you want to leave the meeting?');
  if (!confirmed) return;
  
  try {
    if (currentMeeting && currentMeeting.leave) {
      await currentMeeting.leave();
    }
    
    // Reset all states
    currentMeeting = null;
    stopMeetingTimer();
    hideMeetingControls();
    stopLocalStream();
    
    // Reset video elements
    const remoteVideo = document.getElementById('remote-video');
    const localVideo = document.getElementById('local-video');
    const placeholder = document.querySelector('.video-placeholder');
    
    if (remoteVideo) {
      remoteVideo.style.background = '';
      remoteVideo.classList.remove('active');
    }
    
    if (localVideo) {
      localVideo.classList.add('hidden');
    }
    
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }
    
    console.log('Left meeting successfully');
  } catch (error) {
    console.error('Failed to leave meeting:', error);
  }
};

// Settings modal functions
window.openSettings = function() {
  console.log('Open settings clicked');
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
};

window.closeSettings = function() {
  console.log('Close settings clicked');
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

window.saveSettings = function() {
  console.log('Save settings clicked');
  
  // Get selected values
  const cameraSelect = document.getElementById('camera-select');
  const micSelect = document.getElementById('microphone-select');
  const speakerSelect = document.getElementById('speaker-select');
  const qualitySelect = document.getElementById('quality-select');
  
  const settings = {
    camera: cameraSelect?.value,
    microphone: micSelect?.value,
    speaker: speakerSelect?.value,
    quality: qualitySelect?.value
  };
  
  console.log('Saving settings:', settings);
  
  // In real implementation, apply the settings
  // await applyDeviceSettings(settings);
  
  closeSettings();
  alert('Settings saved successfully!');
};

// Meeting timer functions
function startMeetingTimer() {
  if (meetingTimer) {
    clearInterval(meetingTimer);
  }
  
  meetingTimer = setInterval(() => {
    if (meetingStartTime) {
      const elapsed = Date.now() - meetingStartTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const timerElement = document.getElementById('meeting-timer');
      if (timerElement) {
        timerElement.textContent = timeString;
      }
    }
  }, 1000);
}

function stopMeetingTimer() {
  if (meetingTimer) {
    clearInterval(meetingTimer);
    meetingTimer = null;
  }
  
  const timerElement = document.getElementById('meeting-timer');
  if (timerElement) {
    timerElement.textContent = '00:00:00';
  }
}

// Show/hide meeting controls
function showMeetingControls() {
  const controls = document.getElementById('meeting-controls');
  const videoContainer = document.querySelector('.video-container');
  
  if (controls) {
    controls.style.display = 'flex';
  }
  
  if (videoContainer) {
    videoContainer.classList.add('in-meeting');
  }
}

function hideMeetingControls() {
  const controls = document.getElementById('meeting-controls');
  const videoContainer = document.querySelector('.video-container');
  
  if (controls) {
    controls.style.display = 'none';
  }
  
  if (videoContainer) {
    videoContainer.classList.remove('in-meeting');
  }
}

// Stop local stream
function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  const localVideo = document.getElementById('local-video');
  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.classList.add('hidden');
  }
}

// Update participant count
function updateParticipantCount(count) {
  participantCount = count;
  const participantElement = document.getElementById('participant-count');
  if (participantElement) {
    const span = participantElement.querySelector('span');
    if (span) {
      span.textContent = count.toString();
    }
  }
}

// Test if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, page is ready!');
  
  // Test button existence
  const createBtn = document.querySelector('.create-btn');
  const joinBtn = document.querySelector('.join-btn');
  
  if (createBtn) console.log('Create button found');
  if (joinBtn) console.log('Join button found');
  
  // Test if functions are properly defined
  if (typeof window.createMeeting === 'function') {
    console.log('✓ createMeeting function is available');
  } else {
    console.error('✗ createMeeting function is NOT available');
  }
  
  if (typeof window.joinMeeting === 'function') {
    console.log('✓ joinMeeting function is available');
  } else {
    console.error('✗ joinMeeting function is NOT available');
  }
});

console.log('All functions defined successfully!');

// === Multi-Window Video Setup ===

// Assign webcam streams to the correct video elements
async function setupWebcams() {
  // Get available video devices
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === 'videoinput');

  // Assign first camera to local doctor, second to remote doctor (if available)
  if (videoDevices.length > 0) {
    const localDoctorStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId }, audio: false });
    const localDoctorVideo = document.getElementById('local-doctor-video');
    if (localDoctorVideo) localDoctorVideo.srcObject = localDoctorStream;
  }
  if (videoDevices.length > 1) {
    const remoteDoctorStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[1].deviceId }, audio: false });
    const remoteDoctorVideo = document.getElementById('remote-doctor-video');
    if (remoteDoctorVideo) remoteDoctorVideo.srcObject = remoteDoctorStream;
  }
}

// HDMI feed setup (placeholder logic)
async function setupHDMIFeed() {
  // In real use, select the HDMI capture device
  // For now, use the first available camera as a placeholder
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  if (videoDevices.length > 0) {
    const hdmiStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId }, audio: false });
    const hdmiVideo = document.getElementById('hdmi-feed-video');
    if (hdmiVideo) hdmiVideo.srcObject = hdmiStream;
  }
}

// Screenshot logic
window.takeScreenshot = function() {
  const video = document.getElementById('hdmi-feed-video');
  const img = document.getElementById('screenshot-image');
  if (!video || !img) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL('image/png');
  img.src = dataURL;
  img.style.display = 'block';
  // Pass to VIA if loaded
  if (window.VIA && window.VIA.app) {
    window.VIA.app.loadImages([dataURL]);
  }
};

// VIA Annotation Tool Embed
async function embedVIA() {
  const viaArea = document.getElementById('via-annotation-area');
  if (!viaArea) return;
  // Load VIA from CDN if not already loaded
  if (!window.VIA) {
    const script = document.createElement('script');
    script.src = 'https://www.robots.ox.ac.uk/~vgg/software/via/via-3.0.16/via.js';
    script.onload = () => {
      // VIA will auto-initialize in the div if present
      window.VIA = window.via;
      if (window.VIA && window.VIA.app) {
        window.VIA.app._init(viaArea);
      }
    };
    document.body.appendChild(script);
  } else if (window.VIA.app) {
    window.VIA.app._init(viaArea);
  }
}

// Initialize all video windows and VIA on page load
window.addEventListener('DOMContentLoaded', async () => {
  await setupWebcams();
  await setupHDMIFeed();
  await embedVIA();
});
// Enhanced Ultrasound Webex Annotator with REAL Webex SDK
import { initializeWebexSDK, webexMeetings, isWebexInitialized, createGlobalWebexObject } from './webex-sdk.js';

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

// Real Webex SDK instance
let webex = null;

// Initialize the SDK and create global webex object for backward compatibility
async function setupWebexSDK() {
  try {
    console.log('🔧 Setting up Webex SDK...');
    await initializeWebexSDK();
    
    // Create global webex object for backward compatibility with existing code
    webex = createGlobalWebexObject();
    
    console.log('✅ Webex SDK setup complete');
    return true;
  } catch (error) {
    console.error('❌ Failed to setup Webex SDK:', error);
    console.log('📦 Falling back to mock implementation for development');
    setupMockWebex();
    return false;
  }
}

// Fallback mock implementation for development/testing
function setupMockWebex() {
  console.log('🔧 Setting up mock Webex implementation');
  webex = {
    meetings: {
      create: async function(destination) {
        console.log('Mock: Creating meeting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (destination) {
          // Joining a meeting
          const meetingId = Math.random().toString(36).substr(2, 9);
          return {
            id: meetingId,
            sipUri: `${meetingId}@example.webex.com`,
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
}

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
    // Create a new meeting using real SDK
    console.log('Creating meeting...');
    const meetingInfo = await webex.meetings.create();
    
    // Store meeting info
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

// Reset create button
function resetCreateButton() {
  const createBtn = document.querySelector('.create-btn');
  if (createBtn) {
    createBtn.classList.remove('loading');
    createBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Create Meeting
    `;
  }
}

// Join Meeting Function
window.joinMeeting = async function () {
  console.log('Join meeting button clicked!');
  
  const joinBtn = document.querySelector('.join-btn');
  
  if (!joinBtn) {
    console.error('Join button not found!');
    return;
  }
  
  // Add loading state
  joinBtn.classList.add('loading');
  joinBtn.innerHTML = '<span>Getting call info...</span>';
  
  try {
    const destination = prompt('Enter Call ID or Meeting Link:');
    if (!destination) {
      resetJoinButton();
      return;
    }

    console.log('Processing call join request:', destination);
    
    // Extract or generate call ID
    let callId = destination;
    if (destination.includes('webex.com') || destination.includes('meet.')) {
      // Extract from meeting URL if provided
      callId = 'UW-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    // Redirect to role selection screen
    window.location.href = `role-selection.html?callId=${callId}`;
    
  } catch (error) {
    console.error('Error processing join request:', error);
    alert('Error processing join request. Please try again.');
    resetJoinButton();
  }
};

function resetJoinButton() {
  const joinBtn = document.querySelector('.join-btn');
  if (joinBtn) {
    joinBtn.classList.remove('loading');
    joinBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 8V6C15 3.79086 13.2091 2 11 2H9C6.79086 2 5 3.79086 5 6V8M3 10C3 8.89543 3.89543 8 5 8H15C16.1046 8 17 8.89543 17 10V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Join Meeting
    `;
  }
}

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
    
    // Use real SDK to join meeting
    const meeting = await webex.meetings.join(createdMeetingInfo.sipUri);
    currentMeeting = meeting;

    // Display remote media
    if (meeting.on) {
      meeting.on('media:ready', (media) => {
        console.log('Media ready:', media);
        if (media.type === 'remoteVideo' && videoElement) {
          videoElement.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
          videoElement.classList.add('active');
        }
        if (placeholder) {
          placeholder.classList.add('hidden');
        }
      });
    }

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

function resetJoinCreatedButton() {
  const joinCreatedBtn = document.querySelector('.join-created-btn');
  if (joinCreatedBtn) {
    joinCreatedBtn.classList.remove('loading');
    joinCreatedBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 8V6C15 3.79086 13.2091 2 11 2H9C6.79086 2 5 3.79086 5 6V8M3 10C3 8.89543 3.89543 8 5 8H15C16.1046 8 17 8.89543 17 10V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Join Meeting
    `;
  }
}

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

// Initialize media devices and streams
async function initializeMedia() {
  try {
    console.log('Initializing media...');
    
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    localStream = stream;
    
    // Apply to local video element
    const localVideo = document.getElementById('local-video');
    if (localVideo) {
      localVideo.srcObject = stream;
    }
    
    console.log('✅ Media initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize media:', error);
    alert('Failed to access camera/microphone. Please check permissions.');
  }
}

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
}

// Update participant count
function updateParticipantCount(count) {
  participantCount = count;
  const countElement = document.getElementById('participant-count');
  if (countElement) {
    countElement.textContent = count;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Ultrasound Webex application starting...');
  
  // Initialize Webex SDK
  const sdkInitialized = await setupWebexSDK();
  
  if (sdkInitialized) {
    console.log('✅ Application ready with Webex SDK');
  } else {
    console.log('⚠️ Application running with mock implementation');
  }
  
  // Initialize the rest of the app
  initializeApp();
});

// Initialize app
function initializeApp() {
  console.log('Initializing app...');
  
  // Test button existence
  const createBtn = document.querySelector('.create-btn');
  if (createBtn) {
    console.log('✅ Create button found');
  } else {
    console.error('✗ Create button NOT found');
  }
  
  // Test function existence
  if (typeof window.createMeeting === 'function') {
    console.log('✅ createMeeting function is available');
  } else {
    console.error('✗ createMeeting function is NOT available');
  }
  
  if (typeof window.joinMeeting === 'function') {
    console.log('✅ joinMeeting function is available');
  } else {
    console.error('✗ joinMeeting function is NOT available');
  }
  
  console.log('App initialization complete');
}

console.log('All functions defined successfully!');

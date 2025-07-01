// Full-featured Webex Annotator JavaScript
console.log('JavaScript file loaded successfully!');

// Mock webex object for testing (simulates real Webex SDK)
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

let currentMeeting = null;
let createdMeetingInfo = null;

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
    
    // Show meeting info card with animation
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
        // For testing, show a gradient background to simulate video
        if (videoElement) {
          videoElement.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
          videoElement.style.display = 'block';
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
        // For testing, show a different gradient to distinguish from regular join
        if (videoElement) {
          videoElement.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
          videoElement.style.display = 'block';
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
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else {
      // Fallback for older browsers
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      document.execCommand('copy');
    }
    
    console.log('Copied to clipboard:', input.value);
    
    // Visual feedback
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z" fill="currentColor"/>
        </svg>
      `;
      
      // Reset after 2 seconds
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert('Failed to copy to clipboard. Please try selecting and copying manually.');
  }
};

// Helper Functions
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

function resetJoinCreatedButton() {
  const joinCreatedBtn = document.querySelector('.join-created-btn');
  if (joinCreatedBtn) {
    joinCreatedBtn.classList.remove('loading');
    joinCreatedBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 8V6C15 3.79086 13.2091 2 11 2H9C6.79086 2 5 3.79086 5 6V8M3 10C3 8.89543 3.89543 8 5 8H15C16.1046 8 17 8.89543 17 10V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    Join Your Meeting
  `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, page is ready!');
  
  // Test button existence
  const createBtn = document.querySelector('.create-btn');
  const joinBtn = document.querySelector('.join-btn');
  
  if (createBtn) console.log('✓ Create button found');
  if (joinBtn) console.log('✓ Join button found');
  
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
  
  if (typeof window.copyToClipboard === 'function') {
    console.log('✓ copyToClipboard function is available');
  } else {
    console.error('✗ copyToClipboard function is NOT available');
  }
});

console.log('All functions defined successfully!');

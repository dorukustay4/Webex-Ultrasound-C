// Full-featured Webex Annotator
console.log('JavaScript loaded!');

// Mock Webex SDK
const webex = {
  meetings: {
    create: async function(destination) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (destination) {
        return {
          id: 'mock-' + Math.random().toString(36).substr(2, 9),
          sipUri: 'mock@example.webex.com',
          join: async function() {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Joined meeting:', destination);
          },
          on: function(event, callback) {
            setTimeout(() => {
              if (event === 'media:ready') {
                callback({ type: 'remoteVideo', stream: null });
              }
            }, 2000);
          }
        };
      } else {
        const meetingId = Math.random().toString(36).substr(2, 9);
        return {
          id: meetingId,
          sipUri: meetingId + '@example.webex.com',
          meetingInfo: { meetingLink: 'https://meet.webex.com/meet/' + meetingId },
          meetingNumber: meetingId.substring(0, 10).toUpperCase()
        };
      }
    }
  }
};

let currentMeeting = null;
let createdMeetingInfo = null;

// Create Meeting
window.createMeeting = async function () {
  console.log('Creating meeting...');
  
  const createBtn = document.querySelector('.create-btn');
  const meetingInfoCard = document.getElementById('meeting-info');
  
  if (!createBtn) return;
  
  createBtn.classList.add('loading');
  createBtn.innerHTML = '<span>Creating Meeting...</span>';
  
  try {
    const meeting = await webex.meetings.create();
    
    const meetingInfo = {
      id: meeting.id,
      sipUri: meeting.sipUri,
      meetingLink: meeting.meetingInfo.meetingLink,
      meetingNumber: meeting.meetingNumber
    };
    
    createdMeetingInfo = meetingInfo;
    
    // Update UI
    document.getElementById('meeting-link').value = meetingInfo.meetingLink;
    document.getElementById('meeting-id').value = meetingInfo.meetingNumber;
    document.getElementById('meeting-sip').value = meetingInfo.sipUri;
    
    meetingInfoCard.style.display = 'block';
    
    createBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
      </svg>
      Meeting Created
    `;
    createBtn.classList.remove('loading');
    
  } catch (error) {
    console.error('Failed to create meeting:', error);
    resetCreateButton();
    alert('Failed to create meeting');
  }
};

// Join Meeting
window.joinMeeting = async function () {
  console.log('Joining meeting...');
  
  const joinBtn = document.querySelector('.join-btn');
  const videoElement = document.getElementById('remote-video');
  const placeholder = document.querySelector('.video-placeholder');
  
  if (!joinBtn) return;
  
  joinBtn.classList.add('loading');
  joinBtn.innerHTML = '<span>Connecting...</span>';
  
  try {
    const destination = prompt('Enter Meeting Link or SIP:');
    if (!destination) {
      resetJoinButton();
      return;
    }

    const meeting = await webex.meetings.create(destination);
    await meeting.join();
    currentMeeting = meeting;

    meeting.on('media:ready', (media) => {
      if (media.type === 'remoteVideo') {
        videoElement.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        videoElement.classList.add('active');
        placeholder.classList.add('hidden');
      }
    });

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
    alert('Failed to join meeting');
  }
};

// Join Created Meeting
window.joinCreatedMeeting = async function () {
  console.log('Joining created meeting...');
  
  if (!createdMeetingInfo) {
    alert('No meeting created yet. Please create a meeting first.');
    return;
  }
  
  const joinCreatedBtn = document.querySelector('.join-created-btn');
  const videoElement = document.getElementById('remote-video');
  const placeholder = document.querySelector('.video-placeholder');
  
  if (!joinCreatedBtn) return;
  
  joinCreatedBtn.classList.add('loading');
  joinCreatedBtn.innerHTML = '<span>Joining...</span>';
  
  try {
    const meeting = await webex.meetings.create(createdMeetingInfo.sipUri);
    await meeting.join();
    currentMeeting = meeting;

    meeting.on('media:ready', (media) => {
      if (media.type === 'remoteVideo') {
        videoElement.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
        videoElement.classList.add('active');
        placeholder.classList.add('hidden');
      }
    });

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
    alert('Failed to join the created meeting');
  }
};

// Copy to Clipboard
window.copyToClipboard = async function (elementId) {
  console.log('Copying:', elementId);
  
  const input = document.getElementById(elementId);
  if (!input) return;
  
  const copyBtn = input.parentElement.querySelector('.copy-btn');
  
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(input.value);
    } else {
      input.select();
      document.execCommand('copy');
    }
    
    console.log('Copied:', input.value);
    
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z" fill="currentColor"/>
        </svg>
      `;
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    }
  } catch (error) {
    console.error('Copy failed:', error);
    alert('Failed to copy');
  }
};

// Reset Functions
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
};

console.log('All functions ready!');

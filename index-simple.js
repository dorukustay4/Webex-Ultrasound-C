// Simple working JavaScript for Webex Annotator
console.log('JavaScript loaded!');

// Create Meeting Function
function createMeeting() {
  console.log('Create meeting clicked!');
  alert('Create Meeting clicked! Function is working.');
}

// Join Meeting Function  
function joinMeeting() {
  console.log('Join meeting clicked!');
  alert('Join Meeting clicked! Function is working.');
}

// Join Created Meeting Function
function joinCreatedMeeting() {
  console.log('Join created meeting clicked!');
  alert('Join Created Meeting clicked! Function is working.');
}

// Copy to Clipboard Function
function copyToClipboard(elementId) {
  console.log('Copy clicked for:', elementId);
  alert('Copy function clicked for: ' + elementId);
}

// Make functions available globally
window.createMeeting = createMeeting;
window.joinMeeting = joinMeeting;
window.joinCreatedMeeting = joinCreatedMeeting;
window.copyToClipboard = copyToClipboard;

console.log('All functions ready!');

// Role Selection JavaScript with State Management
class RoleSelectionState {
  constructor() {
    this.callId = null;
    this.selectedRole = null;
    this.participants = [];
    this.isLoading = false;
    this.roleAvailability = {
      'local-doctor': true,
      'remote-expert': true
    };
    
    this.init();
  }
  
  init() {
    this.extractCallId();
    this.setupEventListeners();
    this.fetchCallParticipants();
  }
  
  // Extract call ID from URL parameters
  extractCallId() {
    const urlParams = new URLSearchParams(window.location.search);
    this.callId = urlParams.get('callId') || 'UW-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('display-call-id').textContent = this.callId;
  }
  
  // Setup event listeners for role selection
  setupEventListeners() {
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const role = card.dataset.role;
        if (!card.classList.contains('disabled')) {
          this.selectRole(role);
        }
      });
    });
  }
  
  // Simulate fetching current participants from the call
  async fetchCallParticipants() {
    this.updateParticipantsStatus('Checking availability...');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate API response - in real implementation, this would be an actual Webex API call
      const mockParticipants = await this.getMockParticipants();
      
      this.participants = mockParticipants;
      this.updateRoleAvailability();
      this.updateParticipantsStatus(`${mockParticipants.length}/2 participants in call`);
      
    } catch (error) {
      console.error('Error fetching participants:', error);
      this.updateParticipantsStatus('Error checking availability');
    }
  }
  
  // Mock API response - replace with actual Webex API integration
  async getMockParticipants() {
    // Simulate different scenarios
    const scenarios = [
      [], // Empty call
      [{ id: '1', role: 'local-doctor', name: 'Dr. Johnson' }], // Local doctor already joined
      [{ id: '2', role: 'remote-expert', name: 'Dr. Martinez' }], // Remote expert already joined
      // Both roles taken scenario would prevent joining
    ];
    
    // Random scenario selection for demo purposes
    const randomScenario = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomScenario];
  }
  
  // Update role availability based on current participants
  updateRoleAvailability() {
    // Reset availability
    this.roleAvailability = {
      'local-doctor': true,
      'remote-expert': true
    };
    
    // Check which roles are taken
    this.participants.forEach(participant => {
      if (participant.role && this.roleAvailability.hasOwnProperty(participant.role)) {
        this.roleAvailability[participant.role] = false;
      }
    });
    
    // Update UI
    Object.keys(this.roleAvailability).forEach(role => {
      this.updateRoleCard(role, this.roleAvailability[role]);
    });
  }
  
  // Update role card visual state
  updateRoleCard(role, isAvailable) {
    const card = document.getElementById(`${role}-card`);
    const status = document.getElementById(`${role}-status`);
    const overlay = document.getElementById(`${role}-overlay`);
    
    if (isAvailable) {
      card.classList.remove('disabled');
      status.textContent = 'Available';
      status.className = 'status-badge available';
      overlay.style.display = 'none';
    } else {
      card.classList.add('disabled');
      status.textContent = 'Taken';
      status.className = 'status-badge taken';
      overlay.style.display = 'flex';
      
      // If this role was selected, deselect it
      if (this.selectedRole === role) {
        this.selectedRole = null;
        this.updateJoinButton();
      }
    }
  }
  
  // Handle role selection
  selectRole(role) {
    if (!this.roleAvailability[role]) {
      this.showTooltip(role);
      return;
    }
    
    // Clear previous selection
    document.querySelectorAll('.role-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Select new role
    this.selectedRole = role;
    document.getElementById(`${role}-card`).classList.add('selected');
    
    this.updateJoinButton();
  }
  
  // Show tooltip explaining why role is disabled
  showTooltip(role) {
    const takenBy = this.participants.find(p => p.role === role);
    const message = takenBy 
      ? `This role is already taken by ${takenBy.name}`
      : 'This role is currently unavailable';
    
    // Create temporary tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'role-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      z-index: 10000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    document.body.appendChild(tooltip);
    
    // Remove tooltip after 3 seconds
    setTimeout(() => {
      document.body.removeChild(tooltip);
    }, 3000);
  }
  
  // Update join button state
  updateJoinButton() {
    const joinBtn = document.getElementById('join-btn');
    if (this.selectedRole) {
      joinBtn.disabled = false;
      joinBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Join as ${this.selectedRole === 'local-doctor' ? 'Local Doctor' : 'Remote Expert'}
      `;
    } else {
      joinBtn.disabled = true;
      joinBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Join Call
      `;
    }
  }
  
  // Update participants status display
  updateParticipantsStatus(status) {
    document.getElementById('participants-status').textContent = status;
  }
  
  // Join call with selected role
  async joinWithRole() {
    if (!this.selectedRole) return;
    
    this.isLoading = true;
    this.showLoadingOverlay(true);
    
    try {
      // Simulate joining call
      await this.simulateJoinCall();
      
      // Store user role for the call session
      sessionStorage.setItem('userRole', this.selectedRole);
      sessionStorage.setItem('callId', this.callId);
      
      // Redirect to call interface
      window.location.href = `index.html?callId=${this.callId}&role=${this.selectedRole}`;
      
    } catch (error) {
      console.error('Error joining call:', error);
      this.showLoadingOverlay(false);
      this.showTooltip('general', 'Failed to join call. Please try again.');
    }
  }
  
  // Simulate call joining process
  async simulateJoinCall() {
    // Simulate API calls for joining
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would:
    // 1. Join the Webex meeting
    // 2. Set user metadata with role
    // 3. Configure media streams based on role
    // 4. Setup role-specific UI components
  }
  
  // Show/hide loading overlay
  showLoadingOverlay(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// Navigation functions
function goBack() {
  window.history.back();
}

function joinWithRole() {
  roleSelection.joinWithRole();
}

// Initialize role selection when page loads
let roleSelection;
document.addEventListener('DOMContentLoaded', () => {
  roleSelection = new RoleSelectionState();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RoleSelectionState };
}

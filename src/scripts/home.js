// Home Page JavaScript
console.log('Home.js loaded successfully!');

// Initialize the home page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Ultrasound Webex Home Page...');
  
  // Check authentication and load user info
  checkAuthAndLoadUser();
  
  // Load upcoming calls
  loadUpcomingCalls();
  
  // Initialize tooltips and other UI elements
  initializeUI();
});

// Check authentication and load user information
function checkAuthAndLoadUser() {
  const authMode = localStorage.getItem('webex_auth_mode');
  
  if (authMode === 'authenticated' && isAuthenticated()) {
    const userInfo = getCurrentUser();
    if (userInfo) {
      displayUserInfo(userInfo);
    }
  } else if (authMode === 'guest') {
    // Show guest mode indicators
    console.log('Running in guest mode');
  } else {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }
}

// Display user information in the sidebar
function displayUserInfo(userInfo) {
  const sidebarUser = document.getElementById('sidebar-user');
  const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarUserName = document.getElementById('sidebar-user-name');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  
  if (sidebarUser && userInfo) {
    sidebarUser.style.display = 'flex';
    
    if (sidebarUserAvatar && userInfo.avatar) {
      sidebarUserAvatar.src = userInfo.avatar;
    }
    
    if (sidebarUserName && userInfo.displayName) {
      sidebarUserName.textContent = userInfo.displayName;
    }
    
    if (sidebarUserEmail && userInfo.emails && userInfo.emails.length > 0) {
      sidebarUserEmail.textContent = userInfo.emails[0];
    }
  }
}

// Load upcoming calls (mock data for now)
function loadUpcomingCalls() {
  const upcomingCallsContainer = document.getElementById('upcoming-calls');
  const noCallsContainer = document.getElementById('no-calls');
  
  // Mock data - in a real app, this would come from an API
  const mockCalls = [
    {
      id: 'call-123',
      title: 'Ultrasound Review Session',
      participants: ['Dr. Sarah Johnson', 'Dr. Mike Chen'],
      time: '2:30 PM',
      date: 'Today',
      type: 'Annotation Session',
      status: 'upcoming'
    },
    {
      id: 'call-456', 
      title: 'Team Consultation',
      participants: ['Medical Team Alpha'],
      time: '4:00 PM',
      date: 'Today',
      type: 'Consultation',
      status: 'upcoming'
    },
    {
      id: 'call-789',
      title: 'Weekly Review',
      participants: ['Dr. Emily Davis'],
      time: '9:00 AM',
      date: 'Tomorrow',
      type: 'Review',
      status: 'scheduled'
    }
  ];
  
  if (mockCalls.length === 0) {
    if (upcomingCallsContainer) upcomingCallsContainer.style.display = 'none';
    if (noCallsContainer) noCallsContainer.style.display = 'block';
  } else {
    if (upcomingCallsContainer) upcomingCallsContainer.style.display = 'block';
    if (noCallsContainer) noCallsContainer.style.display = 'none';
    
    // Generate call items (they're already in the HTML as examples)
    console.log('Loaded', mockCalls.length, 'upcoming calls');
  }
}

// Initialize UI components
function initializeUI() {
  // Add smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Add loading states for buttons
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (!this.disabled) {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
          this.style.transform = '';
        }, 150);
      }
    });
  });
}

// Navigation functions
function startCall() {
  console.log('Starting new call...');
  
  // Add loading state
  const button = event.target.closest('.action-btn');
  const originalText = button.innerHTML;
  button.innerHTML = '<div class="spinner"></div> Starting...';
  
  // Simulate loading
  setTimeout(() => {
    window.location.href = 'index.html?action=create';
  }, 1000);
}

function scheduleCall() {
  console.log('Opening schedule call interface...');
  
  // For now, redirect to call room with schedule action
  // In a real app, this would open a scheduling modal or page
  alert('Schedule Call feature coming soon! This will allow you to create scheduled meetings with specific participants and times.');
}

function joinCall() {
  console.log('Opening join call modal...');
  const modal = document.getElementById('join-call-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Focus on the input field
    const input = document.getElementById('meeting-id');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }
}

function closeJoinModal() {
  const modal = document.getElementById('join-call-modal');
  if (modal) {
    modal.style.display = 'none';
    // Clear the input
    const input = document.getElementById('meeting-id');
    if (input) {
      input.value = '';
    }
  }
}

function joinMeetingById() {
  const input = document.getElementById('meeting-id');
  const meetingId = input ? input.value.trim() : '';
  
  if (!meetingId) {
    alert('Please enter a meeting ID or link');
    return;
  }
  
  console.log('Joining meeting:', meetingId);
  
  // Add loading state
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '<div class="spinner"></div> Joining...';
  
  // Simulate joining
  setTimeout(() => {
    closeJoinModal();
    window.location.href = `index.html?join=${encodeURIComponent(meetingId)}`;
  }, 1000);
}

function joinSpecificCall(callId) {
  console.log('Joining specific call:', callId);
  
  // Add loading state to the button
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = 'Joining...';
  button.disabled = true;
  
  // Simulate joining
  setTimeout(() => {
    window.location.href = `index.html?join=${callId}`;
  }, 1000);
}

// View functions
function viewAllCalls() {
  console.log('Viewing all calls...');
  // In a real app, this would navigate to a comprehensive calls page
  alert('View All Calls feature coming soon! This will show your complete call history and scheduled meetings.');
}

function viewAllActivity() {
  console.log('Viewing all activity...');
  // In a real app, this would navigate to a comprehensive activity page
  alert('View All Activity feature coming soon! This will show your complete activity history and analytics.');
}

// Modal handling
document.addEventListener('click', function(e) {
  // Close modal when clicking outside
  if (e.target.classList.contains('modal')) {
    closeJoinModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Close modal with Escape key
  if (e.key === 'Escape') {
    closeJoinModal();
  }
  
  // Quick actions with keyboard shortcuts
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'n':
        e.preventDefault();
        startCall();
        break;
      case 'j':
        e.preventDefault();
        joinCall();
        break;
      case 's':
        e.preventDefault();
        scheduleCall();
        break;
    }
  }
});

// Sidebar toggle for mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

// Add mobile menu button if not exists
function addMobileMenuButton() {
  if (window.innerWidth <= 768) {
    const header = document.querySelector('.content-header');
    if (header && !document.querySelector('.mobile-menu-btn')) {
      const menuBtn = document.createElement('button');
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      menuBtn.onclick = toggleSidebar;
      header.insertBefore(menuBtn, header.firstChild);
    }
  }
}

// Handle window resize
window.addEventListener('resize', function() {
  addMobileMenuButton();
});

// Initialize mobile menu on load
addMobileMenuButton();

// Smooth animations for dashboard cards
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe dashboard cards for animation
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.dashboard-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });
});

console.log('Home page initialized with keyboard shortcuts: Ctrl+N (new call), Ctrl+J (join), Ctrl+S (schedule)');

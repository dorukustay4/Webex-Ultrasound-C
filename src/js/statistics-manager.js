/**
 * Statistics Manager
 * Centralized statistics calculation and management for the annotation platform
 * Data computed here is used for Chart.js visualizations in the home dashboard
 */

class StatisticsManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  /**
   * Get comprehensive statistics from session data
   * @param {Array} sessions - Array of session objects
   * @returns {Object} Statistics object
   */
  calculateStats(sessions = []) {
    if (!Array.isArray(sessions)) {
      console.warn('StatisticsManager: Invalid sessions data provided');
      return this.getEmptyStats();
    }

    const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'ended');
    
    const stats = {
      // Total counts
      totalSessions: completedSessions.length,
      totalImages: completedSessions.reduce((sum, s) => sum + (s.annotated_images || 0), 0),
      totalAnnotations: completedSessions.reduce((sum, s) => sum + (s.annotations || s.total_annotations || 0), 0),
      
      // Time statistics
      totalSessionTime: completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      averageSessionTime: 0,
      
      // User statistics
      uniqueCollaborators: new Set(completedSessions.map(s => s.attendees || s.doctor_name).filter(Boolean)).size,
      
      // Recent activity (last 7 days)
      recentSessions: 0,
      recentAnnotations: 0,
      
      // Date range
      dateRange: this.getDateRange(completedSessions),
      
      // Last updated
      lastUpdated: new Date().toISOString()
    };

    console.log('StatisticsManager: Calculating total annotated images...');
    const imageBreakdown = completedSessions.map(s => ({
      id: s.id,
      title: s.title,
      annotated_images: s.annotated_images || 0
    }));
    console.log('StatisticsManager: Annotated images per session:', imageBreakdown);
    console.log('StatisticsManager: Total annotated images calculated:', stats.totalImages);

    // Calculate averages
    if (stats.totalSessions > 0) {
      stats.averageSessionTime = Math.round(stats.totalSessionTime / stats.totalSessions);
    }

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSessions = completedSessions.filter(s => {
      const sessionDate = new Date(s.date || s.start_time || s.startTime || s.created_at);
      return sessionDate >= sevenDaysAgo;
    });
    
    stats.recentSessions = recentSessions.length;
    stats.recentAnnotations = recentSessions.reduce((sum, s) => sum + (s.annotations || s.total_annotations || 0), 0);

    return stats;
  }

  /**
   * Get date range from sessions
   */
  getDateRange(sessions) {
    if (sessions.length === 0) return { first: null, last: null };
    
    const dates = sessions.map(s => new Date(s.date || s.start_time || s.startTime || s.created_at))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    
    return {
      first: dates[0]?.toISOString() || null,
      last: dates[dates.length - 1]?.toISOString() || null
    };
  }

  /**
   * Get empty statistics object
   */
  getEmptyStats() {
    return {
      totalSessions: 0,
      totalImages: 0,
      totalAnnotations: 0,
      totalSessionTime: 0,
      averageSessionTime: 0,
      uniqueCollaborators: 0,
      recentSessions: 0,
      recentAnnotations: 0,
      dateRange: { first: null, last: null },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Load sessions from database and calculate stats
   */
  async loadStatsFromDatabase() {
    try {
      if (!window.electronAPI || !window.electronAPI.dbGetSessions) {
        console.warn('StatisticsManager: Database API not available');
        return this.getEmptyStats();
      }

      const result = await window.electronAPI.dbGetSessions();
      
      if (result.success && result.sessions && Array.isArray(result.sessions)) {
        console.log(`StatisticsManager: Loaded ${result.sessions.length} sessions for statistics`);
        return this.calculateStats(result.sessions);
      } else {
        console.warn('StatisticsManager: No sessions found or failed to load');
        return this.getEmptyStats();
      }
    } catch (error) {
      console.error('StatisticsManager: Error loading stats from database:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  formatDuration(ms) {
    if (!ms || ms < 0) return '0m';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format large numbers with appropriate suffixes
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Update statistics display on a page
   * @param {Object} stats - Statistics object
   * @param {Object} selectors - Object mapping stat names to CSS selectors
   */
  updateStatsDisplay(stats, selectors = {}) {
    const defaultSelectors = {
      totalImages: '.stat-value:nth-child(1)',
      totalAnnotations: '.stat-value:nth-child(2)',
      totalSessionTime: '.stat-value:nth-child(3)',
      uniqueCollaborators: '.stat-value:nth-child(4)'
    };

    const finalSelectors = { ...defaultSelectors, ...selectors };

    try {
      // Update Images Annotated
      const imagesEl = document.querySelector('[data-stat="images"] .stat-value') || 
                     document.querySelector(finalSelectors.totalImages);
      if (imagesEl) {
        imagesEl.textContent = this.formatNumber(stats.totalImages);
      }

      // Update Sessions
      const annotationsEl = document.querySelector('[data-stat="annotations"] .stat-value') || 
                           document.querySelector(finalSelectors.totalAnnotations);
      if (annotationsEl) {
        annotationsEl.textContent = this.formatNumber(stats.totalSessions);
      }

      // Update Session Time
      const timeEl = document.querySelector('[data-stat="time"] .stat-value') || 
                    document.querySelector(finalSelectors.totalSessionTime);
      if (timeEl) {
        timeEl.textContent = this.formatDuration(stats.totalSessionTime);
      }

      // Update Collaborators
      const collabEl = document.querySelector('[data-stat="collaborators"] .stat-value') || 
                      document.querySelector(finalSelectors.uniqueCollaborators);
      if (collabEl) {
        collabEl.textContent = stats.uniqueCollaborators;
      }

      console.log('StatisticsManager: Updated statistics display', stats);
    } catch (error) {
      console.error('StatisticsManager: Error updating stats display:', error);
    }
  }

  /**
   * Listen for session updates and refresh stats
   */
  setupStatisticsUpdater(refreshCallback) {
    // Listen for custom events that indicate session updates
    window.addEventListener('sessionCompleted', async () => {
      console.log('StatisticsManager: Session completed, refreshing stats...');
      if (refreshCallback) {
        await refreshCallback();
      }
    });

    window.addEventListener('sessionUpdated', async () => {
      console.log('StatisticsManager: Session updated, refreshing stats...');
      if (refreshCallback) {
        await refreshCallback();
      }
    });

    // Also refresh when the page becomes visible (in case data was updated elsewhere)
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && refreshCallback) {
        console.log('StatisticsManager: Page became visible, refreshing stats...');
        await refreshCallback();
      }
    });
  }
}

// Create global instance
window.statisticsManager = new StatisticsManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatisticsManager;
}

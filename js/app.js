import { initEventListeners, fetchLiveUpdates, loadStories } from './events.js';

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    // Load top stories by default
    loadStories('top');

    // Set up event listeners
    initEventListeners();

    // Set up live updates
    fetchLiveUpdates();
    setInterval(fetchLiveUpdates, 30000); // Update every 30 seconds
});
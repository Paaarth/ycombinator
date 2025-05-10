import { fetchStoryIds, fetchItem, fetchItems, fetchUser, fetchUpdates } from './api.js';
import { showLoading, hideLoading, showError, displayStories, displayComments, displayUserProfile, displaySearchResults, displayUpdates } from './ui.js';

// Current state
let currentStories = [];
let currentStoryIds = [];
let currentPage = 1;
let storiesPerPage = 10;
let currentView = 'top';
let currentStoryId = null;
let currentUserId = null;

// DOM elements
let loadMoreButton = document.getElementById('load-more');
let searchForm = document.getElementById('search-form');
let searchInput = document.getElementById('search-input');
let topTab = document.getElementById('top-tab');
let newTab = document.getElementById('new-tab');
let bestTab = document.getElementById('best-tab');
let askTab = document.getElementById('ask-tab');
let showTab = document.getElementById('show-tab');
let jobsTab = document.getElementById('jobs-tab');

// Set active tab
function setActiveTab(tab) {
    currentView = tab;
    currentPage = 1;

    // Reset active class on all tabs
    [topTab, newTab, bestTab, askTab, showTab, jobsTab].forEach(t => {
        t.classList.remove('active-tab');
    });

    // Set active class on current tab
    switch (tab) {
        case 'top':
            topTab.classList.add('active-tab');
            break;
        case 'new':
            newTab.classList.add('active-tab');
            break;
        case 'best':
            bestTab.classList.add('active-tab');
            break;
        case 'ask':
            askTab.classList.add('active-tab');
            break;
        case 'show':
            showTab.classList.add('active-tab');
            break;
        case 'jobs':
            jobsTab.classList.add('active-tab');
            break;
    }
}

// Load stories
async function loadStories(type) {
    showLoading();
    setActiveTab(type);

    try {
        currentStoryIds = await fetchStoryIds(type);
        currentStories = [];
        await loadMoreStories();
    } catch (error) {
        showError('Error loading stories. Please try again.');
        console.error('Error loading stories:', error);
    } finally {
        hideLoading();
    }
}

// Load more stories
async function loadMoreStories() {
    showLoading();

    try {
        let startIdx = (currentPage - 1) * storiesPerPage;
        let endIdx = Math.min(startIdx + storiesPerPage, currentStoryIds.length);

        let newStories = await fetchItems(currentStoryIds.slice(startIdx, endIdx));
        currentStories = [...currentStories, ...newStories];

        let showLoadMore = endIdx < currentStoryIds.length;
        displayStories(currentStories, showLoadMore);
    } catch (error) {
        showError('Error loading more stories. Please try again.');
        console.error('Error loading more stories:', error);
    } finally {
        hideLoading();
    }
}

// Load comments
async function loadComments(storyId) {
    showLoading();

    try {
        let story = await fetchItem(storyId);
        let commentIds = story.kids || [];
        let comments = await fetchItems(commentIds, 20);

        displayComments(story, comments);
    } catch (error) {
        showError('Error loading comments. Please try again.');
        console.error('Error loading comments:', error);
    } finally {
        hideLoading();
    }
}

// Load user profile
async function loadUserProfile(userId) {
    showLoading();

    try {
        let user = await fetchUser(userId);
        displayUserProfile(user);
    } catch (error) {
        showError('Error loading user profile. Please try again.');
        console.error('Error loading user profile:', error);
    } finally {
        hideLoading();
    }
}

// Search stories and users
async function searchStoriesAndUsers(query) {
    showLoading();

    try {
        // First try to fetch as a user
        try {
            let user = await fetchUser(query);
            if (user && user.id) {
                displayUserProfile(user);
                return;
            }
        } catch (e) {
            // Not a user, continue with story search
        }

        // If not a user, search in the latest stories
        let maxItemId = await fetchMaxItem();
        let searchResults = [];
        let searchLimit = 100;

        for (let i = 0; i < searchLimit; i++) {
            let itemId = maxItemId - i;
            let item = await fetchItem(itemId);

            if (item && !item.deleted && !item.dead) {
                let matches = (
                    (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
                    (item.text && item.text.toLowerCase().includes(query.toLowerCase())) ||
                    (item.by && item.by.toLowerCase().includes(query.toLowerCase()))
                );

                if (matches) {
                    searchResults.push(item);
                    if (searchResults.length >= 10) break;
                }
            }
        }

        displaySearchResults(query, searchResults);
    } catch (error) {
        showError('Error performing search. Please try again.');
        console.error('Error searching:', error);
    } finally {
        hideLoading();
    }
}

// Fetch live updates
async function fetchLiveUpdates() {
    try {
        let updates = await fetchUpdates();
        displayUpdates(updates);
    } catch (error) {
        console.error('Error fetching updates:', error);
    }
}

// Initialize event listeners
function initEventListeners() {
    // Tab click handlers
    topTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('top');
    });

    newTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('new');
    });

    bestTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('best');
    });

    askTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('ask');
    });

    showTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('show');
    });

    jobsTab.addEventListener('click', (e) => {
        e.preventDefault();
        loadStories('jobs');
    });

    // Load more button
    loadMoreButton.addEventListener('click', () => {
        currentPage++;
        loadMoreStories();
    });

    // Search form
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let query = searchInput.value.trim();
        if (query) {
            searchStoriesAndUsers(query);
        }
    });

    // Delegate events for dynamically added elements
    document.addEventListener('click', (e) => {
        // User links
        if (e.target.classList.contains('user-link')) {
            e.preventDefault();
            let username = e.target.getAttribute('data-user');
            loadUserProfile(username);
        }

        // Comments links
        if (e.target.classList.contains('comments-link')) {
            e.preventDefault();
            let storyId = e.target.getAttribute('data-story');
            loadComments(storyId);
        }

        // Item links (from updates)
        if (e.target.classList.contains('item-link')) {
            e.preventDefault();
            let itemId = e.target.getAttribute('data-item');
            fetchItem(itemId).then(item => {
                if (item.type === 'comment') {
                    loadComments(item.parent);
                } else {
                    // Display as a single story
                    displayStories([item], false);
                }
            });
        }
    });
}

export { initEventListeners, fetchLiveUpdates, loadStories };
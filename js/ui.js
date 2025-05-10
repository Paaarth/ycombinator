import { timeAgo, truncateText, getDomain } from './utils.js';
import { fetchItem, fetchItems, fetchUser } from './api.js';

// DOM elements
let loadingElement = document.getElementById('loading');
let storiesContainer = document.getElementById('stories-container');
let commentsContainer = document.getElementById('comments-container');
let userContainer = document.getElementById('user-container');
let searchResults = document.getElementById('search-results');
let loadMoreButton = document.getElementById('load-more');
let updatesContainer = document.getElementById('updates-container');

// Show loading state
function showLoading() {
    loadingElement.style.display = 'block';
    storiesContainer.style.display = 'none';
    commentsContainer.style.display = 'none';
    userContainer.style.display = 'none';
    searchResults.style.display = 'none';
    loadMoreButton.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Show error message
function showError(message) {
    loadingElement.innerHTML = `<p class="text-danger">${message}</p>`;
}

// Reset UI containers
function resetContainers() {
    storiesContainer.innerHTML = '';
    commentsContainer.innerHTML = '';
    userContainer.innerHTML = '';
    searchResults.innerHTML = '';
}

// Display stories
function displayStories(stories, showLoadMore = false) {
    resetContainers();

    if (stories.length === 0) {
        storiesContainer.innerHTML = '<p>No stories found.</p>';
        return;
    }

    stories.forEach((story, index) => {
        if (story.error) {
            storiesContainer.innerHTML += `<div class="story-card">Error loading story</div>`;
            return;
        }

        let storyElement = document.createElement('div');
        storyElement.className = 'story-card';
        storyElement.innerHTML = `
            <div class="d-flex align-items-start">
                <span class="text-muted me-2">${index + 1}.</span>
                <div>
                    <a href="${story.url || '#'}" class="story-title" target="_blank" rel="noopener">${story.title}</a>
                    ${story.url ? `<div class="story-url">${getDomain(story.url)}</div>` : ''}
                    <div class="story-meta mt-1">
                        ${story.score || 0} points by 
                        <a href="#" class="user-link" data-user="${story.by}">${story.by}</a> 
                        ${timeAgo(story.time)} | 
                        <a href="#" class="comments-link" data-story="${story.id}">${story.descendants || 0} comments</a>
                    </div>
                    ${story.text ? `<div class="story-text mt-2">${truncateText(story.text, 200)}</div>` : ''}
                </div>
            </div>
        `;

        storiesContainer.appendChild(storyElement);
    });

    storiesContainer.style.display = 'block';
    loadMoreButton.style.display = showLoadMore ? 'block' : 'none';
}

// Display comments
async function displayComments(story, comments) {
    resetContainers();

    // Story header
    let storyHeader = document.createElement('div');
    storyHeader.className = 'story-card mb-4';
    storyHeader.innerHTML = `
        <h4>${story.title}</h4>
        <div class="story-meta mt-1">
            ${story.score || 0} points by 
            <a href="#" class="user-link" data-user="${story.by}">${story.by}</a> 
            ${timeAgo(story.time)}
        </div>
        ${story.text ? `<div class="story-text mt-2">${story.text}</div>` : ''}
        <div class="mt-2"><strong>${comments.length} comments</strong></div>
    `;
    commentsContainer.appendChild(storyHeader);

    // Comments
    if (comments.length === 0) {
        commentsContainer.innerHTML += '<p>No comments yet.</p>';
        return;
    }

    for (let comment of comments) {
        if (comment.deleted || comment.dead) continue;

        // Fetch any nested comments
        let nestedComments = [];
        if (comment.kids && comment.kids.length > 0) {
            nestedComments = await fetchItems(comment.kids, 5);
        }

        let commentElement = document.createElement('div');
        commentElement.className = 'comment mb-3';
        commentElement.innerHTML = `
            <div class="comment-meta">
                <a href="#" class="user-link" data-user="${comment.by}">${comment.by}</a> 
                ${timeAgo(comment.time)}
            </div>
            <div class="comment-text">${comment.text || '[comment deleted]'}</div>
        `;

        commentsContainer.appendChild(commentElement);

        // Add nested comments
        if (nestedComments.length > 0) {
            let nestedContainer = document.createElement('div');
            nestedContainer.className = 'ms-4 mt-2';
            nestedComments.forEach(nested => {
                if (nested.deleted || nested.dead) return;
                nestedContainer.innerHTML += `
                    <div class="comment mb-2">
                        <div class="comment-meta">
                            <a href="#" class="user-link" data-user="${nested.by}">${nested.by}</a> 
                            ${timeAgo(nested.time)}
                        </div>
                        <div class="comment-text">${nested.text || '[comment deleted]'}</div>
                    </div>
                `;
            });
            commentsContainer.appendChild(nestedContainer);
        }
    }

    commentsContainer.style.display = 'block';
}

// Display user profile
async function displayUserProfile(user) {
    resetContainers();

    if (user.error) {
        userContainer.innerHTML = `<p>Error loading user profile.</p>`;
        userContainer.style.display = 'block';
        return;
    }

    let userElement = document.createElement('div');
    userElement.className = 'user-profile';
    userElement.innerHTML = `
        <h3>${user.id}</h3>
        <div class="mb-3">
            <span class="badge bg-primary">Karma: ${user.karma || 0}</span>
            <span class="ms-2">Member since ${new Date(user.created * 1000).toLocaleDateString()}</span>
        </div>
        ${user.about ? `<div class="mb-3">${user.about}</div>` : ''}
        <h5 class="mt-4">Submissions (${user.submitted ? user.submitted.length : 0})</h5>
        <div id="user-submissions" class="mt-3">Loading submissions...</div>
    `;
    userContainer.appendChild(userElement);

    // Load user submissions
    if (user.submitted && user.submitted.length > 0) {
        let submissions = await fetchItems(user.submitted, 10);
        displayUserSubmissions(submissions);
    } else {
        document.getElementById('user-submissions').innerHTML = '<p>No submissions found.</p>';
    }

    userContainer.style.display = 'block';
}

// Display user submissions
function displayUserSubmissions(submissions) {
    let submissionsContainer = document.getElementById('user-submissions');
    if (!submissionsContainer) return;

    submissionsContainer.innerHTML = '';

    if (submissions.length === 0) {
        submissionsContainer.innerHTML = '<p>No submissions found.</p>';
        return;
    }

    submissions.forEach(submission => {
        if (submission.deleted || submission.dead) return;

        let submissionElement = document.createElement('div');
        submissionElement.className = 'mb-3';

        if (submission.type === 'comment') {
            submissionElement.innerHTML = `
                <div class="comment-meta">
                    Comment on ${timeAgo(submission.time)}
                </div>
                <div class="comment-text">${truncateText(submission.text || '', 200)}</div>
                <a href="#" class="comments-link" data-story="${submission.parent}">View thread</a>
            `;
        } else {
            submissionElement.innerHTML = `
                <div>
                    <a href="${submission.url || '#'}" class="story-title" target="_blank" rel="noopener">${submission.title || '[no title]'}</a>
                    ${submission.url ? `<div class="story-url">${getDomain(submission.url)}</div>` : ''}
                    <div class="story-meta mt-1">
                        ${submission.score || 0} points | 
                        ${timeAgo(submission.time)} | 
                        <a href="#" class="comments-link" data-story="${submission.id}">${submission.descendants || 0} comments</a>
                    </div>
                </div>
            `;
        }

        submissionsContainer.appendChild(submissionElement);
    });
}

// Display search results
function displaySearchResults(query, results) {
    resetContainers();

    if (results.length === 0) {
        searchResults.innerHTML = `<p>No results found for "${query}".</p>`;
        searchResults.style.display = 'block';
        return;
    }

    searchResults.innerHTML = `<h4>Search results for "${query}"</h4>`;

    results.forEach(item => {
        let itemElement = document.createElement('div');
        itemElement.className = 'story-card mb-3';

        if (item.type === 'comment') {
            itemElement.innerHTML = `
                <div class="comment-meta">
                    Comment by <a href="#" class="user-link" data-user="${item.by}">${item.by}</a> 
                    ${timeAgo(item.time)}
                </div>
                <div class="comment-text">${truncateText(item.text || '', 200)}</div>
                <a href="#" class="comments-link" data-story="${item.parent}">View thread</a>
            `;
        } else {
            itemElement.innerHTML = `
                <div>
                    <a href="${item.url || '#'}" class="story-title" target="_blank" rel="noopener">${item.title || '[no title]'}</a>
                    ${item.url ? `<div class="story-url">${getDomain(item.url)}</div>` : ''}
                    <div class="story-meta mt-1">
                        ${item.score || 0} points by 
                        <a href="#" class="user-link" data-user="${item.by}">${item.by}</a> 
                        ${timeAgo(item.time)} | 
                        <a href="#" class="comments-link" data-story="${item.id}">${item.descendants || 0} comments</a>
                    </div>
                    ${item.text ? `<div class="story-text mt-2">${truncateText(item.text, 200)}</div>` : ''}
                </div>
            `;
        }

        searchResults.appendChild(itemElement);
    });

    searchResults.style.display = 'block';
}

// Display live updates
function displayUpdates(updates) {
    if (!updatesContainer) return;

    let updatesHTML = '';

    if (updates.items && updates.items.length > 0) {
        updatesHTML += '<h6>Updated Items</h6><ul class="list-unstyled">';
        for (let i = 0; i < Math.min(5, updates.items.length); i++) {
            updatesHTML += `<li><a href="#" class="item-link" data-item="${updates.items[i]}">Item ${updates.items[i]}</a></li>`;
        }
        updatesHTML += '</ul>';
    }

    if (updates.profiles && updates.profiles.length > 0) {
        updatesHTML += '<h6 class="mt-3">Updated Profiles</h6><ul class="list-unstyled">';
        for (let i = 0; i < Math.min(5, updates.profiles.length); i++) {
            updatesHTML += `<li><a href="#" class="user-link" data-user="${updates.profiles[i]}">${updates.profiles[i]}</a></li>`;
        }
        updatesHTML += '</ul>';
    }

    if (updatesHTML) {
        updatesContainer.innerHTML = updatesHTML;
    }
}

export {
    showLoading,
    hideLoading,
    showError,
    displayStories,
    displayComments,
    displayUserProfile,
    displaySearchResults,
    displayUpdates
};
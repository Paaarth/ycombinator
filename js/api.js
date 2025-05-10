import { getDomain } from './utils.js';

let HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// Fetch a single item by ID
async function fetchItem(id) {
    try {
        let response = await fetch(`${HN_API_BASE}/item/${id}.json`);
        if (!response.ok) throw new Error('Failed to fetch item');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching item ${id}:`, error);
        return { id, error: true };
    }
}

// Fetch multiple items by IDs
async function fetchItems(ids, limit = 10) {
    try {
        let itemsToFetch = ids.slice(0, limit);
        let promises = itemsToFetch.map(id => fetchItem(id));
        return await Promise.all(promises);
    } catch (error) {
        console.error('Error fetching items:', error);
        return [];
    }
}

// Fetch story IDs by type
async function fetchStoryIds(type = 'top') {
    try {
        let endpoint = {
            top: 'topstories',
            new: 'newstories',
            best: 'beststories',
            ask: 'askstories',
            show: 'showstories',
            jobs: 'jobstories'
        }[type] || 'topstories';

        let response = await fetch(`${HN_API_BASE}/${endpoint}.json`);
        if (!response.ok) throw new Error('Failed to fetch story IDs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching story IDs:', error);
        return [];
    }
}

// Fetch user profile
async function fetchUser(userId) {
    try {
        let response = await fetch(`${HN_API_BASE}/user/${userId}.json`);
        if (!response.ok) throw new Error('Failed to fetch user');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
        return { id: userId, error: true };
    }
}

// Fetch max item ID
async function fetchMaxItem() {
    try {
        let response = await fetch(`${HN_API_BASE}/maxitem.json`);
        if (!response.ok) throw new Error('Failed to fetch max item');
        return await response.json();
    } catch (error) {
        console.error('Error fetching max item:', error);
        return 0;
    }
}

// Fetch updates
async function fetchUpdates() {
    try {
        let response = await fetch(`${HN_API_BASE}/updates.json`);
        if (!response.ok) throw new Error('Failed to fetch updates');
        return await response.json();
    } catch (error) {
        console.error('Error fetching updates:', error);
        return { items: [], profiles: [] };
    }
}

export {
    fetchItem,
    fetchItems,
    fetchStoryIds,
    fetchUser,
    fetchMaxItem,
    fetchUpdates
};
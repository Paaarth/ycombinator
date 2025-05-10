// Helper function to format time as "time ago"
function timeAgo(timestamp) {
    let seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;

    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';

    // Remove HTML tags
    let div = document.createElement('div');
    div.innerHTML = text;
    let plainText = div.textContent || div.innerText || '';

    if (plainText.length <= maxLength) return text;
    return `${plainText.substring(0, maxLength)}...`;
}

// Helper to extract domain from URL
function getDomain(url) {
    if (!url) return '';
    try {
        let urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
}

export { timeAgo, truncateText, getDomain };
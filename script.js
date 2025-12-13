// --- Server Status and Copy IP Script ---

// *** IMPORTANT: CHANGE THIS TO YOUR ACTUAL SERVER IP/DOMAIN ***
const serverIP = 'sequence.playmc.cloud';

// Function to fetch and display the server status using MCAPI.us
function fetchServerStatus() {
    // We're using a free API proxy to fetch the status
    const apiUrl = `https://api.mcapi.us/v1/server/status?ip=${serverIP}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const playerCountElement = document.getElementById('player-count');

            if (data.online) {
                // Server is online, display current/max players
                playerCountElement.textContent = `${data.players.now} / ${data.players.max}`;
                playerCountElement.style.color = 'var(--color-accent)'; // Greenish/Yellow for online
            } else {
                // Server is offline
                playerCountElement.textContent = 'Server is currently Offline.';
                playerCountElement.style.color = 'var(--color-secondary-accent)'; // Orange/Red for offline
            }
        })
        .catch(error => {
            console.error('Error fetching server status:', error);
            document.getElementById('player-count').textContent = 'Error loading status.';
            document.getElementById('player-count').style.color = '#ff0000';
        });
}

// Function to copy the IP address to the clipboard
function copyIP() {
    const ip = document.getElementById('server-ip').textContent;
    navigator.clipboard.writeText(ip)
        .then(() => {
            const button = document.getElementById('copy-button');
            const originalText = button.textContent;
            button.textContent = 'COPIED!';

            // Revert button text after a short time
            setTimeout(() => {
                button.textContent = originalText;
            }, 1500);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert(`Error: Please manually copy the IP: ${ip}`);
        });
}

// --- Initialization ---

// Set the IP address span content (in case the API fails)
document.getElementById('server-ip').textContent = serverIP;

// Call the function once when the page loads
fetchServerStatus();

// Optional: Refresh the status every 60 seconds
setInterval(fetchServerStatus, 60000);
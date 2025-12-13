/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com"; 
const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

/* --- TAB SWITCHING LOGIC --- */
function openTab(tabName) {
    var allTabs = document.getElementsByClassName("tab-content");
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].style.display = "none";
        allTabs[i].classList.remove("fade-in");
    }

    var navButtons = document.getElementsByClassName("nav-btn");
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active-link");
    }

    var selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = "block";
        void selectedTab.offsetWidth; 
        selectedTab.classList.add("fade-in");
    }
    
    if(event && event.currentTarget) {
        event.currentTarget.classList.add("active-link");
    }
}

/* --- LIGHTBOX (GALLERY ZOOM) LOGIC --- */
window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL ELEMENTS ---
    const playerText = document.getElementById('player-text');
    const statusDot = document.querySelector('.status-dot');
    const playerTooltip = document.getElementById('player-list-tooltip');
    const ipTextElement = document.getElementById('server-ip');
    
    // --- AUDIO SYSTEM ELEMENTS ---
    const audioPlayer = document.getElementById('audio-player');
    const nowPlayingText = document.getElementById('now-playing-text');
    let ws;
    let isManualDisconnect = false;

    // --- 1. SERVER STATUS (PLAYER COUNT & LIST) ---
    function updateServerStatus() {
        if (!playerText) return;

        fetch(SERVER_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.online) {
                    // 1. Update Count Text
                    playerText.innerText = `${data.players.online} / ${data.players.max}`;
                    statusDot.style.backgroundColor = "#55ff55";
                    statusDot.style.boxShadow = "0 0 5px #55ff55";

                    // 2. Update Player List Tooltip
                    if (data.players.list && data.players.list.length > 0) {
                        let playerHtml = '';
                        data.players.list.forEach(player => {
                            playerHtml += `
                                <div class="player-row">
                                    <img src="https://crafatar.com/avatars/${player.uuid}?size=24&overlay" class="player-head">
                                    <span>${player.name}</span>
                                </div>
                            `;
                        });
                        playerTooltip.innerHTML = playerHtml;
                    } else if (data.players.online > 0) {
                        // Online but player list is hidden by server query settings
                        playerTooltip.innerHTML = `<div style='text-align:center; color:#888;'>${data.players.online} player(s) online.<br>List is private.</div>`;
                    } else {
                         playerTooltip.innerHTML = "<div style='text-align:center; color:#888;'>No players currently online.</div>";
                    }

                } else {
                    // Server Offline
                    playerText.innerText = "Offline";
                    statusDot.style.backgroundColor = "#ff5555";
                    statusDot.style.boxShadow = "0 0 5px #ff5555";
                    playerTooltip.innerHTML = "Server is currently offline.";
                }
            })
            .catch(error => {
                playerText.innerText = "Error";
                playerTooltip.innerHTML = "Could not fetch server status.";
            });
    }

    // Run immediately when page loads
    updateServerStatus();
    // Refresh every 30 seconds
    setInterval(updateServerStatus, 30000);


    // --- 2. COPY IP BUTTON ---
    const copyButton = document.getElementById('copy-btn');
    if (copyButton && ipTextElement) {
        copyButton.addEventListener('click', () => {
            const ipText = ipTextElement.innerText;
            navigator.clipboard.writeText(ipText).then(() => {
                // Button animation logic...
            });
        });
    }


    // --- 3. AUDIO SYSTEM LOGIC ---
    const connectBtn = document.getElementById('connect-audio-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const connectWrapper = document.getElementById('connect-wrapper');
    const playerControls = document.getElementById('player-controls');
    const audioStatus = document.getElementById('audio-status');
    const volumeSlider = document.getElementById('volume-slider');

    if (connectBtn) {
connectBtn.addEventListener('click', async () => {
    connectWrapper.style.display = 'none';
    playerControls.style.display = 'block';

    if (volumeSlider && audioPlayer) {
        audioPlayer.volume = volumeSlider.value;
    }

    // autoplay unlock on user gesture
    try {
        audioPlayer.muted = false;
        audioPlayer.src = "";
        await audioPlayer.play().catch(() => {});
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    } catch {}

    isManualDisconnect = false;
    initWebSocket();
});
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            isManualDisconnect = true; 
            if (ws) ws.close();
            stopAudio();

            playerControls.style.display = 'none';
            connectWrapper.style.display = 'block';
            audioStatus.innerText = "Status: Disconnected";
            audioStatus.style.color = "#888";
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if(audioPlayer) audioPlayer.volume = e.target.value;
        });
    }

    function initWebSocket() {
        if (!audioStatus) return;

        audioStatus.innerText = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerText = "Status: Connected ●";
            audioStatus.style.color = "#55ff55";
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'play') playAudio(data.url, data.text);
                else if (data.action === 'stop') stopAudio();
            } catch (e) { console.error("JSON Error:", e); }
        };

        ws.onclose = () => {
            if (isManualDisconnect) return;
            audioStatus.innerText = "Status: Disconnected (Retrying...)";
            audioStatus.style.color = "#ff5555";
            setTimeout(initWebSocket, 3000); 
        };
    }

    function playAudio(url, text) {
        if (!audioPlayer) return;
        nowPlayingText.innerText = text ? "♫ " + text : "♫ Unknown Track";
        audioPlayer.src = url;
        audioPlayer.play().catch(e => {
            nowPlayingText.innerText = "⚠️ Click to Play";
        });
    }

    function stopAudio() {
        if (!audioPlayer) return;
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        nowPlayingText.innerText = "Waiting for music...";
    }

});

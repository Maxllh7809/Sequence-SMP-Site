// --- CONFIGURATION ---
// IMPORTANT: Change this URL to your backend server URL
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";

// --- TAB SWITCHING LOGIC ---
function openTab(tabName) {
    var x = document.getElementsByClassName("tab-content");
    for (var i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        x[i].classList.remove("fade-in");
    }

    var navButtons = document.getElementsByClassName("nav-btn");
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active-link");
    }

    var tab = document.getElementById(tabName);
    tab.style.display = "block";
    void tab.offsetWidth; // Trigger reflow for animation

    if (event) {
        event.currentTarget.classList.add("active-link");
    }
}

// --- DOM LOADED ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. COPY IP LOGIC
    const copyButton = document.getElementById('copy-btn');
    const ipText = document.getElementById('server-ip').innerText;

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(ipText).then(() => {
                const originalText = copyButton.innerText;
                const originalBg = copyButton.style.background;

                copyButton.innerText = "COPIED!";
                copyButton.style.background = "#55ff55";
                copyButton.style.color = "#000";
                copyButton.style.transform = "scale(1.1)";

                setTimeout(() => {
                    copyButton.innerText = originalText;
                    copyButton.style.background = originalBg;
                    copyButton.style.color = "";
                    copyButton.style.transform = "scale(1)";
                }, 2000);
            });
        });
    }

    // 2. AUDIO CLIENT LOGIC
    const connectBtn = document.getElementById('connect-audio-btn');
    const disconnectBtn = document.getElementById('disconnect-btn'); // New Button
    const connectWrapper = document.getElementById('connect-wrapper');
    const playerControls = document.getElementById('player-controls');
    const audioStatus = document.getElementById('audio-status');
    const audioPlayer = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    const nowPlayingText = document.getElementById('now-playing-text');

    let ws;
    let isManualDisconnect = false; // Flag to prevent auto-reconnect

    // CONNECT BUTTON CLICK
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            // UI Transition
            connectWrapper.style.display = 'none';
            playerControls.style.display = 'block';

            // Set Volume
            audioPlayer.volume = volumeSlider.value;

            // Connect
            isManualDisconnect = false;
            initWebSocket();
        });
    }

    // DISCONNECT BUTTON CLICK
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            isManualDisconnect = true; // Tell system not to retry

            // Close Socket
            if (ws) {
                ws.close();
            }

            // Stop Music
            stopAudio();

            // Reset UI
            playerControls.style.display = 'none';
            connectWrapper.style.display = 'block';
            audioStatus.innerText = "Status: Disconnected";
            audioStatus.style.color = "#888";
        });
    }

    // Volume Control
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
        });
    }

    function initWebSocket() {
        audioStatus.innerText = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerText = "Status: Connected ●";
            audioStatus.style.color = "#55ff55";
            console.log("Audio WS Connected");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.action === 'play') {
                    playAudio(data.url, data.text);
                }
                else if (data.action === 'stop') {
                    stopAudio();
                }
            } catch (e) {
                console.error("Invalid JSON", event.data);
            }
        };

        ws.onclose = () => {
            if (isManualDisconnect) {
                // User clicked disconnect, don't retry
                console.log("Disconnected manually.");
                return;
            }

            // Otherwise, it was an error/timeout, so try again
            audioStatus.innerText = "Status: Disconnected (Retrying...)";
            audioStatus.style.color = "#ff5555";
            setTimeout(initWebSocket, 3000);
        };
    }

    function playAudio(url, text) {
        if (!url) return;

        nowPlayingText.innerText = text ? "♫ " + text : "♫ Unknown Track";
        audioPlayer.src = url;

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Autoplay blocked:", error);
                nowPlayingText.innerText = "⚠️ Autoplay Blocked. Interact with page.";
            });
        }
    }

    function stopAudio() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        nowPlayingText.innerText = "Waiting for music...";
    }
});
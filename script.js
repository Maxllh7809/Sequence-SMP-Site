/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";

/* --- TAB SWITCHING LOGIC (Must be at the top) --- */
function openTab(tabName) {
    console.log("Switching to tab:", tabName); // Debug message

    // 1. Hide all tabs
    var allTabs = document.getElementsByClassName("tab-content");
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].style.display = "none";
        allTabs[i].classList.remove("fade-in");
    }

    // 2. Reset buttons
    var navButtons = document.getElementsByClassName("nav-btn");
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active-link");
    }

    // 3. Show the correct tab
    var selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = "block";
        // Trigger animation
        void selectedTab.offsetWidth;
        selectedTab.classList.add("fade-in");
    } else {
        console.error("Could not find tab with ID:", tabName);
    }

    // 4. Highlight the button
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active-link");
    }
}

/* --- MAIN LOGIC (Runs when page loads) --- */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Website Loaded Successfully");

    // --- VARIABLES ---
    const copyButton = document.getElementById('copy-btn');
    const ipTextElement = document.getElementById('server-ip');

    // Audio Elements
    const connectBtn = document.getElementById('connect-audio-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const connectWrapper = document.getElementById('connect-wrapper');
    const playerControls = document.getElementById('player-controls');
    const audioStatus = document.getElementById('audio-status');
    const audioPlayer = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    const nowPlayingText = document.getElementById('now-playing-text');

    let ws;
    let isManualDisconnect = false;

    // --- 1. COPY IP FUNCTION ---
    if (copyButton && ipTextElement) {
        copyButton.addEventListener('click', () => {
            const ipText = ipTextElement.innerText;
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

    // --- 2. AUDIO: CONNECT ---
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            console.log("Connect button clicked");
            // UI Transition
            connectWrapper.style.display = 'none';
            playerControls.style.display = 'block';

            // Set Volume
            if (volumeSlider && audioPlayer) {
                audioPlayer.volume = volumeSlider.value;
            }

            // Connect
            isManualDisconnect = false;
            initWebSocket();
        });
    }

    // --- 3. AUDIO: DISCONNECT ---
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            console.log("Disconnect button clicked");
            isManualDisconnect = true;

            if (ws) ws.close();
            stopAudio();

            // Reset UI
            playerControls.style.display = 'none';
            connectWrapper.style.display = 'block';
            audioStatus.innerText = "Status: Disconnected";
            audioStatus.style.color = "#888";
        });
    }

    // --- 4. VOLUME CONTROL ---
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (audioPlayer) audioPlayer.volume = e.target.value;
        });
    }

    // --- 5. WEBSOCKET LOGIC ---
    function initWebSocket() {
        if (!audioStatus) return;

        audioStatus.innerText = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerText = "Status: Connected ●";
            audioStatus.style.color = "#55ff55";
            console.log("WebSocket connection established");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'play') playAudio(data.url, data.text);
                else if (data.action === 'stop') stopAudio();
            } catch (e) {
                console.error("JSON Error:", e);
            }
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
            console.error("Autoplay error:", e);
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
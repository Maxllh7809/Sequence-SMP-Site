/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";

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

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active-link");
    }
}

/* --- LIGHTBOX (GALLERY ZOOM) LOGIC --- */
window.closeLightbox = function () {
    document.getElementById('lightbox').style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {

    /* -- 1. SETUP LIGHTBOX CLICK EVENTS -- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const galleryImages = document.querySelectorAll('.gallery-item img');

    galleryImages.forEach(img => {
        img.addEventListener('click', function () {
            lightbox.style.display = "flex";
            lightbox.style.flexDirection = "column";
            lightbox.style.justifyContent = "center";
            lightbox.style.alignItems = "center"; // Centering fix

            lightboxImg.src = this.src;
            lightboxCaption.innerText = this.nextElementSibling ? this.nextElementSibling.innerText : this.alt;
        });
    });

    /* -- 2. COPY IP BUTTON -- */
    const copyButton = document.getElementById('copy-btn');
    const ipTextElement = document.getElementById('server-ip');

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

    /* -- 3. AUDIO SYSTEM -- */
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
                await audioPlayer.play().catch(() => { });
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            } catch { }

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
            if (audioPlayer) audioPlayer.volume = e.target.value;
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
       audioPlayer.play().catch(() => {
  nowPlayingText.innerText = "⚠️ Click to Play";

  const unlock = () => {
    audioPlayer.play();
    nowPlayingText.innerText = "♫ " + (text || "Now playing");
    document.removeEventListener("click", unlock);
  };

  document.addEventListener("click", unlock, { once: true });
});

    }

    function stopAudio() {
        if (!audioPlayer) return;
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        nowPlayingText.innerText = "Waiting for music...";
    }
});
/* --- 4. SERVER STATUS (PLAYER COUNT) --- */
    const playerText = document.getElementById('player-text');
    const statusDot = document.querySelector('.status-dot');
    
    // Using mcsrvstat.us API (free, no key required)
    const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

    function updateServerStatus() {
        if (!playerText) return;

        fetch(SERVER_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.online) {
                    // Server is online
                    playerText.innerText = `${data.players.online} / ${data.players.max}`;
                    statusDot.style.backgroundColor = "#55ff55"; // Green
                    statusDot.style.boxShadow = "0 0 5px #55ff55";
                } else {
                    // Server is offline
                    playerText.innerText = "Offline";
                    statusDot.style.backgroundColor = "#ff5555"; // Red
                    statusDot.style.boxShadow = "0 0 5px #ff5555";
                }
            })
            .catch(error => {
                console.error("Error fetching server status:", error);
                playerText.innerText = "Error";
            });
    }

    // Run immediately when page loads
    updateServerStatus();
    
    // Optional: Refresh every 30 seconds
    setInterval(updateServerStatus, 30000);

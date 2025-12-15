/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";

/* --- TAB SWITCHING LOGIC --- */
function openTab(tabName) {
    const allTabs = document.getElementsByClassName("tab-content");
    for (let tab of allTabs) {
        tab.style.display = "none";
        tab.classList.remove("fade-in");
    }

    const navButtons = document.getElementsByClassName("nav-btn");
    for (let btn of navButtons) btn.classList.remove("active-link");

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = "block";
        void selectedTab.offsetWidth;
        selectedTab.classList.add("fade-in");
    }

    if (event?.currentTarget) event.currentTarget.classList.add("active-link");
}

/* --- LIGHTBOX --- */
window.closeLightbox = () => {
    document.getElementById("lightbox").style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {

    /* --- AUDIO ELEMENTS --- */
    const connectBtn = document.getElementById("connect-audio-btn");
    const disconnectBtn = document.getElementById("disconnect-btn");
    const connectWrapper = document.getElementById("connect-wrapper");
    const playerControls = document.getElementById("player-controls");
    const audioStatus = document.getElementById("audio-status");
    const audioPlayer = document.getElementById("audio-player");
    const volumeSlider = document.getElementById("volume-slider");
    const nowPlayingText = document.getElementById("now-playing-text");
    const visualizer = document.querySelector(".visualizer");

    let ws;
    let isManualDisconnect = false;

    /* --- CONNECT BUTTON --- */
    connectBtn?.addEventListener("click", async () => {
        connectWrapper.style.display = "none";
        playerControls.style.display = "block";

        audioPlayer.volume = volumeSlider?.value ?? 1;

        // 🔓 Unlock autoplay
        try {
            audioPlayer.muted = false;
            await audioPlayer.play().catch(() => { });
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        } catch { }

        visualizer && (visualizer.style.opacity = "0.5");

        isManualDisconnect = false;
        initWebSocket();
    });

    /* --- DISCONNECT BUTTON --- */
    disconnectBtn?.addEventListener("click", () => {
        isManualDisconnect = true;
        ws?.close();
        stopAudio();

        playerControls.style.display = "none";
        connectWrapper.style.display = "block";
        audioStatus.textContent = "Status: Disconnected";
        audioStatus.style.color = "#888";
    });

    /* --- VOLUME --- */
    volumeSlider?.addEventListener("input", e => {
        audioPlayer.volume = e.target.value;
    });

    /* --- WEBSOCKET --- */
    function initWebSocket() {
        audioStatus.textContent = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log("WS connected");
            audioStatus.innerHTML = 'Status: <span style="color:#55ff55">● LIVE</span>';
        };

        ws.onmessage = event => {
            const data = JSON.parse(event.data);
            console.log("WS:", data);

            if (data.action === "play") {
                playAudio(data.url, data.text);
            }

            if (data.action === "stop") {
                stopAudio();
            }

            // 🔥 IMPORTANT FIX: sync from queue state
            if (data.action === "queue" && data.nowPlaying) {
                playAudio(data.nowPlaying.url, data.nowPlaying.text);
            }
        };

        ws.onclose = () => {
            if (isManualDisconnect) return;

            audioStatus.textContent = "Status: Disconnected (Retrying...)";
            audioStatus.style.color = "#ff5555";
            setTimeout(initWebSocket, 3000);
        };
    }

    /* --- QUEUE CONTINUE --- */
    audioPlayer.addEventListener("ended", () => {
        ws?.readyState === WebSocket.OPEN &&
            ws.send(JSON.stringify({ action: "ended", url: audioPlayer.src }));
    });

    /* --- PLAY AUDIO (FIXED) --- */
    function playAudio(url, text) {
        if (!url) return;

        const sameTrack = audioPlayer.src === url;

        nowPlayingText.textContent = "♫ " + (text || "Now playing");
        nowPlayingText.style.color = "#55ff55";
        visualizer && (visualizer.style.opacity = "1");

        if (!sameTrack) {
            audioPlayer.src = url;
            audioPlayer.load();
        }

        audioPlayer.play().catch(() => {
            nowPlayingText.textContent = "⚠️ Click to Play";
            nowPlayingText.style.color = "#ffaa00";

            document.addEventListener("click", () => {
                audioPlayer.play();
                nowPlayingText.textContent = "♫ " + (text || "Now playing");
                nowPlayingText.style.color = "#55ff55";
            }, { once: true });
        });
    }

    /* --- STOP AUDIO --- */
    function stopAudio() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        nowPlayingText.textContent = "Waiting for music...";
        nowPlayingText.style.color = "#ffaa00";
        visualizer && (visualizer.style.opacity = "0.3");
    }
});

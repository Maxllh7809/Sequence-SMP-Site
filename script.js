/* ================= CONFIG ================= */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";
const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

/* ================= TAB SWITCHING ================= */
function openTab(tabName) {
    const tabs = document.getElementsByClassName("tab-content");
    for (let tab of tabs) {
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

/* ================= LIGHTBOX ================= */
window.closeLightbox = () => {
    document.getElementById("lightbox").style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {

    /* ================= LIGHTBOX LOGIC ================= */
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");

    document.querySelectorAll(".gallery-item img").forEach(img => {
        img.addEventListener("click", () => {
            lightbox.style.display = "flex";
            lightboxImg.src = img.src;
            lightboxCaption.innerText =
                img.nextElementSibling?.innerText || img.alt;
        });
    });

    /* ================= COPY IP ================= */
    const copyButton = document.getElementById("copy-btn");
    const ipTextElement = document.getElementById("server-ip");

    copyButton?.addEventListener("click", () => {
        navigator.clipboard.writeText(ipTextElement.innerText);
        const original = copyButton.innerText;
        copyButton.innerText = "COPIED!";
        setTimeout(() => copyButton.innerText = original, 2000);
    });

    /* ================= AUDIO SYSTEM ================= */
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

    connectBtn?.addEventListener("click", async () => {
        connectWrapper.style.display = "none";
        playerControls.style.display = "block";

        audioPlayer.volume = volumeSlider?.value ?? 1;

        // 🔓 Unlock autoplay
        try {
            await audioPlayer.play().catch(() => {});
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        } catch {}

        isManualDisconnect = false;
        initWebSocket();
    });

    disconnectBtn?.addEventListener("click", () => {
        isManualDisconnect = true;
        ws?.close();
        stopAudio();
        playerControls.style.display = "none";
        connectWrapper.style.display = "block";
        audioStatus.innerText = "Status: Disconnected";
    });

    volumeSlider?.addEventListener("input", e => {
        audioPlayer.volume = e.target.value;
    });

    function initWebSocket() {
        audioStatus.innerText = "Status: Connecting...";
        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerHTML =
                'Status: <span style="color:#55ff55">● LIVE</span>';
        };

        ws.onmessage = e => {
            const data = JSON.parse(e.data);
            console.log("WS:", data);

            if (data.action === "play")
                playAudio(data.url, data.text);

            if (data.action === "stop")
                stopAudio();

            // 🔥 FIX: sync from queue state
            if (data.action === "queue" && data.nowPlaying)
                playAudio(data.nowPlaying.url, data.nowPlaying.text);
        };

        ws.onclose = () => {
            if (isManualDisconnect) return;
            setTimeout(initWebSocket, 3000);
        };
    }

    audioPlayer?.addEventListener("ended", () => {
        ws?.readyState === WebSocket.OPEN &&
            ws.send(JSON.stringify({
                action: "ended",
                url: audioPlayer.src
            }));
    });

    function playAudio(url, text) {
        if (!url) return;

        const same = audioPlayer.src === url;

        nowPlayingText.innerText = "♫ " + (text || "Now Playing");
        visualizer && (visualizer.style.opacity = "1");

        if (!same) {
            audioPlayer.src = url;
            audioPlayer.load();
        }

        audioPlayer.play().catch(() => {
            nowPlayingText.innerText = "⚠️ Click to Play";
            document.addEventListener("click", () => audioPlayer.play(), { once: true });
        });
    }

    function stopAudio() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        nowPlayingText.innerText = "Waiting for music...";
        visualizer && (visualizer.style.opacity = "0.3");
    }
});

/* ================= SERVER STATUS ================= */
const playerText = document.getElementById("player-text");
const statusDot = document.querySelector(".status-dot");
const playerTooltip = document.getElementById("player-list-tooltip");

function updateServerStatus() {
    fetch(SERVER_API_URL)
        .then(r => r.json())
        .then(data => {
            if (data.online) {
                playerText.innerText = `${data.players.online} / ${data.players.max}`;
                statusDot.style.background = "#55ff55";

                playerTooltip.innerHTML = data.players.list?.length
                    ? data.players.list.map(p => `
                        <div class="player-row">
                            <img src="https://crafatar.com/avatars/${p.uuid}?size=24&overlay">
                            ${p.name}
                        </div>
                      `).join("")
                    : "No players online";
            } else {
                playerText.innerText = "Offline";
                statusDot.style.background = "#ff5555";
            }
        });
}

updateServerStatus();
setInterval(updateServerStatus, 30000);

/* ================= MODALS ================= */
const rulesModal = document.getElementById("rules-modal");
const modalTitle = document.getElementById("modal-rule-title");
const modalImage = document.getElementById("modal-rule-image");
const modalDesc = document.getElementById("modal-rule-description");
const closeModalBtn = document.querySelector(".close-modal-btn");

function openInfoModal(title, desc, img = null) {
    modalTitle.innerText = title;
    modalDesc.innerHTML = desc;
    modalImage.style.display = img ? "block" : "none";
    modalImage.src = img || "";
    rulesModal.style.display = "flex";
}

function closeRuleModal() {
    rulesModal.style.display = "none";
}

document.querySelectorAll(".rule-trigger").forEach(el =>
    el.addEventListener("click", () =>
        openInfoModal(el.dataset.title, el.dataset.description, el.dataset.image)
    )
);

document.querySelectorAll(".command-trigger").forEach(el =>
    el.addEventListener("click", () =>
        openInfoModal(el.dataset.title, el.dataset.desc)
    )
);

closeModalBtn?.addEventListener("click", closeRuleModal);
window.addEventListener("click", e => {
    if (e.target === rulesModal) closeRuleModal();
});

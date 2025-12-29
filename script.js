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

/* -- 1. SETUP LIGHTBOX CLICK EVENTS (BULLETPROOF VERSION) -- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    // We use 'document.addEventListener' to catch clicks on elements 
    // that might be cloned or animated by the scrolling effect.
    document.addEventListener('click', function (e) {
        // 1. Check if the user clicked inside a gallery item
        const item = e.target.closest('.gallery-item');

        // 2. If they did, and the lightbox exists...
        if (item && lightbox && lightboxImg) {
            const img = item.querySelector('img');
            const caption = item.querySelector('.caption');

            if (img) {
                lightbox.style.display = "flex";
                lightbox.style.flexDirection = "column";
                lightbox.style.justifyContent = "center";
                lightbox.style.alignItems = "center";

                // Set image and caption
                lightboxImg.src = img.src;
                if (caption) {
                    lightboxCaption.innerText = caption.innerText;
                } else {
                    lightboxCaption.innerText = "Gallery Image";
                }
            }
        }
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

    /* -- 3. AUDIO SYSTEM (WITH VOLUME MEMORY) -- */
    const connectBtn = document.getElementById('connect-audio-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const connectWrapper = document.getElementById('connect-wrapper');
    const playerControls = document.getElementById('player-controls');
    const audioStatus = document.getElementById('audio-status');
    const audioPlayer = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    const nowPlayingText = document.getElementById('now-playing-text');

    // Add visualizer selection if you have it in HTML
    const visualizer = document.querySelector('.visualizer');

    let ws;
    let isManualDisconnect = false;

    // A. Connect Button
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            connectWrapper.style.display = 'none';
            playerControls.style.display = 'block';

            // Apply volume immediately upon connection
            if (volumeSlider && audioPlayer) {
                audioPlayer.volume = volumeSlider.value;
            }

            // Autoplay unlock
            try {
                audioPlayer.muted = false;
                audioPlayer.src = "";
                await audioPlayer.play().catch(() => { });
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            } catch { }

            if (visualizer) visualizer.style.opacity = "0.5";
            isManualDisconnect = false;
            initWebSocket();
        });
    }

    // B. Disconnect Button
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

    // C. Volume Slider (IMPROVED: SAVES TO BROWSER MEMORY)
    if (volumeSlider) {
        // 1. Load saved volume
        const savedVolume = localStorage.getItem('siteVolume');
        if (savedVolume !== null) {
            volumeSlider.value = savedVolume;
            if (audioPlayer) audioPlayer.volume = savedVolume;
        }

        // 2. Save volume on change
        volumeSlider.addEventListener('input', (e) => {
            const vol = e.target.value;
            if (audioPlayer) audioPlayer.volume = vol;
            localStorage.setItem('siteVolume', vol);
        });
    }

    // D. WebSocket Logic
    function initWebSocket() {
        if (!audioStatus) return;

        audioStatus.innerText = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerHTML = 'Status: <span style="color:#55ff55">● LIVE</span> Connected';
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

    // E. Queue Logic (Song Ended)
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            console.log("Song finished. Requesting next track...");
            nowPlayingText.innerText = "Loading next song...";
            nowPlayingText.style.color = "#ffaa00";

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    action: "ended",
                    url: audioPlayer.src
                }));
            }
        });
    }

    // F. Play Audio Function (With Requester Name)
    function playAudio(url, text, requester) {
        if (!audioPlayer) return;

        // 1. Format the Text
        let displayHtml = text ? "♫ " + text : "♫ Unknown Track";

        // Add "Requested by..." if it exists
        if (requester) {
            displayHtml += `<br><span style="font-size: 0.6em; color: #888; font-weight: normal;">Requested by: ${requester}</span>`;
        }

        // 2. Update the Screen (Use innerHTML to allow the line break)
        nowPlayingText.innerHTML = displayHtml;
        nowPlayingText.style.color = "#55ff55";

        if (visualizer) visualizer.style.opacity = "1";

        // 3. Play Logic
        audioPlayer.src = url;
        audioPlayer.load();

        audioPlayer.play().catch(() => {
            nowPlayingText.innerHTML = "⚠️ Click to Play<br><span style='font-size:0.6em; color:#888'>" + (text || "") + "</span>";
            nowPlayingText.style.color = "#ffaa00";

            const unlock = () => {
                audioPlayer.play();
                nowPlayingText.innerHTML = displayHtml;
                nowPlayingText.style.color = "#55ff55";
                document.removeEventListener("click", unlock);
            };
            document.addEventListener("click", unlock, { once: true });
        });
    }

    // G. Stop Function
    function stopAudio() {
        if (!audioPlayer) return;
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        nowPlayingText.innerText = "Waiting for music...";
        nowPlayingText.style.color = "#ffaa00";
        if (visualizer) visualizer.style.opacity = "0.3";
    }
});

/* --- 4. SERVER STATUS (PLAYER COUNT & LIST) --- */
const playerText = document.getElementById('player-text');
const statusDot = document.querySelector('.status-dot');
const playerTooltip = document.getElementById('player-list-tooltip');

// Using mcsrvstat.us API
const SERVER_API_URL = "https://api.mcsrvstat.us/3/15.235.160.20:25597";

function updateServerStatus() {
    if (!playerText) return;

    fetch(SERVER_API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.online) {
                // Update Count
                playerText.innerText = `${data.players.online} / ${data.players.max}`;
                statusDot.style.backgroundColor = "#55ff55";
                statusDot.style.boxShadow = "0 0 5px #55ff55";

                // Update List
                if (data.players.list && data.players.list.length > 0) {
                    let playerHtml = '';
                    data.players.list.forEach(player => {
                        playerHtml += `
                            <div class="player-row">
                                <img src="https://minotar.net/helm/${player.name}/24.png" class="player-head">
                                <span>${player.name}</span>
                                </div>
                            `;
                    });
                    playerTooltip.innerHTML = playerHtml;
                } else {
                    playerTooltip.innerHTML = "<div style='text-align:center; color:#888;'>No players list available<br>(or nobody is online)</div>";
                }

            } else {
                playerText.innerText = "Offline";
                statusDot.style.backgroundColor = "#ff5555";
                statusDot.style.boxShadow = "0 0 5px #ff5555";
                playerTooltip.innerHTML = "Server is currently offline.";
            }
        })
        .catch(error => {
            console.error("Error fetching server status:", error);
            playerText.innerText = "Error";
        });
}

updateServerStatus();
setInterval(updateServerStatus, 30000);

/* --- 5. UNIFIED MODAL LOGIC (RULES & COMMANDS) --- */
const rulesModal = document.getElementById('rules-modal');
const modalTitle = document.getElementById('modal-rule-title');
const modalImage = document.getElementById('modal-rule-image');
const modalDesc = document.getElementById('modal-rule-description');
const modalBody = document.querySelector('.modal-body');
const closeModalBtn = document.querySelector('.close-modal-btn');

function openInfoModal(title, description, imageSrc = null) {
    modalTitle.innerText = title;
    modalDesc.innerHTML = description;

    if (imageSrc) {
        // IMAGE MODE
        modalImage.src = imageSrc;
        modalImage.style.display = "block";
        modalBody.classList.remove('no-image');
    } else {
        // TEXT MODE
        modalImage.src = "";
        modalBody.classList.add('no-image');
    }

    rulesModal.style.display = "flex";
    void rulesModal.offsetWidth;
    rulesModal.classList.add("fade-in");
}

function closeRuleModal() {
    rulesModal.style.display = "none";
    rulesModal.classList.remove("fade-in");
}

document.querySelectorAll('.rule-trigger').forEach(trigger => {
    trigger.addEventListener('click', function () {
        const title = this.getAttribute('data-title');
        const img = this.getAttribute('data-image');
        const desc = this.getAttribute('data-description');
        openInfoModal(title, desc, img);
    });
});

document.querySelectorAll('.command-trigger').forEach(trigger => {
    trigger.addEventListener('click', function () {
        const title = this.getAttribute('data-title');
        const desc = this.getAttribute('data-desc');
        openInfoModal(title, desc, null);
    });
});

if (closeModalBtn) closeModalBtn.addEventListener('click', closeRuleModal);

window.addEventListener('click', (e) => {
    if (e.target === rulesModal) closeRuleModal();
});
/* --- END OF SCRIPT.JS --- */

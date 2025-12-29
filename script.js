/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";
const SERVER_API_URL = "https://api.mcsrvstat.us/3/mc.siqns.dev"; // Changed to your actual IP domain

/* --- 1. TAB SWITCHING LOGIC --- */
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
        void selectedTab.offsetWidth; // Trigger reflow
        selectedTab.classList.add("fade-in");
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active-link");
    }
}

/* --- 2. LIGHTBOX (GALLERY ZOOM) - BULLETPROOF VERSION --- */
window.closeLightbox = function () {
    document.getElementById('lightbox').style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {

    /* -- A. Lightbox Logic -- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    // Use Event Delegation to catch clicks on cloned/animated images
    document.addEventListener('click', function (e) {
        const item = e.target.closest('.gallery-item');

        if (item && lightbox && lightboxImg) {
            const img = item.querySelector('img');
            const caption = item.querySelector('.caption');

            if (img) {
                lightbox.style.display = "flex";
                lightbox.style.flexDirection = "column";
                lightbox.style.justifyContent = "center";
                lightbox.style.alignItems = "center";

                lightboxImg.src = img.src;
                if (caption) {
                    lightboxCaption.innerText = caption.innerText;
                } else {
                    lightboxCaption.innerText = img.alt || "Gallery Image";
                }
            }
        }
    });

    /* -- B. Copy IP Button -- */
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

    /* --- 3. SPOTIFY AUDIO WIDGET LOGIC --- */
    const widgetConnect = document.getElementById('connect-wrapper');
    const widgetPlayer = document.getElementById('player-controls');
    
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
    
    const titleText = document.getElementById('now-playing-title');
    const artistText = document.getElementById('now-playing-artist');
    
    const disconnectBtn = document.getElementById('disconnect-btn');
    const volumeSlider = document.getElementById('volume-slider');

    let ws;
    let isManualDisconnect = false;

    // Connect Function (Global Scope for HTML onclick)
    window.connectAudio = async function() {
        if (!widgetConnect || !widgetPlayer) return;

        widgetConnect.style.display = 'none';
        widgetPlayer.style.display = 'flex'; // Show Spotify player
        
        isManualDisconnect = false;

        // Restore volume
        const savedVolume = localStorage.getItem('siteVolume');
        if (savedVolume !== null && volumeSlider) {
            volumeSlider.value = savedVolume;
            audioPlayer.volume = savedVolume;
        }

        // Attempt Auto-play
        try {
            audioPlayer.src = ""; // Reset source to be safe
            await audioPlayer.play().catch(() => {}); 
        } catch {}

        initWebSocket();
    };

    // Play/Pause Button Logic
    if (playPauseBtn && audioPlayer) {
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                if(playIcon) playIcon.className = 'fas fa-pause';
            } else {
                audioPlayer.pause();
                if(playIcon) playIcon.className = 'fas fa-play';
            }
        });

        // Sync icon if song ends or starts automatically
        audioPlayer.addEventListener('play', () => { if(playIcon) playIcon.className = 'fas fa-pause'; });
        audioPlayer.addEventListener('pause', () => { if(playIcon) playIcon.className = 'fas fa-play'; });
    }

    // Disconnect Logic
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isManualDisconnect = true;
            if(ws) ws.close();
            
            if(audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            }

            widgetPlayer.style.display = 'none';
            widgetConnect.style.display = 'flex';
        });
    }

    // Volume Slider Logic
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const vol = e.target.value;
            if (audioPlayer) audioPlayer.volume = vol;
            localStorage.setItem('siteVolume', vol);
        });
    }

    // WebSocket Logic (Data Stream)
    function initWebSocket() {
        if(ws && ws.readyState === WebSocket.OPEN) return;

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            if(artistText) artistText.innerText = "Connected...";
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.action === 'play') {
                    // Update Text
                    if(titleText) titleText.innerText = data.text || "Unknown Song";
                    if(artistText) artistText.innerText = data.requester ? "Req by: " + data.requester : "Server Radio";
                    
                    // Play Audio
                    if(audioPlayer) {
                        // Only change source if it's actually different
                        if (audioPlayer.src !== data.url) {
                            audioPlayer.src = data.url;
                            audioPlayer.play().catch(e => console.log("Playback auto-start blocked", e));
                        }
                    }
                } 
                else if (data.action === 'stop') {
                    if(audioPlayer) audioPlayer.pause();
                    if(titleText) titleText.innerText = "Music Paused";
                    if(artistText) artistText.innerText = "Server Radio";
                }
            } catch (e) { console.error(e); }
        };

        ws.onclose = () => {
            if (isManualDisconnect) return;
            // Auto Reconnect Attempt
            setTimeout(initWebSocket, 3000);
        };
    }

    // Auto-Next Song Trigger
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            if(titleText) titleText.innerText = "Loading next song...";
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "ended", url: audioPlayer.src }));
            }
        });
    }

    /* --- 4. SERVER STATUS (PLAYER COUNT & LIST) --- */
    const playerText = document.getElementById('player-text');
    const statusDot = document.querySelector('.status-dot');
    const playerTooltip = document.getElementById('player-list-tooltip');

    function updateServerStatus() {
        if (!playerText) return;

        fetch(SERVER_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.online) {
                    // Update Count
                    playerText.innerText = `${data.players.online} / ${data.players.max}`;
                    if(statusDot) {
                        statusDot.style.backgroundColor = "#55ff55";
                        statusDot.style.boxShadow = "0 0 5px #55ff55";
                    }

                    // Update List (Using Minotar for offline/cracked support)
                    if (data.players.list && data.players.list.length > 0) {
                        let playerHtml = '';
                        data.players.list.forEach(player => {
                            playerHtml += `
                                <div class="player-row">
                                    <img src="https://minotar.net/helm/${player.name}/24.png" class="player-head" onerror="this.src='https://minotar.net/helm/Steve/24.png'">
                                    <span>${player.name}</span>
                                </div>
                            `;
                        });
                        if(playerTooltip) playerTooltip.innerHTML = playerHtml;
                    } else {
                        if(playerTooltip) playerTooltip.innerHTML = "<div style='text-align:center; color:#888;'>No players list available<br>(or nobody is online)</div>";
                    }

                } else {
                    playerText.innerText = "Offline";
                    if(statusDot) {
                        statusDot.style.backgroundColor = "#ff5555";
                        statusDot.style.boxShadow = "0 0 5px #ff5555";
                    }
                    if(playerTooltip) playerTooltip.innerHTML = "Server is currently offline.";
                }
            })
            .catch(error => {
                console.error("Error fetching server status:", error);
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
        if(modalTitle) modalTitle.innerText = title;
        if(modalDesc) modalDesc.innerHTML = description;

        if (imageSrc) {
            if(modalImage) {
                modalImage.src = imageSrc;
                modalImage.style.display = "block";
            }
            if(modalBody) modalBody.classList.remove('no-image');
        } else {
            if(modalImage) modalImage.src = "";
            if(modalBody) modalBody.classList.add('no-image');
        }

        if(rulesModal) {
            rulesModal.style.display = "flex";
            void rulesModal.offsetWidth;
            rulesModal.classList.add("fade-in");
        }
    }

    function closeRuleModal() {
        if(rulesModal) {
            rulesModal.style.display = "none";
            rulesModal.classList.remove("fade-in");
        }
    }

    // Attach listeners
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

});
/* --- END OF SCRIPT.JS --- */

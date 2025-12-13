/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com"; 
const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

/* 
 * CRITICAL: GLOBAL FUNCTIONS DEFINED FIRST.
 * These must be defined before the browser reads the HTML's 'onclick' attributes.
 */

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
    
    // Note: 'event' is a global object when using onclick=""
    if(event && event.currentTarget) {
        event.currentTarget.classList.add("active-link");
    }
}

function closeLightbox(event) {
    const lightbox = document.getElementById('lightbox');
    if (event.target === lightbox || event.target.classList.contains('close-btn')) {
        lightbox.style.display = "none";
        document.getElementById('lightbox-img').style.transform = 'scale(1)';
        document.getElementById('lightbox-img').style.cursor = 'grab';
    }
}


// --- MAIN LOGIC (Runs ONLY when HTML elements are ready) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENT INITIALIZATION ---
    const copyButton = document.getElementById('copy-btn');
    const ipTextElement = document.getElementById('server-ip');
    const playerText = document.getElementById('player-text');
    const statusDot = document.querySelector('.status-dot');
    const playerTooltip = document.getElementById('player-list-tooltip');
    
    // Audio Elements
    const audioPlayer = document.getElementById('audio-player');
    const nowPlayingText = document.getElementById('now-playing-text');
    const connectBtn = document.getElementById('connect-audio-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const connectWrapper = document.getElementById('connect-wrapper');
    const playerControls = document.getElementById('player-controls');
    const audioStatus = document.getElementById('audio-status');
    const volumeSlider = document.getElementById('volume-slider');
    const playerNameInput = document.getElementById('player-name-input');
    const radioMemberList = document.getElementById('radio-member-list'); 

    let ws;
    let isManualDisconnect = false;

    // --- 1. GALLERY INIT & CLICK ATTACHMENT ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const galleryImages = document.querySelectorAll('.scrolling-gallery-track .gallery-item img');

    galleryImages.forEach(img => {
        img.addEventListener('click', function() {
            lightbox.style.display = "flex";
            lightbox.style.flexDirection = "column";
            lightbox.style.justifyContent = "center";
            lightbox.style.alignItems = "center"; 
            
            lightboxImg.src = this.src;
            // Get caption from the sibling div or the alt tag
            lightboxCaption.innerText = this.nextElementSibling ? this.nextElementSibling.innerText : this.alt;
        });
    });


    // --- 2. SERVER STATUS CHECK ---
    function updateServerStatus() {
        if (!playerText) return; 

        fetch(SERVER_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.online) {
                    playerText.innerText = `${data.players.online} / ${data.players.max}`;
                    statusDot.style.backgroundColor = "#55ff55";
                    statusDot.style.boxShadow = "0 0 5px #55ff55";

                    if (data.players.list && data.players.list.length > 0) {
                        let playerHtml = '';
                        data.players.list.forEach(player => {
                            playerHtml += `<div class="player-row"><img src="https://crafatar.com/avatars/${player.uuid}?size=24&overlay" class="player-head"><span>${player.name}</span></div>`;
                        });
                        playerTooltip.innerHTML = playerHtml;
                    } else if (data.players.online > 0) {
                        playerTooltip.innerHTML = `<div style='text-align:center; color:#888;'>${data.players.online} player(s) online.<br>List is private.</div>`;
                    } else {
                         playerTooltip.innerHTML = "<div style='text-align:center; color:#888;'>No players currently online.</div>";
                    }

                } else {
                    playerText.innerText = "Offline";
                    statusDot.style.backgroundColor = "#ff5555";
                    statusDot.style.boxShadow = "0 0 5px #ff5555";
                    playerTooltip.innerHTML = "Server is currently offline.";
                }
            })
            .catch(error => {
                playerText.innerText = "Error";
                statusDot.style.backgroundColor = "#ffaa00";
                playerTooltip.innerHTML = "Could not fetch server status.";
            });
    }

    updateServerStatus();
    setInterval(updateServerStatus, 30000);


    // --- 3. COPY IP BUTTON ---
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

    // --- 4. AUDIO SYSTEM LOGIC ---
    // Helper functions for audio logic
    function updateMemberList(players) {
        if (!radioMemberList) return;
        
        if (players.length === 0) {
            radioMemberList.innerHTML = "<p style='text-align:center; color:#aaa;'>You are the only one listening!</p>";
            return;
        }

        let listHtml = '';
        players.forEach(player => {
            listHtml += `<div class="user-list-item"><img src="https://crafatar.com/avatars/${player.name}?size=24&overlay" class="user-avatar"><span>${player.name}</span></div>`;
        });
        radioMemberList.innerHTML = listHtml;
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
    
    // Connect Button Listener
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            const username = playerNameInput.value.trim();
            if (username.length < 3) {
                alert("Please enter a valid Minecraft username.");
                return;
            }
            localStorage.setItem('minecraft_username', username);
            
            connectWrapper.style.display = 'none';
            playerControls.style.display = 'block';
            if(volumeSlider && audioPlayer) audioPlayer.volume = volumeSlider.value;
            isManualDisconnect = false;
            initWebSocket(username); 
        });
    }

    if (playerNameInput) {
        playerNameInput.value = localStorage.getItem('minecraft_username') || '';
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
            radioMemberList.innerHTML = '<p style="text-align: center; color:#aaa;">Enable audio to see the list.</p>';
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if(audioPlayer) audioPlayer.volume = e.target.value;
        });
    }

    function initWebSocket(username) {
        if (!audioStatus) return;

        audioStatus.innerText = "Status: Connecting...";
        audioStatus.style.color = "#ffaa00";

        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            audioStatus.innerText = "Status: Connected ●";
            audioStatus.style.color = "#55ff55";
            ws.send(JSON.stringify({ type: "identify", playername: username }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.action === 'play') playAudio(data.url, data.text);
                else if (data.action === 'stop') stopAudio();
                else if (data.action === 'clientlist') updateMemberList(data.players); 

            } catch (e) { console.error("JSON Error:", e); }
        };

        ws.onclose = () => {
            if (isManualDisconnect) return;
            audioStatus.innerText = "Status: Disconnected (Retrying...)";
            audioStatus.style.color = "#ff5555";
            setTimeout(initWebSocket, 3000); 
        };
    }
});

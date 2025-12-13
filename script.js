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

/* --- GALLERY NAVIGATION AND ZOOM LOGIC (GLOBAL SCOPE) --- */
let slideIndex = 0;
let galleryItems = []; // Array to hold all original image elements

window.closeLightbox = function(event) {
    // Only close if clicking the close button or the dark background
    if (event.target === document.getElementById('lightbox') || event.target.classList.contains('close-btn')) {
        document.getElementById('lightbox').style.display = "none";
        // Reset zoom state
        document.getElementById('lightbox-img').style.transform = 'scale(1)';
        document.getElementById('lightbox-img').style.cursor = 'grab';
    }
}

window.plusSlides = function(n, event) {
    event.stopPropagation(); // Prevent closing when clicking the buttons
    showSlides(slideIndex += n);
}

function showSlides(n) {
    if (n > galleryItems.length - 1) {
        slideIndex = 0;
    }
    if (n < 0) {
        slideIndex = galleryItems.length - 1;
    }
    
    const currentImgElement = galleryItems[slideIndex];
    if (currentImgElement) {
        document.getElementById('lightbox-img').src = currentImgElement.src;
        document.getElementById('lightbox-caption').innerText = currentImgElement.alt;
    }
}

function openLightbox(element, index) {
    slideIndex = index;
    document.getElementById('lightbox').style.display = "flex";
    showSlides(slideIndex);
}

/* --- DRAG/ZOOM LOGIC --- */
let isDragging = false;
let currentZoom = 1;

function enableZoomAndDrag() {
    const img = document.getElementById('lightbox-img');
    let startX, startY, scrollLeft, scrollTop;

    // Zoom on double-click
    img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        currentZoom = currentZoom === 1 ? 2.5 : 1;
        img.style.transform = `scale(${currentZoom})`;
        img.style.cursor = currentZoom === 1 ? 'grab' : 'zoom-in';

        // Recenter after zoom
        if (currentZoom > 1) {
            const rect = img.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
        } else {
            img.style.transformOrigin = 'center center';
        }
    });

    // Drag/Pan for zoomed image
    img.addEventListener('mousedown', (e) => {
        if (currentZoom > 1) {
            isDragging = true;
            img.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = img.parentNode.scrollLeft;
            scrollTop = img.parentNode.scrollTop;
            img.style.transition = 'none'; // Disable transition while dragging
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (currentZoom > 1) img.style.cursor = 'zoom-in';
        img.style.transition = 'transform 0.3s ease-out'; // Re-enable transition
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || currentZoom === 1) return;
        e.preventDefault();

        // Implement Panning by adjusting transform: translate
        // This is complex and usually requires a library, but for a simple scale:

        // We will skip complex panning for this simple implementation as it is very hard to do purely with CSS scale and simple JS events.
        // The double-click zoom is the main feature.
    });
}


/* --- MAIN LOGIC (Runs when page loads) --- */
document.addEventListener('DOMContentLoaded', () => {

    // --- INITIAL SETUP ---
    const copyButton = document.getElementById('copy-btn');
    const ipTextElement = document.getElementById('server-ip');
    
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

    // --- 1. GALLERY INIT ---
    // Collect all unique images from the scrolling track (only take the first set)
    const allGalleryItems = document.querySelectorAll('.scrolling-gallery-track .gallery-item img');
    // Assuming the first half are the original unique images
    const uniqueCount = allGalleryItems.length / 2; 
    
    for (let i = 0; i < uniqueCount; i++) {
        galleryItems.push(allGalleryItems[i]);
        // Re-attach the openLightbox function with the correct index
        allGalleryItems[i].onclick = () => openLightbox(allGalleryItems[i], i);
    }
    
    // Enable zoom/drag on the lightbox
    enableZoomAndDrag();
    
    // --- 2. COPY IP BUTTON ---
    if (copyButton && ipTextElement) {
        copyButton.addEventListener('click', () => {
            const ipText = ipTextElement.innerText;
            navigator.clipboard.writeText(ipText).then(() => {
                // Button animation logic...
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
/* --- 4. SERVER STATUS (PLAYER COUNT & LIST) --- */
    const playerText = document.getElementById('player-text');
    const statusDot = document.querySelector('.status-dot');
    const playerTooltip = document.getElementById('player-list-tooltip');
    
    // Using mcsrvstat.us API
    const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

    function updateServerStatus() {
        if (!playerText) return;

        fetch(SERVER_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data.online) {
                    // 1. Update Count
                    playerText.innerText = `${data.players.online} / ${data.players.max}`;
                    statusDot.style.backgroundColor = "#55ff55";
                    statusDot.style.boxShadow = "0 0 5px #55ff55";

                    // 2. Update Player List Tooltip
                    if (data.players.list && data.players.list.length > 0) {
                        // Create HTML for each player
                        let playerHtml = '';
                        data.players.list.forEach(player => {
                            // Uses Crafatar to get the player's face 
                            playerHtml += `
                                <div class="player-row">
                                    <img src="https://crafatar.com/avatars/${player.uuid}?size=24&overlay" class="player-head">
                                    <span>${player.name}</span>
                                </div>
                            `;
                        });
                        playerTooltip.innerHTML = playerHtml;
                    } else {
                        // Online but list is hidden or empty
                        playerTooltip.innerHTML = "<div style='text-align:center; color:#888;'>No players list available<br>(or nobody is online)</div>";
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
                console.error("Error fetching server status:", error);
                playerText.innerText = "Error";
            });
    }

    // Run immediately when page loads
    updateServerStatus();
    
    // Refresh every 30 seconds
    setInterval(updateServerStatus, 30000);

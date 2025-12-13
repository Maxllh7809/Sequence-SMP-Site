/* --- CONFIGURATION --- */
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com"; 
const SERVER_API_URL = "https://api.mcsrvstat.us/3/sequence.playmc.cloud";

/* --- GLOBAL NAVIGATION FUNCTIONS (MUST BE AT TOP FOR HTML ONCLICK) --- */

let slideIndex = 0;
let galleryItems = []; // This will be filled later in DOMContentLoaded

// Global function to manage tab switching (called by Navbar buttons)
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

// Global function to close the Lightbox (called by onclick on the dark background)
window.closeLightbox = function(event) {
    // Only close if clicking the close button or the dark background
    if (event.target === document.getElementById('lightbox') || event.target.classList.contains('close-btn')) {
        document.getElementById('lightbox').style.display = "none";
        // Reset zoom state
        document.getElementById('lightbox-img').style.transform = 'scale(1)';
        document.getElementById('lightbox-img').style.cursor = 'grab';
    }
}

// Global function to navigate slides (called by onclick on the arrows)
window.plusSlides = function(n, event) {
    event.stopPropagation(); // Prevents closing the lightbox when clicking arrows
    showSlides(slideIndex += n);
}

// Internal logic to display the image
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

// Internal function to open lightbox (called by the image click listeners)
function openLightbox(element, index) {
    slideIndex = index;
    document.getElementById('lightbox').style.display = "flex";
    showSlides(slideIndex);
}

// --- MAIN LOGIC (Runs when page loads) ---
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

    // --- 1. GALLERY INIT & EVENT ATTACHMENT ---
    const allGalleryImages = document.querySelectorAll('.scrolling-gallery-track .gallery-item img');
    // Assuming the first half are the original unique images (8 unique images in HTML)
    const uniqueCount = 8; 
    
    for (let i = 0; i < uniqueCount; i++) {
        galleryItems.push(allGalleryImages[i]);
        // Attach click listener to each image
        allGalleryImages[i].addEventListener('click', () => openLightbox(allGalleryImages[i], i));
    }
    
    // Attach Zoom/Drag logic
    const lightboxImg = document.getElementById('lightbox-img');
    let currentZoom = 1;
    lightboxImg.addEventListener('dblclick', (e) => {
        e.preventDefault();
        currentZoom = currentZoom === 1 ? 2.5 : 1;
        lightboxImg.style.transform = `scale(${currentZoom})`;
        lightboxImg.style.cursor = currentZoom === 1 ? 'grab' : 'zoom-in';

        if (currentZoom > 1) {
            const rect = lightboxImg.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            lightboxImg.style.transformOrigin = `${x * 100}% ${y * 100}%`;
        } else {
            lightboxImg.style.transformOrigin = 'center center';
        }
    });


    // --- 2. SERVER STATUS ---
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
                playerTooltip.innerHTML = "Could not fetch server status.";
            });
    }

    updateServerStatus();
    setInterval(updateServerStatus, 30000);


    // --- 3. COPY IP BUTTON ---
    const copyButton = document.getElementById('copy-btn');
    if (copyButton && ipTextElement) {
        copyButton.addEventListener('click', () => {
            const ipText = ipTextElement.innerText;
            navigator.clipboard.writeText(ipText).then(() => {
                // Button animation logic...
            });
        });
    }


    // --- 4. AUDIO SYSTEM LOGIC ---
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
});

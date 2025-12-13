# ⚔️ Sequence SMP Website

The official community website for **Sequence SMP**, a semi-vanilla Minecraft server focused on friendly cooperation and long-term progression.

<!-- BADGES: Linking to other repos -->
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
[![Audio Backend](https://img.shields.io/badge/GitHub-Audio_Backend_Repo-181717?style=for-the-badge&logo=github)](https://github.com/Maxllh7809/sequence-audio-backend)
[![Minecraft Plugin](https://img.shields.io/badge/GitHub-Radio_Plugin_Repo-blue?style=for-the-badge&logo=github)](https://github.com/Maxllh7809/sequence-radio-audio)

## 🌟 Features

*   **Modern Dark UI:** A sleek, "Nether-themed" design with animated background particles.
*   **Tabbed Navigation:** Seamless switching between Home, Discord, Rules, and Audio without reloading.
*   **Live Audio Client:** Integrated WebSocket client allowing players to listen to server music/voice directly from the browser.
*   **Auto-Scrolling Gallery:** An infinite-scroll marquee showcasing server builds, with a clickable Lightbox (zoom) view.
*   **Server Status:** One-click button to copy the Server IP (`sequence.playmc.cloud`) and live player count syncing.
*   **Responsive Design:** Fully functional on mobile and desktop.

## 🔗 Related Repositories

This website works in tandem with a backend server to handle the audio streaming features.
*   **Audio Backend:** [sequence-audio-backend](https://github.com/Maxllh7809/sequence-audio-backend)

## 📂 Project Structure

*   `index.html` - The main structure, text content, and gallery images.
*   `script.css` - All styling, animations, fonts, and responsive layout rules.
*   `script.js` - Logic for tabs, the audio client (WebSocket), the gallery lightbox, and the copy-IP button.
*   `logo.png` - The server icon displayed in the header and browser tab.

## ⚙️ Configuration

### 1. Changing the Server IP
Open `index.html` and find the `status-bar` section:
```html
<span id="server-ip" class="ip-text">sequence.playmc.cloud</span>
```

### 2. Configuring the Audio Backend
This website requires a backend WebSocket server to handle audio streaming.
Open `script.js` and update the top line:
```javascript
// Replace with your Render/Glitch URL
const WEBSOCKET_URL = "wss://sequence-audio-backend.onrender.com";
```

### 3. Updating the Gallery
To add or change images, open `index.html` and look for the `scrolling-gallery-track`.
*   **Important:** You must add the new images to **both** sets of divs (the original set and the duplicate set) to ensure the infinite scroll loop remains seamless.
*   The `alt` text in the `<img>` tag is automatically displayed as the caption.

```html
<div class="gallery-item">
    <img src="your-image.png" alt="Caption Goes Here">
    <div class="caption">Caption Goes Here</div>
</div>
```

## 🚀 How to Run Locally

1.  Clone the repository:
    ```bash
    git clone https://github.com/Maxllh7809/Sequence-SMP-Site.git
    ```
2.  Open the folder in VS Code.
3.  Open `index.html` in your browser (or use the Live Server extension).

## 👥 Credits

*   **Website/Backend Development:** Loh Wei Feng (Max)
*   **Plugin Development:** Jishnu H Maruthamutu (Hooman)
*   **Server Owner:** Siqns

&copy; 2025 Sequence SMP

// Function to handle Tab Switching with Animation
function openTab(tabName) {
    // 1. Hide all elements with class="tab-content"
    var x = document.getElementsByClassName("tab-content");
    for (var i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        // Remove animation class to reset it
        x[i].classList.remove("fade-in");
    }

    // 2. Remove "active-link" class from all buttons
    var navButtons = document.getElementsByClassName("nav-btn");
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active-link");
    }

    // 3. Show the specific tab requested
    var tab = document.getElementById(tabName);
    tab.style.display = "block";

    // 4. Force a browser reflow (trick to restart CSS animation)
    void tab.offsetWidth;

    // 5. Add "active-link" to the button that was clicked
    event.currentTarget.classList.add("active-link");
}

// Copy IP Logic
document.addEventListener('DOMContentLoaded', () => {

    const copyButton = document.getElementById('copy-btn');
    const ipText = document.getElementById('server-ip').innerText;

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(ipText).then(() => {
                const originalText = copyButton.innerText;
                const originalBg = copyButton.style.background;

                // Animate button success
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
});
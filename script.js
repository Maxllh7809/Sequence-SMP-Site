// Function to handle Tab Switching
function openTab(tabName) {
    // 1. Hide all elements with class="tab-content"
    var i;
    var x = document.getElementsByClassName("tab-content");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }

    // 2. Remove "active-link" class from all buttons
    var navButtons = document.getElementsByClassName("nav-btn");
    for (i = 0; i < navButtons.length; i++) {
        navButtons[i].classList.remove("active-link");
    }

    // 3. Show the specific tab requested
    document.getElementById(tabName).style.display = "block";

    // 4. Add "active-link" to the button that was clicked
    // We find the button by checking which one triggered the event
    event.currentTarget.classList.add("active-link");
}

// Existing Code for Copy IP
document.addEventListener('DOMContentLoaded', () => {

    const copyButton = document.getElementById('copy-btn');
    const ipText = document.getElementById('server-ip').innerText;

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(ipText).then(() => {
                const originalText = copyButton.innerText;
                const originalBg = copyButton.style.background;

                copyButton.innerText = "COPIED!";
                copyButton.style.background = "#55ff55";
                copyButton.style.color = "#000";

                setTimeout(() => {
                    copyButton.innerText = originalText;
                    copyButton.style.background = originalBg;
                    copyButton.style.color = "";
                }, 2000);
            });
        });
    }
});
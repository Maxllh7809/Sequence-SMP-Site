document.addEventListener('DOMContentLoaded', () => {

    const copyButton = document.getElementById('copy-btn');
    const ipText = document.getElementById('server-ip').innerText;

    if (copyButton) {
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(ipText).then(() => {

                // Change button style temporarily
                const originalText = copyButton.innerText;
                const originalBg = copyButton.style.background;

                copyButton.innerText = "COPIED!";
                copyButton.style.background = "#55ff55"; // Green color
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
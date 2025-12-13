document.addEventListener('DOMContentLoaded', () => {

    // Find the button and the IP text
    const copyButton = document.getElementById('copy-btn');
    const ipText = document.getElementById('server-ip').innerText;

    // Listen for a click on the button
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            // Copy to clipboard
            navigator.clipboard.writeText(ipText).then(() => {

                // Change button text temporarily to show it worked
                const originalText = copyButton.innerText;
                copyButton.innerText = "COPIED!";

                // Reset text after 2 seconds
                setTimeout(() => {
                    copyButton.innerText = originalText;
                }, 2000);
            });
        });
    }
});
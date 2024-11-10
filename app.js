class PageManager {
    constructor() {
        this.currentPage = 1;
        this.pages = document.querySelectorAll('.page');
        this.logoAnimationComplete = false;
        
        // Logo animation completion listener
        const logoPath = document.querySelector('#logo-path');
        logoPath.addEventListener('animationend', () => {
            setTimeout(() => {
                this.logoAnimationComplete = true;
                this.goToPage(2);
            }, 2500);
        });

        // Camera permission button listener
        const cameraButton = document.getElementById('requestCamera');
        if (cameraButton) {
            cameraButton.addEventListener('click', () => this.requestCameraPermission());
        }
    }

    goToPage(pageNumber) {
        this.pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
        this.currentPage = pageNumber;

        if (pageNumber === 2) {
            this.animateTextLines();
        }
    }

    animateTextLines() {
        const textLines = document.querySelectorAll('.text-line');
        
        // Fade in animation
        textLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.opacity = '1';
            }, index * 500);
        });

        // Slide animation after 5 seconds (reduced from 10)
        setTimeout(() => {
            textLines.forEach((line, index) => {
                line.style.transition = 'transform 2s ease'; // Slowed down transition
                if (index % 2 === 0) {
                    line.style.transform = 'translateX(-100%)';
                } else {
                    line.style.transform = 'translateX(100%)';
                }
            });
            
            // Move to camera permission page after text slides out
            setTimeout(() => {
                this.goToPage(3);
            }, 2000);
        }, 5000);
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                }
            });
            
            // Permission granted
            stream.getTracks().forEach(track => track.stop()); // Stop the stream as we don't need it yet
            this.goToPage(4); // Move to next page after permission granted
        } catch (error) {
            // Permission denied or error
            console.error('Camera access error:', error);
            document.getElementById('permissionError').style.display = 'block';
        }
    }
}

// Initialize the page manager
const pageManager = new PageManager();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/museomix/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.error('ServiceWorker registration failed:', err);
            });
    });
}
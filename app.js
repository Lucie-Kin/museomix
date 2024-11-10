// Main app.js file for museum interactive guide

class PageManager {
    constructor() {
        // Initialize page tracking
        this.currentPage = 1;
        this.pages = document.querySelectorAll('.page');
        this.logoAnimationComplete = false;
        
        // Camera related properties
        this.stream = null;
        this.videoElement = null;
        
        // Initialize event listeners for logo animation
        const logoBackground = document.querySelector('.logo-background');
        logoBackground.addEventListener('animationend', () => {
            setTimeout(() => {
                this.logoAnimationComplete = true;
                this.startColorTransition();
            }, 500);
        });

        // Preload all necessary images
        this.preloadImages([
            'rsc/art1.jpg',
            'rsc/art2.jpg',
            'rsc/art3.jpg',
            'rsc/ciac_logo-02.png',
            'rsc/send_btn.png'
        ]);

        // Add keyboard navigation for testing
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.goToPage(this.currentPage + 1);
            } else if (e.key === 'ArrowLeft') {
                this.goToPage(this.currentPage - 1);
            }
        });
    }

    // Preload images for better performance
    preloadImages(sources) {
        sources.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Manage logo color transition
    startColorTransition() {
        const logoImage = document.getElementById('logoWhite');
        logoImage.style.opacity = '0';
        
        setTimeout(() => {
            logoImage.style.opacity = '1';
            
            setTimeout(() => {
                this.goToPage(2);
                this.animateTextLines();
            }, 1000);
        }, 500);
    }

    // Page navigation
    goToPage(pageNumber) {
        // Validate page number
        if (pageNumber < 1 || pageNumber > this.pages.length) return;
        
        // Handle special cases before page transition
        if (this.currentPage === 3) {
            this.stopCamera();
        }

        // Transition to new page
        this.pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
        this.currentPage = pageNumber;

        // Handle special cases after page transition
        if (pageNumber === 3) {
            this.initializeCamera();
        }
    }

    // Text animation for page 2
    animateTextLines() {
        const textLines = document.querySelectorAll('.text-line');
        
        // Fade in animation
        textLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.opacity = '1';
            }, index * 500);
        });

        // Slide out animation after delay
        setTimeout(() => {
            textLines.forEach((line, index) => {
                if (index % 2 === 0) {
                    line.style.transform = 'translateX(-100%)';
                } else {
                    line.style.transform = 'translateX(100%)';
                }
            });
            
            // Move to next page after text slides out
            setTimeout(() => {
                this.goToPage(3);
            }, 1000);
        }, 10000);
    }

    // Camera initialization
    async initializeCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement = document.querySelector('#camera-feed');
            
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.play();
            }
        } catch (error) {
            console.error('Camera access error:', error);
            // Display error message to user
            const errorMessage = document.getElementById('camera-error');
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
        }
    }

    // Stop camera when leaving camera page
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    // Capture photo from camera
    capturePhoto() {
        if (!this.videoElement) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(this.videoElement, 0, 0);
        
        return canvas.toDataURL('image/jpeg');
    }

    // Create brick wall effect
    createBrickWall() {
        const container = document.getElementById('brick-wall');
        if (!container) return;

        const brickTexts = [
            "Lorem ipsum dolor sit amet",
            "Consectetur adipiscing elit",
            "Sed do eiusmod tempor",
            "Incididunt ut labore",
            "Et dolore magna aliqua"
        ];

        brickTexts.forEach((text, index) => {
            const brick = document.createElement('div');
            brick.className = 'brick';
            brick.textContent = text;
            brick.style.animationDelay = `${index * 0.5}s`;
            brick.style.animationDirection = index % 2 === 0 ? 'normal' : 'reverse';
            container.appendChild(brick);
        });
    }

    // Check if device has camera
    async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error checking camera:', error);
            return false;
        }
    }
}

// Initialize the page manager
const pageManager = new PageManager();

// Service Worker Registration for PWA
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

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && pageManager.currentPage === 3) {
        pageManager.stopCamera();
    } else if (!document.hidden && pageManager.currentPage === 3) {
        pageManager.initializeCamera();
    }
});

// Handle page resize
window.addEventListener('resize', () => {
    // Add any necessary resize handling logic
    console.log('Window resized');
});

// Handle offline/online status
window.addEventListener('online', () => {
    console.log('Application is online');
});

window.addEventListener('offline', () => {
    console.log('Application is offline');
});

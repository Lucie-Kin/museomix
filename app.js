class PageManager {
    constructor() {
        this.currentPage = 1;
        this.pages = document.querySelectorAll('.page');
        this.preloadDone = false;
        this.minAnimationTime = 3000; // Minimum 3 seconds for logo animation
        this.animationStartTime = Date.now();
        
        // Start preloading
        this.preloadResources();
        
        // Set up animation monitoring
        this.monitorLogoAnimation();
    }

    preloadResources() {
        // Add your resource URLs here
        const resources = [
            'rsc/logo.png',
            'rsc/ciac_logo-01.png',
            'rsc/ciac_logo-02.png',
            // Add other resources as needed
        ];

        let loadedCount = 0;
        
        resources.forEach(url => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === resources.length) {
                    this.preloadDone = true;
                    this.checkTransition();
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === resources.length) {
                    this.preloadDone = true;
                    this.checkTransition();
                }
            };
            img.src = url;
        });
    }

    monitorLogoAnimation() {
        // Monitor logo animation completion
        setTimeout(() => {
            this.checkTransition();
        }, this.minAnimationTime);
    }

    checkTransition() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.animationStartTime;
        
        if (elapsedTime >= this.minAnimationTime && this.preloadDone) {
            this.goToPage(2);
            this.setupPage2Animation();
        }
    }

    goToPage(pageNumber) {
        this.pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
        this.currentPage = pageNumber;
    }

    setupPage2Animation() {
        if (this.currentPage === 2) {
            const textLines = document.querySelectorAll('#page2 p');
            setTimeout(() => {
                textLines.forEach((line, index) => {
                    if (index % 2 === 0) {
                        line.classList.add('slide-left');
                    } else {
                        line.classList.add('slide-right');
                    }
                });
                
                // Transition to page 3 after animation
                setTimeout(() => {
                    this.goToPage(3);
                }, 500);
            }, 10000); // Wait 10 seconds before sliding
        }
    }
}

// Initialize the page manager
const pageManager = new PageManager();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
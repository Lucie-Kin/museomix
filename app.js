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
        // Pages and resources to preload
        const resources = [
            // Add your resource URLs here
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
        // Monitor logo drawing animation
        const logoPath = document.querySelector('#logo-path');
        let animationCount = 0;
        
        logoPath.addEventListener('animationiteration', () => {
            animationCount++;
            this.checkTransition();
        });
    }

    checkTransition() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.animationStartTime;
        
        // Only transition if both conditions are met:
        // 1. Minimum animation time has passed
        // 2. Resources are preloaded
        if (elapsedTime >= this.minAnimationTime && this.preloadDone) {
            this.goToPage(2);
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

    // Rest of your existing PageManager methods remain the same
}

// Initialize the page manager
const pageManager = new PageManager();

// Your existing service worker registration remains the same
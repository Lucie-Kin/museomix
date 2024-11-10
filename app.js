// Complete project code with all required functionality
class PageManager {
    constructor() {
        this.currentPage = 1;
        this.pages = document.querySelectorAll('.page');
        this.preloadDone = false;
        this.minAnimationTime = 12000;
        this.animationStartTime = Date.now();
        this.cameraStream = null;
        this.animationCount = 0;
        this.cameraInitialized = false;
        this.torchTrack = null;
        this.hasTorch = false;
        
        this.initializeEventListeners();
        this.preloadResources();
        this.monitorLogoAnimation();
        this.setupLogoAnimationCounter();
    }

    setupLogoAnimationCounter() {
        const logo = document.getElementById('animated-logo');
        logo.addEventListener('load', () => {
            const svgDoc = logo.contentDocument;
            const mainPath = svgDoc.getElementById('main-path');
            
            mainPath.addEventListener('animationiteration', () => {
                this.animationCount++;
                if (this.animationCount >= 2) {
                    const allElements = svgDoc.querySelectorAll('*');
                    allElements.forEach(element => {
                        element.style.animation = 'none';
                    });
                    
                    const logoContainer = document.querySelector('.logo-container');
                    logoContainer.style.transition = 'opacity 0.5s';
                    logoContainer.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.goToPage(2);
                        this.setupPage2Animation();
                    }, 500);
                }
            });
        });
    }

    initializeEventListeners() {
        document.getElementById('cameraPermissionBtn').addEventListener('click', () => this.requestCamera());
        document.getElementById('retryPermissionBtn').addEventListener('click', () => this.requestCamera());
        document.getElementById('captureBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('yesBtn').addEventListener('click', () => this.handlePositiveResponse());
        document.getElementById('noBtn').addEventListener('click', () => this.handleNegativeResponse());
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
        document.getElementById('converseCIAC').addEventListener('click', async () => {
            if (this.cameraInitialized && this.cameraStream) {
                this.goToPage(5);
            } else {
                try {
                    await this.requestCamera();
                } catch (error) {
                    console.error('Camera initialization failed:', error);
                }
            }
        });
        document.getElementById('returnCamera').addEventListener('click', () => this.goToPage(5));
    }

    preloadResources() {
        const resources = [
            'rsc/logo.png',
            'rsc/ciac_logo-01.png',
            'rsc/ciac_logo-02.png',
            'rsc/send_btn.png',
            'rsc/art1.jpg',
            'rsc/art2.jpg',
            'rsc/art3.jpg'
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
        setTimeout(() => {
            this.checkTransition();
        }, this.minAnimationTime);
    }

    checkTransition() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.animationStartTime;
        
        if (elapsedTime >= this.minAnimationTime && this.preloadDone) {
            const logo = document.querySelector('.logo-container');
            logo.style.transition = 'opacity 0.5s';
            logo.style.opacity = '0';
            
            setTimeout(() => {
                this.goToPage(2);
                this.setupPage2Animation();
            }, 500);
        }
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
                
                setTimeout(() => {
                    this.goToPage(3);
                }, 1000);
            }, 3000);
        }
    }

    async turnOnFlash() {
        try {
            if (!this.cameraStream) return;
            
            const track = this.cameraStream.getVideoTracks()[0];
            if (!track) return;

            // Check if torch is supported
            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                console.log('Torch not supported on this device');
                return;
            }

            // Try to turn on the torch
            await track.applyConstraints({
                advanced: [{ torch: true }]
            });
            
            console.log('Torch turned on successfully');
        } catch (err) {
            console.error('Error turning on flash:', err);
        }
    }

    async turnOffFlash() {
        try {
            if (!this.cameraStream) return;
            
            const track = this.cameraStream.getVideoTracks()[0];
            if (!track) return;

            // Check if torch is supported
            const capabilities = track.getCapabilities();
            if (!capabilities.torch) return;

            // Try to turn off the torch
            await track.applyConstraints({
                advanced: [{ torch: false }]
            });
            
            console.log('Torch turned off successfully');
        } catch (err) {
            console.error('Error turning off flash:', err);
        }
    }

    async requestCamera() {
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const constraints = {
                video: {
                    facingMode: isMobile ? 'environment' : 'user'
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraStream = stream;
            this.cameraInitialized = true;
            
            // Get the video track and check torch capability
            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            
            // Check and store torch capability
            this.hasTorch = capabilities?.torch || false;
            if (this.hasTorch) {
                console.log('Torch is available on this device');
                this.torchTrack = videoTrack;
                // Try to turn on torch immediately if we're going to camera page
                if (this.currentPage === 5) {
                    await this.turnOnFlash();
                }
            } else {
                console.log('Torch is not available on this device');
            }

            document.getElementById('cameraFeed').srcObject = stream;
            this.goToPage(4);
        } catch (error) {
            console.error('Camera access denied:', error);
            document.querySelector('.camera-message').classList.add('hidden');
            document.querySelector('.camera-denied').classList.remove('hidden');
            this.goToPage(3);
        }
    }

    goToPage(pageNumber) {
        // Don't allow going back to animation pages
        if (pageNumber <= 2 && this.currentPage > 2) {
            return;
        }

        // Handle flash based on page
        if (pageNumber === 5) {
            setTimeout(() => this.turnOnFlash(), 500); // Delay torch activation slightly
        } else {
            this.turnOffFlash();
        }

        if (this.currentPage === 5 && pageNumber !== 5) {
            this.stopCamera();
        }
        
        this.pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
        this.currentPage = pageNumber;

        if (pageNumber === 4) {
            this.initializeBrickWall();
        } else if (pageNumber === 5) {
            this.initializeCamera();
        } else if (pageNumber === 9) {
            this.initializeScrollingWall();
        }
    }

    initializeBrickWall() {
        // Nothing to do here anymore as we're using a background image
        return;
    }

    initializeCamera() {
        if (this.cameraStream) {
            document.getElementById('cameraFeed').srcObject = this.cameraStream;
            setTimeout(() => this.turnOnFlash(), 500); // Delay torch activation
        } else {
            this.requestCamera();
        }
    }

    stopCamera() {
        this.turnOffFlash();
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => {
                track.stop();
            });
            this.cameraStream = null;
            this.torchTrack = null;
            this.hasTorch = false;
        }
    }

    capturePhoto() {
        const video = document.getElementById('cameraFeed');
        const canvas = document.getElementById('photoCanvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        this.recognizeArtwork(canvas)
            .then(artwork => {
                if (artwork) {
                    this.recognizedArtwork = artwork;
                    this.goToPage(6);
                    this.initializeChat();
                }
            });
    }

    async recognizeArtwork(canvas) {
        const artworks = [
            {
                id: 1,
                title: "Sample Artwork 1",
                image: "rsc/art1.jpg",
                keywords: ["abstract", "geometric", "blue", "modern"],
                description: "A contemporary piece exploring geometric forms"
            },
            {
                id: 2,
                title: "Sample Artwork 2",
                image: "rsc/art2.jpg",
                keywords: ["organic", "nature", "fluid", "green"],
                description: "An organic composition inspired by natural forms"
            },
            {
                id: 3,
                title: "Sample Artwork 3",
                image: "rsc/art3.jpg",
                keywords: ["urban", "dynamic", "movement", "structure"],
                description: "A dynamic interpretation of urban spaces"
            }
        ];

        return artworks[Math.floor(Math.random() * artworks.length)];
    }

    initializeChat() {
        const messages = document.querySelector('.chat-messages');
        messages.innerHTML = '';
    
        this.addChatMessage("Hello visitor");
        this.addChatMessage(`You've photographed ${this.recognizedArtwork.title}`);
        this.addChatMessage(this.recognizedArtwork.description);
        
        const thumbnailBubble = document.createElement('div');
        thumbnailBubble.className = 'chat-bubble';
        const thumbnail = document.createElement('img');
        thumbnail.src = this.recognizedArtwork.image;
        thumbnail.style.width = '25px';
        thumbnail.style.height = '40px';
        thumbnailBubble.appendChild(thumbnail);
        
        const keywordsPara = document.createElement('p');
        keywordsPara.textContent = `Keywords: ${this.recognizedArtwork.keywords.join(', ')}`;
        keywordsPara.style.marginTop = '5px';
        thumbnailBubble.appendChild(keywordsPara);
        
        messages.appendChild(thumbnailBubble);
    
        this.addChatMessage("I've got a sharp eye, right?");
        
        const chatButtons = document.querySelector('.chat-buttons');
        chatButtons.style.display = 'flex';
        document.getElementById('messageInput').disabled = true;
        
        document.getElementById('yesBtn').style.display = 'block';
        document.getElementById('noBtn').style.display = 'block';
    }

    addChatMessage(text) {
        const messages = document.querySelector('.chat-messages');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    handlePositiveResponse() {
        document.getElementById('yesBtn').style.display = 'none';
        document.getElementById('noBtn').style.display = 'none';
        this.addChatMessage("Great! Let me ask you something about this artwork...");
        document.getElementById('messageInput').disabled = false;
    }

    handleNegativeResponse() {
        this.goToPage(5);
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(message);
            input.value = '';
            
            setTimeout(() => {
                this.goToPage(7);
                setTimeout(() => {
                    this.goToPage(8);
                }, 3000);
            }, 1000);
        }
    }

    initializeScrollingWall() {
        this.initializeBrickWall();
        const bricks = document.querySelectorAll('.scrolling .brick');
        
        bricks.forEach((brick, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            this.animateBrick(brick, direction);
        });
    }

    animateBrick(brick, direction) {
        const duration = 10000;
        const start = brick.offsetLeft;
        const distance = window.innerWidth;
        let startTime = null;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const position = start + (distance * progress * direction);
                brick.style.left = `${position}px`;
                requestAnimationFrame(animate);
            } else {
                brick.style.left = start + 'px';
                startTime = null;
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
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
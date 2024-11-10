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
        this.torchEnabled = false;
        
        this.initializeEventListeners();
        this.preloadResources();
        this.monitorLogoAnimation();
        this.setupLogoAnimationCounter();
        this.userResponse = '';
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
            'rsc/art3.jpg',
            'rsc/bg_last.jpg'  // Add this line
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
                console.error('Failed to load:', url);
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
            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                console.log('Torch not supported on this device');
                return;
            }
            await track.applyConstraints({
                advanced: [{ torch: true }]
            });
        } catch (err) {
            console.error('Error turning on flash:', err);
        }
    }

    async turnOffFlash() {
        try {
            if (!this.cameraStream) return;
            const track = this.cameraStream.getVideoTracks()[0];
            if (!track) return;
            await track.applyConstraints({ advanced: [{ torch: false }] });
            this.torchEnabled = false;
        } catch (err) {
            console.error('Error turning off flash:', err);
        }
    }

    async requestCamera() {
        try {
            if (this.cameraStream) {
                this.stopCamera();
            }

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const constraints = {
                video: {
                    facingMode: isMobile ? 'environment' : 'user',
                    advanced: [{ torch: true }]
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraStream = stream;
            this.cameraInitialized = true;
            document.getElementById('cameraFeed').srcObject = stream;
            this.goToPage(4);
        } catch (error) {
            console.error('Camera access error:', error);
            document.querySelector('.camera-message').classList.add('hidden');
            document.querySelector('.camera-denied').classList.remove('hidden');
            this.goToPage(3);
        }
    }

    goToPage(pageNumber) {
        if (pageNumber <= 2 && this.currentPage > 2) {
            return;
        }

        if (pageNumber === 5) {
            if (!this.cameraInitialized) {
                this.requestCamera().then(() => {
                    setTimeout(() => this.turnOnFlash(), 500);
                });
            } else {
                setTimeout(() => this.turnOnFlash(), 500);
            }
        } else if (this.currentPage === 5) {
            this.turnOffFlash();
            if (pageNumber !== 5) {
                this.stopCamera();
            }
        }

        this.pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
        this.currentPage = pageNumber;

        if (pageNumber === 5) {
            this.initializeCamera();
        }
    }

    initializeCamera() {
        if (this.cameraStream) {
            document.getElementById('cameraFeed').srcObject = this.cameraStream;
            setTimeout(() => this.turnOnFlash(), 500);
        } else {
            this.requestCamera();
        }
    }

    stopCamera() {
        this.turnOffFlash();
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            this.cameraInitialized = false;
            this.torchEnabled = false;
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
                title: "Étude pour l'Homme cherche midi",
                artiste: "Caroline Challan-Belval",
                date: "2011",
                provenance: "Collection du CIAC",
                picto: "SI CONCERNEE",
                image: "rsc/art1.jpg",
                question: "Imaginons ce que fait cette personne..."
            },
            {
                id: 2,
                title: "Sans titre",
                artiste: "Michel Carlin",
                date: "2000",
                provenance: "Collection du CIAC Prêt",
                picto: "OBSERVER",
                image: "rsc/art2.jpg",
                question: "Que voyez-vous ? Que se passe-t-il ?"
            },
            {
                id: 3,
                title: "Si on frappe une plume bleue avec un marteau, l'air est écrasé et l'on peut voir le bleu disparaître",
                artiste: "Hélène Bertin, Aline Cado et Lamia Talaï",
                date: "2023",
                provenance: "Prêt",
                picto: "Explorer",
                image: "rsc/art3.jpg",
                question: "Regardons un instant la variété des couleurs des plumes. Que nous évoque cette œuvre ?"
            }
        ];
        return artworks[Math.floor(Math.random() * artworks.length)];
    }

    addChatMessage(text) {
        const messages = document.querySelector('.chat-messages');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    initializeChat() {
        const messages = document.querySelector('.chat-messages');
        messages.innerHTML = '';

        this.addChatMessage("Salut");
        this.addChatMessage(`Vous avez photographié "${this.recognizedArtwork.title}"`);
        this.addChatMessage(`Une œuvre de ${this.recognizedArtwork.artiste} (${this.recognizedArtwork.date})`);
        this.addChatMessage(`${this.recognizedArtwork.provenance}`);

        const thumbnailBubble = document.createElement('div');
        thumbnailBubble.className = 'chat-bubble';
        const thumbnail = document.createElement('img');
        thumbnail.src = this.recognizedArtwork.image;
        thumbnail.style.width = '25px';
        thumbnail.style.height = '40px';
        thumbnailBubble.appendChild(thumbnail);
        messages.appendChild(thumbnailBubble);

        this.addChatMessage("J'ai un œil de lynx, n'est-ce pas ?");

        const chatButtons = document.querySelector('.chat-buttons');
        chatButtons.style.display = 'flex';
        document.getElementById('messageInput').disabled = true;
        document.getElementById('yesBtn').style.display = 'block';
        document.getElementById('noBtn').style.display = 'block';
    }
    
    handlePositiveResponse() {
        document.getElementById('yesBtn').style.display = 'none';
        document.getElementById('noBtn').style.display = 'none';
        this.addChatMessage(`${this.recognizedArtwork.picto} : ${this.recognizedArtwork.question}`);
        document.getElementById('messageInput').disabled = false;
        document.getElementById('messageInput').placeholder = "Tapez votre réponse...";
    }

    handleNegativeResponse() {
        this.goToPage(5);
    }

    // Ajouter ces fonctions après sendMessage() et avant la fin de la classe PageManager

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            this.userResponse = message;
            this.addChatMessage(message);
            input.value = '';
            
            setTimeout(() => {
                this.goToPage(7);
                setTimeout(() => {
                    this.goToPage(9);
                    this.initializeScrollingText();
                }, 3000);
            }, 1000);
        }
    }

    initializeScrollingText() {
        const container = document.querySelector('.scrolling-wall');
        container.innerHTML = '';

        const answers = [
            "Du jardinage",
            "Le monsieur pèche",
            "Il randonne sur le Mont Chauve",
            "Cette personne skie",
            "Il saute à la perche",
            "Le monsieur fait voler un cerf volant",
            "Le souvenir douloureux de la guerre, le corps dans la boue",
            "Une main abimé",
            "Un corps qui se jette",
            "Une superposition de marron",
            "De la terre",
            "Un oasis dans un désert coloré",
            "Une doudoune",
            "Un costume pour Halloween",
            "Les oiseaux déplumées",
            "Un oiseau rare",
            "Une pallette de peinture",
            "Un paysage impressioniste"
        ];

        const scrollingContent = document.createElement('div');
        scrollingContent.className = 'scrolling-content';
        container.appendChild(scrollingContent);

        // Ajouter l'élément avec la réponse de l'utilisateur
        const userLine = document.createElement('div');
        userLine.className = 'content-line';
        const userText = document.createElement('p');
        userText.textContent = this.userResponse;
        userText.className = 'scroll-text';
        userLine.appendChild(userText);
        scrollingContent.appendChild(userLine);

        // Ajouter les réponses prédéfinies
        answers.forEach(answer => {
            const line = document.createElement('div');
            line.className = 'content-line';
            const text = document.createElement('p');
            text.textContent = answer;
            text.className = 'scroll-text';
            line.appendChild(text);
            scrollingContent.appendChild(line);
        });

        // Animation de défilement
        let scrollPosition = 0;
        const animate = () => {
            scrollPosition -= 1;
            scrollingContent.style.transform = `translateX(${scrollPosition}px)`;
            
            // Reset position when content is off screen
            const contentWidth = scrollingContent.offsetWidth;
            if (-scrollPosition > contentWidth / 2) {
                scrollPosition = 0;
            }
            
            requestAnimationFrame(animate);
        };

        animate();
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

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const cardContainer = document.getElementById('card-container');
    const startBtn = document.getElementById('start-game');
    const resetBtn = document.getElementById('reset-game');
    const playAgainBtn = document.getElementById('play-again');
    const soundToggleBtn = document.getElementById('sound-toggle');
    const winMessage = document.getElementById('win-message');
    const movesDisplay = document.getElementById('moves');
    const timerDisplay = document.getElementById('timer');
    const matchesDisplay = document.getElementById('matches');
    const finalMoves = document.getElementById('final-moves');
    const finalTime = document.getElementById('final-time');
    const difficultyButtons = document.querySelectorAll('.difficulty-buttons button');
    
    // Audio elements
    const flipSound = document.getElementById('flip-sound');
    const matchSound = document.getElementById('match-sound');
    const mismatchSound = document.getElementById('mismatch-sound');
    const winSound = document.getElementById('win-sound');
    const selectSound = document.getElementById('select-sound');
    
    // Game state
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timer = 0;
    let timerInterval;
    let gameStarted = false;
    let canFlip = true;
    let gridSize = 4; // Default to 4x4 grid
    let soundEnabled = true;
    
    // Available card images (excluding back.svg)
    const availableImages = [
        "ace_of_clubs.png",
        "ace_of_diamonds.png",
        "ace_of_hearts.png",
        "ace_of_spades.png",
        "2_of_clubs.png",
        "2_of_diamonds.png",
        "2_of_hearts.png",
        "2_of_spades.png",
        "3_of_clubs.png",
        "3_of_diamonds.png",
        "3_of_hearts.png",
        "3_of_spades.png",
        "4_of_clubs.png",
        "4_of_diamonds.png",
        "4_of_hearts.png",
        "4_of_spades.png",
        "5_of_clubs.png",
        "5_of_diamonds.png",
        "5_of_hearts.png",
        "5_of_spades.png",
        "6_of_clubs.png",
        "6_of_diamonds.png",
        "6_of_hearts.png",
        "6_of_spades.png",
        "7_of_clubs.png",
        "7_of_diamonds.png",
        "7_of_hearts.png",
        "7_of_spades.png",
        "8_of_clubs.png",
        "8_of_diamonds.png",
        "8_of_hearts.png",
        "8_of_spades.png",
        "9_of_clubs.png",
        "9_of_diamonds.png",
        "9_of_hearts.png",
        "9_of_spades.png",
        "10_of_clubs.png",
        "10_of_diamonds.png", 
        "10_of_hearts.png",
        "10_of_spades.png",
        "jack_of_clubs2.png",
        "jack_of_diamonds2.png",
        "jack_of_hearts2.png",
        "jack_of_spades2.png",
        "queen_of_clubs2.png",
        "queen_of_diamonds2.png",
        "queen_of_hearts2.png",
        "queen_of_spades2.png",
        "king_of_clubs2.png",
        "king_of_diamonds2.png",
        "king_of_hearts2.png",
        "king_of_spades2.png",
        "red_joker.png",
        "black_joker.png"
       ];
    
    // Initialize game
    function initGame() {
        // Reset game state
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        timer = 0;
        gameStarted = false;
        canFlip = true;
        
        // Update displays
        movesDisplay.textContent = moves;
        matchesDisplay.textContent = matchedPairs;
        timerDisplay.textContent = `${timer}s`;
        
        // Clear timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Hide win message
        winMessage.style.display = 'none';
        
        // Create cards based on grid size
        createCards();
    }
    
    // Create card elements using dynamic image-based logic
    function createCards() {
        cardContainer.innerHTML = '';
        
        // Determine number of pairs based on grid size
        const totalPairs = (gridSize * gridSize) / 2;
        
        // Check if we have enough unique images
        if (availableImages.length < totalPairs) {
            console.warn(`Not enough unique images. Need ${totalPairs}, have ${availableImages.length}`);
        }
        
        // Select random images for this game
        const selectedImages = selectRandomImages(totalPairs);
        
        // Create pairs of image names
        const imagePairs = [];
        selectedImages.forEach(imageName => {
            // Add two copies of each image for matching
            imagePairs.push(imageName);
            imagePairs.push(imageName);
        });
        
        // Shuffle the image pairs
        shuffleArray(imagePairs);
        
        // Update grid layout
        cardContainer.className = `card-container grid-${gridSize}x${gridSize}`;
        
        // Create card elements
        imagePairs.forEach((imageName, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'memory-card';
            cardWrapper.dataset.index = index;
            cardWrapper.dataset.imageName = imageName;
            
            // Create card using dynamic logic
            const card = createCardElement(imageName);
            
            // Add click handler
            cardWrapper.addEventListener('click', () => flipCard(cardWrapper, imageName));
            
            // Mount card to wrapper
            cardWrapper.appendChild(card);
            cardContainer.appendChild(cardWrapper);
            
            cards.push({
                wrapper: cardWrapper,
                element: card,
                imageName: imageName,
                isFlipped: false,
                isMatched: false
            });
        });
    }
    
    // Select random images for the current game
    function selectRandomImages(totalPairs) {
        const shuffled = [...availableImages].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, totalPairs);
    }
    
    // Create a card element - DYNAMIC VERSION
    function createCardElement(imageName) {
        // Create card element
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.imageName = imageName;
        
        // Create face element with the specific image
        const faceEl = document.createElement('div');
        faceEl.className = 'face';
        
        // Set the image based on the image name
        const faceImage = `faces/${imageName}`;
        faceEl.style.backgroundImage = `url("${faceImage}")`;
        
        // Create back element
        const backEl = document.createElement('div');
        backEl.className = 'back';
        backEl.style.backgroundImage = 'url("faces/back.svg")';
        
        // Add elements to card
        cardEl.appendChild(faceEl);
        cardEl.appendChild(backEl);
        
        return cardEl;
    }
    
    // Flip card function - UPDATED for image name matching
    function flipCard(cardWrapper, imageName) {
        // If game hasn't started, start it
        if (!gameStarted) {
            startGame();
        }
        
        // Find the card in our cards array
        const cardIndex = cards.findIndex(card => card.wrapper === cardWrapper);
        if (cardIndex === -1) return;
        
        const card = cards[cardIndex];
        
        // Check if card can be flipped
        if (!canFlip || card.isFlipped || card.isMatched) {
            return;
        }
        
        // Play flip sound
        playSound(flipSound);
        
        // Flip the card
        card.isFlipped = true;
        cardWrapper.classList.add('flipped');
        flippedCards.push(card);
        
        // Check for match when two cards are flipped
        if (flippedCards.length === 2) {
            canFlip = false;
            moves++;
            movesDisplay.textContent = moves;
            
            const card1 = flippedCards[0];
            const card2 = flippedCards[1];
            
            // MATCH CONDITION: Compare image names
            if (card1.imageName === card2.imageName) {
                // Match found
                playSound(matchSound);
                
                card1.isMatched = true;
                card2.isMatched = true;
                card1.wrapper.classList.add('matched');
                card2.wrapper.classList.add('matched');
                matchedPairs++;
                matchesDisplay.textContent = matchedPairs;
                
                // Add pulse animation to stats
                matchesDisplay.parentElement.classList.add('pulse');
                setTimeout(() => {
                    matchesDisplay.parentElement.classList.remove('pulse');
                }, 500);
                
                flippedCards = [];
                canFlip = true;
                
                // Check for win
                checkWin();
            } else {
                // No match
                playSound(mismatchSound);
                
                setTimeout(() => {
                    card1.isFlipped = false;
                    card2.isFlipped = false;
                    card1.wrapper.classList.remove('flipped');
                    card2.wrapper.classList.remove('flipped');
                    card1.wrapper.classList.add('error');
                    card2.wrapper.classList.add('error');
                    
                    setTimeout(() => {
                        card1.wrapper.classList.remove('error');
                        card2.wrapper.classList.remove('error');
                    }, 500);
                    
                    flippedCards = [];
                    canFlip = true;
                }, 1000);
            }
        }
    }
    
    // Start the game (unchanged)
    function startGame() {
        gameStarted = true;
        
        // Start timer
        timerInterval = setInterval(() => {
            timer++;
            timerDisplay.textContent = `${timer}s`;
        }, 1000);
    }
    
    // Check for win condition (unchanged)
    function checkWin() {
        const totalPairs = (gridSize * gridSize) / 2;
        
        if (matchedPairs === totalPairs) {
            // Game won
            clearInterval(timerInterval);
            
            // Play win sound
            playSound(winSound);
            
            // Create confetti effect
            createConfetti();
            
            // Update final stats
            finalMoves.textContent = moves;
            finalTime.textContent = `${timer}s`;
            
            // Show win message with delay for last card animation
            setTimeout(() => {
                winMessage.style.display = 'block';
            }, 500);
        }
    }
    
    // Create confetti effect (unchanged)
    function createConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        });
        
        setTimeout(() => confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 }
        }), 250);
        
        setTimeout(() => confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 }
        }), 400);
    }
    
    // Utility function to play sound (unchanged)
    function playSound(soundElement) {
        if (soundEnabled) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => {
                console.log("Audio play failed:", e);
            });
        }
    }
    
    // Toggle sound on/off (unchanged)
    function toggleSound() {
        soundEnabled = !soundEnabled;
        
        if (soundEnabled) {
            soundToggleBtn.textContent = '🔊 Sound On';
            soundToggleBtn.classList.remove('sound-off');
            soundToggleBtn.classList.add('sound-on');
        } else {
            soundToggleBtn.textContent = '🔇 Sound Off';
            soundToggleBtn.classList.remove('sound-on');
            soundToggleBtn.classList.add('sound-off');
        }
        
        if (soundEnabled) {
            playSound(selectSound);
        }
    }
    
    // Utility function to shuffle array (unchanged)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Set difficulty level (unchanged)
    function setDifficulty(level) {
        playSound(selectSound);
        
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        switch(level) {
            case 'easy':
                gridSize = 4;
                break;
            case 'medium':
                gridSize = 6;
                break;
        }
        
        initGame();
    }
    
    // Event listeners (unchanged)
    startBtn.addEventListener('click', () => {
        playSound(selectSound);
        initGame();
    });
    
    resetBtn.addEventListener('click', () => {
        playSound(selectSound);
        initGame();
    });
    
    playAgainBtn.addEventListener('click', () => {
        playSound(selectSound);
        initGame();
    });
    
    soundToggleBtn.addEventListener('click', toggleSound);
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => setDifficulty(button.id));
    });
    
    // Initialize the game
    initGame();
});
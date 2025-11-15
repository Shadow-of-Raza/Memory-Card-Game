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
    let soundEnabled = true; // Sound is enabled by default
    
    // Card suits and ranks
    const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
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
    
    // Create card elements using custom logic
    function createCards() {
        cardContainer.innerHTML = '';
        
        // Determine number of pairs based on grid size
        const totalPairs = (gridSize * gridSize) / 2;
        
        // Create pairs of card indices
        const cardIndices = [];
        const usedIndices = new Set();
        
        while (cardIndices.length < totalPairs * 2) {
            const randomIndex = Math.floor(Math.random() * 52); // 52 cards total
            if (!usedIndices.has(randomIndex)) {
                // Add two copies of each card for matching
                cardIndices.push(randomIndex);
                cardIndices.push(randomIndex);
                usedIndices.add(randomIndex);
                
                if (cardIndices.length >= totalPairs * 2) break;
            }
        }
        
        // Shuffle the card indices
        shuffleArray(cardIndices);
        
        // Update grid layout
        cardContainer.className = `card-container grid-${gridSize}x${gridSize}`;
        
        // Create card elements
        cardIndices.forEach((cardIndex, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'memory-card';
            cardWrapper.dataset.index = index;
            cardWrapper.dataset.cardId = cardIndex;
            
            // Create card using custom logic
            const card = createCardElement(cardIndex);
            
            // Add click handler
            cardWrapper.addEventListener('click', () => flipCard(cardWrapper, cardIndex));
            
            // Mount card to wrapper
            cardWrapper.appendChild(card);
            cardContainer.appendChild(cardWrapper);
            
            cards.push({
                wrapper: cardWrapper,
                element: card,
                id: cardIndex,
                isFlipped: false,
                isMatched: false
            });
        });
    }
    
    // Create a card element
    function createCardElement(cardIndex) {
        // Calculate suit and rank
        const suitIndex = Math.floor(cardIndex / 13);
        const rankIndex = cardIndex % 13;
        const suit = suits[suitIndex];
        const rank = ranks[rankIndex];
        
        // Create card element
        const cardEl = document.createElement('div');
        cardEl.className = `card ${suit} rank${rankIndex + 1}`;
        cardEl.dataset.suit = suit;
        cardEl.dataset.rank = rankIndex + 1;
        
        // Create face element
        const faceEl = document.createElement('div');
        faceEl.className = 'face';
        
        // Set the appropriate face image based on suit and rank
        const faceImage = `faces/${suitIndex}_${rankIndex + 1}.svg`;
        faceEl.style.backgroundImage = `url("${faceImage}")`;
        
        // Create rank indicators for the front face
        const rankTop = document.createElement('div');
        rankTop.className = 'rank-top';
        rankTop.textContent = rank;
        
        const rankBottom = document.createElement('div');
        rankBottom.className = 'rank-bottom';
        rankBottom.textContent = rank;
        
        // Create back element
        const backEl = document.createElement('div');
        backEl.className = 'back';
        backEl.style.backgroundImage = 'url("faces/back.svg")';
        
        // Add elements to card - ranks go on the face only
        faceEl.appendChild(rankTop);
        faceEl.appendChild(rankBottom);
        cardEl.appendChild(faceEl);
        cardEl.appendChild(backEl);
        
        return cardEl;
    }
    
    // Flip card function
    function flipCard(cardWrapper, cardId) {
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
            
            if (card1.id === card2.id) {
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
    
    // Start the game
    function startGame() {
        gameStarted = true;
        
        // Start timer
        timerInterval = setInterval(() => {
            timer++;
            timerDisplay.textContent = `${timer}s`;
        }, 1000);
    }
    
    // Check for win condition
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
    
    // Create confetti effect
    function createConfetti() {
        // Use the confetti library
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        });
        
        // Additional bursts for more celebration
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
    
    // Utility function to play sound
    function playSound(soundElement) {
        if (soundEnabled) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => {
                console.log("Audio play failed:", e);
            });
        }
    }
    
    // Toggle sound on/off
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
        
        // Play a sound to indicate the change (if sound is being turned on)
        if (soundEnabled) {
            playSound(selectSound);
        }
    }
    
    // Utility function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Set difficulty level
    function setDifficulty(level) {
        // Play select sound
        playSound(selectSound);
        
        // Update active button
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Set grid size based on difficulty
        switch(level) {
            case 'easy':
                gridSize = 4; // 4x4 grid (8 pairs)
                break;
            case 'medium':
                gridSize = 6; // 6x6 grid (18 pairs)
                break;
        }
        
        // Restart game with new difficulty
        initGame();
    }
    
    // Event listeners
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
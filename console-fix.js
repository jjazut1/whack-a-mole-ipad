// Emergency fix for iPad game selection buttons
// Paste this entire script into the browser console if buttons are not working

(function() {
    console.log("Applying emergency fix for game selection buttons");
    
    // Get all game option buttons
    const buttons = document.querySelectorAll('.game-option');
    console.log(`Found ${buttons.length} game option buttons`);
    
    if (buttons.length === 0) {
        console.error("No game buttons found! Check HTML structure.");
        return;
    }
    
    // Apply direct click handlers to each button
    buttons.forEach(button => {
        console.log(`Setting up handler for ${button.textContent}`);
        
        // Clear any existing handlers
        button.onclick = null;
        button.ontouchend = null;
        
        // Add new direct handler
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Button clicked: ${this.textContent}`);
            
            // Get game data
            const selectedGame = this.getAttribute('data-game');
            if (!selectedGame) {
                console.error("Button missing data-game attribute!");
                return;
            }
            
            console.log(`Selected game: ${selectedGame}`);
            
            // Get required elements
            const gameSelection = document.getElementById('game-selection');
            const gameTitleDisplay = document.getElementById('game-title-display');
            
            // Provide visual feedback
            this.style.backgroundColor = '#7BC67B';
            
            // Set the current category
            window.currentCategory = selectedGame;
            window.correctWords = window.wordCategories[selectedGame].words;
            window.incorrectWords = window.generateIncorrectWords(selectedGame);
            
            // Update the UI
            if (gameSelection) gameSelection.style.display = 'none';
            if (gameTitleDisplay) {
                gameTitleDisplay.textContent = window.wordCategories[selectedGame].title;
                gameTitleDisplay.style.display = 'block';
            }
            
            // Start the game
            setTimeout(() => {
                window.startGame();
            }, 50);
        };
        
        // Add touch handler for iPads
        button.ontouchend = function(e) {
            e.preventDefault();
            console.log(`Touch detected on button: ${this.textContent}`);
            this.onclick(e);
        };
        
        // Make buttons more visible
        button.style.backgroundColor = '#90EE90';
        button.style.fontSize = '28px';
        button.style.padding = '20px';
        button.style.margin = '15px 0';
        button.style.position = 'relative';
        button.style.zIndex = '100';
    });
    
    // Also make game selection container more visible
    const gameSelection = document.getElementById('game-selection');
    if (gameSelection) {
        gameSelection.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        gameSelection.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.4)';
        gameSelection.style.zIndex = '50';
    }
    
    console.log("Emergency fix applied - try clicking the buttons now");
})(); 
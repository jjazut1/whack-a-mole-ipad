// Quick fix for iPad game selection issues - Copy and paste into browser console
(function() {
    console.log("Applying emergency fix for iPad game selection issues");
    
    // Get game selection and game options
    const gameSelection = document.getElementById('game-selection');
    const gameOptions = document.querySelectorAll('.game-option');
    
    console.log(`Found game selection: ${gameSelection ? 'Yes' : 'No'}`);
    console.log(`Found ${gameOptions.length} game options`);
    
    if (!gameSelection || gameOptions.length === 0) {
        console.error("Required elements not found! Check HTML structure.");
        return;
    }
    
    // Fix 1: Ensure game selection is initially visible
    gameSelection.style.display = 'block';
    gameSelection.style.visibility = 'visible';
    gameSelection.style.opacity = '1';
    gameSelection.style.pointerEvents = 'auto';
    
    // Fix 2: Make sure any "hidden" class is removed
    gameSelection.classList.remove('hidden');
    
    // Fix 3: Add hardware acceleration for better iOS performance
    gameSelection.style.webkitTransform = 'translate3d(0,0,0)';
    gameSelection.style.transform = 'translate3d(0,0,0)';
    
    // Fix 4: Apply improved styles for touch targets
    const buttonStyle = document.createElement('style');
    buttonStyle.textContent = `
        .game-option {
            z-index: 100 !important;
            position: relative !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent !important;
            user-select: none !important;
            -webkit-user-select: none !important;
        }
        
        #game-selection {
            z-index: 99 !important;
        }
        
        /* When hidden */
        #game-selection.hidden {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(buttonStyle);
    
    // Fix 5: Replace all button handlers
    gameOptions.forEach(button => {
        // Remove existing handlers by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new handlers
        newButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Button clicked: ${this.textContent}`);
            
            // Get game data
            const selectedGame = this.getAttribute('data-game');
            if (!selectedGame) {
                console.error("Button missing data-game attribute!");
                return false;
            }
            
            // Visual feedback
            this.style.backgroundColor = '#7BC67B';
            
            // Set the current category
            window.currentCategory = selectedGame;
            window.correctWords = window.wordCategories[selectedGame].words;
            window.incorrectWords = window.generateIncorrectWords(selectedGame);
            
            // Force game selection to hide with multiple methods
            gameSelection.style.display = 'none';
            gameSelection.classList.add('hidden');
            gameSelection.style.visibility = 'hidden';
            gameSelection.style.opacity = '0';
            gameSelection.style.pointerEvents = 'none';
            
            console.log("Game selection hidden");
            
            // Show game title
            const gameTitleDisplay = document.getElementById('game-title-display');
            if (gameTitleDisplay) {
                gameTitleDisplay.textContent = window.wordCategories[selectedGame].title;
                gameTitleDisplay.style.display = 'block';
            }
            
            // Start the game with delay
            setTimeout(() => {
                // Ensure game starts
                window.startGame();
                console.log("Game started");
            }, 100);
            
            return false;
        };
        
        // Add separate touch handlers
        ['touchstart', 'touchend'].forEach(eventType => {
            newButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (eventType === 'touchend') {
                    this.onclick(e);
                }
                
                if (eventType === 'touchstart') {
                    this.style.backgroundColor = '#7BC67B';
                    this.style.transform = 'scale(0.95)';
                }
            }, { passive: false });
        });
    });
    
    // Fix 6: Override window.handleInteraction to prevent game selection issues
    const originalHandleInteraction = window.handleInteraction || function(){};
    window.handleInteraction = function(event) {
        // Don't allow normal interaction when game selection is visible
        if (gameSelection.style.display !== 'none' && !gameSelection.classList.contains('hidden')) {
            console.log("Blocking interaction while game selection visible");
            if (event.type.startsWith('touch')) {
                event.preventDefault();
            }
            return;
        }
        
        // Call original handler
        originalHandleInteraction.call(this, event);
    };
    
    console.log("Emergency fix applied! Game selection should now work correctly.");
})(); 
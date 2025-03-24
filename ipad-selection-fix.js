// COPY AND PASTE THIS ENTIRE SCRIPT INTO YOUR IPAD SAFARI CONSOLE
// TO FIX THE GAME SELECTION POPUP ISSUE

(function() {
  console.log("🔧 Applying iPad Safari game selection fix...");
  
  // 1. Force hide any currently visible game selection
  const gameSelection = document.getElementById('game-selection');
  if (gameSelection) {
    // Apply multiple hiding techniques
    gameSelection.style.display = 'none';
    gameSelection.style.visibility = 'hidden';
    gameSelection.style.opacity = '0';
    gameSelection.style.pointerEvents = 'none';
    gameSelection.style.position = 'absolute';
    gameSelection.style.zIndex = '-999';
    gameSelection.style.transform = 'translateY(-9999px)';
    
    console.log("✅ Forcefully hidden game selection popup");
  }
  
  // 2. Add CSS to ensure popups stay hidden
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    #game-selection[style*="display"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      z-index: -999 !important;
      transform: translateY(-100vh) !important;
    }
    
    .game-option {
      min-height: 50px;
      padding: 15px;
      margin: 10px 0;
      font-size: 20px;
    }
  `;
  document.head.appendChild(styleEl);
  console.log("✅ Added CSS fixes");
  
  // 3. Patch the game option selection process
  document.querySelectorAll('.game-option').forEach(option => {
    // Remove existing event listeners by cloning the element
    const newOption = option.cloneNode(true);
    if (option.parentNode) {
      option.parentNode.replaceChild(newOption, option);
    }
    
    // Add our own event handler that forcefully hides the popup
    newOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Get the game type from the data attribute
      const gameType = this.getAttribute('data-game');
      console.log("🎮 Selected game:", gameType);
      
      // Hide game selection with multiple approaches
      const gameSelection = document.getElementById('game-selection');
      if (gameSelection) {
        gameSelection.style.display = 'none';
        gameSelection.style.visibility = 'hidden';
        gameSelection.style.opacity = '0';
        gameSelection.style.pointerEvents = 'none';
        gameSelection.style.transform = 'translateY(-9999px)';
        
        // Physically remove from DOM temporarily
        if (gameSelection.parentNode) {
          const placeholder = document.createElement('div');
          placeholder.id = 'game-selection-placeholder';
          placeholder.style.display = 'none';
          gameSelection.parentNode.insertBefore(placeholder, gameSelection);
          document.body.appendChild(gameSelection);
          gameSelection.style.display = 'none';
          
          // Restore in original position but keep hidden
          setTimeout(() => {
            if (placeholder.parentNode) {
              placeholder.parentNode.insertBefore(gameSelection, placeholder);
              placeholder.parentNode.removeChild(placeholder);
              gameSelection.style.display = 'none';
            }
          }, 2000);
        }
      }
      
      // Set current category and words (copied from original handler)
      if (window.currentCategory !== undefined) {
        window.currentCategory = gameType;
        window.correctWords = window.wordCategories[gameType].words;
        window.incorrectWords = window.generateIncorrectWords(gameType);
        
        // Show game title
        const gameTitleDisplay = document.getElementById('game-title-display');
        if (gameTitleDisplay) {
          gameTitleDisplay.textContent = window.wordCategories[gameType].title;
          gameTitleDisplay.style.display = 'block';
        }
        
        // Start the game
        console.log("🚀 Starting game...");
        window.startGame();
      } else {
        console.error("❌ Game variables not found. Try refreshing the page.");
      }
    });
    
    // Also add touch event for better handling
    newOption.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Simply trigger the click handler
      setTimeout(() => {
        this.click();
      }, 10);
    }, { passive: false });
    
    console.log("✅ Fixed event handler for button: " + newOption.textContent.trim());
  });
  
  // 4. Patch the startGame function for extra safety
  if (window.startGame) {
    const originalStartGame = window.startGame;
    window.startGame = function() {
      // Hide selection UI first
      const gameSelection = document.getElementById('game-selection');
      if (gameSelection) {
        gameSelection.style.display = 'none';
        gameSelection.style.visibility = 'hidden';
        gameSelection.style.opacity = '0';
      }
      
      // Call original function
      return originalStartGame.apply(this, arguments);
    };
    console.log("✅ Patched startGame function");
  }
  
  console.log("✨ iPad Safari game selection fix applied successfully!");
  console.log("🎮 Try selecting a game option now - the popup should close properly.");
  
  return "Fix applied successfully!";
})(); 
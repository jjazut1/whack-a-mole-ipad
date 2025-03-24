// COPY AND PASTE THIS INTO SAFARI CONSOLE TO STANDARDIZE ALL INTERACTIONS TO CLICKS
(function() {
  console.log("🔄 Converting all game interactions to standardized click events...");
  
  // 1. Fix game selection popup
  const gameSelection = document.getElementById('game-selection');
  if (gameSelection) {
    console.log("- Processing game selection UI");
    
    // Apply aggressive hiding
    gameSelection.style.display = 'none';
    gameSelection.style.visibility = 'hidden';
    gameSelection.style.opacity = '0';
    gameSelection.style.pointerEvents = 'none';
    gameSelection.style.position = 'absolute';
    gameSelection.style.zIndex = '-9999';
    gameSelection.classList.add('hidden');
  }
  
  // 2. Add CSS for bulletproof popup hiding
  const style = document.createElement('style');
  style.innerHTML = `
    #game-selection, #game-selection.hidden, #game-selection[style*="display"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      z-index: -9999 !important;
      transform: translateY(-9999px) !important;
    }
    
    /* Make touch targets bigger */
    .game-option {
      min-height: 60px;
      padding: 15px;
      margin: 8px 0;
      font-size: 22px;
      cursor: pointer;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: rgba(255,255,255,0.9);
      transition: background 0.2s;
    }
    
    .game-option:hover {
      background: rgba(220,255,220,0.95);
    }
  `;
  document.head.appendChild(style);
  console.log("- Added CSS fixes");
  
  // 3. Rebuild game selection buttons with standardized click events
  document.querySelectorAll('.game-option').forEach(option => {
    // Clone the option to remove existing event listeners
    const newOption = option.cloneNode(true);
    if (option.parentNode) {
      option.parentNode.replaceChild(newOption, option);
    }
    
    // Add our standardized click handler
    newOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Get the game type
      const gameType = this.getAttribute('data-game');
      console.log("🎮 Selected game:", gameType);
      
      // Hide game selection with multiple approaches
      const gameSelection = document.getElementById('game-selection');
      if (gameSelection) {
        // Apply every hiding technique possible
        gameSelection.style.display = 'none';
        gameSelection.style.visibility = 'hidden';
        gameSelection.style.opacity = '0';
        gameSelection.style.pointerEvents = 'none';
        gameSelection.style.zIndex = '-9999';
        gameSelection.classList.add('hidden');
        
        // Temporarily remove from DOM
        if (gameSelection.parentNode) {
          const placeholder = document.createElement('div');
          placeholder.id = 'game-selection-placeholder';
          placeholder.style.display = 'none';
          gameSelection.parentNode.insertBefore(placeholder, gameSelection);
          
          // Move to a hidden container
          const tempContainer = document.createElement('div');
          tempContainer.id = 'temp-selection-container';
          tempContainer.style.display = 'none';
          document.body.appendChild(tempContainer);
          tempContainer.appendChild(gameSelection);
          
          // Restore later but keep hidden
          setTimeout(() => {
            if (placeholder.parentNode && tempContainer.contains(gameSelection)) {
              placeholder.parentNode.insertBefore(gameSelection, placeholder);
              placeholder.parentNode.removeChild(placeholder);
              document.body.removeChild(tempContainer);
              gameSelection.style.display = 'none';
            }
          }, 1000);
        }
      }
      
      // Set current category and words
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
      }
    });
    
    // Convert touch events to clicks
    newOption.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    newOption.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => this.click(), 10);
    }, { passive: false });
    
    console.log(`- Fixed button: ${newOption.textContent.trim()}`);
  });
  
  // 4. Create a standardized event handling system
  console.log("- Standardizing game interaction events");
  
  // Store original handlers
  const originalHandleInteraction = window.handleInteraction;
  
  // Helper function to process mole hits
  function processMoleHit(mole) {
    // Mark this mole as being hit to prevent duplicate hits
    mole.userData.isMoving = true;
    
    if (window.isCorrectWord) {
      window.score += 10;
      
      // Increase streak counter
      window.correctStreak++;
      
      // Check for streak bonus
      if (window.correctStreak >= 3 && window.correctStreak % 3 === 0 && 
          window.lastStreakBonus !== window.correctStreak) {
        window.score += 10;
        window.lastStreakBonus = window.correctStreak;
        
        if (window.showStreakBonus) {
          window.showStreakBonus();
        }
      }
      
      // Add success indicator
      if (window.createSuccessIndicator) {
        window.createSuccessIndicator(mole.position.clone().add(new THREE.Vector3(0, 1, 0)));
      }
    } else {
      window.score = Math.max(0, window.score - 5);
      window.correctStreak = 0;
    }
    
    // Update UI
    if (window.updateUI) {
      window.updateUI();
    }
    
    // Animate mole back down
    setTimeout(() => {
      if (window.animateMole) {
        window.animateMole(mole, false);
      }
    }, 50);
  }
  
  // Define our standardized handler
  window.handleInteraction = function(event) {
    // For touch events, convert to a click
    if (event.type === 'touchstart') {
      event.preventDefault();
      event.stopPropagation();
      
      // Get touch coordinates
      const touch = event.touches[0];
      
      // Check if touching a game option (already handled separately)
      if (touch && event.target.closest('.game-option')) {
        return;
      }
      
      // Create a synthetic click
      const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      // Mark as processed
      clickEvent._processedFromTouch = true;
      
      // Find the element at this point and dispatch click
      setTimeout(() => {
        const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementAtPoint) {
          elementAtPoint.dispatchEvent(clickEvent);
        }
      }, 10);
      
      return;
    }
    
    // Only handle click events from here
    if (event.type !== 'click') {
      return;
    }
    
    // Prevent double processing
    if (event._processedFromTouch) {
      return;
    }
    
    // Use the original handler if available
    if (typeof originalHandleInteraction === 'function') {
      originalHandleInteraction.call(this, event);
    }
  };
  
  // 5. Rebind event listeners
  console.log("- Rebinding event listeners");
  
  // Remove existing listeners
  window.removeEventListener('click', originalHandleInteraction);
  window.removeEventListener('touchstart', originalHandleInteraction);
  
  // Add our standardized listeners
  window.addEventListener('click', window.handleInteraction);
  window.addEventListener('touchstart', window.handleInteraction, { passive: false });
  
  console.log("✅ All interactions standardized to clicks!");
  console.log("🎮 Try selecting a game option - the popup should close properly.");
  
  return "Click standardization complete! Game should work better on iPad now.";
})(); 
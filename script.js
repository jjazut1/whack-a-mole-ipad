// Import Three.js (Make sure you include Three.js in your HTML)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// Add this at the beginning of your script to check Three.js version
console.log("Three.js version:", THREE.REVISION);

// Scene setup
const scene = new THREE.Scene();
scene.background = null; // Make background transparent instead of blue sky
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    premultipliedAlpha: false, // Ensure proper alpha blending
    powerPreference: 'high-performance' // Add performance preference for mobile devices
}); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = true;
renderer.setClearColor(0x000000, 0); // Set to fully transparent
renderer.setClearAlpha(0); // Explicitly set alpha to 0
renderer.setPixelRatio(window.devicePixelRatio || 1); // Better handling of high-DPI screens like iPad
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Configure canvas for better touch events
const canvas = renderer.domElement;
canvas.style.touchAction = 'none'; // Disable browser touch actions
// Add all touch event listeners with passive: false to ensure preventDefault works
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventName => {
    canvas.addEventListener(eventName, function(e) {
        e.preventDefault(); // Prevent default touch behavior like scrolling
    }, { passive: false });
});

// Add meta viewport tag to prevent unwanted zooming on iPad
function addViewportMeta() {
    // Check if viewport meta tag already exists
    let metaViewport = document.querySelector('meta[name="viewport"]');
    
    if (!metaViewport) {
        // Create and add the viewport meta tag
        metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        document.head.appendChild(metaViewport);
    }
    
    // Set viewport properties optimized for games on touch devices
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    console.log("Viewport meta tag configured for touch devices");
}

// Call immediately
addViewportMeta();

// Initialize arrays and game state
const moles = [];
let score = 0;
let gameActive = false;
let timeRemaining = 30;

// Define all word categories with their word lists
const wordCategories = {
    short_a: {
        title: "Short 'a' Words",
        words: ['had', 'ran', 'and', 'man', 'can', 'at', 'am', 'an', 'last', 'past', 'fast', 'ask', 'land', 'hand', 'stand']
    },
    short_e: {
        title: "Short 'e' Words",
        words: ['men', 'set', 'let', 'get', 'red', 'end', 'yet', 'yes', 'met', 'ten', 'bed', 'went', 'send', 'sent', 'left', 'kept', 'help', 'best', 'west']
    },
    short_i: {
        title: "Short 'i' Words",
        words: ['sit', 'him', 'hid', 'did', 'six', 'fix', 'in', 'if', 'it', 'trip', 'milk']
    },
    short_o: {
        title: "Short 'o' Words",
        words: ['top', 'got', 'box', 'not', 'on', 'dog', 'lot', 'drop', 'spot', 'hot', 'stop', 'lost', 'soft', 'from']
    },
    short_u: {
        title: "Short 'u' Words",
        words: ['bug', 'run', 'fun', 'sun', 'cut', 'but', 'up', 'must', 'jump', 'just']
    },
    sh_words: {
        title: "Words with 'sh'",
        words: ['ship', 'shop', 'shut', 'wish', 'dish', 'fish', 'rush']
    },
    ch_words: {
        title: "Words with 'ch'",
        words: ['such', 'much', 'lunch','chum','chip','chap','bunch','hunch','munch','punch']
    },
    th_words: {
        title: "Words with 'th'",
        words: ['that', 'than', 'with', 'them','then','thin','thing','thank','the','this','with','moth','path','math']
    },
    wh_words: {
        title: "Words with 'wh'",
        words: ['when', 'which','whiz','whim','whip']
    }
};

// Variables to track the current game category
let currentCategory = 'short_a';
let correctWords = wordCategories.short_a.words;
let incorrectWords = [];
let isCorrectWord = false;
let currentWord = '';
// Add streak tracking
let correctStreak = 0;
let lastStreakBonus = 0; // To prevent multiple bonuses for the same streak

// Generate incorrect words based on the selected category
function generateIncorrectWords(selectedCategory) {
    const allWords = [];
    
    // Collect words from all other categories
    Object.keys(wordCategories).forEach(category => {
        if (category !== selectedCategory) {
            allWords.push(...wordCategories[category].words);
        }
    });
    
    // Shuffle and select the same number of words as in the correct category
    return shuffleArray(allWords).slice(0, correctWords.length);
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Add iPad-specific CSS
function addTouchStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* Larger UI elements for touch */
        #game-selection .game-option {
            padding: 15px 20px;
            margin: 10px;
            font-size: 24px;
            border-radius: 10px;
            min-width: 200px;
            cursor: pointer;
            transition: transform 0.1s ease-out;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        #game-selection .game-option:active {
            transform: scale(0.95);
        }
        
        /* Touch ripple animation */
        @keyframes rippleAnimation {
            from { transform: scale(0); opacity: 1; }
            to { transform: scale(2); opacity: 0; }
        }
        
        .touch-ripple {
            position: absolute;
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            animation: rippleAnimation 0.4s ease-out forwards;
        }
        
        /* Streak bonus animation for touch devices */
        .streak-bonus {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.5);
            background-color: #FF5722;
            color: white;
            font-size: 36px;
            font-weight: bold;
            padding: 20px 30px;
            border-radius: 15px;
            opacity: 0;
            z-index: 1000;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            pointer-events: none;
        }
        
        .streak-bonus.active {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        
        /* Hole marker size optimization for iPad */
        .hole-marker {
            border-radius: 50%;
            position: absolute;
            width: 150px;
            height: 150px;
        }
        
        /* Increase size of UI elements for iPad */
        @media (pointer: coarse) {
            #game-title-display {
                font-size: 32px !important;
            }
            
            #instructionsElement {
                font-size: 28px !important;
                padding: 15px !important;
            }
        }
    `;
    document.head.appendChild(styleEl);
    console.log("Added touch-optimized styles");
}

// Call immediately
addTouchStyles();

// Modify game selection UI setup for better touch interaction - fixing the issue with buttons not responding
function initGameSelection() {
    console.log("Initializing game selection UI...");
    
    const gameSelection = document.getElementById('game-selection');
    if (!gameSelection) {
        console.error("Game selection element not found!");
        return;
    }
    
    // Clear any existing handlers that might be interfering
    const gameOptions = gameSelection.querySelectorAll('.game-option');
    console.log(`Found ${gameOptions.length} game options`);
    
    // Initially hide title display and show selection UI
    const gameTitleDisplay = document.getElementById('game-title-display');
    if (gameTitleDisplay) {
        gameTitleDisplay.style.display = 'none';
    }
    gameSelection.style.display = 'block';
    
    // Apply iPad-friendly styles
    gameSelection.style.padding = '20px';
    gameSelection.style.maxWidth = '90%';
    gameSelection.style.margin = '0 auto';
    if (gameTitleDisplay) {
        gameTitleDisplay.style.fontSize = '28px';
        gameTitleDisplay.style.padding = '10px';
        gameTitleDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    }
    
    // Setup direct click/touch handlers on all game options
    gameOptions.forEach(option => {
        // Remove all existing event listeners to prevent duplicates
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        // Log for debugging
        console.log(`Setting up handler for ${newOption.textContent} (${newOption.getAttribute('data-game')})`);
        
        // Add multiple event listeners for maximum compatibility
        ['click', 'touchend'].forEach(eventType => {
            newOption.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Log that we received the event
                console.log(`${eventType} event received on ${this.textContent}`);
                
                // Create visual feedback
                this.style.backgroundColor = '#7BC67B';
                
                // Get the game category from the data attribute
                const selectedGame = this.getAttribute('data-game');
                console.log(`Selected game: ${selectedGame}`);
                
                if (!selectedGame) {
                    console.error("No game selected - data-game attribute missing");
                    return;
                }
                
                // Set current category
                currentCategory = selectedGame;
                correctWords = wordCategories[selectedGame].words;
                incorrectWords = generateIncorrectWords(selectedGame);
                
                // Hide selection UI
                gameSelection.style.display = 'none';
                
                // Set and show the game title
                if (gameTitleDisplay) {
                    gameTitleDisplay.textContent = wordCategories[selectedGame].title;
                    gameTitleDisplay.style.display = 'block';
                }
                
                // Start the game after a short delay to allow UI updates
                setTimeout(() => {
                    startGame();
                }, 50);
            }, { passive: false });
        });
        
        // Also add touchstart for feedback
        newOption.addEventListener('touchstart', function(e) {
            e.preventDefault();
            console.log('Touch start on game option');
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = '#7BC67B';
        }, { passive: false });
    });
    
    console.log("Game selection initialization complete");
}

// Call initGameSelection when DOM is completely loaded and after a slight delay to ensure everything is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded");
    
    // First detect device - needed for other optimizations
    if (typeof deviceInfo !== 'undefined') {
        deviceInfo.initialize();
    }
    
    // Initialize game selection with a slight delay to ensure DOM is completely ready
    setTimeout(() => {
        initGameSelection();
        console.log("Game selection initialized after delay");
    }, 300);
});

// Modified handleInteraction function to check for game selection screen
const originalHandleInteraction = window.handleInteraction || function() {};
window.handleInteraction = function(event) {
    const gameSelection = document.getElementById('game-selection');
    
    // If game selection is visible, don't handle the interaction
    if (gameSelection && gameSelection.style.display !== 'none') {
        return;
    }
    
    // If game is not active but selection is hidden, it's either a new game or game over screen
    if (!gameActive) {
        const gameSelection = document.getElementById('game-selection');
        gameSelection.style.display = 'block';
        
        if (document.getElementById('instructionsElement')) {
            document.getElementById('instructionsElement').style.display = 'none';
        }
        return;
    }
    
    // Otherwise, proceed with original handler
    originalHandleInteraction(event);
};

// UI Setup
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = '#00008B'; // Dark blue
scoreElement.style.fontSize = '24px';
scoreElement.style.fontWeight = 'bold';
scoreElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)'; // Add white shadow for better visibility
scoreElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds and canvas
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '20px';
timerElement.style.right = '20px';
timerElement.style.color = '#00008B'; // Dark blue
timerElement.style.fontSize = '24px';
timerElement.style.fontWeight = 'bold';
timerElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.7)'; // Add white shadow for better visibility
timerElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds and canvas
document.body.appendChild(timerElement);

// Add instructions element
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '50%';
instructionsElement.style.transform = 'translateX(-50%)';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '24px';
instructionsElement.style.textAlign = 'center';
instructionsElement.style.zIndex = '5'; // Higher z-index to appear in front of clouds
instructionsElement.innerHTML = 'Hit the mole when you see a word with the short "a" sound!<br>Click anywhere to start';
document.body.appendChild(instructionsElement);

// Adjust the camera position
camera.position.set(0, 10, 12); // Move the camera up
camera.lookAt(0, 0, 0);

// Function to create a terrain with a custom equation
function createCustomTerrain() {
    const geometry = new THREE.PlaneGeometry(30, 30, 100, 100); // More segments for smoother edges
    
    // Constants for the equation
    const A = 0.1; // Amplitude
    const B = 0.4; // Frequency

    // Modify vertices using the custom equation
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        
        // Apply the custom equation
        const z = A * Math.sin(B * x) + A * Math.cos(B * y);
        positionAttribute.setZ(i, z);
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshLambertMaterial({
        color: 0x90EE90, // Light green
        side: THREE.DoubleSide,
        transparent: true, // Enable transparency
        opacity: 0, // Fully transparent
        depthWrite: false // Prevent z-fighting with other objects
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = Math.PI / 2;
    terrain.position.y = -0.1;
    
    return terrain;
}

// Function to create clouds
function createCloud() {
    const group = new THREE.Group();
    
    // Create simple white spheres - smaller size (0.8 instead of 1)
    const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    // Main sphere
    const mainSphere = new THREE.Mesh(sphereGeometry, material);
    // Scale down the main sphere slightly
    mainSphere.scale.set(0.9, 0.9, 0.9);
    group.add(mainSphere);
    
    // Add additional spheres
    const positions = [
        { x: -1, y: 0.3, z: 0 },
        { x: 1, y: 0.3, z: 0 },
        { x: 0, y: 0.5, z: 0 }
    ];
    
    positions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(pos.x, pos.y, pos.z);
        // Make additional spheres smaller (0.6, 0.4, 0.6 instead of 0.7, 0.5, 0.7)
        sphere.scale.set(0.6, 0.4, 0.6);
        group.add(sphere);
    });
    
    return group;
}

// Setup scene function
function setupScene() {
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    scene.children.length = 0;
    lights.forEach(light => scene.add(light));

    // Add custom terrain
    const terrain = createCustomTerrain();
    terrain.position.y = -0.5;
    scene.add(terrain);

    // Create and add clouds with lower y-position
    const cloudPositions = [
        { x: -5, y: 2, z: -5 }, // Lower y value
        { x: 0, y: 3, z: -4 },  // Lower y value
        { x: 5, y: 2, z: -5 }   // Lower y value
    ];

    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        cloud.scale.set(1, 1, 1); // Increase scale for visibility
        scene.add(cloud);
    });

    setupHolesAndMoles();
}

// Setup holes and moles
function setupHolesAndMoles() {
    const holeGeometry = new THREE.CircleGeometry(1.4, 32);
    const holeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x404040,  // Dark gray
        transparent: true, // Enable transparency
        opacity: 0, // Fully transparent
        depthWrite: false // Prevent z-fighting with moles
    });

    // Adjust the Z values to move holes more toward the bottom edge of the screen
    // Increasing Z values moves the holes further down/away from the camera
    const holes = [
        { x: -1.5, z: -1.5, rotation: Math.PI * 0.25 + 0.175, description: "back Left" },     // Moved up by decreasing Z
        { x: 2.2, z: -1.5, rotation: -Math.PI * 0.25 - 0.175, description: "back Right" },     // Moved up by decreasing Z
        { x: -2.3, z: 1.5, rotation: Math.PI * 0.75 + 0.175, description: "front Left" },       // Moved toward center by decreasing Z
        { x: 2.2, z: 2.0, rotation: -Math.PI * 0.75 - 0.175, description: "front Right" }        // Moved back to original position
    ];

    // Store hole positions for reference when positioning the decorative overlay
    window.holePositions = [];

holes.forEach(pos => {
        console.log(`Creating hole at ${pos.description}`);

        // Create hole
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(pos.x * 1.5, 0.01, pos.z * 1.5);
        scene.add(hole);
        
        // Store hole position for overlay alignment
        window.holePositions.push({
            x: pos.x * 1.5,
            y: 0.01,
            z: pos.z * 1.5,
            description: pos.description
        });

        // Create mole
        const mole = createMole();
        mole.position.set(pos.x * 1.5, -1.8, pos.z * 1.5); // Match the "down" position in animateMole
        mole.visible = false; // Initialize moles as invisible since they're down
        
        // Set mole rotation
        const targetPoint = new THREE.Vector3(0, 0, -3);
        mole.lookAt(targetPoint);
        mole.rotateX(Math.PI / 2);
        
        if (pos.x < 0) {
            mole.rotateY(0.175);
        } else {
            mole.rotateY(-0.175);
        }
        
        mole.userData.isUp = false;
        mole.userData.isMoving = false;
        mole.userData.holePosition = { x: pos.x * 1.5, y: 0.01, z: pos.z * 1.5 }; // Store hole reference
    scene.add(mole);
    moles.push(mole);
});

    // Position the decorative overlay
    setTimeout(positionDecorativeOverlay, 500);
}

// Function to position the decorative overlay based on hole positions
function positionDecorativeOverlay() {
    if (!window.holePositions || window.holePositions.length === 0) {
        console.log('No hole positions available');
        return;
    }
    
    console.log('Positioning dirt holes based on mole hole positions');
    console.log(`Window dimensions: ${window.innerWidth}x${window.innerHeight}`);
    
    // Calculate scale factors based on screen size to help with responsiveness
    const isLandscape = window.innerWidth > window.innerHeight;
    const baseWidth = 1024; // Base width for iPad
    const scaleFactorX = window.innerWidth / baseWidth;
    
    // Apply a stronger scale factor for small screens like phones
    let screenSizeFactor = 1;
    if (window.innerWidth < 600) {
        screenSizeFactor = 0.8; // Smaller adjustments for phones
    } else if (window.innerWidth > 1200) {
        screenSizeFactor = 1.2; // Larger adjustments for big iPads
    }
    
    console.log(`Screen orientation: ${isLandscape ? 'Landscape' : 'Portrait'}, Scale factors: ${scaleFactorX}, ${screenSizeFactor}`);
    
    // Get screen coordinates of holes
    const holeScreenPositions = window.holePositions.map(pos => {
        const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
        vector.project(camera);
        
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: -(vector.y * 0.5 - 0.5) * window.innerHeight,
            description: pos.description
        };
    });
    
    console.log('Original hole screen positions:', holeScreenPositions);
    
    // Position the markers in the overlay to match hole positions
    const markers = document.querySelectorAll('.hole-marker');
    console.log(`Found ${markers.length} dirt hole markers to position`);
    
    // Different hole sizes for better perspective
    const backHoleSize = 280;      // Slightly smaller for back holes
    const frontHoleSize = 320;     // Slightly larger for front holes
    const largeHoleSize = 380;     // Larger size for bottom right hole
    
    holeScreenPositions.forEach((pos, index) => {
        if (markers[index]) {
            // Convert to percentages for responsive positioning
            // Apply offset to center the larger holes under the grass holes
            let posX = pos.x;
            let posY = pos.y;
            let holeSize;
            
            // Custom position adjustments for each hole
            switch(index) {
                case 0: // Back Left
                    posX -= 20 * scaleFactorX * screenSizeFactor; // Shift left
                    posY += 35 * screenSizeFactor; // Shift down
                    holeSize = backHoleSize * scaleFactorX;
                    break;
                case 1: // Back Right
                    posX += 25 * scaleFactorX * screenSizeFactor; // Shift right
                    posY += 35 * screenSizeFactor; // Shift down
                    holeSize = backHoleSize * scaleFactorX;
                    break;
                case 2: // Front Left
                    posX -= 15 * scaleFactorX * screenSizeFactor; // Shift left
                    posY += 5 * screenSizeFactor; // Slight shift down
                    holeSize = frontHoleSize * scaleFactorX;
                    break;
                case 3: // Bottom right hole - keep existing adjustments
                    posX += 15 * scaleFactorX * screenSizeFactor; // Shift right to move toward the bottom right corner
                    posY += 25 * screenSizeFactor; // Shift down to better cover the blue sky
                    holeSize = largeHoleSize * scaleFactorX;
                    break;
                default:
                    holeSize = frontHoleSize * scaleFactorX;
            }
            
            // Apply any custom adjustments if provided through the console
            if (window.customDirtAdjustments && window.customDirtAdjustments[index]) {
                const custom = window.customDirtAdjustments[index];
                if (custom.x !== undefined) posX += custom.x;
                if (custom.y !== undefined) posY += custom.y;
                console.log(`Applied custom adjustment to hole ${index}: x:${custom.x}, y:${custom.y}`);
            }
            
            // Calculate offsets based on the specific hole size
            const offsetX = holeSize / 2;
            const offsetY = holeSize / 2;
            
            const percentX = ((posX - offsetX) / window.innerWidth) * 100;
            const percentY = ((posY - offsetY) / window.innerHeight) * 100;
            
            markers[index].style.left = percentX + '%';
            markers[index].style.top = percentY + '%';
            
            // Log the final position for debugging
            console.log(`Positioned dirt hole ${index} (${pos.description}): Original pos [${pos.x}, ${pos.y}], Adjusted [${posX}, ${posY}], Final [${percentX}%, ${percentY}%]`);
            
            // Add subtle color variations to each dirt hole for realism
            // Create slightly different brown shades for each hole
            const brownBase = [155, 118, 83]; // Lighter brown color - #9b7653 in RGB
            const randomOffset = [
                Math.floor(Math.random() * 10) - 5,
                Math.floor(Math.random() * 8) - 4,
                Math.floor(Math.random() * 6) - 3
            ];
            
            const randomBrown = [
                Math.max(140, Math.min(170, brownBase[0] + randomOffset[0])),
                Math.max(100, Math.min(130, brownBase[1] + randomOffset[1])),
                Math.max(70, Math.min(100, brownBase[2] + randomOffset[2]))
            ];
            
            markers[index].style.backgroundColor = `rgb(${randomBrown[0]}, ${randomBrown[1]}, ${randomBrown[2]})`;
        }
    });
}

// Call positionDecorativeOverlay on load to ensure dirt holes are visible
window.addEventListener('load', function() {
    // First positioning attempt
    setTimeout(positionDecorativeOverlay, 500);
    
    // Second positioning attempt with slightly longer delay to ensure everything is ready
    setTimeout(positionDecorativeOverlay, 1000);
    
    // Force a third positioning attempt to ensure alignment is fixed
    setTimeout(function() {
        console.log("Forcing final dirt hole positioning");
        positionDecorativeOverlay();
        
        // Also try to force a redraw of the markers to ensure they're correctly positioned
        const markers = document.querySelectorAll('.hole-marker');
        markers.forEach(marker => {
            marker.style.display = 'none';
            // Force browser to recalculate layout
            void marker.offsetHeight;
            marker.style.display = 'block';
        });
    }, 1500);
});

// Initialize scene
setupScene();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update mole faces
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.lookAt(camera.position);
        }
    });
    
    // Animate clouds
    scene.children.forEach(child => {
        if (child.isGroup && child.children[0]?.material?.color?.equals(new THREE.Color(0xFFFFFF))) {
            child.position.x += 0.01;
            if (child.position.x > 15) child.position.x = -15;
        }
    });
    
    renderer.render(scene, camera);
}

animate();

// Mole materials with brighter colors
const moleBodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const moleNoseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const moleEyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const moleMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xD2B48C  // Light brown (tan)
});
const moleNoseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for nose
});
const moleEyeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1A1A1A  // Dark gray for eyes
});

// Modified click and touch handler
window.addEventListener('click', handleInteraction);
window.addEventListener('touchstart', handleInteraction, { passive: false });
window.addEventListener('touchend', preventDefaultTouch, { passive: false });
window.addEventListener('touchmove', preventDefaultTouch, { passive: false });

// Prevent default touch behaviors
function preventDefaultTouch(event) {
    event.preventDefault();
    event.stopPropagation();
}

// Enhanced touch state tracking
const touchState = {
    lastTouchTime: 0,
    processingTouch: false,
    touchTimeThreshold: 300 // ms threshold to prevent duplicate touch events
};

// Handle both mouse clicks and touch events
function handleInteraction(event) {
    console.log('Interaction detected:', event.type);
    
    // Prevent any scrolling/zooming on iPad
    if (event.type.startsWith('touch')) {
        event.preventDefault();
        event.stopPropagation();
        
        // iPad-specific touch handling with debouncing
        const now = Date.now();
        if (now - touchState.lastTouchTime < touchState.touchTimeThreshold || touchState.processingTouch) {
            console.log('Ignoring rapid touch - debounce protection');
            return;
        }
        
        touchState.lastTouchTime = now;
        touchState.processingTouch = true;
        
        // Release touch lock after processing
        setTimeout(() => {
            touchState.processingTouch = false;
        }, touchState.touchTimeThreshold);
    }
    
    if (!gameActive) {
        startGame();
        instructionsElement.style.display = 'none';
        return;
    }
    
    // Get the coordinates (handling both mouse and touch)
    let clientX, clientY;
    
    if (event.type === 'touchstart') {
        // Get the first touch point
        const touch = event.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
        
        console.log('Touch detected at:', clientX, clientY);
    } else {
        // Regular mouse event
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Use a more comprehensive approach to find intersections
    // Create a flattened array of all meshes in the mole groups
    let hitMole = null;
    
    // First, try the standard approach - intersecting with visible moles
    const visibleMoles = moles.filter(mole => mole.visible);
    const moleObjects = [];
    
    // Collect all objects in the mole hierarchy for intersection testing
    visibleMoles.forEach(moleGroup => {
        // Only include moles that are up and not already being animated
        if (moleGroup.userData.isUp && !moleGroup.userData.isMoving) {
            moleGroup.traverse(object => {
                if (object.isMesh) {
                    object.userData.parentMole = moleGroup; // Store reference to parent
                    moleObjects.push(object);
                }
            });
        }
    });
    
    // Check for intersections with all meshes
    const intersects = raycaster.intersectObjects(moleObjects, false);
    
    if (intersects.length > 0) {
        // Find the parent mole of the intersected object
        hitMole = intersects[0].object.userData.parentMole || 
                  intersects[0].object.parent;
                  
        console.log('Hit detected on:', hitMole);
    }
    
    // For touch events, use a larger hit area - especially on iPad
    const isTouchEvent = event.type === 'touchstart';
    const proximityThreshold = isTouchEvent ? 180 : 100; // Even larger for iPad touches (was 150)
    
    // If a mole was hit
    if (hitMole && hitMole.userData && hitMole.userData.isUp && !hitMole.userData.isMoving) {
        console.log('Processing hit on mole:', hitMole);
        
        // Mark this mole as being hit to prevent duplicate hits
        hitMole.userData.isMoving = true;
        
        if (isCorrectWord) {
            score += 10;
            
            // Increase the streak counter for correct hits
            correctStreak++;
            console.log(`Current streak: ${correctStreak}`);
            
            // Check if player has achieved 3 correct hits in a row
            if (correctStreak >= 3 && correctStreak % 3 === 0 && lastStreakBonus !== correctStreak) {
                // Award bonus points
                score += 10;
                lastStreakBonus = correctStreak;
                
                // Show streak bonus celebration
                showStreakBonus();
            }
            
            // Add success indicator at hit position
            createSuccessIndicator(hitMole.position.clone().add(new THREE.Vector3(0, 1, 0)));
        } else {
            score = Math.max(0, score - 5);
            // Reset streak on incorrect hit
            correctStreak = 0;
        }
        updateUI();
        
        // Use setTimeout to ensure there's a small delay before the animation starts
        // This helps prevent event race conditions
        setTimeout(() => {
            animateMole(hitMole, false);
        }, 50);
        
    } else if (isTouchEvent) {
        // Special handling for iPad touch - if no direct hit was detected
        // Find the closest visible mole to the touch point
        console.log('No direct hit - checking proximity for touch events');
        
        let closestDistance = Infinity;
        let closestMole = null;
        
        visibleMoles.forEach(mole => {
            if (mole.userData.isUp && !mole.userData.isMoving) {
                // Project mole position to screen coordinates
                const molePos = new THREE.Vector3(
                    mole.position.x,
                    mole.position.y + 0.7, // Target higher on the mole for better touch targeting
                    mole.position.z
                );
                molePos.project(camera);
                
                // Convert to screen coordinates
                const moleScreenX = (molePos.x + 1) * window.innerWidth / 2;
                const moleScreenY = (-molePos.y + 1) * window.innerHeight / 2;
                
                // Calculate distance to touch point
                const distance = Math.sqrt(
                    Math.pow(moleScreenX - clientX, 2) + 
                    Math.pow(moleScreenY - clientY, 2)
                );
                
                if (distance < proximityThreshold && distance < closestDistance) {
                    closestDistance = distance;
                    closestMole = mole;
                }
            }
        });
        
        // If we found a close mole, register a hit
        if (closestMole && !closestMole.userData.isMoving) {
            console.log('Proximity hit detected - distance:', closestDistance);
            
            // Mark this mole as being hit to prevent duplicate hits
            closestMole.userData.isMoving = true;
            
            // Add visual feedback for touch at the touch point
            createTouchFeedback(clientX, clientY);
            
            if (isCorrectWord) {
                score += 10;
                
                // Increase streak for correct hits
                correctStreak++;
                console.log(`Current streak: ${correctStreak}`);
                
                // Check if player has achieved 3 correct hits in a row
                if (correctStreak >= 3 && correctStreak % 3 === 0 && lastStreakBonus !== correctStreak) {
                    // Award bonus points
                    score += 10;
                    lastStreakBonus = correctStreak;
                    
                    // Show streak bonus celebration
                    showStreakBonus();
                }
                
                createSuccessIndicator(closestMole.position.clone().add(new THREE.Vector3(0, 1, 0)));
            } else {
                score = Math.max(0, score - 5);
                // Reset streak on incorrect hit
                correctStreak = 0;
            }
            updateUI();
            
            // Use setTimeout to ensure there's a small delay before the animation starts
            setTimeout(() => {
                animateMole(closestMole, false);
            }, 50);
        } else {
            // Provide visual feedback even when no mole is hit
            createTouchFeedback(clientX, clientY);
        }
    }
}

// Add touch feedback function for better iPad interaction
function createTouchFeedback(x, y) {
    // Create a visual ripple effect at touch point
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.position = 'absolute';
    ripple.style.left = (x - 30) + 'px';
    ripple.style.top = (y - 30) + 'px';
    ripple.style.width = '60px';
    ripple.style.height = '60px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    ripple.style.zIndex = '1000';
    ripple.style.pointerEvents = 'none';
    document.body.appendChild(ripple);
    
    // Trigger animation
    setTimeout(() => {
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0';
    }, 10);
    
    // Remove after animation completes
    setTimeout(() => {
        document.body.removeChild(ripple);
    }, 300);
}

// Show streak bonus celebration notification
function showStreakBonus() {
    // Create a streak bonus notification element
    const streakBonus = document.createElement('div');
    streakBonus.className = 'streak-bonus';
    streakBonus.textContent = '+10 BONUS!';
    document.body.appendChild(streakBonus);
    
    // Trigger animation by adding the active class after a small delay
    setTimeout(() => {
        streakBonus.classList.add('active');
    }, 10);
    
    // Create fireworks effect in the scene
    createFireworks();
    
    // Remove the notification after animation completes
    setTimeout(() => {
        streakBonus.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(streakBonus);
        }, 200); // Faster removal after animation ends (was 500)
    }, 800); // Display for shorter time (was 2000)
}

// Create fireworks effect for streak bonus
function createFireworks() {
    const particleCount = 30; // Fewer particles (was 50)
    const particles = [];
    const colors = [0xFF5722]; // Single color (orange) matching the notification
    
    // Create particles in a circle around the center of the view
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.08, 8, 8); // Smaller particles (was 0.1)
        const material = new THREE.MeshBasicMaterial({ 
            color: colors[0],
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Set starting position in the center of the screen
        const centerPosition = new THREE.Vector3(0, 5, 0);
        particle.position.copy(centerPosition);
        
        // Generate velocity in all directions - slightly faster speed
        const angle = Math.random() * Math.PI * 2;
        const height = 0.7 + Math.random() * 1.2;
        particle.velocity = new THREE.Vector3(
            Math.cos(angle) * (0.6 + Math.random()),
            height,
            Math.sin(angle) * (0.6 + Math.random())
        );
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate particles
    let elapsed = 0;
    function animateFireworks() {
        elapsed += 0.025; // Faster animation (was 0.016)
        
        particles.forEach(particle => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.08; // Stronger gravity (was 0.05)
            particle.material.opacity = 1 - (elapsed * 1.2); // Faster fade (was 0.7)
            
            // Add some rotation for sparkle effect
            particle.rotation.x += 0.1;
            particle.rotation.y += 0.1;
        });
        
        if (elapsed < 0.8) { // Shorter animation duration (was 1.5)
            requestAnimationFrame(animateFireworks);
        } else {
            // Clean up particles
            particles.forEach(particle => scene.remove(particle));
        }
    }
    
    animateFireworks();
}

// Add success indicator function
function createSuccessIndicator(position) {
    const particles = [];
    const particleCount = 20;
    const colors = [0xFFFF00, 0x00FF00, 0xFF00FF]; // Yellow, green, and pink particles
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true 
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Set initial position at hit point
        particle.position.copy(position);
        
        // Random velocity
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.3
        );
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate particles
    let elapsed = 0;
    function animateParticles() {
        elapsed += 0.016; // Approximate for 60fps
        
        particles.forEach((particle, i) => {
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.01; // Gravity
            particle.material.opacity = 1 - (elapsed * 2);
            particle.scale.multiplyScalar(0.98); // Shrink particles
        });
        
        if (elapsed < 0.5) { // Animation duration
            requestAnimationFrame(animateParticles);
        } else {
            // Clean up particles
            particles.forEach(particle => scene.remove(particle));
        }
    }
    
    animateParticles();
}

// Modify the text rendering function
function updateMoleText(mole, word) {
    const context = mole.userData.textContext;
    const texture = mole.userData.textTexture;
    
    // Clear the canvas
    context.clearRect(0, 0, 512, 256);
    
    // Set text properties
    context.fillStyle = 'black';
    context.font = 'bold 160px Arial'; // Larger font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text with white outline for better visibility on brown
    context.strokeStyle = 'white';
    context.lineWidth = 10;
    context.strokeText(word, 256, 128);
    context.fillText(word, 256, 128);
    
    // Update the texture
    texture.needsUpdate = true;
}

// Function to create curly hair
function createCurlyHairstyle() {
    const hairGroup = new THREE.Group();
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x5A3A1B }); // Darker brown color

    // Create a curve for each strand
    for (let i = 0; i < 500; i++) { // Increase quantity
        const length = 0.3 + Math.random() * 0.2; // Random length
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((Math.random() - 0.5) * 0.1, length / 3, (Math.random() - 0.5) * 0.1),
            new THREE.Vector3((Math.random() - 0.5) * 0.2, length / 2, (Math.random() - 0.5) * 0.2),
            new THREE.Vector3((Math.random() - 0.5) * 0.3, length, (Math.random() - 0.5) * 0.3)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.001, 8, false); // Smaller diameter
        const hairStrand = new THREE.Mesh(tubeGeometry, hairMaterial);

        // Adjust position to sit slightly above the mole's head
        hairStrand.position.set(
            (Math.random() - 0.5) * 0.8, // Random x position
            0.5,                        // Slightly higher y position
            (Math.random() - 0.5) * 0.4 // Random z position
        );

        hairGroup.add(hairStrand);
    }

    return hairGroup;
}

// Modify the createMole function to add the curly hair
function createMole() {
    const moleGroup = new THREE.Group();
    
    // Body - light brown color
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xD2B48C  // Light brown (tan) color
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    moleGroup.add(body);

    // Create a front-facing group for text and facial features
    const facingGroup = new THREE.Group();
    moleGroup.add(facingGroup);

    // Add hair to the facing group
    const hair = createCurlyHairstyle();
    facingGroup.add(hair);

    // Text plane
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    const textTexture = new THREE.Texture(canvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    
    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.4),
        textMaterial
    );
    textPlane.position.set(0, 0, 0.81);
    facingGroup.add(textPlane);
    
    // Eyes - make slightly larger
    const eyeGeometry = new THREE.CircleGeometry(0.04, 32);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.4, 0.81);
    facingGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.4, 0.81);
    facingGroup.add(rightEye);
    
    moleGroup.userData.textTexture = textTexture;
    moleGroup.userData.textContext = context;
    moleGroup.userData.facingGroup = facingGroup;

    return moleGroup;
}

// Modify the assignNewWord function
function assignNewWord(mole) {
    isCorrectWord = Math.random() < 0.7;
    const wordList = isCorrectWord ? correctWords : incorrectWords;
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    updateMoleText(mole, currentWord);
}

// Optimize the animateMole function for better iPad performance
function animateMole(mole, goingUp) {
    // Ensure we don't double-animate
    if (mole.userData.isMoving && goingUp) return;
    
    console.log(`Animating mole ${goingUp ? 'up' : 'down'} at position:`, mole.position);
    
    mole.userData.isMoving = true;
    
    // Assign a unique ID to this mole instance when it comes up
    if (goingUp) {
        mole.userData.clickId = Date.now() + Math.floor(Math.random() * 10000);
        console.log('Assigned new clickId:', mole.userData.clickId);
    }
    
    // Adjust the rise height for better visibility through the grass overlay
    // Raised slightly higher on iPad for better touch targeting
    const targetY = goingUp ? 0.8 : -1.8; // Even higher when up for iPad
    const startY = mole.position.y;
    // Faster animations for more responsive touch feel
    const duration = 180; // Was 200ms, slightly faster
    const startTime = Date.now();
    
    if (goingUp) {
        // Make mole visible when coming up
        mole.visible = true;
        // Ensure state is correctly set before assigning word
        mole.userData.isUp = false; // Will be set to true when animation completes
        assignNewWord(mole);
    } else {
        updateMoleText(mole, '');
        // Clear any stored interaction state
        mole.userData.lastClicked = null;
    }
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Simplified easing function for smoother performance on iPad
        // Linear is perfectly fine for this mechanic
        mole.position.y = startY + (targetY - startY) * progress;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Animation is complete
            mole.userData.isMoving = false;
            mole.userData.isUp = goingUp;
            
            // Complete cleanup when going down
            if (!goingUp) {
                // Hide the mole completely
                mole.visible = false;
                
                // Reset all interaction state
                mole.userData.clickId = null;
                mole.userData.lastClicked = null;
                
                // Log that this mole animation cycle is complete
                console.log('Mole animation complete - mole is down and reset');
            } else {
                // Log that mole is now up and ready for interaction
                console.log('Mole is now up with ID:', mole.userData.clickId);
            }
        }
    }
    
    // Start the animation
    update();
}

// Game logic
function startGame() {
    score = 0;
    timeRemaining = 30;
    gameActive = true;
    
    // Reset streak counter at start of game
    correctStreak = 0;
    lastStreakBonus = 0;
    
    // Reset any global interaction state
    window.lastInteractionId = null;
    touchState.processingTouch = false;
    touchState.lastTouchTime = 0;
    
    console.log("Starting new game - resetting all mole states");
    
    // Make sure all moles are completely reset when the game starts
    moles.forEach(mole => {
        // Reset visual state
        mole.visible = false;
        mole.position.y = -1.8; // Ensure moles are in the down position
        
        // Thoroughly reset all interaction state
        mole.userData.isUp = false;
        mole.userData.isMoving = false;
        mole.userData.clickId = null;
        mole.userData.lastClicked = null;
        mole.userData.currentAppearanceId = null;
        
        // Clear any text
        if (mole.userData.textContext) {
            updateMoleText(mole, '');
        }
        
        console.log("Reset mole at position:", mole.position);
    });
    
    updateUI();
    
    // Update the instructions to match the current category
    if (instructionsElement) {
        // Make instructions iPad-friendly with larger text and clear background
        instructionsElement.style.fontSize = '28px';
        instructionsElement.style.padding = '15px';
        instructionsElement.style.background = 'rgba(0, 0, 0, 0.7)';
        instructionsElement.style.borderRadius = '10px';
        instructionsElement.style.maxWidth = '90%';
        instructionsElement.style.textAlign = 'center';
        instructionsElement.style.left = '50%';
        instructionsElement.style.transform = 'translateX(-50%)';
        
        instructionsElement.innerHTML = `Tap the mole when you see a word from the "<b>${wordCategories[currentCategory].title}</b>" list!`;
        instructionsElement.style.display = 'block';
        
        // Hide instructions after 3 seconds
        setTimeout(() => {
            instructionsElement.style.display = 'none';
        }, 3000);
    }
    
    // Add a small delay before starting the game loop to ensure UI has updated
    setTimeout(() => {
        gameLoop();
    }, 500);
    
    const gameTimer = setInterval(() => {
        timeRemaining--;
        updateUI();
        if (timeRemaining <= 0) {
            gameActive = false;
            clearInterval(gameTimer);
            
            // Hide all moles when game ends
            moles.forEach(mole => {
                if (mole.userData.isUp) {
                    animateMole(mole, false);
                }
                
                // Extra cleanup to prevent issues when starting a new game
                setTimeout(() => {
                    mole.userData.isUp = false;
                    mole.userData.isMoving = false;
                    mole.userData.clickId = null;
                    mole.userData.lastClicked = null;
                    mole.userData.currentAppearanceId = null;
                    mole.visible = false;
                }, 300);
            });
            
            // Reset global interaction state again
            touchState.processingTouch = false;
            touchState.lastTouchTime = 0;
            
            // Show game over screen with iPad-friendly styling
            instructionsElement.innerHTML = `<div style="font-size: 32px; margin-bottom: 15px;">Game Over!</div>
                                           <div style="font-size: 28px; margin-bottom: 20px;">Final Score: ${score}</div>
                                           <div style="font-size: 24px;">Tap anywhere to choose a new game</div>`;
            instructionsElement.style.display = 'block';
            
            // Hide the category title when the game is over
            document.getElementById('game-title-display').style.display = 'none';
            
            // For iPad - ensure the game selection will respond to the next tap
            setTimeout(() => {
                // Reset touch state after a delay
                touchState.processingTouch = false;
            }, 500);
        }
    }, 1000);
}

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    timerElement.textContent = `Time: ${timeRemaining}s`;
    
    // Make UI elements larger for iPad
    scoreElement.style.fontSize = '28px';
    timerElement.style.fontSize = '28px';
    
    // Ensure styling is maintained
    scoreElement.style.color = '#00008B'; // Dark blue
    scoreElement.style.fontWeight = 'bold';
    scoreElement.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.8)'; // Stronger shadow
    scoreElement.style.zIndex = '5'; // Maintain higher z-index
    
    timerElement.style.color = '#00008B'; // Dark blue
    timerElement.style.fontWeight = 'bold';
    timerElement.style.textShadow = '2px 2px 4px rgba(255, 255, 255, 0.8)'; // Stronger shadow
    timerElement.style.zIndex = '5'; // Maintain higher z-index
    
    // Ensure game title is displayed correctly with larger font for iPad
    const gameTitleDisplay = document.getElementById('game-title-display');
    if (gameTitleDisplay && gameActive) {
        gameTitleDisplay.textContent = wordCategories[currentCategory].title;
        gameTitleDisplay.style.display = 'block';
        gameTitleDisplay.style.fontSize = '32px';
        gameTitleDisplay.style.padding = '10px 15px';
        gameTitleDisplay.style.background = 'rgba(255, 255, 255, 0.8)';
        gameTitleDisplay.style.borderRadius = '10px';
        gameTitleDisplay.style.color = '#00008B';
        gameTitleDisplay.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.3)';
    }
}

// Optimize game loop timing for iPad
function gameLoop() {
    if (!gameActive) return;
    
    // Extra check to ensure all moles are in a consistent state
    moles.forEach(mole => {
        if (!mole.visible && mole.userData.isUp) {
            console.log('Found inconsistent mole state - fixing:', mole);
            mole.userData.isUp = false;
            mole.userData.isMoving = false;
            mole.userData.clickId = null;
            mole.userData.lastClicked = null;
        }
    });
    
    const availableMoles = moles.filter(mole => !mole.userData.isUp && !mole.userData.isMoving);
    if (availableMoles.length > 0) {
        // Pick a random mole to pop up
        const randomMole = availableMoles[Math.floor(Math.random() * availableMoles.length)];
        
        // Ensure it's in a clean state before animating
        randomMole.userData.isUp = false;
        randomMole.userData.lastClicked = null;
        randomMole.userData.clickId = null;
        
        // Start the animation
        console.log('Game loop popping up a mole at:', randomMole.position);
        animateMole(randomMole, true);
        
        // Create a timer to automatically hide the mole if not clicked
        const moleId = Date.now(); // Create a unique ID for this mole appearance
        randomMole.userData.currentAppearanceId = moleId;
        
        // On iPad, slightly shorter appearance time for better pacing
        const appearanceTime = 1400; // Was 1500ms
        
        setTimeout(() => {
            // Only hide if this is still the same appearance cycle and the mole is still up
            if (randomMole.userData.currentAppearanceId === moleId && 
                randomMole.userData.isUp && 
                !randomMole.userData.isMoving) {
                
                console.log('Auto-hiding mole that was not clicked:', randomMole);
                animateMole(randomMole, false);
            }
        }, appearanceTime);
    }
    
    // Schedule the next game loop iteration with a random delay
    // Slightly faster pace for iPad touch gameplay 
    const nextDelay = 1200 + Math.random() * 800; // Was 1500 + Math.random() * 1000
    setTimeout(gameLoop, nextDelay);
}

// Explicitly add terrain and clouds to scene
function addTerrainAndClouds() {
    // Add terrain
    const terrain = createCustomTerrain();
    scene.add(terrain);
    console.log("Terrain added:", terrain);
    
    // Add clouds
    const cloudPositions = [
        { x: -8, y: 7, z: -5 },  // Higher y value
        { x: 0, y: 8, z: -4 },   // Higher y value
        { x: 8, y: 7, z: -5 }    // Higher y value
    ];
    
    cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        // Scale clouds to be slightly smaller
        cloud.scale.set(0.8, 0.8, 0.8);
        scene.add(cloud);
        console.log("Cloud added:", cloud);
    });
}

// Call this function after scene initialization
addTerrainAndClouds();

// Debug canvas styling
const canvasElement = renderer.domElement;
console.log("Canvas element:", canvasElement);
console.log("Canvas background:", getComputedStyle(canvasElement).backgroundColor);
// Ensure canvas is transparent
canvasElement.style.backgroundColor = "transparent";

// Add debug info to check what's in the scene
console.log("Scene children:", scene.children);

// Add a second directional light to better show the slopes
const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

// Move clouds higher and make them smaller
function adjustCloudPositions() {
    // Find all clouds in the scene
    scene.children.forEach(child => {
        // Identify clouds by checking if they're groups with white material children
        if (child.isGroup && child.children.length > 0) {
            const firstChild = child.children[0];
            if (firstChild.material && firstChild.material.color && 
                firstChild.material.color.getHexString() === 'ffffff') {
                // Move cloud up by 2 units
                child.position.y += 2;
                
                // Scale down existing clouds by 20%
                child.scale.multiplyScalar(0.8);
            }
        }
    });
}

// Call this function to adjust existing clouds
adjustCloudPositions();

// Update hole color to be less dark
function updateHoleColor() {
    scene.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'CircleGeometry') {
            // Make holes fully transparent
            child.material = new THREE.MeshLambertMaterial({
                color: 0x505050, // Color doesn't matter since transparent
                transparent: true,
                opacity: 0,
                depthWrite: false
            });
            console.log("Updated hole to be transparent");
        }
    });
}

// Improve lighting for better visibility
function enhanceLighting() {
    // Remove existing lights
    scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
            scene.remove(child);
        }
    });
    
    // Add stronger ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Add directional light from front
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
    
    // Add directional light from above
    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);
}

// Call these functions to update the scene
updateHoleColor();
enhanceLighting();

// Make the ground green again
function updateGroundColor() {
    scene.children.forEach(child => {
        if (child.geometry && 
            (child.geometry.type === 'PlaneGeometry' || child.geometry.type === 'PlaneBufferGeometry') && 
            child.rotation.x === -Math.PI / 2) {
            child.material.color.set(0x90EE90); // Light green color
        }
    });
}

// Adjust eye position for better visibility
function adjustEyePositions() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Identify eyes by their geometry and position
                if (child.geometry && child.geometry.type === 'CircleGeometry') {
                    // Make eyes larger
                    child.scale.set(1.5, 1.5, 1.5);
                    
                    // Move eyes higher if they're the eye positions
                    if (Math.abs(child.position.x) > 0.1) { // This is an eye
                        child.position.y += 0.1; // Move higher
                    }
                }
            });
        }
    });
}

// Call these functions to update the scene
// Uncomment if you want the ground to be green again
// updateGroundColor();
adjustEyePositions();

// Update mole color to light brown
function updateMoleColor() {
    moles.forEach(mole => {
        // Find the body (first child, which is the sphere)
        if (mole.children && mole.children.length > 0) {
            const body = mole.children[0];
            if (body.material) {
                body.material.color.set(0xD2B48C); // Light brown (tan) color
            }
        }
    });
}

// Call this function to ensure good lighting
enhanceLighting();

// More direct approach to update ground color
function fixGroundColor() {
    // Log all scene children to debug
    console.log("Scene children:", scene.children);
    
    // Try multiple approaches to find and update the ground
    scene.traverse(function(object) {
        // Look for large plane geometries that are likely to be the ground
        if (object.geometry && 
            (object.geometry.type === 'PlaneGeometry' || object.geometry.type === 'PlaneBufferGeometry') && 
            object.geometry.parameters && 
            object.geometry.parameters.width > 10) {
            
            console.log("Found potential ground:", object);
            
            // Force update the material to transparent
            object.material = new THREE.MeshLambertMaterial({
                color: 0x4CAF50, // Green (but will be invisible)
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0,
                depthWrite: false
            });
            
            console.log("Updated ground to transparent");
        }
    });
}

// More direct approach to update mole color
function fixMoleColor() {
    // Log all moles to debug
    console.log("Moles array:", moles);
    
    moles.forEach((mole, index) => {
        console.log(`Examining mole ${index}:`, mole);
        
        // Try to find the body mesh (usually the first child or the object itself)
        let bodyMesh = null;
        
        if (mole.children && mole.children.length > 0) {
            // Try to find a sphere geometry which is likely the body
            mole.traverse(function(child) {
                if (child.geometry && 
                    (child.geometry.type === 'SphereGeometry' || child.geometry.type === 'SphereBufferGeometry')) {
                    bodyMesh = child;
                }
            });
            
            if (!bodyMesh && mole.children[0].isMesh) {
                bodyMesh = mole.children[0];
            }
        }
        
        if (bodyMesh) {
            console.log("Found mole body:", bodyMesh);
            
            // Force update the material
            bodyMesh.material = new THREE.MeshLambertMaterial({
                color: 0xC19A6B // Warmer, more visible light brown
            });
            
            console.log("Updated mole color");
        }
    });
}

// Ensure proper lighting
function fixLighting() {
    // Remove any existing lights
    const existingLights = [];
    scene.traverse(function(object) {
        if (object.isLight) {
            existingLights.push(object);
        }
    });
    
    existingLights.forEach(light => scene.remove(light));
    
    // Add new lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
}

// Call all fix functions
fixGroundColor();
fixMoleColor();
fixLighting();

// Log the scene after fixes
console.log("Scene after fixes:", scene);

// Zoom in the camera
function zoomInCamera() {
    // Move camera closer to the scene
    camera.position.set(0, 5, 6); // Reduced z value to zoom in
camera.lookAt(0, 0, 0);
    console.log("Camera zoomed in:", camera.position);
}

// Load Google Cosmic Neue font
function loadCustomFont() {
    // Create a link element to load the font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Add a style element for font-family
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Comic Neue';
            font-style: normal;
            font-weight: 700;
            src: url(https://fonts.gstatic.com/s/comicneue/v8/4UaErEJDsxBrF37olUeD_xHM8pxULg.woff2) format('woff2');
        }
    `;
    document.head.appendChild(style);
    
    console.log("Custom font loaded");
}

// Improve text rendering with the new font
function updateTextRendering() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Clear the canvas
        context.clearRect(0, 0, 512, 256);
        
        // Set text properties with Comic Neue font
        context.fillStyle = 'black';
        context.font = 'bold 140px "Comic Neue", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text with outline for better visibility
        context.strokeStyle = 'white';
        context.lineWidth = 8;
        context.strokeText(word, 256, 128);
        context.fillText(word, 256, 128);
        
        // Update the texture
        texture.needsUpdate = true;
    };
    
    // Update UI text elements
    const textElements = [scoreElement, timerElement, instructionsElement];
    textElements.forEach(element => {
        if (element) {
            element.style.fontFamily = '"Comic Neue", sans-serif';
            element.style.fontSize = '28px';
            element.style.fontWeight = 'bold';
            element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        }
    });
    
    console.log("Text rendering updated");
}

// Make text planes larger for better visibility
function enlargeTextPlanes() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Find the text plane
                if (child.geometry && 
                    child.geometry.type === 'PlaneGeometry' && 
                    child.material && 
                    child.material.map) {
                    
                    // Make it larger
                    child.scale.set(1.5, 1.5, 1.5);
                    console.log("Text plane enlarged");
                }
            });
        }
    });
}

// Apply all improvements
loadCustomFont();
zoomInCamera();
updateTextRendering();
enlargeTextPlanes();

// Update any existing mole text
moles.forEach(mole => {
    if (mole.userData.textContext && mole.userData.isUp) {
        updateMoleText(mole, currentWord);
    }
});

// Ensure UI is updated
updateUI();

// Improve text rendering for better clarity
function improveTextClarity() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Increase canvas resolution for sharper text
        if (context.canvas.width < 1024) {
            context.canvas.width = 1024;
            context.canvas.height = 512;
        }
        
        // Clear the canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Add a subtle background for better contrast
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Set text properties
        context.fillStyle = 'black';
        context.font = 'bold 180px Arial'; // Larger, simpler font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add strong white outline
        context.strokeStyle = 'white';
        context.lineWidth = 12;
        context.strokeText(word, context.canvas.width/2, context.canvas.height/2);
        
        // Fill text
        context.fillText(word, context.canvas.width/2, context.canvas.height/2);
        
        // Update the texture with better filtering
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
    };
    
    // Update existing mole text
    moles.forEach(mole => {
        if (mole.userData.textContext) {
            // Get current word or use a default
            const word = currentWord || "nap";
            updateMoleText(mole, word);
        }
    });
    
    console.log("Text clarity improved");
}

// Make text planes larger and better positioned
function improveTextPlanes() {
    moles.forEach(mole => {
        if (mole.userData.facingGroup) {
            mole.userData.facingGroup.children.forEach(child => {
                // Find the text plane
                if (child.geometry && 
                    child.geometry.type === 'PlaneGeometry' && 
                    child.material && 
                    child.material.map) {
                    
                    // Replace with larger plane
                    const newPlane = new THREE.Mesh(
                        new THREE.PlaneGeometry(1.2, 0.6),
                        child.material
                    );
                    
                    // Position it better
                    newPlane.position.copy(child.position);
                    newPlane.position.z = 0.82; // Slightly more forward
                    
                    // Replace the old plane
                    const parent = child.parent;
                    parent.remove(child);
                    parent.add(newPlane);
                    
                    console.log("Text plane improved");
                }
            });
        }
    });
}

// Add directional lighting specifically for text
function addTextLighting() {
    const textLight = new THREE.DirectionalLight(0xffffff, 1.0);
    textLight.position.set(0, 0, 10); // Light directly from camera
    camera.add(textLight);
    scene.add(camera); // Ensure camera is in scene
    
    console.log("Text lighting added");
}

// Apply all text improvements
improveTextClarity();
improveTextPlanes();
addTextLighting();

// Improve text rendering with anti-aliasing and smoother edges
function fixPixelatedText() {
    // Update the text rendering function
    window.updateMoleText = function(mole, word) {
        const context = mole.userData.textContext;
        const texture = mole.userData.textTexture;
        
        // Increase canvas resolution significantly for smoother text
        if (context.canvas.width < 2048) {
            context.canvas.width = 2048;
            context.canvas.height = 1024;
        }
        
        // Clear the canvas
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Enable anti-aliasing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Set text properties
        context.fillStyle = 'black';
        context.font = '300px Arial'; // Clean, sans-serif font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Use a technique to render smoother text
        // First, render at a larger size
        const scaleFactor = 2;
        context.scale(scaleFactor, scaleFactor);
        
        // Draw text with smooth edges
        context.fillText(word, context.canvas.width/(2*scaleFactor), context.canvas.height/(2*scaleFactor));
        
        // Reset scale
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Update the texture with better filtering
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = false;
    };
    
    // Update existing mole text
    moles.forEach(mole => {
        if (mole.userData.textContext) {
            const word = currentWord || "nap";
            updateMoleText(mole, word);
        }
    });
    
    console.log("Text rendering improved to fix pixelation");
}

// Fix the renderer settings function to avoid reassigning constants
function improveRendererSettings() {
    // Check if renderer exists and is a constant
    if (typeof renderer !== 'undefined') {
        // Update settings without reassigning the renderer
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Enable anti-aliasing if possible without reassigning
        if (renderer.capabilities && renderer.capabilities.isWebGL2) {
            try {
                // Try to modify context parameters without reassignment
                const context = renderer.getContext();
                if (context && context.getContextAttributes) {
                    const attributes = context.getContextAttributes();
                    if (attributes) {
                        attributes.antialias = true;
                    }
                }
            } catch (e) {
                console.log("Could not modify WebGL context attributes:", e);
            }
        }
        
        console.log("Renderer settings updated without reassignment");
    } else {
        console.log("Renderer not available or is not a constant");
    }
}

// Version indicator that doesn't interfere with constants
function addVersionIndicator() {
    // Create a unique version timestamp
    const versionTimestamp = new Date().toISOString();
    const versionNumber = "1.0.1"; // Incremented to reflect the fix
    
    // Create a distinctive console message
    console.log(
        "%c Whack-a-Mole Educational Game - Latest Version Running %c",
        "background: #4CAF50; color: white; font-size: 16px; padding: 5px; border-radius: 5px;",
        ""
    );
    
    console.log(
        "%c Version: yellow" + versionNumber + " | Loaded: " + versionTimestamp + " %c",
        "background: #2196F3; color: white; font-size: 14px; padding: 3px; border-radius: 3px;",
        ""
    );
    
    // Add a global variable to check in the console
    window.gameVersionInfo = {
        version: versionNumber,
        timestamp: versionTimestamp,
        cacheStatus: "Fresh Load - Fixed Constant Error"
    };
    
    // Add a visual indicator on the screen
    const versionIndicator = document.createElement('div');
    versionIndicator.style.position = 'absolute';
    versionIndicator.style.bottom = '10px';
    versionIndicator.style.right = '10px';
    versionIndicator.style.background = 'rgba(0,0,0,0.5)';
    versionIndicator.style.color = 'white';
    versionIndicator.style.padding = '5px';
    versionIndicator.style.borderRadius = '3px';
    versionIndicator.style.fontSize = '12px';
    versionIndicator.style.fontFamily = 'monospace';
    versionIndicator.style.zIndex = '5'; // Higher z-index to appear in front of clouds
    versionIndicator.textContent = 'v' + versionNumber;
    document.body.appendChild(versionIndicator);
    
    console.log("Version indicator added - running latest version with fixes");
    
    return "Version indicator added successfully";
}

// Call the fixed functions
improveRendererSettings();
addVersionIndicator();

// You can also add this at the end of your main code
console.log("Game initialization complete - running latest version");

// Handle window resize to reposition overlay markers
window.addEventListener('resize', function() {
    positionDecorativeOverlay();
});

// Add iPad detection and optimization
const deviceInfo = {
    isIOS: false,
    isIPad: false,
    isTouch: false,
    initialize: function() {
        // Check if the device is iOS
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // More specific check for iPad
        this.isIPad = this.isIOS && 
                     (navigator.platform === 'iPad' || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && 
                      window.innerWidth > 750));
                      
        // General touch device detection
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        console.log(`Device detection: iOS=${this.isIOS}, iPad=${this.isIPad}, Touch=${this.isTouch}`);
        
        // Add class to body for CSS targeting
        if (this.isIPad) document.body.classList.add('ipad-device');
        if (this.isIOS) document.body.classList.add('ios-device');
        if (this.isTouch) document.body.classList.add('touch-device');
        
        // Apply device-specific optimizations
        this.applyOptimizations();
    },
    applyOptimizations: function() {
        if (this.isIPad) {
            // iPad-specific optimizations
            
            // Make hitboxes larger
            proximityThreshold = 200; // Larger hit detection area
            
            // Apply iPad-specific CSS
            const ipadStyles = document.createElement('style');
            ipadStyles.textContent = `
                /* iPad-specific style tweaks */
                #game-title-display {
                    font-size: 36px !important;
                    padding: 15px 20px !important;
                }
                
                .hole-marker {
                    width: 180px !important;
                    height: 180px !important;
                }
                
                .streak-bonus {
                    font-size: 42px !important;
                    padding: 25px 35px !important;
                }
                
                /* Fix for game selection on iPad */
                #game-selection {
                    background-color: rgba(255, 255, 255, 0.95) !important;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
                }
                
                #game-selection .game-option {
                    font-size: 28px !important;
                    padding: 20px 25px !important;
                    margin: 20px 0 !important;
                }
            `;
            document.head.appendChild(ipadStyles);
            
            // Enlarge selectable areas
            document.querySelectorAll('.game-option').forEach(option => {
                option.style.padding = '20px 25px';
                option.style.fontSize = '28px';
                option.style.margin = '15px';
            });
        }
    }
};

// Failsafe function to ensure game options work on iPad
function attachGameOptionHandlers() {
    console.log("Setting up failsafe touch handlers for game options");
    
    // Direct DOM query for game options
    const gameOptions = document.querySelectorAll('.game-option');
    if (!gameOptions || gameOptions.length === 0) {
        console.error("Game options not found in failsafe handler");
        
        // Schedule another attempt if none found
        setTimeout(attachGameOptionHandlers, 500);
        return;
    }
    
    console.log(`Found ${gameOptions.length} game options in failsafe handler`);
    
    // Apply click handler to each option
    gameOptions.forEach(button => {
        // Remove any existing handlers
        button.onclick = null;
        
        // Add a direct click handler
        button.onclick = function(e) {
            e.preventDefault();
            console.log(`Direct click on ${this.textContent}`);
            
            const gameSelection = document.getElementById('game-selection');
            const gameTitleDisplay = document.getElementById('game-title-display');
            const selectedGame = this.getAttribute('data-game');
            
            if (!selectedGame || !wordCategories[selectedGame]) {
                console.error(`Invalid game selected: ${selectedGame}`);
                return;
            }
            
            // Highlight button
            this.style.backgroundColor = '#7BC67B';
            
            // Set game data
            currentCategory = selectedGame;
            correctWords = wordCategories[selectedGame].words;
            incorrectWords = generateIncorrectWords(selectedGame);
            
            // Update UI
            if (gameSelection) gameSelection.style.display = 'none';
            if (gameTitleDisplay) {
                gameTitleDisplay.textContent = wordCategories[selectedGame].title;
                gameTitleDisplay.style.display = 'block';
            }
            
            // Start game
            setTimeout(() => {
                startGame();
            }, 50);
        };
        
        // Also add touch handler for iOS
        button.ontouchend = function(e) {
            e.preventDefault();
            console.log(`Direct touch on ${this.textContent}`);
            this.onclick(e);
        };
    });
    
    // Add a click handler to the entire game selection container as a final fallback
    const gameSelection = document.getElementById('game-selection');
    if (gameSelection) {
        gameSelection.addEventListener('click', function(e) {
            // Check if the click was on a game option
            let target = e.target;
            while (target !== this) {
                if (target.classList && target.classList.contains('game-option')) {
                    console.log(`Delegated click on ${target.textContent}`);
                    
                    // Trigger the option's click handler
                    if (target.onclick) {
                        target.onclick(e);
                    }
                    return;
                }
                target = target.parentNode;
            }
        });
    }
    
    console.log("Failsafe game option handlers attached");
}

// Initialize all event handlers when window loads
window.addEventListener('load', function() {
    console.log("Window loaded - initializing all handlers");
    
    // First position overlay
    setTimeout(positionDecorativeOverlay, 500);
    
    // Initialize device detection
    if (typeof deviceInfo !== 'undefined') {
        deviceInfo.initialize();
    }
    
    // Attach failsafe handlers for game options
    attachGameOptionHandlers();
    
    // Also initialize game selection the normal way as a backup
    setTimeout(initGameSelection, 600);
});

// Add a function that can be called from the console to manually reposition dirt holes
window.fixDirtHoles = function(adjustments) {
    console.log("Manual dirt hole repositioning triggered");
    
    // If custom adjustments are provided, use them
    if (adjustments && typeof adjustments === 'object') {
        window.customDirtAdjustments = adjustments;
        console.log("Using custom adjustments:", adjustments);
    }
    
    // Reposition the dirt holes
    positionDecorativeOverlay();
    
    // Force a redraw of the markers
    const markers = document.querySelectorAll('.hole-marker');
    markers.forEach(marker => {
        marker.style.display = 'none';
        void marker.offsetHeight;
        marker.style.display = 'block';
    });
    
    return "Dirt hole repositioning complete. If you need to make custom adjustments, call this function with an object like: fixDirtHoles({0:{x:-10,y:20}, 1:{x:15,y:10}})";
};

// Initialize scene
setupScene();

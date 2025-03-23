// Emergency fix for dirt hole alignment
// Copy and paste this entire code into your browser console to fix the dirt holes

(function() {
    console.log("Emergency dirt hole alignment fix");
    
    // Define the fix function in global scope
    window.fixDirtHoles = function(adjustments) {
        console.log("Manual dirt hole repositioning triggered");
        
        // Find the positioning function
        const positionOverlay = window.positionDecorativeOverlay;
        
        if (!positionOverlay) {
            console.error("Could not find positionDecorativeOverlay function!");
            return "Error: positioning function not found";
        }
        
        // Create custom adjustments for each hole if none provided
        if (!adjustments) {
            adjustments = {
                0: {x: -30, y: 40}, // Back Left
                1: {x: 40, y: 40},  // Back Right
                2: {x: -25, y: 10}, // Front Left
                3: {x: 25, y: 25}   // Bottom Right
            };
        }
        
        // Set the custom adjustments globally
        window.customDirtAdjustments = adjustments;
        console.log("Using adjustments:", adjustments);
        
        // Call the positioning function
        positionOverlay();
        
        // Force a redraw of the markers
        const markers = document.querySelectorAll('.hole-marker');
        console.log(`Found ${markers.length} dirt hole markers to reposition`);
        
        markers.forEach((marker, i) => {
            marker.style.display = 'none';
            // Force browser to recalculate layout
            void marker.offsetHeight;
            marker.style.display = 'block';
            console.log(`Repositioned dirt hole ${i}`);
        });
        
        return "Dirt hole repositioning complete!";
    };
    
    // Now call the function immediately
    const result = window.fixDirtHoles();
    console.log(result);
    
    return "Emergency dirt hole fix applied! If you need further adjustments, call fixDirtHoles() again.";
})(); 
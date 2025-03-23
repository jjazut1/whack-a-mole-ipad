// Quick fix for dirt hole alignment - copy into console
window.fixDirtHoles=function(a){window.customDirtAdjustments=a||{0:{x:-30,y:40},1:{x:40,y:40},2:{x:-25,y:10},3:{x:25,y:25}};window.positionDecorativeOverlay();document.querySelectorAll('.hole-marker').forEach(m=>{m.style.display='none';void m.offsetHeight;m.style.display='block'});return 'Done!';}; fixDirtHoles();

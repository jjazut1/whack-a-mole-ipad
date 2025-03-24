// Copy and paste into iPad Safari Console to fix game selection popup issue:
(function(){
  console.log("🔧 iPad selection fix");
  const gameSelection=document.getElementById("game-selection");
  if(gameSelection){
    gameSelection.style.display="none";
    gameSelection.style.visibility="hidden";
    gameSelection.style.opacity="0";
    gameSelection.style.pointerEvents="none";
    gameSelection.style.zIndex="-999";
  }
  
  const style=document.createElement("style");
  style.innerHTML="#game-selection{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;z-index:-999!important}";
  document.head.appendChild(style);
  
  document.querySelectorAll(".game-option").forEach(option=>{
    const newOption=option.cloneNode(true);
    if(option.parentNode)option.parentNode.replaceChild(newOption,option);
    
    newOption.addEventListener("click",function(e){
      e.stopPropagation();
      const gameType=this.getAttribute("data-game");
      const selection=document.getElementById("game-selection");
      
      if(selection){
        selection.style.display="none";
        selection.style.visibility="hidden";
        selection.style.opacity="0";
        
        if(selection.parentNode){
          selection.parentNode.removeChild(selection);
          window.setTimeout(()=>{
            if(!document.body.contains(selection))document.body.appendChild(selection);
            selection.style.display="none";
          },2000);
        }
      }
      
      window.currentCategory=gameType;
      window.correctWords=window.wordCategories[gameType].words;
      window.incorrectWords=window.generateIncorrectWords(gameType);
      
      const titleDisplay=document.getElementById("game-title-display");
      if(titleDisplay){
        titleDisplay.textContent=window.wordCategories[gameType].title;
        titleDisplay.style.display="block";
      }
      
      window.startGame();
    });
    
    newOption.addEventListener("touchend",function(e){
      e.preventDefault();
      setTimeout(()=>this.click(),10);
    },{passive:false});
  });
  
  if(window.startGame){
    window.originalStartGame=window.startGame;
    window.startGame=function(){
      const selection=document.getElementById("game-selection");
      if(selection){
        selection.style.display="none";
        selection.style.visibility="hidden";
        selection.style.opacity="0";
      }
      return window.originalStartGame.apply(this,arguments);
    };
  }
  
  return "✅ Game selection popup fixed";
})(); 
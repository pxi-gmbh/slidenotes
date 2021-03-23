var newtheme = new Theme("progressbar");
newtheme.description = 'Adds a progressbar to the presentation';

newtheme.active = true; //opt-out

//we put it in afterStyle, so it does not interfere with styling
newtheme.afterStyle = function(){
  var slides = document.getElementsByClassName("ppage");
  for(var x=0;x<slides.length;x++){
    var actwidth = 100/slides.length * (x+1);
    var slidebar = document.createElement("div");
    slidebar.classList.add("progressbar");
    slidebar.style.width=actwidth+"%";
    slides[x].appendChild(slidebar);
  }
}


slidenote.addTheme(newtheme);

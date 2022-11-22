/*das ist ein beispiel-theme script. es tut nichts weiter, als festzulegen, dass es den namen printer trägt, ein basic-theme ist (printer.themetype = "css" und eine description, die beschreibt, was die user erwartet*/
var printer = new Theme("printer"); //erstelle ein theme mit namen printer
printer.active=true;
printer.previewImage=true;
printer.themetype = "css"; //themetype ist css, also ein basis-theme und keine erweiterung
printer.description = "a theme to print as pdf"; //beschreibung, die im tooltip angezeigt wird
printer.highlightTheme = "mono-blue"; //theme für highlight
printer.afterStyle = function(){
    let slides = document.getElementsByClassName('ppage');
    for(let i=1;i<=slides.length;i++){
        slides[i-1].id='slide'+i;
        let slidetitle= document.createElement('div');
        slidetitle.classList.add('slide-title');
        slidetitle.innerText='slide '+i+'/'+slides.length;
        slides[i-1].parentElement.insertBefore(slidetitle,slides[i-1]);
    }
}

printer.init = function(){
  // CHROME
  let browser='print-';
  if (navigator.userAgent.indexOf("Chrome") != -1 ) {
    browser+='chrome';
  }
  // FIREFOX
  else if (navigator.userAgent.indexOf("Firefox") != -1 ) {
    browser+='firefox';
  }
  // SAFARI
  else if (navigator.userAgent.indexOf("Safari") != -1 || navigator.userAgent.indexOf("Epiphany") != -1 ) {
    browser+='safari';
  }
  if(browser!='print-')document.body.classList.add(browser);

}

printer.showPrintPreview = function(){
  this.active=true;
  document.body.classList.add('print-preview');
  this.previousSelectedTheme = slidenote.extensions.activeCssTheme;
  slidenote.extensions.changeThemeStatusByClassname('printer',true);
  slidenote.presentation.showpresentation();
}

printer.afterPresentationPreviewClose = function(){
  this.active=false;
  document.body.classList.remove('print-preview');
  slidenote.extensions.changeThemeStatusByClassname(this.previousSelectedTheme.classname,true);
}

printer.print = function(){
  window.print();
}

slidenote.addTheme(printer);// füge das theme der slidenote hinzu

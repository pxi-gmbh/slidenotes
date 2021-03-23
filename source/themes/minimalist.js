/*das ist ein beispiel-theme script. es tut nichts weiter, als festzulegen, dass es den namen minimalist trägt, ein basic-theme ist (minimalist.themetype = "css" und eine description, die beschreibt, was die user erwartet*/
var minimalist = new Theme("minimalist"); //erstelle ein theme mit namen minimalist
minimalist.active=true;
minimalist.previewImage=true;
minimalist.themetype = "css"; //themetype ist css, also ein basis-theme und keine erweiterung
minimalist.description = "a light colored theme"; //beschreibung, die im tooltip angezeigt wird
minimalist.highlightTheme = "mono-blue"; //theme für highlight
slidenote.addTheme(minimalist);// füge das theme der slidenote hinzu

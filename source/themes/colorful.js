/*das ist ein beispiel-theme script. es tut nichts weiter, als festzulegen, dass es den namen colorful trägt, ein basic-theme ist (colorful.themetype = "css" und eine description, die beschreibt, was die user erwartet*/
var colorful = new Theme("colorful"); //erstelle ein theme mit namen colorful
colorful.active = false;
colorful.previewImage=true;
colorful.themetype = "css"; //themetype ist css, also ein basis-theme und keine erweiterung
colorful.description = "a colorful theme"; //beschreibung, die im tooltip angezeigt wird
colorful.highlightTheme = "monokai-sublime"; //theme für highlight
slidenote.addTheme(colorful);// füge das theme der slidenote hinzu

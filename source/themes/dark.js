/*das ist ein beispiel-theme script. es tut nichts weiter, als festzulegen, dass es den namen dark trägt, ein basic-theme ist (dark.themetype = "css" und eine description, die beschreibt, was die user erwartet*/
var dark = new Theme("dark"); //erstelle ein theme mit namen dark
dark.active=false;
dark.previewImage=true;
dark.themetype = "css"; //themetype ist css, also ein basis-theme und keine erweiterung
dark.description = "a dark colored theme"; //beschreibung, die im tooltip angezeigt wird
dark.highlightTheme = "monokai-sublime"; //theme für highlight
slidenote.addTheme(dark);// füge das theme der slidenote hinzu

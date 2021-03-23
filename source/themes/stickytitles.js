/* sticky-titles: sticks titles to lists, imageblocks and paragraphs:
*/
var newtheme = new Theme("stickytitles");
newtheme.description = "Sticks Titles to Lists, imageblocks and paragraphs if not separated by empty line";
//listblock:
newtheme.addStyle(new Array("h1","list"),'<div class="listblock">','</div>');
newtheme.addStyle(new Array("h2","list"),'<div class="listblock">','</div>');
newtheme.addStyle(new Array("h3","list"),'<div class="listblock">','</div>');
//imageblocks:
newtheme.addStyle(new Array("h1","imageblock"),'<div class="imageblock">','</div>');
newtheme.addStyle(new Array("h2","imageblock"),'<div class="imageblock">','</div>');
newtheme.addStyle(new Array("h3","imageblock"),'<div class="imageblock">','</div>');
//paragraphs:
newtheme.addStyle(new Array("h1","text"),'<div class="pblock">','</div>');
newtheme.addStyle(new Array("h2","text"),'<div class="pblock">','</div>');
newtheme.addStyle(new Array("h3","text"),'<div class="pblock">','</div>');


slidenote.addTheme(newtheme);

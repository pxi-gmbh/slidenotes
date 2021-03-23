var newtheme = new Theme("transition");
newtheme.description = "Transition: Adds CSS-based transition-effects to slideshow";
/*Define Options*/
newtheme.options = new Array(
                  {name:"Opacity", transition:"transitionopacity", value:false},
                  {name:"Scroll to Left", transition:"transitionscrollleft", value:false}
                );

//Add to global Options:
newtheme.addGlobalOption("checkbox","opacity", "Opacity", false);
newtheme.addGlobalOption("checkbox","scroll to left", "Scroll to Left", false);

newtheme.changeGlobalOption = function(optionnr, value){
  this.options[optionnr].value = value;
  this.globaloptions[optionnr].values=value;
  console.log("option geändert");
  console.log(this.options);
}

newtheme.saveConfigString = function(){
  var stringToSave="";
  stringToSave+=this.options[0].value+";"+this.options[1].value;
  return stringToSave;
}

newtheme.loadConfigString = function(datastring){
  var data = datastring.split(";");
  for(var x=0;x<data.length;x++)this.changeGlobalOption(x,(data[x]==="true"));
}


/*Hook into styling-process, append classes */
newtheme.styleThemeSpecials = function(){
  var pages = document.getElementsByClassName("ppage");
  console.log("transition pages:");
  console.log(pages);
  console.log(this.options);
  for(var x=0;x<this.options.length;x++){
    for(var px=0;px<pages.length;px++){
      if(this.options[x].value)pages[px].classList.add(this.options[x].transition);
        else pages[px].classList.remove(this.options[x].transition);
    }
  }
}

//end of theme-declaration - append to slidenote
slidenote.addTheme(newtheme);

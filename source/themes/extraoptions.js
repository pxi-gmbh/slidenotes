var xtraoptions = new Theme("extraoptions");
xtraoptions.active=true;
xtraoptions.description = "Show more Options";
xtraoptions.options=new Array();
//xtraoptions.options[0]= {name:"Sidebar",value:true};
//xtraoptions.options[1]= {name:"Editorbuttons", value:true};
//xtraoptions.options[1].onchange = function(){
  //if(this.value)document.getElementById("texteditorbuttons").style.display="unset";
  //  else document.getElementById("texteditorbuttons").style.display = "none";
//}
xtraoptions.options[0]={name:"automagic closure on * ~ ` _ and +++", value:true};
xtraoptions.options[0].onchange = function(){
  if(!keyboardshortcuts)return;
  slidenote.keyboardshortcuts.automaticClosure = this.value;
}
xtraoptions.options[1]={name:"activate tab-functionality in textarea" ,value:false};
xtraoptions.options[1].onchange = function(){
  if(!keyboardshortcuts)return;
  slidenote.keyboardshortcuts.enableTab = this.value;
}
xtraoptions.addGlobalOption("checkbox",xtraoptions.options[0].name,xtraoptions.options[0].name,true);
xtraoptions.addGlobalOption("checkbox",xtraoptions.options[1].name,xtraoptions.options[1].name,false);
//xtraoptions.addGlobalOption("checkbox","editorbuttons","Show Editorbuttons",true);

xtraoptions.changeGlobalOption = function(optionnr, value){
  this.options[optionnr].value = value;
  this.globaloptions[optionnr].values=value;
  if(this.options[optionnr].onchange)this.options[optionnr].onchange();
}

xtraoptions.saveConfigString = function(){
  var stringToSave="";
  stringToSave+=this.options[0].value+";"+this.options[1].value;
  return stringToSave;
}

xtraoptions.loadConfigString = function(datastring){
  var data = datastring.split(";");
  for(var x=0;x<data.length;x++)this.changeGlobalOption(x,(data[x]==="true"));
}


slidenote.addTheme(xtraoptions);

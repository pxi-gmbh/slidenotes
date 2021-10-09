var currentslide = new Theme("currentslide");
currentslide.active=true;
currentslide.description = "visualizes current Slide in Editor";
currentslide.options=new Array();
//currentslide.options[0]= {name:"Sidebar",value:true};
//currentslide.options[1]= {name:"Editorbuttons", value:true};
//currentslide.options[1].onchange = function(){
  //if(this.value)document.getElementById("texteditorbuttons").style.display="unset";
  //  else document.getElementById("texteditorbuttons").style.display = "none";
//}
currentslide.options[0]={
  name:"visualize active slidenote",
  value:true,
  onchange:function(){
    //nothing to do here
  },
};


currentslide.addGlobalOption("checkbox",currentslide.options[0].name,currentslide.options[0].name,true);
//currentslide.addGlobalOption("checkbox","editorbuttons","Show Editorbuttons",true);
currentslide.createSlidebackground = function(){
  //check for old bg:
  let old = document.getElementById('currentSlideBackground');
  if(old)old.parentElement.removeChild(old);
  let bgd = document.createElement('div');
  bgd.id='currentSlideBackground';
  let eb = document.getElementById('editorblock');
  eb.insertBefore(bgd, eb.childNodes[0]);
  return bgd;
},

currentslide.init = function(){
  if(this.active && this.options[0].value){
    this.backgrounddiv = this.createSlidebackground();
  }
}
currentslide.changeGlobalOption = function(optionnr, value){
  this.options[optionnr].value = value;
  this.globaloptions[optionnr].values=value;
  document.body.classList.toggle('currentslide-active');
  if(this.options[optionnr].onchange)this.options[optionnr].onchange();
  let backgrounddiv = document.getElementById('currentSlideBackground');
  let bgd=false;
  if(backgrounddiv==null && value){
    //create new backgrounddiv
    bgd = this.createSlidebackground();
  }else if(backgrounddiv && value==false){
    backgrounddiv.parentElement.removeChild(backgrounddiv);
    //get old-active lines:
    let oldActiveLines=document.querySelectorAll('#texteditorerrorlayer span.backgroundline.currentslide');
    for(let x=oldActiveLines.length-1;x>=0;x--){
      oldActiveLines[x].classList.remove('currentslide');
    }
  }
  if(bgd)this.backgrounddiv = bgd;
}

currentslide.saveConfigString = function(){
  var stringToSave=this.options[0].value;
  return stringToSave;
}

currentslide.loadConfigString = function(datastring){
    this.changeGlobalOption(0,(datastring==="true" || datastring===true));
}

currentslide.styleThemeMDCodeEditor = function(changedlines){
  console.log('starting styling of active slide')
  if(this.options[0].value==false)return;
  if(!this.backgrounddiv)return;
  //get old-active lines:
  let oldActiveLines=document.querySelectorAll('#texteditorerrorlayer span.backgroundline.currentslide');
  for(let x=oldActiveLines.length-1;x>=0;x--){
    oldActiveLines[x].classList.remove('currentslide');
  }
  let current = slidenote.parser.map.pageAtPosition();
  let activeLine = slidenote.parser.lineAtPosition();
  if(slidenote.parser.lineswithhtml[activeLine]=='pagebreak'){
    //we are just on a pagebreak so we should count it as next page:
    current++;
  }
  let begin = slidenote.parser.map.pagestart[current].line;
  let end = slidenote.parser.map.pageend[current].line;
  let lines = document.querySelectorAll('#texteditorerrorlayer span.backgroundline');
  console.log('style current slide:',current,'from:',begin,'to:',end, 'total lines:',lines.length);
  if(begin>0)begin--; //we start with the above --- pagebreak
  for (let x=begin;x<=end;x++){
    if(lines[x])lines[x].classList.add('currentslide');
  }
  //set backgrounddiv:
  let startTop = lines[begin].offsetTop;
  let endTop;
  let editor=slidenote.textarea;
  if(end<lines.length)endTop=lines[end+1].offsetTop;
  else endTop = startTop+editor.offsetHeight;
  startTop-=editor.scrollTop;
  endTop-=editor.scrollTop;
  this.backgrounddiv.style.top = startTop+'px';
  this.backgrounddiv.style.height = endTop-startTop+'px';
  border=4;
  if(editor.offsetHeight>=editor.scrollHeight)border+=4;
  this.backgrounddiv.style.width = (editor.offsetWidth+border)+'px';
  // this.backgrounddiv.style.left=slidenote.textarea.offsetTop+'px';
};


currentslide.scroll = function(){
  if(this.options[0].value==false)return;
  //move active background to new top:
  let firstline = document.querySelector('#texteditorerrorlayer span.backgroundline.currentslide');
  if(!firstline)return;
  let startTop = firstline.offsetTop-slidenote.textarea.scrollTop ;
  this.backgrounddiv.style.top = startTop+'px';
}

slidenote.addTheme(currentslide);

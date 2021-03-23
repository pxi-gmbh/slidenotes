/* outline - adds outline to slidenoteeditor
*
*/
var newtheme = new Theme("outline");

newtheme.helpText = function(dataobject){
  var result = "outline - adds outline funcionality to slidenote editor";
  return result;
}

newtheme.countWords = function(text){
  return text.split(' ')
            .filter(function(n) { return n != '' })
            .length;
}

newtheme.active = true;
//variables:
newtheme.titleBlock;
newtheme.wordBlock; //html-element to put word-count inside
newtheme.charBlock; //html-element to put char-count inside
newtheme.speakTimeBlock; //html-element to put speaktime inside
newtheme.speakTimeActivated = true; //generate Speaktime or not

newtheme.addGlobalOption("checkbox", "calculate speak time", "Calculate Speak Time", this.speakTimeActivated);

newtheme.changeGlobalOption = function(optionnr, value){
  this.speakTimeActivated = value; //!this.speakTimeActivated;
  this.globaloptions[0].values=value;
  var outlineblock = document.getElementById("outlineblock");
  if(this.speakTimeActivated)outlineblock.classList.remove("withoutSpeakTime");
  else outlineblock.classList.add("withoutSpeakTime");
  //console.log("changed outline speaktime to: "+this.speakTimeActivated + "value:"+value);
}
newtheme.saveConfigString = function(){return this.speakTimeActivated};
newtheme.loadConfigString= function(data){
  this.speakTimeActivated = data;
  if(!this.speakTimeActivated)document.getElementById("outlineblock").classList.add("withoutSpeakTime");
};
newtheme.changeThemeStatus = function(status){
  this.active = status;
  var ol = document.getElementById("outlineblock");
  if(this.active && !ol){
    //console.log("generate Outline Block")
    this.generateOutlineBlock();
  }else{
    if(!this.active && ol)ol.parentElement.removeChild(ol);
  }
}
newtheme.init = function(){
  //if(this.active)this.generateOutlineBlock();
}

newtheme.generateOutlineBlock = function(){
  var outlineblock = document.createElement("div");
  outlineblock.id="outlineblock";
  //var img = new Image();
  //img.src=slidenote.imagespath+"buttons/outline.png";
  //outlineblock.appendChild(img);
  var title = document.createElement("div");
  title.id="outlineBlockTitle";
  title.innerText="OUTLINE";
  this.titleBlock=title;
  outlineblock.appendChild(title);
  var wordchars = document.createElement("div");
  var wordc = document.createElement("span");
  wordc.id = "outlineWordCount";
  wordchars.appendChild(wordc);
  this.wordBlock=wordc;
  var wordcl = document.createElement("span");
  wordcl.innerText=" WORDS, ";
  wordchars.appendChild(wordcl);
  var charc = document.createElement("span");
  charc.id="outlineCharCount";
  this.charBlock = charc;
  wordchars.appendChild(charc);
  var charl = document.createElement("span");
  charl.innerText=" CHARS";
  wordchars.appendChild(charl);
  outlineblock.appendChild(wordchars);

  var speakdiv = document.createElement("div");
  speakdiv.id="outlineSpeakTime";
  var speakt = document.createElement("span");
  speakt.id="outlineSpeakTimeCount";
  this.speakTimeBlock = speakt;
  speakdiv.appendChild(speakt);
  var speakl=document.createElement("span");
  speakl.innerText = " SPEAKING TIME";
  speakdiv.appendChild(speakl);
  outlineblock.appendChild(speakdiv);
  /*
  outlineblock.addEventListener("click",function(){
    var oldmenu = document.getElementById("outlineMenu");
    if(oldmenu)oldmenu.parentElement.removeChild(oldmenu);
    else slidenote.extensions.getThemeByName("outline").generateOutlineMenu();
  });*/
  var newoutletdiv = document.getElementById("outlet");
  if(newoutletdiv){
    newoutletdiv.innerHTML = "";
    newoutletdiv.appendChild(outlineblock);
  }else  document.getElementById("editorblock").appendChild(outlineblock);
}

newtheme.fillOutlineBlock = function(text, selection){
    var words = this.countWords(text);
    var chars = text.length;
    var speaktime;
    if(this.speakTimeActivated)speaktime = this.calculateSpeakTime(words, selection);
    if(this.wordBlock)this.wordBlock.innerText = words;
    if(this.charBlock)this.charBlock.innerText = chars;
    if(this.speakTimeBlock)this.speakTimeBlock.innerText = speaktime;
    if(selection)this.titleBlock.innerText="OUTLINE:SELECTION";
    else if(this.titleBlock.innerText!="OUTLINE") this.titleBlock.innerText="OUTLINE";
}

newtheme.parseOutlineMenu = function(){
  var mdcode = slidenote.textarea.value;
  mdcodelines = slidenote.parser.lines;
  var pagestart = slidenote.parser.map.pagestart;
  var pageend = slidenote.parser.map.pageend;
  var inline = slidenote.parser.map.insertedhtmlinline;
  var slidearray  = new Array();
  var countobj = {code:0};
  for(var x=0;x<pagestart.length;x++){
  	slidearray.push({text:"SLIDE "+x, posInTextarea:pagestart[x].posinall, type:"slide"});
  	for(var line=pagestart[x].line;line<pageend[x].line;line++){
  		for(var y=0;y<inline[line].length;y++){
  			actel = inline[line][y];
  			if(actel.tag==="title"){
  				slidearray.push({
  					text:mdcodelines[actel.line].substring(actel.mdcode.length).toUpperCase(),
  					posInTextarea:slidenote.parser.map.lineend[actel.line], type:"title"
  				});
  				var endline = actel.line+1;
  				var tmptext = "";
  				while(endline<slidenote.parser.lineswithhtml.length &&
  						slidenote.parser.lineswithhtml[endline]===undefined &&
  						tmptext.length<30){
  					tmptext+=slidenote.parser.lines[endline];
  					endline++;
  				}
  				tmptext = tmptext.substring(0,28)+"...";
  				if(tmptext.length>3)slidearray.push({
  					text:tmptext, type:"text",
            posInTextarea:slidenote.parser.map.linestart[actel.line+1]
  				});
  			}else if(actel.dataobject){
          if(countobj[actel.dataobject.type]===undefined)countobj[actel.dataobject.type]=0;
          countobj[actel.dataobject.type]++;
  				slidearray.push({
  					text:actel.dataobject.type.toUpperCase() +" "+ countobj[actel.dataobject.type],
  					type:actel.dataobject.type,
  					posInTextarea:slidenote.parser.map.lineend[actel.line]
  				});
  				slidearray.push({
  					text:mdcodelines[actel.line+1].substring(0,28)+"...",
  					type:"text",
  					posInTextarea:slidenote.parser.map.linestart[actel.line+1]
  				});
  			}else if(actel.tag==="codestart"){
          countobj.code++;
          slidearray.push({
                  text:"CODE "+countobj.code, type:"code",
                  posInTextarea:slidenote.parser.map.lineend[actel.line]
                });
          var codetext = "";
          var endline = actel.line+1;
          while(endline<inline.length && inline[endline].length===0 && codetext.length<30){
            codetext+=slidenote.parser.lines[endline];
            endline++;
          }
          slidearray.push({text:codetext.substring(0,30)+"...", type:"text", posInTextarea:slidenote.parser.map.linestart[actel.line+1]});

        }
  		}
  	}
  }
  return slidearray;
}

newtheme.generateOutlineMenu = function(){
  var oldmenu = document.getElementById("outlineMenu");
  if(oldmenu)oldmenu.parentElement.removeChild(oldmenu);
  var menu = document.createElement("div");
  menu.id= "outlineMenu";
  var slidearray = this.parseOutlineMenu();
  for(var x=0;x<slidearray.length;x++){
  	var actel = slidearray[x];
  	var cssclass = "outlineMenu-"+actel.type;
  	var newdiv = document.createElement("button");
  	newdiv.innerText = actel.text;
  	newdiv.classList.add(cssclass);
  	newdiv.id="outlineM"+actel.posInTextarea;
  	newdiv.onclick = function(){
  		slidenote.extensions.getThemeByName("outline").gotoPos(this.id.substring(8));
  	}
    menu.appendChild(newdiv);
  }
  document.getElementById("editorblock").appendChild(menu);
}

newtheme.gotoPos = function(position){
  var menu = document.getElementById("outlineMenu");
  if(menu)menu.parentElement.removeChild(menu);
  if(position===undefined)return;
  slidenote.textarea.selectionEnd = position;
  slidenote.textarea.selectionStart = position;
  slidenote.textarea.focus();
  slidenote.parseneu();
}


newtheme.calculateSpeakTime = function(wordcount, selectionbol){
  var wordc = wordcount;
  var speaktime = 0;
  if(!wordcount)wordc = this.countWords(slidenote.textarea.value);
  var wordtime = Math.ceil(wordc/80*60) ;
  speaktime += wordtime;
  //console.log("wordtime:"+wordtime);
  //add here additional time:
  var selstart = 0;
  var selend = slidenote.textarea.value.length;
  if(selectionbol){
    selstart = slidenote.textarea.selectionStart;
    selend = slidenote.textarea.selectionEnd;
  }
  function isbetween(number){
    var result = false;
    //console.log(selstart+ "<"+number + "<"+selend);
    result = selstart < number && selend > number;
    return result;
  }
  var imagetime = 0;
  for(var x=0;x<slidenote.parser.map.insertedimages.length;x++){
    if(isbetween(slidenote.parser.map.insertedimages[x].posinall))
      imagetime+= 30; //hardcoded 30 sec per img
  }
  speaktime+=imagetime;
  var datablocktime = 0;
  for(var x=0;x<slidenote.parser.dataobjects.length;x++){
    if(!isbetween(slidenote.parser.dataobjects[x].posinall))continue;
    if(slidenote.parser.dataobjects[x].type==="chart")datablocktime+=60; //chart:60 sec;
    if(slidenote.parser.dataobjects[x].type==="table")datablocktime+=60;//tables:60sec;
    if(slidenote.parser.dataobjects[x].type==="latex")datablocktime+=120//latex:60sec;
  }
  speaktime+=datablocktime;

  var result ="";
  if(speaktime>60){
    result = " MIN";
    speaktime = Math.ceil(speaktime/60);
  }else{
    result = " SEC";
  }
  result = speaktime + result
  return result;
}

newtheme.styleThemeMDCodeEditor = function(){
  var selstart = slidenote.textarea.selectionStart;
  var selend = slidenote.textarea.selectionEnd;
  var selected = (selstart -selend != 0);
  if(selected){
    this.fillOutlineBlock(slidenote.textarea.value.substring(selstart,selend), true);
  }else{
    this.fillOutlineBlock(slidenote.textarea.value);
  }
}

slidenote.addTheme(newtheme);

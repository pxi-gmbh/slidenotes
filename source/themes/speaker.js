var slidenoteSpeaker = new Theme("speaker");
slidenote.extensions.speaker = slidenoteSpeaker;
slidenoteSpeaker.active=true;

//options:
slidenoteSpeaker.speechOptions = {
  useSpeechSynthesis:true,
  volume: 1,
  //voiceNr:10,
  //voiceURI: "native",
  rate: 1,
  pitch: 0.8,
  guiLang: 'en-US', //language for editor, such as toolbar
  lang: 'en-US', //default for editor
}
slidenoteSpeaker.defaultOptions = {
  allwaysActive: {active:false, description:"use speaker outside of audiomode"}, //only on audiomode
  readLine:{active:true, button:"l", description:"read current line"},
  readPage:{active:true, button:"p", description:"read current page"},
  readElement:{active:true, button:"e", description:"read current element"},
  onHover:{active:true, awaitTime: 1000,description:"read title on mouse over gui element (for example elements of toolbar)"},
  onFocus:{active:true, description:"read description of gui element on focus"},
}

slidenoteSpeaker.options = JSON.parse(JSON.stringify(slidenoteSpeaker.defaultOptions));
slidenoteSpeaker.metakey = "Numpad0";

slidenoteSpeaker.saveConfigString = function(){
  var saveobject = {
    options:{},
    metakey:this.metakey,
    speechOptions:this.speechOptions
  };
  let okeys = Object.keys(this.options);
  for(var x=0;x<okeys.length;x++){
    saveobject.options[okeys[x]]={
      active:this.options[okeys[x]].active,
    }
    if(this.options[okeys[x]].button!=undefined){
      saveobject.options[okeys[x]].button=this.options[okeys[x]].button;
    }
  }
  return JSON.stringify(saveobject);
}

slidenoteSpeaker.loadConfigString = function(savestring){
    var saveobject;
    try{
      saveobject = JSON.parse(savestring);
    }catch(e){
      console.warn("configstring of speaker malformed:"+savestring);
      return;
    }
    if(saveobject===null)return;
    this.metakey = saveobject.metakey;
    this.speechOptions = saveobject.speechOptions;
    let okeys = Object.keys(saveobject.options);
    for(var x=0;x<okeys.length;x++){
      this.options[okeys[x]].active = saveobject.options[okeys[x]].active;
      if(saveobject.options[okeys[x]].button!=undefined)this.options[okeys[x]].button=saveobject.options[okeys[x]].button;
    }
    this.initShortcuts();
}

slidenoteSpeaker.isActive = function(option){
  return (this.active &&
    (this.options.allwaysActive.active || slidenote.editormodus==="audio-mode")&&
    (option===undefined || this.options[option].active)
    );
}

slidenoteSpeaker.buildConfigMenu = function(){
  var configMenu = document.createElement("div");
  configMenu.id="slidenoteSpeakerConfigMenu";
  let speechTitle = document.createElement("h3");
  speechTitle.innerText  = "speech options";
  let speechSynthesisSelector = document.createElement("select");
  speechSynthesisSelector.classList.add("menuitem");
  let synoptrue = document.createElement("option");
  synoptrue.value = true;
  synoptrue.innerText = "use speechSynthesis-API / Browser";
  let synopfalse = document.createElement("option");
  speechSynthesisSelector.appendChild(synoptrue);
  speechSynthesisSelector.appendChild(synopfalse);
  synopfalse.value=false;
  synopfalse.innerText = "use external Screenreader with live-regions support";
  if(this.speechOptions.useSpeechSynthesis){
    synoptrue.checked = true;
    configMenu.classList.add("showAPIConfig");
    let hiddenitems = configMenu.getElementsByClassName("hiddenmenuitem");
    for(var i=hiddenitems.length-1;i>=0;i--){
      hiddenitems[i].classList.add("menuitem");
      hiddenitems[i].classList.remove("hiddenmenuitem");
    }
  }else{
    synopfalse.checked = true;
    let itemstohide = configMenu.querySelectorAll(".speechOptionsList .menuitem");
    for(var i=itemstohide.length-1;i>=0;i--){
      itemstohide[i].classList.add("hiddenmenuitem");
      itemstohide[i].classList.remove("menuitem");
    }
  }
  speechSynthesisSelector.value=this.speechOptions.useSpeechSynthesis;
  speechSynthesisSelector.onchange = function(){
    slidenoteSpeaker.speechOptions.useSpeechSynthesis=(this.value==="true");
    let configMenu = document.getElementById("slidenoteSpeakerConfigMenu");
    //if(this.value==="true")configMenu.classList.add("showAPIConfig"); else configMenu.classList.remove("showAPIConfig");
    configMenu.classList.toggle("showAPIConfig",(this.value==="true"));
    let hideitems = configMenu.querySelectorAll(".speechOptionsList .menuitem");
    if(hideitems.length===0)hideitems=configMenu.getElementsByClassName("hiddenmenuitem");
    for(var x=hideitems.length-1;x>=0;x--){
      if(this.value==="true"){
        hideitems[x].classList.add("menuitem");
        hideitems[x].classList.remove("hiddenmenuitem");
      }else{
        hideitems[x].classList.add("hiddenmenuitem");
        hideitems[x].classList.remove("menuitem");
      }
    }
    if(slidenoteguardian)slidenoteguardian.saveConfig("local");
  }
  let speechUl = document.createElement("ul");
  speechUl.classList.add("speechOptionsList");
    //volume
     let speechVolumeLi = document.createElement("li");
     let speechVolumeSlider = document.createElement("input");
     speechVolumeSlider.classList.add("menuitem");
     speechVolumeSlider.type="range";
     speechVolumeSlider.value = this.speechOptions.volume*100;
     speechVolumeSlider.min =1;
     speechVolumeSlider.max =10;
     speechVolumeSlider.oninput = function(){
       slidenoteSpeaker.speechOptions.volume = Math.floor(this.value*10)/100;
       if(slidenoteguardian)slidenoteguardian.saveConfig("local");
     }
     let volumeLabel = document.createElement("label");
     volumeLabel.innerText = "volume";
     speechVolumeLi.appendChild(volumeLabel);
     speechVolumeLi.appendChild(speechVolumeSlider);
     //rate
     let speechRateLi = document.createElement("li");
     let speechRateSlider = document.createElement("input");
     speechRateSlider.type="range";
     speechRateSlider.classList.add("menuitem");
     speechRateSlider.value = this.speechOptions.rate*100;
     speechRateSlider.min =1;
     speechRateSlider.max =10;
     speechRateSlider.oninput = function(){
       slidenoteSpeaker.speechOptions.rate = Math.floor(this.value*10)/100;
       if(slidenoteguardian)slidenoteguardian.saveConfig("local");
     }
     let rateLabel = document.createElement("label");
     rateLabel.innerText = "rate";
     speechRateLi.appendChild(rateLabel);
     speechRateLi.appendChild(speechRateSlider);
     //pitch
     let speechPitchLi = document.createElement("li");
    let speechPitchSlider = document.createElement("input");
    speechPitchSlider.type="range";
    speechPitchSlider.classList.add("menuitem");
    speechPitchSlider.value = this.speechOptions.pitch*100;
    speechPitchSlider.min =1;
    speechPitchSlider.max =10;
    speechPitchSlider.oninput = function(){
      slidenoteSpeaker.speechOptions.pitch = Math.floor(this.value*10)/100;
      if(slidenoteguardian)slidenoteguardian.saveConfig("local");
    }
    let pitchLabel = document.createElement("label");
    pitchLabel.innerText = "pitch";
    speechPitchLi.appendChild(pitchLabel);
    speechPitchLi.appendChild(speechPitchSlider);
     //guiLang: we make that not configurable, but
     //set this automaticaly with multilinguality

     //lang
     var allvoices = speechSynthesis.getVoices();
     if(allvoices.length>0){
       var langLi = document.createElement("li");
       allvoices.sort(function(a,b){return a.lang > b.lang});
       var langSelect = document.createElement("select");
       langSelect.classList.add("menuitem");
       for(var l=0;l<allvoices.length;l++){
         let op = document.createElement("option");
         op.value = allvoices[l].lang;
         op.innerText = allvoices[l].lang;
         if(allvoices[l].lang===this.speechOptions.lang)op.selected = true;
         langSelect.appendChild(op);
       }
       langSelect.onchange=function(){
         slidenoteSpeaker.speechOptions.lang=this.value;
         if(slidenoteguardian)slidenoteguardian.saveConfig("local");
       }
       langLabel = document.createElement("label");
       langLabel.innerText = "language"
       langLi.appendChild(langLabel);
       langLi.appendChild(langSelect);
     }
     //putting ul together:
     if(langLi!=undefined)speechUl.appendChild(langLi);
     speechUl.appendChild(speechVolumeLi);
     speechUl.appendChild(speechRateLi);
     speechUl.appendChild(speechPitchLi);
     // keyboardshortcuts:
  let onclickf = function(){
    if(this.changingactive)return;
    this.changingactive=false;
    if(confirm("press ok and then the key you want to use")){
      this.classList.add("changingactive");
      this.changingactive=true;
    }else{
      this.classList.remove("changingactive");
      this.changingactive=false;
    }
    this.focus();
  }
  let onkeyupf = function(e){
    if(this.changingactive===false || this.classList.contains("changingactive")===false)return;
    let key = e.key;
    let changed = false;
    if(e.code.indexOf("Numpad")>-1)key = e.code;
    if(this.name==="metakey" && confirm("set metakey to "+key)){
      slidenoteSpeaker.metakey=key;
      changed=true;
      this.innerText = key;

    }else if(confirm("set key to "+key)){
      slidenoteSpeaker.options[this.name].button = key;
      changed=true;
      this.innerText=slidenoteSpeaker.metakey + "+" + key;
    }
    if(changed){
      slidenoteSpeaker.initShortcuts();
    }
    this.classList.remove("changingactive");
    this.changingactive=false;
  }

  let optionsTitle = document.createElement("h3");
  optionsTitle.innerText = "editor Options";
  let optionsUl = document.createElement("ul");
  optionsUl.classList.add("keyboardshortcuts");

  let optionsMetaKeyli = document.createElement("li");
  let optionsMetaKeyLabel = document.createElement("label");
  optionsMetaKeyLabel.innerText = "metakey to use for speaker";
  let optionsMetaKeyButton = document.createElement("button");
  optionsMetaKeyButton.innerText = this.metakey;
  optionsMetaKeyButton.name = "metakey";
  optionsMetaKeyButton.onclick = onclickf;
  optionsMetaKeyButton.onkeyup = onkeyupf;
  optionsMetaKeyButton.classList.add("menuitem");
  optionsMetaKeyli.appendChild(optionsMetaKeyLabel);
  optionsMetaKeyli.appendChild(optionsMetaKeyButton);
  optionsUl.appendChild(optionsMetaKeyli);

  let keys = Object.keys(this.options);
  for(var x=0;x<keys.length;x++){
    let key = keys[x];
    let act = this.options[key];
    let li = document.createElement("li");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("menuitem");
    if(act.active)checkbox.checked = true;
    checkbox.option = key;
    checkbox.onclick = function(){
      slidenoteSpeaker.options[this.option].active = this.checked;
      if(slidenoteguardian)slidenoteguardian.saveConfig("local");
    };
    let description = document.createElement("label");
    description.innerText = act.description;
    li.appendChild(description);
    li.appendChild(checkbox);
    if(act.button!=undefined){
      let button = document.createElement("button");
      button.innerText = this.metakey + " + " + act.button;
      button.name = key;
      button.onclick = onclickf;
      button.onkeyup = onkeyupf;
      button.classList.add("menuitem");
      li.appendChild(button);
    }
    if(x===0)optionsUl.insertBefore(li, optionsUl.firstChild);
    else optionsUl.appendChild(li);
  }
  configMenu.appendChild(speechTitle);
  configMenu.appendChild(speechSynthesisSelector);
  configMenu.appendChild(speechUl);
  configMenu.appendChild(optionsTitle);
  configMenu.appendChild(optionsUl);
  return configMenu;
}

slidenoteSpeaker.say = function(m, gui, wait) {
  console.log("speaker says:"+m);
  var msg = new SpeechSynthesisUtterance();
  var voices = window.speechSynthesis.getVoices();
  // msg.voice = voices[10];
  //msg.voiceURI = "native";
  msg.volume = this.speechOptions.volume; //1;
  msg.rate = this.speechOptions.rate; //1;
  msg.pitch = this.speechOptions.pitch; //0.8;
  msg.text = m;
  if(gui)msg.lang=this.speechOptions.guiLang;
  else msg.lang = this.speechOptions.lang; //'de';//'en-US';
  if(wait!=true)speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

slidenoteSpeaker.readLine = function(linenr){
  if(!this.isActive("readLine"))return;
  var nr = linenr;
  if(nr===null || nr===undefined)nr = slidenote.parser.lineAtPosition(slidenote.textarea.selectionEnd);
  console.log("speaker: readline "+nr);
  var linetext = slidenote.parser.map.origLines[nr];
  console.log("speaker: linetext"+linetext);
  var cursorpos = slidenote.textarea.selectionEnd;
  var lst = slidenote.parser.map.linestart[nr];
  var lend = slidenote.parser.map.lineend[nr];
  console.log("cursorpos:"+cursorpos+"lst:"+lst+"lend"+lend);
  if(lst <= cursorpos &&lend>=cursorpos){
      console.log("insert cursor to speaker text");
      var cpos = cursorpos - slidenote.parser.map.linestart[nr];
      linetext = linetext.substring(0,cpos)+" Cursor "+linetext.substring(cpos);
    }
  //linetext = "line "+nr+": "+linetext;
  nr++;
  this.say("line ",true,false); //speak in gui-language, aggressive
  this.say(nr + ": "+linetext, false, true); //speak in user-defined language, wait till first has finished
}

slidenoteSpeaker.readPage = function(pagenr){
  if(!this.isActive("readPage"))return;
  var nr = pagenr;
  if(!nr+1>0)nr=slidenote.parser.map.pageAtPosition(slidenote.textarea.selectionEnd);
  console.log("speaker:read Page "+nr);
  if(nr<slidenote.parser.map.pagesCode.length)
        var pageText = "Slide Number "+(nr+1)+":";
        pageText+=slidenote.parser.map.pagesCode[nr];
        this.say(pageText);
}

slidenoteSpeaker.readElement = function(mdelement){
  if(!this.isActive("readElement"))return;
  var elem = mdelement;
  if(elem===null || elem===undefined)elem = slidenote.parser.CarretOnElement();
  console.log("speaker: speak Element:");console.log(elem);
  var textToSpeak = "";
  if(elem===null || elem===undefined){
    textToSpeak="No Element found";
    return;
  }
  if(elem.dataobject){
    textToSpeak = "Sectionblock Type "+elem.dataobject.type;
    let headtext = elem.dataobject.head.substring(4+elem.dataobject.type.length);
    if(headtext.length>0)textToSpeak+= " with head "+headtext;
    //textToSpeak+= " line 1: " + elem.dataobject.raw.join(". line 2:");
    for(let hx=0;hx<elem.dataobject.raw.length;hx++)textToSpeak+="line "+(hx+1)+". "+elem.dataobject.raw[hx];
  }else{
    //other objects like title
  }
  this.say(textToSpeak);
}

slidenoteSpeaker.whereAmI = function(){
    let result;
    let actfocuselement = document.activeElement;
    if(actfocuselement === slidenote.textarea){
        result = this.editorOverview();
    }else if(actfocuselement.type === submit){
        result.type = "button";
        result.text = actfocuselement.innerText;
    }
    result.focusOnElement = actfocuselement;
    return result;
}

slidenoteSpeaker.editorOverview = function(){
    let result = {type:"editor"};
    let selection = (slidenote.textarea.selectionEnd - slidenote.textarea.selectionStart === 0);
    let carretpos = slidenote.textarea.selectionStart;
    let element = slidenote.parser.CarretOnElement();
    let pagenr = slidenote.parser.map.pageAtPosition(carretpos);
    let slidenr = pagenr +1;
    let linenr = slidenote.parser.lineAtPosition(carretpos);
    let lineOnSlide = linenr - slidenote.parser.map.pagestart[linenr].line + 1;

    if(selection){
        let toSlide = slidenote.parser.map.pageAtPosition(slidenote.textarea.selectionEnd) + 1;
        let toLine = slidenote.parser.lineAtPosition(slidenote.textarea.selectionEnd) + 1;

        result.text = "selection from slide "+slidenr+" line "+lineOnSlide+" to slide "+toSlide+" line "+toLine;
        result.text +=": \n"+slidenote.textarea.value.substring(slidenote.textarea.value.selectionStart, slidenote.texarea.value.selectionEnd);
    }else{
      result.text = "carret on slide "+slidenr+" line "+lineOnSlide;
      if(element){
        result.text += " inside "+element.label;
      }
    }
    result.text += ": \n" + slidenote.parser.lines[linenr];
    return result;
}

slidenoteSpeaker.hoverManager = {
    lastFocus: null,
    onHover: function(e){
      if(slidenoteSpeaker.isActive("onHover") &&
          ((e.target.title && e.target.title.length>0)||
          (e.target.alt && e.target.alt.length>0))){
        let title = e.target.title;
        if(e.target.alt && e.target.alt.length>0)title=e.target.alt;
        //console.log("mousehover on " +title);
        //console.log(e);
        this.lastFocus = title;
        setTimeout("slidenoteSpeaker.hoverManager.onHoverSpeak('" + title + "')",slidenoteSpeaker.options.onHover.awaitTime);
        e.target.onmouseleave = function(){
          slidenoteSpeaker.hoverManager.lastFocus=null
          //console.log("leaving "+this.title + " "+this.alt);
        };
      }
    },
    onHoverSpeak: function(title){
      if(this.lastFocus===title){
        slidenoteSpeaker.say(title, true);
        this.lastFocus=null;
      }
    },
    init: function(){
      document.body.addEventListener("mouseover",function(e){
        slidenoteSpeaker.hoverManager.onHover(e);
      });
    }
}

slidenoteSpeaker.onFocusFunction = function(e){
  if(!slidenoteSpeaker.isActive("onFocus"))return;
  let target = e.target;
  //console.log("focus on:");console.log(target);
  if(target!=slidenote.textarea){
    //console.log(target.innerText);
    let wait = false;
    slidenoteSpeaker.say(target.innerText,true,wait);
  }

};

slidenoteSpeaker.keyPressed = function(event){
  var key = event.key;
  //console.log(event);
  var stopEvent = false;
  if(event.key===this.options.readLine.button){this.readLine();stopEvent=true;}
  if(event.key===this.options.readElement.button){this.readElement();stopEvent=true;}
  if(event.key===this.options.readPage.button){this.readPage();stopEvent=true;}

  if(stopEvent){
    event.preventDefault();
    return false;
  }
}

slidenoteSpeaker.initShortcuts = function(dontsave){
  if(slidenote===undefined || slidenote.keyboardshortcuts === undefined)return;
  let metakey = this.metakey;
  let buttons = new Array();
  let keys = Object.keys(this.options);
  for(var x=0;x<keys.length;x++){
    let act = this.options[keys[x]];
    if(act.button!=undefined && act.active){
      buttons.push(act.button);
    }
  }
  if(this.shortcut===undefined){
    this.shortcut = new slidenote.keyboardshortcuts.shortcut(
      "slidenoteSpeaker","global",
      {key:this.metakey,
      multipleChoiceKeys:buttons,
      metakey:false},
      function(e){
          slidenoteSpeaker.keyPressed(e);
      });
      slidenote.keyboardshortcuts.addShortcut(this.shortcut);
      this.stopOnMetakey = function(e){
        if(slidenoteSpeaker.isActive()===false)return;
        let key=e.key;
        if(e.code.indexOf("Numpad")>-1)key=e.code;
        if(key===slidenoteSpeaker.metakey ||
           slidenote.keyboardshortcuts.pressedkeys[slidenoteSpeaker.metakey]===true){
          e.preventDefault();
        }
      };
      slidenote.textarea.addEventListener("keydown", this.stopOnMetakey);
  }else{
    this.shortcut.key = this.metakey;
    this.shortcut.multipleChoiceKeys = buttons;
  }
  if(dontsave!=true && slidenoteguardian)slidenoteguardian.saveConfig("local");
}

slidenoteSpeaker.init = function(){
  //set default keystrokes:
  //slidenote.textarea.addEventListener("keydown",function(e){
  //  slidenoteSpeaker.keyPressed(e);
  //});
  this.hoverManager.init();
  document.body.addEventListener("focus",this.onFocusFunction,true);
}


slidenote.addTheme(slidenoteSpeaker);

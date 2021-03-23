var keyboardshortcuts = {
    allkeys : [], //one array to rule them all...
    //ctrlkeys:[],
    //secondkey:[],
    toolbar:[], //all shortcuts attached to toolbar
    insertmenu:[], //all shortcuts attached to insertmenu
    imagegallery:[], //all shortcuts attached to imagegallery
    textarea:[], //all shortcuts attached to textarea
    options:[], //all shortcuts attached to optionsmenu
    globals:[], //all shortcuts attached globaly
    menuload:[], //all shortcuts attached to load slidenotesmenu
    menucloud:[], //all shortcuts attached to cloud-menuload
    menupublish:[],//all shortcuts on publish-menu
    menuimportexport:[],//all shortcuts on import/export menu
    menuoptionspresentation:[],//all shortcuts presentation-options-menu
    menusearchbox:[],//all shortcuts searchbox
    dialog:[], //all shortcuts on dialog
    arrowleftright:[], //shortcuts arrownav left-right
    menuoptionseditor:[],//all shortcuts editor-options-menu
    presentation:[],//all shortcuts for presentation
    pressedkeys:{}, //element that holds all pressed keys at the time - used to check if shortcut is found
    metakey: "Control", //global metakey to check against
    automaticClosure:true, //global boolean if automatic closure is active or not
    enableTab:false, //global boolean if tab in editor should be enabled
}

keyboardshortcuts.shortcut = function(name, element, key, shortcutfunc){
    this.name = name; //unique name of shortcut - if made by a theme it should have theme-name inside of name
    this.element = element; //element the shortcut should be appended to: textarea,global,imagegallery,toolbar,insertmenu...
    this.metakey = true; //metakey is true as standard?
    this.keys = [];
    this.multipleChoiceKeys = [];
    //console.log("shortcut keyelement:"+typeof key);
    //console.log(key);
    if(typeof key === "string"){
        this.keys = [key]; //sole key-element
    }else if(key.constructor === Array){
        this.keys = key;
    }else{
        if(key.key)this.keys = [key.key]; //sole key in key-object
        if(key.keys)this.keys = key.keys; //array of pressed keys
        if(key.multipleChoiceKeys)this.multipleChoiceKeys = key.multipleChoiceKeys;
        if(key.metakey!=undefined)this.metakey = key.metakey; //if global-metakey should be pressed
    }
    this.activate = shortcutfunc; //"on shortcut entered do this"
    this.active = true; //not active shortcuts will not be used
}

keyboardshortcuts.allPressedKeys = function(){
  var keys = Object.keys(this.pressedkeys);
  var result = new Array();
  for(var x=0;x<keys.length;x++){
    if(this.pressedkeys[keys[x]]){
      result.push(keys[x]);
    }
  }
  return result;
}

keyboardshortcuts.configString = function(){
  var saveobject = {
    metakey:this.metakey,
    automaticClosure:this.automaticClosure,
    enableTab: this.enableTab,
  };
  saveobject.changedkeys = new Array();
  for(var x=0;x<this.allkeys.length;x++){
    var sc = this.allkeys[x];
    if(sc.standardkeys)saveobject.changedkeys.push({name:sc.name,keys:sc.keys,standardkeys:sc.standardkeys});
  }
  return JSON.stringify(saveobject);
}
keyboardshortcuts.loadConfigString = function(configstring){
  var confobject;
  try{
    confobject = JSON.parse(configstring);
  }catch(e){
    console.error("configstring malformed:"+configstring);
    return;
  }
  this.metakey = confobject.metakey;
  this.automaticClosure = confobject.automaticClosure;
  this.enableTab = (confobject.enableTab==true);
  for(var x=0;x<confobject.changedkeys.length;x++){
    var sc = confobject.changedkeys[x];
    var shortcut = this.shortcutByName(sc.name);
    shortcut.keys = sc.keys;
    shortcut.standardkeys = sc.standardkeys;
  }
  this.buildOptionsMenu();
}

keyboardshortcuts.addShortcut = function(shortcut){
    this.allkeys.push(shortcut);
    //if(shortcut.keys.includes("Control"))this.ctrlkeys.push(shortcut); //not used, can be gone i think and added on later if we really need it
    //TODO: secondkey
    var elements = shortcut.element;
    if(typeof elements === "string")elements = [shortcut.element];
    for(var x=0;x<elements.length;x++){
      let element = elements[x];
      // i use this block as a standard-definition of what exists
      // therefore a lot of ifs. performance is not crucial at this point
      if(element==="toolbar")this.toolbar.push(shortcut);
      if(element==="insertmenu")this.insertmenu.push(shortcut);
      if(element==="imagegallery")this.imagegallery.push(shortcut);
      if(element==="textarea")this.textarea.push(shortcut);
      if(element==="options")this.options.push(shortcut);
      if(element==="global")this.globals.push(shortcut);
      if(element==="menuload")this.menuload.push(shortcut);
      if(element==="menucloud")this.menucloud.push(shortcut);
      if(element==="menupublish")this.menupublish.push(shortcut);
      if(element==="menuimportexport")this.menuimportexport.push(shortcut);
      if(element==="menuoptionseditor")this.menuoptionseditor.push(shortcut);
      if(element==="menuoptionspresentation")this.menuoptionspresentation.push(shortcut);
      if(element==="menusearchbox")this.menusearchbox.push(shortcut);
      if(element==="dialog")this.dialog.push(shortcut);
      if(element==="arrowleftright")this.arrowleftright.push(shortcut);
      if(element==="presentation")this.presentation.push(shortcut);
    }
}

keyboardshortcuts.toggleShortcut = function(shortcutname, state){
    var shortcut = this.shortcutByName(shortcutname);
    if(shortcut===null){console.log("shortcut "+shortcutname+" not found");return;}
    if(state!=undefined && state!=null)shortcut.active=state;else shortcut.active=!shortcut.active;
    console.log("shortcut "+shortcutname+"deactivated");
    slidenoteguardian.saveConfig("local");

}

keyboardshortcuts.shortcutByName = function(shortcutname){
   var shortcut = null;
   for(var x=0;x<this.allkeys.length;x++){
        if(this.allkeys[x].name===shortcutname){shortcut=this.allkeys[x];break;}
        //console.log(this.allkeys[x].name + "->\n"+shortcutname+"<-");
    }
   return shortcut;
}

keyboardshortcuts.buildOptionsMenu = function(focusbutton){
    if(!this.optionsmenu){
        this.optionsmenu = document.createElement("div");
    }
    this.optionsmenu.innerHTML = "";
    //change later with different groups maybe:
    var allinone = document.createElement("ul");
    allinone.classList.add("keyboardshortcuts");
    //meta-key:
    let metali = document.createElement("li");
    let metabutton = document.createElement("button");
    let metalabel = document.createElement("label");
    metalabel.innerText = "metakey";
    metali.appendChild(metalabel);
    metabutton.innerText = this.metakey;
    if(this.isMac && this.metakey=="Meta")metabutton.innerText="cmd";
    metabutton.changingactive = false;
    metabutton.name = "metakey"
    metabutton.onclick = function(){
      if(this.changingactive)return;
        this.changingactive=false;
      if(confirm("press ok and then the key you want to use to change metakey")){
        this.changingactive=true;
        this.classList.add("changingactive");
      }else{
        this.classList.remove("changingactive");
      }
      this.focus();
    }
    metabutton.onkeyup = function(e){
      if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
      var key = e.key+"";
      if(key==="undefined")key=getKeyOfKeyCode(e.keyCode);
      var displaykey = key;
      if(keyboardshortcuts.isMac && key=="Meta")displaykey = "cmd";
      else if(key==" ")displaykey="space";
      else displaykey = key.toLowerCase();
      if(e.code.indexOf("Numpad")>-1)key=e.code;
      if(this.changingactive){
        this.changingactive=false;
        if(confirm("set metakey to "+displaykey+"?")){
          slidenote.keyboardshortcuts.metakey = key;
          slidenote.extensions.showKeyboardConfig("metakey");
          slidenoteguardian.saveConfig("local");
        }
      }
    }
    metali.appendChild(metabutton);
    allinone.appendChild(metali);
    for(var x=0;x<this.allkeys.length;x++){
        var shortcut = this.allkeys[x];
        if(shortcut.name.indexOf("arrow")>-1 ||
        shortcut.name.indexOf("escape")>-1 ||
        shortcut.name.indexOf("navigation")>-1 ||
        //shortcut.name.indexOf('move line up')>-1 ||
        shortcut.name.indexOf("slidenoteSpeaker")>-1)continue;
        var li = document.createElement("li");
        var check = document.createElement("input");
        check.type = "checkbox";
        check.name = shortcut.name;
        check.checked = shortcut.active;
        check.onchange = function(){
            keyboardshortcuts.toggleShortcut(this.name, this.checked);
        }
        var label = document.createElement("label");
        label.innerText = shortcut.name;
        li.appendChild(label);
        li.appendChild(check);

        var changebutton = document.createElement("button");
        var buttontext = "";
        if(shortcut.metakey){
          if(this.isMac && this.metakey=="Meta")buttontext+='cmd ';
          else buttontext += this.metakey+" ";
        }
        buttontext+=shortcut.keys.join(" ");
        if(shortcut.keys[0]===" ")buttontext+='Space';
        if(shortcut.multipleChoiceKeys.length>0){
          buttontext+=" ["+shortcut.multipleChoiceKeys.join(" | ")+"]";
          changebutton.disabled = true;
        }

        changebutton.innerText = buttontext;
        changebutton.name = shortcut.name;

        //add changefunction
        //new:
        changebutton.changingactive=false;
        changebutton.onclick = function(){
            if(this.changingactive)return;
            this.changingactive=false;
          if(confirm("press ok and then the key(s) you want to use for "+this.name.toLowerCase())){
            this.changingactive=true;
            this.classList.add("changingactive");
            slidenote.keyboardshortcuts.tempkeydowns = new Array();
          }else{
            this.classList.remove("changingactive");
          }
          this.focus();
        }
        changebutton.onkeydown = function(e){
          if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
          if(!this.changingactive)return;
          key = e.key;
          if(key===undefined)key=getKeyOfKeyCode(e.keyCode);
          if(e.code.indexOf("Numpad")>-1)key=e.code;
          slidenote.keyboardshortcuts.tempkeydowns.push(key);
        };
        changebutton.onkeyup = function(e){
          if(!this.changingactive)return;
          var shortcut = slidenote.keyboardshortcuts.shortcutByName(this.name);
          var pressedkeys = slidenote.keyboardshortcuts.pressedkeys;
          var objindex = Object.keys(pressedkeys);
          var pressedkeyarray = slidenote.keyboardshortcuts.tempkeydowns;//new Array();
          var metakey = slidenote.keyboardshortcuts.metakey;
          //for(var x=0;x<objindex.length;x++){
          //  if(objindex[x]===metakey)continue;
          //  if(pressedkeys[objindex[x]])pressedkeyarray.push(objindex[x]);
          //}
          var previewtext = "";
          if(pressedkeyarray.indexOf(metakey)>-1)pressedkeyarray.splice(pressedkeyarray.indexOf(metakey),1);
          if(shortcut.metakey)previewtext+=metakey + " ";
          //previewtext += pressedkeyarray.join(" ");
          for(var x=0;x<pressedkeyarray.length;x++){
            if(pressedkeyarray[x]==" ")previewtext+="space ";
            else previewtext += pressedkeyarray[x]+ " ";
          }
            this.changingactive=false;
            if(confirm("set "+this.name.toLowerCase()+" to "+previewtext.toLowerCase())){
              if(shortcut.standardkeys===undefined)shortcut.standardkeys = shortcut.keys;
              shortcut.keys = pressedkeyarray;
              slidenote.extensions.showKeyboardConfig(this.name);
              slidenoteguardian.saveConfig("local");
            }
            this.classList.remove("changingactive");
            slidenote.keyboardshortcuts.tempkeydowns = new Array();

        }
        /*old:
        changebutton.onclick = function(){
          var shortcut = slidenote.keyboardshortcuts.shortcutByName(this.name);
          slidenote.keyboardshortcuts.changeKeyByUserInput(shortcut);
        }*/
        li.appendChild(changebutton);
        if(shortcut.standardkeys){
          var revertbutton = document.createElement("button");
          revertbutton.innerText = "revert to standard";
          revertbutton.name = shortcut.name;
          revertbutton.classList.add('revertbutton');
          revertbutton.onclick = function(){
            var shortcut = slidenote.keyboardshortcuts.shortcutByName(this.name);
            if(shortcut.standardkeys){
              shortcut.keys = shortcut.standardkeys;
              shortcut.standardkeys = undefined;
              slidenote.extensions.showKeyboardConfig(this.name);
              slidenoteguardian.saveConfig("local");
            }
          }
          li.appendChild(revertbutton);
        }
        //ToDo: append on different parrents, depending element
        allinone.appendChild(li);
    }//for-to
    //automagic closure: -> moved to extraoptions-theme
    /*var amli = document.createElement("li");
    var amcheck = document.createElement("input");
    amcheck.type = "checkbox";
    amcheck.name = "automagic closure";
    amcheck.checked = this.automaticClosure;
    amcheck.onchange = function(){
        slidenote.keyboardshortcuts.automaticClosure = (this.checked);
        slidenoteguardian.saveConfig("local");
    }
    amli.appendChild(amcheck);
    var amlabel = document.createElement("label");
    amlabel.innerText = "Automatic Closure on * ~ ` _";
    amli.appendChild(amlabel);
    allinone.appendChild(amli);
    */
    this.optionsmenu.appendChild(allinone);
    return this.optionsmenu;
}

keyboardshortcuts.selectCurrentElement = function(){
  var el = slidenote.parser.CarretOnElement();
  var selstart;
  var selend;
  if(el && el.parentelement){
    selstart = el.parentelement.posinall;
    selend = slidenote.parser.map.lineend[el.parentelement.lastline];
  }else if(el){ selstart=el.posinall;
      if(el.brotherelement)selend=el.brotherelement.posinall+el.brotherelement.mdcode.length;
      if(el.brotherelement===undefined){
        selend = slidenote.parser.map.lineend[el.line];
      }
      if(el.typ === "image")selend=selstart+el.mdcode.length;
      if(el.tag==="linkend"){
        selstart = el.brotherelement.posinall;
        selend = el.posinall+el.mdcode.length;
      }
  }
  if(selstart!=null && selend!=null){
    slidenote.textarea.selectionStart = selstart;
    slidenote.textarea.selectionEnd = selend;
  }
}

keyboardshortcuts.init = function(){
    //add basic shortcuts:
    //start presentation
    this.addShortcut(new keyboardshortcuts.shortcut("start presentation","global", "Enter", function(){
      //slidenote.parseneu();slidenote.presentation.showpresentation();
      document.getElementById("playbutton").click();
    }));
    //select element - just for testuse:
    /*
    this.addShortcut(new this.shortcut("select element", "textarea","m",function(){
        slidenote.keyboardshortcuts.selectCurrentElement();
    }));
    */
    /*
    //jump to next/last element: does not work at the moment...
    this.addShortcut(new this.shortcut("jump to element","textarea",{multipleChoiceKeys:["PageUp","PageDown"],metakey:true},function(e){
      var actline = slidenote.parser.lineAtPosition(slidenote.textarea.selectionStart);
      var selstart = slidenote.textarea.selectionStart;
      var selend = slidenote.textarea.selectionEnd;
      var actel = slidenote.parser.CarretOnElement(selstart,true);
      var endel = actel;
      var seldirection = slidenote.textarea.selectionDirection;
      var selisforward = (seldirection === "forward");
      if(selend-selstart!=0){
        endel=slidenote.parser.CarretOnElement(selend,true);
        if(selisforward){
          actel=endel;
          actline = slidenote.parser.lineAtPosition(slidenote.textarea.selectionEnd,true);
        }
      }

      if(e.shiftKey && selend-selstart===0){
        slidenote.keyboardshortcuts.selectCurrentElement();
        if(e.key==="PageDown")slidenote.textarea.selectionDirection="forward";
          else slidenote.textarea.selectionDirection="backward";
        return; //do nothing more
      }
      if(e.key==="PageDown"){
        if(actel && actel.parentelement)actline=actel.parentelement.lastline+1;
        var elines = slidenote.parser.map.insertedhtmlinline;
        if(actline>elines.length)return;
        for(var x=actline;x<elines.length;x++){
          var found=false;
          for(var y=0;y<elines[x].length;y++){
            var el=elines[x][y];
            if((el.typ==="start" || el.typ==="image")&&el!=actel && (!actel || el.posinall>actel.posinall)){
              actel=el;
              found=true;
              break;
            }
          }
          if(found)break;
        }
      }else{
        //actel = slidenote.parser.CarretOnElement(selstart);
        if(actel && actel.parentelement)actline=actel.parentelement.line-1;

        var elines = slidenote.parser.map.insertedhtmlinline;
        if(actline<0)actline=0;
        for(var x=actline;x>=0;x--){
          var found=false;
          for(var y=elines[x].length-1;y>=0;y--){
            var el=elines[x][y];
            if((el.typ==="start" || el.typ==="image" || el.typ==="pagebreak")&&el!=actel && (!actel || el.posinall<actel.posinall)){
              actel=el;
              found=true;
              break;
            }
          }
          if(found)break;
        }
      }

      if(actel){
        var pos = actel.posinall;
        slidenote.textarea.selectionEnd = pos;
        slidenote.textarea.selectionStart=pos;
        if(e.shiftKey){
          slidenote.keyboardshortcuts.selectCurrentElement();
          if(selisforward){
            if(e.key==="PageUp"){
              if(pos<selstart){
                //selection turns backward
                slidenote.textarea.selectionEnd = selstart;
                slidenote.textarea.selectionDirection="backward";
              }else{
                //selection stays forward
                slidenote.textarea.selectionStart = selstart;
                slidenote.textarea.selectionDirection = "forward";
              }
            }else{ //Arrow-Down
              //selection stays forward
              slidenote.textarea.selectionStart = selstart;
              slidenote.textarea.selectionDirection = "forward";
            }
          }else{ //selisbackward
            if(e.key==="PageDown" && pos>selend){
              //selection changes selectionDirection
              slidenote.textarea.selectionStart=selend;
              slidenote.textarea.selectionDirection="forward";
            }else{
              //selection does not change selectionDirection
              slidenote.textarea.selectionEnd = selend;
              slidenote.textarea.selectionDirection="backward";
            }
          }
        }
        var carret = document.getElementById("carret");
        if(carret)carret.parentNode.removeChild(carret);
        slidenote.parser.renderNewCursorInCodeeditor();
        var pressedkeys = slidenote.keyboardshortcuts.pressedkeys;
        slidenote.textarea.blur();
        slidenote.textarea.focus();
        slidenote.keyboardshortcuts.pressedkeys=pressedkeys;
      }
    }));
    */
    //move lines up and down:
    this.addShortcut(new this.shortcut("move line up or down", "textarea", {multipleChoiceKeys:["ArrowUp","ArrowDown"],metakey:true},function(e){
      let selstart = slidenote.textarea.selectionStart;
      let selend = slidenote.textarea.selectionEnd;
      let sellength = selend - selstart;
      var txt = slidenote.textarea.value;
      let lineblockstart = txt.lastIndexOf('\n',selstart-1);
      if(lineblockstart==-1)lineblockstart=0;
      let lineblockend = txt.indexOf('\n',selend);
      if(lineblockend==-1)lineblockend=txt.length;
      if(e.key==="ArrowUp"){
        let exchangestart = txt.lastIndexOf('\n',lineblockstart-1);
        if(exchangestart==-1)exchangestart=0;
        if(exchangestart==lineblockstart)return; //we cant go further up
        if(exchangestart==0){
          txt = txt.substring(lineblockstart+1,lineblockend)+
              '\n'+
              txt.substring(exchangestart,lineblockstart)+
              txt.substring(lineblockend);
          selstart = 0;
          selend = lineblockend - lineblockstart-1;
        }else{
          txt = txt.substring(0,exchangestart)+
              txt.substring(lineblockstart,lineblockend)+
              txt.substring(exchangestart,lineblockstart)+
              txt.substring(lineblockend);
          selstart = exchangestart+1;
          selend = exchangestart + lineblockend - lineblockstart;
        }
      }else{
        let exchangeend = txt.indexOf('\n',lineblockend+1);
        if(exchangeend==-1)exchangeend=txt.length;
        if(exchangeend==lineblockend)return; //we cant go further down
        if(lineblockstart==0){
          txt = txt.substring(lineblockend+1, exchangeend)+
                '\n'+
                txt.substring(lineblockstart,lineblockend)+
                txt.substring(exchangeend);
          selend = exchangeend;
          selstart =  selend-lineblockend + lineblockstart;
        }else{
          txt = txt.substring(0,lineblockstart)+
                txt.substring(lineblockend, exchangeend)+
                txt.substring(lineblockstart,lineblockend)+
                txt.substring(exchangeend);
          selend = exchangeend;
          selstart =  selend-lineblockend + lineblockstart +1;//dont select the \n
        }

      }
      slidenote.textarea.value=txt;
      slidenote.textarea.selectionStart = selstart;
      slidenote.textarea.selectionEnd = selend;
      slidenote.parseneu();
    }));
    /*
    //automatic closure on dead key:

    this.addShortcut(new this.shortcut("automatic closure for (deadkey)", "textarea",{multipleChoiceKeys:["Dead","`"],metakey:false},function(e){
      if(e.key===undefined)e.key=getKeyOfKeyCode(e.keyCode);
      if(!(e.key==="Dead" && e.shiftKey))return;
      var selstart = slidenote.textarea.selectionStart; //its the one after inserted `
      var selend = slidenote.textarea.selectionEnd;
      //if(selstart===selend)return; //only on selection
      var tmpselection = slidenote.keyboardshortcuts.tmpSelection;
      var txt = slidenote.textarea.value;
      if(txt.substring(selstart-2,selstart-1)!="\n"){
        txt = txt.substring(0,selend)+
        tmpselection + "`"+
        txt.substring(selend);
      }else{
        txt = txt.substring(0,selend)+ "``\n"+tmpselection+"\n```"+txt.substring(selend);
        selstart+=2;
      }
      slidenote.textarea.value=txt;

      slidenote.textarea.selectionStart = selstart;
      slidenote.textarea.selectionEnd = selstart+tmpselection.length;

      slidenote.textarea.blur();
      slidenote.textarea.focus();
      slidenote.parseneu();
    }));
    */
    //insertmenu:
    this.addShortcut(new this.shortcut("open context menu", "global", "ContextMenu", function(){
        //slidenote.presentation.showInsertMenu();
        //console.log("global shortcut on:"); console.log(this);
        nsbs = document.getElementById("nicesidebarsymbolcontainer");
        if(nsbs){
          nsbs.focus();
          nsbs.click();
        }
        setTimeout(function(){
        var b=document.getElementById("insertarea").getElementsByTagName("button");
        if(b && b[0]){
          b[0].focus();
          console.log("focus on insertmenu");
        }else{
          console.log("no focus-object available for insertmenu");
        }
      },100);


    }));
    this.addShortcut(new this.shortcut("arrownavigate insertmenu","insertmenu",{multipleChoiceKeys:["ArrowUp","ArrowDown"],metakey:false},function(event){
        var insmen = document.getElementById("insertarea");
        var buttons = insmen.getElementsByTagName("button");
        var bnr=0;
        for(var x=0;x<buttons.length;x++)if(buttons[x]===document.activeElement)bnr=x;
        if(event.key==="ArrowUp")bnr--; else bnr++;
        if(bnr<0)bnr=buttons.length-1;
        if(bnr>=buttons.length)bnr=0;
        buttons[bnr].focus();
        console.log("move to button no"+bnr);
    }));
    this.addShortcut(new this.shortcut("escape insertmenu","insertmenu",{key:"Escape",metakey:false},function(e){slidenote.textarea.focus();}));

    //toolbar:
    this.addShortcut(new this.shortcut("open toolbar", "global", " ", function(e){
      var toolbar = document.getElementById("toolbar");
      toolbar.classList.add("active");
      document.getElementById("toolbarbutton").classList.add("active");
      document.getElementById("imagegallery").classList.remove("active");
      document.getElementById("imagegallerybutton").classList.remove("active");
      document.getElementById("menusearchbox").classList.remove("active");
      document.getElementById("searchbutton").classList.remove("active");

      //setTimeout("document.getElementById('toolbar').getElementsByTagName('button')[0].focus()",20);
      slidenote.keyboardshortcuts.delayTillKeyUp(function(){
        setTimeout("document.getElementById('toolbar').getElementsByTagName('button')[0].focus();",20);
      });
    }));
    /*this.addShortcut(new this.shortcut("arrownavigate toolbar", "toolbar", {multipleChoiceKeys:["ArrowUp","ArrowDown"],metakey:false}, function(e){
      var toolbar = document.getElementById("texteditorbuttons");
      var toolbarbuttons = toolbar.getElementsByTagName("button");
      var actnr = 0;
      for(var x=0;x<toolbarbuttons.length;x++)if(toolbarbuttons[x]===document.activeElement)actnr=x;
      if(e.key==="ArrowUp")actnr--;else actnr++;
      if(actnr<0)actnr=toolbarbuttons.length-1;
      if(actnr>=toolbarbuttons.length)actnr=0;
      toolbarbuttons[actnr].focus();
      console.log("move to button no "+actnr);
    }));
    this.addShortcut(new this.shortcut("escape toolbar","toolbar",{key:"Escape",metakey:false},function(e){slidenote.textarea.focus();}));
*/
    //optionsmenu:
    this.addShortcut(new this.shortcut("open options", "global", "o",function(e){
      document.getElementById("optionsbutton").click();
    }));
    //designmenu:
    this.addShortcut(new this.shortcut("open slide design menu", "global", "d",function(e){
      document.getElementById("presentationoptionsbutton").click();
    }));
    /*this.addShortcut(new this.shortcut("escape optionsmenu","options",{key:"Escape",metakey:false},function(e){
      slidenote.textarea.focus();
      slidenote.extensions.optionmenu.classList.remove("active");
    }));*/
    this.addShortcut(new this.shortcut("open publish menu", "global", "p",function(e){
      document.getElementById("publishbutton").click();
    }));
    this.addShortcut(new this.shortcut("open file menu", "global", ["Shift","F"],function(e){
      document.getElementById("importexportbutton").click();
    }));
    this.addShortcut(new this.shortcut("open cloud menu", "global",["Shift","S"],function(e){
      document.getElementById("cloud").click();
    }));
    this.addShortcut(new this.shortcut("save note to cloud directly", "global","s",function(e){
      document.getElementById("savebutton").click();
    }));
    this.addShortcut(new this.shortcut("open noteload menu", "global","l",function(e){
      document.getElementById("loadnote").click();
    }));
    this.addShortcut(new this.shortcut("open imagegallery", "global","i",function(e){
      let igb = document.getElementById("imagegallerybutton");
      if(igb.classList.contains('active')){
        let firstbutton = document.querySelector('#imagegallerybox button');
        firstbutton.focus();
      }else igb.click();
    }));
    this.addShortcut(new this.shortcut("open search menu", "global","f",function(e){
      let sb = document.getElementById("searchbutton");
      if(sb.classList.contains("active")){
        document.getElementById('findinput').focus();
      }else sb.click();
    }));

    //history:
    this.addShortcut(new this.shortcut("undo last change", "global","z",function(e){
      document.getElementById("historyBackButton").click();
    }));
    this.addShortcut(new this.shortcut("redo last undone change", "global","y",function(e){
      document.getElementById("historyForwardButton").click();
    }));
    /*
    this.addShortcut(new this.shortcut("arrownavigate insertmenu","insertmenu",["ArrowDown"],false,function(){
        var insmen = document.getElementById("insertarea");
        var buttons = insmen.getElementsByTagName("button");
        var bnr=0;
        for(var x=0;x<buttons.length;x++)if(buttons[x]===document.activeElement)bnr=x;
        bnr++;
        if(bnr>=buttons.length)bnr=0;
        buttons[bnr].focus();
    }));*/
    //general arrow-keys on menus:
    var arrownav = function(e){
      //we presume that "this" is the calling object: wrong!
      console.log(e);
      var element = e.currentTarget;
      var buttons = element.getElementsByClassName("menuitem");
      if(buttons.length<1)buttons = element.getElementsByTagName("button");
      if(buttons.length<1)return;
      var actpos = 0;
      var actel = document.activeElement;
      for(var x=0;x<buttons.length;x++){
        actpos=x; if(actel===buttons[x])break;
      }
      if(e.key==="ArrowUp")actpos--;
      if(e.key==="ArrowDown")actpos++;
      if(actpos>=buttons.length)actpos=0;
      if(actpos<0)actpos=buttons.length-1;
      buttons[actpos].focus();
    }
    //dialog-key-nav:
    this.addShortcut(new this.shortcut("arrownavigate dialog leftright", "arrowleftright",
        {multipleChoiceKeys:["ArrowLeft","ArrowRight"],metakey:false},function(e){
          var element = e.currentTarget;
          var buttons = element.getElementsByClassName("menuitem");
          if(buttons.length<1)buttons = element.getElementsByTagName("button");
          if(buttons.length<1)return;
          var actpos = 0;
          var actel = document.activeElement;
          for(var x=0;x<buttons.length;x++){
            actpos=x; if(actel===buttons[x])break;
          }
          if(e.key==="ArrowLeft")actpos--;
          if(e.key==="ArrowRight")actpos++;
          if(actpos>=buttons.length)actpos=0;
          if(actpos<0)actpos=buttons.length-1;
          buttons[actpos].focus();
    }));
    this.addShortcut(new this.shortcut("arrownavigate dialog",
      "dialog",
      {multipleChoiceKeys:["ArrowUp","ArrowDown"],metakey:false},
      arrownav));
    this.addShortcut(new this.shortcut("arrownavigate dialog escape",
        "dialog",
        {key:["Escape"],metakey:false},
        function(e){
          var cancelbutton = document.getElementById("dialogclosebutton");
          if(cancelbutton){
            cancelbutton.click();
          }else{
            var dialog = document.getElementById("dialogcontainer");
            if(dialog)dialog.parentElement.removeChild(dialog);
            slidenote.textarea.focus();
          }
        }));

    if(slidenote.menumanager === undefined)return;
    var standardmenus = slidenote.menumanager.standardmenus;
    if(standardmenus===undefined)return;
    for(var x=0;x<standardmenus.length;x++){
      var menuname = standardmenus[x];
      this.addShortcut(new this.shortcut("arrownavigate "+menuname,
        menuname,
        {multipleChoiceKeys:["ArrowUp","ArrowDown"],metakey:false},
        arrownav));
      this.addShortcut(new this.shortcut("arrownavigate "+menuname+" escape",
          menuname,
          {key:["Escape"],metakey:false},
          function(e){
            slidenote.textarea.focus();
            slidenote.textarea.click();
      }));
    }
    //extra, because escape in menusearchbox has own function:
    this.shortcutByName("arrownavigate menusearchbox escape").activate = function(e){
      slidenote.textarea.focus();
      //document.getElementById("menusearchbox").classList.remove("active");
      //document.getElementById("searchbutton").classList.remove("active");
    }
    //letter-navigation in toolbar:
    this.addShortcut(new this.shortcut("letter navigation in toolbar","toolbar",{multipleChoiceKeys:["c","t","l","q","n","f","i","o","h","b","d"],metakey:false},function(e){
      //["c","t","l","q","n","f","i","o","h","b","d"]
      var nametable = {
        c:["code-block","chart","comment"],
        t:["table","title","headline"],
        l:["list","link","latex","layout"],
        q:["quote"],
        n:["new slide"],
        f:["footnote"],
        i:["image","italic", "inline"],
        o:["ordered list"],
        h:["hidden","headline","title"],
        b:["bold"],
        d:["deleted","crossed"]
      };
      var key = e.key;
      if(nametable[key]===undefined)return;
      var toolbar = document.getElementById("toolbar");
      var buttons = toolbar.getElementsByTagName("button");
      var beforeactiveelement = true;
      for(var x=0;x<buttons.length;x++){
        if(buttons[x]===document.activeElement){
          beforeactiveelement=false;
          continue;
        }
        if(beforeactiveelement)continue;
        for(var y=0;y<nametable[key].length;y++){
          if(buttons[x].title.indexOf(nametable[key][y])>-1||
            buttons[x].value.indexOf(nametable[key][y])>-1){
            buttons[x].focus();
            return;
          }
        }
      }
      for(var x=0;x<buttons.length;x++){
        if(buttons[x]===document.activeElement)return;
        for(var y=0;y<nametable[key].length;y++){
          if(buttons[x].title.indexOf(nametable[key][y])>-1||
            buttons[x].value.indexOf(nametable[key][y])>-1){
            buttons[x].focus();
            return;
          }
        }
      }
    })); //end of letter-navigation in toolbar
    //presentation-keyboard-navigation:
    this.addShortcut(new this.shortcut("presentation keyboard navigation",
      "presentation",
      {multipleChoiceKeys:["ArrowLeft","ArrowRight", " ","Escape","Enter","0","1","2","3","4","5","6","7","8","9","f"],
      metakey:false},
        function(e){
      var key=e.key;
      if(!fullscreen)return true;
      if(key==="Escape")slidenote.presentation.showpresentation();
      if(key==="ArrowRight" || key===" ")slidenote.presentation.nextPage();
      if(key==="ArrowLeft")slidenote.presentation.lastPage();
      //preparing slide-by-number-jump:
      if(key==="0" ||key==="1" ||key==="2" ||key==="3" ||key==="4" ||key==="5" ||key==="6" ||key==="7" ||key==="8" ||key==="9" ){
        if(presentation.lastpressednrkey==undefined)presentation.lastpressednrkey="";
        presentation.lastpressednrkey+=key;
      }
      //executing slide-by-number-jump:
      if(presentation.lastpressednrkey===undefined)presentation.lastpressednrkey="";
      if(key==="Enter" && presentation.lastpressednrkey.length>0){
        presentation.lastpressednrkey--;
        console.log(presentation.lastpressednrkey);
        presentation.showPage(presentation.lastpressednrkey);
        presentation.lastpressednrkey="";
      }
      console.log('presentation-key',key);
      if(key==="f")slidenote.goFullScreen(false, true);
    }));

    //look out for mac and load mac-standard-keys:
    if (navigator.userAgent.indexOf('Mac OS X') != -1) {
      this.metakey = "Meta";
      this.isMac = true;
      for (var x=0;x<this.mackeys.length;x++){
        let mackey=this.mackeys[x];
        var shortcut =  this.shortcutByName(mackey.name);
        shortcut.keys = mackey.keys;
      }
    }

    this.allkeys.sort(function(a,b){
      if(keyboardshortcuts.publishMenuOrder.indexOf(a.name)<keyboardshortcuts.publishMenuOrder.indexOf(b.name))return -1;
      return 1;
    });
    //build options-Menu:
    this.buildOptionsMenu();
    //garbage-cleaning for pressedkeys:
    slidenote.textarea.addEventListener("focusout",function(){
      slidenote.keyboardshortcuts.pressedkeys = {};
    });
    slidenote.textarea.addEventListener("focus",function(){
      slidenote.keyboardshortcuts.pressedkeys = {};
    });
    window.addEventListener("focus",function(){
      console.log(slidenote.keyboardshortcuts.pressedkeys);
      slidenote.keyboardshortcuts.pressedkeys = {};
      console.log(slidenote.keyboardshortcuts.pressedkeys);
    });
    if(slidenoteSpeaker!=undefined)slidenoteSpeaker.initShortcuts();
}//end of init
keyboardshortcuts.pressKey = function(e){
  if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
    var key = e.key;
    if(key==="undefined")key=getKeyOfKeyCode(e.keyCode); //webkit-bug
    if(e.code.indexOf("Numpad")>-1)key=e.code;
    this.pressedkeys[key]=true;
    console.log(e);
    if(e.ctrlKey && e.srcElement===slidenote.textarea){
      //prevent default from the following, hardcoded for speed:
      if(e.key==="ArrowUp"|| e.key==="ArrowDown" || //e.key==="Dead" ||
        ["t","T","p","P","e","E","r","R","l","L","S","s","O","o","z","Z","y","Y","i","I",
        "PageUp","PageDown","f","F","`"].indexOf(e.key)>=0){
        e.preventDefault();
        e.stopPropagation();
      }
    }
    if(key===this.metakey){
      e.preventDefault();
      //e.stopPropagation();
    }
    if((key=="Tab" || e.keyCode==9)&&this.enableTab && e.target==slidenote.textarea){
      e.preventDefault();
      this.handleTab(e);
      e.stopPropagation();
    }
}
keyboardshortcuts.preventDefaultOnKeypress = function(e){
  if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
  if(e.ctrlKey && e.srcElement===slidenote.textarea){
    //prevent default from the following, hardcoded for speed:
    //tn doesnt work,
    if(["t","T","p","P","e","E","r","R","l","L","S","s","O","o","z","Z","y","Y","i","I",
    "PageUp","PageDown","f","F","`"].indexOf(e.key)>=0){
      e.preventDefault();
      e.stopPropagation();
    }
  }
  let key = e.key;
  if(e.code.indexOf("Numpad")>-1)key=e.code;
  if(key===this.metakey){
    e.preventDefault();
    e.stopPropagation();
  }
}
keyboardshortcuts.releaseKey = function(e){
  if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
    let key = e.key;
    if(key==="undefined")key=getKeyOfKeyCode(e.keyCode); //webkit-bug
    if(e.code.indexOf("Numpad")>-1)key=e.code;
    if(key===undefined && e.keyCode===undefined)return;
    if(this.pressedkeys[key]===undefined){
      this.pressedkeys={};
      return;
    }
    console.log(e);
    //this.pressedkeys[key]=false;
    delete this.pressedkeys[key];
    if(key.length===1)delete this.pressedkeys[key.toUpperCase()]; //=false; //also delete uppercase-letter if shift is let go first
    if(key==="Meta" || key==="Shift" || key==="Control" ||
    key==="Alt" || key===this.metakey)this.pressedkeys = {};
}

keyboardshortcuts.shortcutFound = function(event, shortcut){
    if(shortcut.metakey && !this.pressedkeys[this.metakey])return false;
    for(var x=0;x<shortcut.keys.length;x++)if(!this.pressedkeys[shortcut.keys[x]])return false;
    /*let pkeys = Object.keys(this.pressedkeys);
    pkeys.splice(pkeys.indexOf(this.metakey),1);
    for (var x=0;x<pkeys.length;x++)
      if(this.pressedkeys[pkeys[x]] && shortcut.keys.indexOf(pkeys[x])==-1)
        return false;
        */
    if(!shortcut.multipleChoiceKeys ||shortcut.multipleChoiceKeys.length===0){
      let apk = this.allPressedKeys();
      let apklength = apk.length;
      if(shortcut.metakey)apklength--;
      if(shortcut.keys.length!=apklength)return false;
      return true;
    }
    for(var x=0;x<shortcut.multipleChoiceKeys.length;x++)if(this.pressedkeys[shortcut.multipleChoiceKeys[x]])return true;
    return false;
}

keyboardshortcuts.reactOn = function(e, element){
  if(e.key===undefined && e.keyCode===undefined)return; //seems not to be valid key
    let key = e.key;
    if(key==="undefined")key=getKeyOfKeyCode(e.keyCode); //webkit-bug
    if(e.code.indexOf("Numpad")>-1)key=e.code;
    if(!this.pressedkeys[key])slidenote.keyboardshortcuts.pressKey(e);
    if(this[element]!=undefined){
        var preventDefault=false;
        var list = this[element];
        for(var x=0;x<list.length;x++)if(list[x].active && this.shortcutFound(e,list[x])){
            var continuedefault = list[x].activate(e);
            if(continuedefault != true)preventDefault=true;
        }
        if(preventDefault){
          e.preventDefault();
          e.stopPropagation();
        }
        return preventDefault;
    }

}
//handle tab:
keyboardshortcuts.handleTab = function(e){
  var text = slidenote.textarea.value;
  let selstart = slidenote.textarea.selectionStart;
  let selend = slidenote.textarea.selectionEnd;
  var firstline = slidenote.parser.lineAtPosition(selstart);
  var lastline = slidenote.parser.lineAtPosition(selend);


  //if(selstart-selend!=0){
  //there is a selection:
  if(lastline-firstline!=0){
    //there is a multiline-selection
    if(e.shiftKey){
      //shift to left
      var totaldeleted=0;
      for (var x=lastline;x>=firstline;x--){
        let linestart = slidenote.parser.map.linestart[x];
        let firstfourChars = text.substring(linestart,linestart+4);
        while(firstfourChars.length>0 && firstfourChars.charAt(0)==' '){
          firstfourChars=firstfourChars.substring(1);
        }
        let deleteAmmount = 4-firstfourChars.length;
        if(deleteAmmount>0){
          text=text.substring(0,linestart)+
              text.substring(linestart+deleteAmmount);
        }
        totaldeleted+=deleteAmmount;
      }
      slidenote.textarea.value=text;
      slidenote.parseneu();
      slidenote.textarea.selectionStart = slidenote.parser.map.linestart[firstline];
      slidenote.textarea.selectionEnd = slidenote.parser.map.lineend[lastline];//selend-totaldeleted;
    }else{
      //shift to right: easy
      for (var x=lastline;x>=firstline;x--){
        text = text.substring(0,slidenote.parser.map.linestart[x])+"    "+text.substring(slidenote.parser.map.linestart[x]);
      }
      slidenote.textarea.value=text;
      slidenote.parseneu();
      slidenote.textarea.selectionStart=slidenote.parser.map.linestart[firstline];
      slidenote.textarea.selectionEnd=slidenote.parser.map.lineend[lastline];
    }

  }else{
    //there is no selection or selection inside a line, make tab-function
    let linestart = slidenote.parser.map.linestart[slidenote.parser.lineAtPosition(selstart)];
    let posinline = selstart-linestart;
    let spaces = "    ";
    if(e.shiftKey){
      let spacestogoback = 4-(posinline%4);
      if(posinline<4)spacestogoback=posinline;
      let textbeforesel = text.substring(selstart-spacestogoback,selstart);
      let expected = spaces.substring(posinline%4);
      if(textbeforesel==expected){
        text=text.substring(0,selstart-spacestogoback)+text.substring(selstart);
        slidenote.textarea.value=text;
        slidenote.textarea.selectionStart=selstart-spacestogoback;
        slidenote.textarea.selectionEnd=selend-spacestogoback;
        slidenote.parseneu();
      }
    }else{
      spaces = spaces.substring(posinline%4);
      console.log('tab:spaces:'+spaces.length,posinline,(posinline%4));
      text = text.substring(0,selstart)+spaces+text.substring(selstart);
      slidenote.textarea.value=text;
      slidenote.textarea.selectionStart=selstart+spaces.length;
      slidenote.textarea.selectionEnd=selend+spaces.length;//slidenote.textarea.selectionStart;
      slidenote.parseneu();
    }
  }
}

//automagic closure:
keyboardshortcuts.closeAutomagic = function(event){
  if(!this.automaticClosure)return;
  var key = event.key+"";
  console.log(event);
  if(key==="undefined")key=getKeyOfKeyCode(event.keyCode);
  //if(key==="Dead" && event.code==="Equal" && event.shiftKey)key="`"; //&& event.keyCode===187
  var actel = slidenote.parser.CarretOnElement();
  if(actel && actel.label==="code")return;
  if(actel && actel.dataobject){
    for(var x=0;x<slidenote.datatypes.length;x++){
      if(slidenote.datatypes[x].type===actel.dataobject.type
         && slidenote.datatypes[x].mdcode===false)return;
    }
  }
  var selend = slidenote.textarea.selectionEnd;
  var selstart = slidenote.textarea.selectionStart;
  var txt = slidenote.textarea.value;
  var checknextletter = slidenote.textarea.value.charAt(selend); //slidenote.textarea.value.substring(selend,selend+1);
  var checkletterbefore = slidenote.textarea.value.charAt(selstart-1); //slidenote.textarea.value.substring(selstart-1,selstart);
  if(key==="*" && selstart-selend===0 && checknextletter==="*"){

    var insideofendtag = false;
    if(actel && actel.brotherelement && actel.brotherelement.typ==="end"){
      var elpos = actel.brotherelement.posinall;
      var elcode = actel.brotherelement.mdcode;
      insideofendtag= (elpos<selstart && elpos+elcode.length > selend);
      insideofendtag = (insideofendtag && actel.mdcode.indexOf("**")>-1);
    }

    if(checkletterbefore!="*" ||insideofendtag ){
      //slidenote.textarea.value = slidenote.textarea.value.substring(0,selend)+slidenote.textarea.value.substring(selend+1);
      slidenote.textarea.selectionStart=selstart+1;
      slidenote.textarea.selctionEnd=selend+1;
      event.preventDefault();
      return "break";
    }
  }
  if(key==="*" && selstart-selend===0 && checkletterbefore==="*" && checknextletter!="*")return;
  if(key==="Backspace" && selend-selstart===0 &&
    checknextletter ==="*" && checkletterbefore==="*"){
    slidenote.textarea.value = slidenote.textarea.value.substring(0,selstart-1)+slidenote.textarea.value.substring(selend+1);
    slidenote.textarea.selectionStart = selstart-1;
    slidenote.textarea.selectionEnd = selend-1;
    event.preventDefault();
    return "break";
  }
  if(key==="~" && actel && actel.mdcode==="~~" && selstart-selend===0 && checknextletter==="~"){
    slidenote.textarea.selectionStart=selstart+1;
    slidenote.textarea.selctionEnd=selend+1;
    event.preventDefault();
    return "break";
  }
  if(key==="*" || key==="_" ||
  //(key==="~" && (key===checkletterbefore || selend-selstart>0)) ||
  key==="~" ||
          key==="`"){
      event.preventDefault();
        //if(key==="~" && checkletterbefore!=key)key+=key;
        //if(key==="~" && checkletterbefore === key){
          //key+=key;
        //  txt = txt.substring(0,selstart)+key+txt.substring(selstart,selend)+key+key+txt.substring(selend);
        //}else
        if(key==="`" && txt.substring(selstart-1,selstart)==="`" && txt.substring(selend,selend+1)==="`"){
          txt = txt.substring(0,selstart)+"``\n"+txt.substring(selstart,selend)+"\n```\n"+txt.substring(selend+1);
          key="``";
//        }else if(key==="*" &&
//                (txt.substring(selstart-1,selstart)==="\n"||selstart===0)){
//          key+=" ";
//          txt = txt.substring(0,selstart)+key+txt.substring(selstart);
        }else{
          txt = txt.substring(0,selstart)+key+txt.substring(selstart,selend)+key+txt.substring(selend);
        }
        slidenote.textarea.value=txt;
        slidenote.textarea.selectionEnd = selend+key.length;
        slidenote.textarea.selectionStart = selstart+key.length;
        return "break";
        //slidenote.parseneu();
  }
  if(key==="+"){
    if(selend-selstart!=0){
      txt = txt.substring(0,selstart)+
            "\n+++\n"+txt.substring(selstart,selend)+
            "\n+++\n"+txt.substring(selend);
      slidenote.textarea.value = txt;
      slidenote.textarea.selectionStart = selstart+1; //put selectionstart right after new line
      slidenote.textarea.selectionEnd = selend+9; //put selectionend to end of inputted line
      slidenote.parseneu();
    }else if(txt.substring(selstart-3,selstart)==="\n++" ||
      (selstart===2 && txt.substring(0,selstart)==="++")){
      txt = txt.substring(0,selstart-1)+
            "+\n\n+++\n"+txt.substring(selstart);
      slidenote.textarea.value=txt;
      slidenote.textarea.selectionStart = selstart;
      slidenote.textarea.selectionEnd = selstart;
      //slidenote.parseneu();
      return "break";
    }
  }
  if(key==='Enter'){
    let carret = document.getElementById('carret');
    let realpos = selend;
    if(carret && carret.innerHTML.length>1){
      realpos=realpos - carret.innerHTML.length +1; //carret has non-space-char
      //actel = slidenote.parser.CarretOnElement(realpos);
    }else{
      //we dont have a carret so go back in line till start and check there:
      //realpos -1 because if not it stands at end of line
      realpos = slidenote.textarea.value.lastIndexOf('\n',realpos-1)+1;
    }
    actel = slidenote.parser.CarretOnElement(realpos);
    let currentLine = slidenote.parser.lineAtPosition(realpos);
    if( (
      (actel && actel.label==="list")||
      //slidenote.parser.lineswithhtml[currentLine]=='list' ||
      (actel && actel.label==="quote")
    ) &&  selend-selstart==0 && (checknextletter=="\n" || selend==slidenote.textarea.value.length)){
      console.log('automagic listen erweitern', actel);
      event.preventDefault();
      txt = txt.substring(0,selstart)+"\n"+actel.mdcode+txt.substring(selstart);
      slidenote.textarea.value = txt;
      slidenote.textarea.selectionStart = selstart+actel.mdcode.length+1;
      slidenote.textarea.selectionEnd = selend+actel.mdcode.length+1;
      if(actel.parentelement && actel.parentelement.listtyp=="ol"){
        setTimeout(function(){
          slidenote.changeListType(actel.parentelement.listmdsymbol);
        },50);
      }
      return "break";
    }//end of enter
    /* now it works:
    }else if(key==="Enter"){
      //sometimes it does not get it right: show me what went wrong:
      console.warn('automagic listen erweitern', actel,'selend/start: ',
      selend, selstart,
      'real:',realpos,
      'next letter enter?:', (checknextletter=='\n'),
      'line:', currentLine,
      slidenote.parser.lineAtPosition(selend),
      slidenote.parser.lineAtPosition(realpos),
      slidenote.parser.lineswithhtml[currentLine],
      (slidenote.parser.lineswithhtml[currentLine]=='list'));
    }
    */
  }
  //other keys
  console.log('automagic key:',key, actel);
}

keyboardshortcuts.attachShortcuts = function(){
  //what to do on android-device? attach shortcuts or not?
  //on android virtual keyboards pops up all the time
  //lets try if removing it solves the problem:
  if(navigator.userAgent.toLowerCase().indexOf('android')>-1)return;
    window.addEventListener("keydown",function(e){
      slidenote.keyboardshortcuts.pressKey(e);
      if(fullscreen)slidenote.keyboardshortcuts.reactOn(e,"presentation");
      else slidenote.keyboardshortcuts.reactOn(e,"globals");
      console.log("react on global"+e.key);
    });

    slidenote.textarea.addEventListener("keydown",function(e){
      slidenote.keyboardshortcuts.pressKey(e);
      let found = slidenote.keyboardshortcuts.reactOn(e,"globals");
      if(!found)slidenote.keyboardshortcuts.reactOn(e, "textarea");
    });
    slidenote.textarea.addEventListener("keypress",function(e){
      slidenote.keyboardshortcuts.preventDefaultOnKeypress(e, "textarea");
    });
    //document.getElementById("slidenoteeditor").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"globals")});
    document.getElementById("insertarea").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e, "insertmenu");console.log("shortcut insmenu");console.log(e);});
    //document.getElementById("texteditorbuttons").addEventListener("keyup",function(e){slidenote.keyboardshortcuts.reactOn(e,"toolbar");console.log("shortcut toolbar");console.log(e);});
    document.getElementById("menuload").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menuload")});
    document.getElementById("menucloud").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menucloud")});
    document.getElementById("menupublish").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menupublish")});
    document.getElementById("menuimportexport").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menuimportexport")});
    document.getElementById("menuoptionseditor").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menuoptionseditor")});
    //document.getElementById("menuoptionspresentation").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menuoptionspresentation")});
    //?? dont get it? what happened?
    document.getElementById("menusearchbox").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"menusearchbox")});
    document.getElementById("toolbar").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"toolbar")});
    document.getElementById("imagegallery").addEventListener("keydown",function(e){slidenote.keyboardshortcuts.reactOn(e,"imagegallery")});

    //document.getElementById("optionmenu").addEventListener("keyup",function(e){slidenote.keyboardshortcuts.reactOn(e,"options");console.log("shortcut options");console.log(e);});

//    window.addEventListener("keyup", function(e){slidenote.keyboardshortcuts.reactOn(e,"global");});
    window.addEventListener("keyup", function(e){
      slidenote.keyboardshortcuts.runDelayedKeyUpFunctions();
      slidenote.keyboardshortcuts.releaseKey(e);
    });
}
keyboardshortcuts.delayedKeyUpFunctions = [];
keyboardshortcuts.delayTillKeyUp = function(delayFunction){
  this.delayedKeyUpFunctions.push(delayFunction);
}
keyboardshortcuts.runDelayedKeyUpFunctions = function(){
  while(this.delayedKeyUpFunctions.length>0){
    var actfunc = this.delayedKeyUpFunctions.pop();
    actfunc();
  }
}

slidenote.keyboardshortcuts = keyboardshortcuts;

keyboardshortcuts.mackeys = [
  {name:"start presentation",keys:["Enter"]},
	{name:"open context menu",keys:["Control","c"]},
  {name:"open toolbar",keys:["Control","t"]},
  {name:"save note to cloud directly",keys:["s"]},
  {name:"open cloud menu",keys:["Control","s"]},
  {name:"open noteload menu",keys:["Control","n"]},
  {name:"open file menu",keys:["Control","f"]},
  {name:"open publish menu",keys:["Control","p"]},
	{name:"open options",keys:["o"]},
	{name:"open slide design menu",keys:["d"]},
  {name:"open search menu",keys:["f"]},
	{name:"open imagegallery",keys:["i"]},
	{name:"undo last change",keys:["z"]},
	{name:"redo last undone change",keys:["Shift","Z"]}
];

keyboardshortcuts.publishMenuOrder = [
  "start presentation",
  "move line up or down",
	"open contextmenu",
  "save note to cloud directly",
  "open cloud menu",
  "open noteload menu",
  "open file menu",
  "open publish menu",
	"open options",
	"open slide design menu",
  "open search menu",
	"open imagegallery",
	"undo last change",
	"redo last undone change",
  "open toolbar",
];

keyboardshortcuts.init();
keyboardshortcuts.attachShortcuts();

/*
keyboardshortcuts.toolbarReaction = function(e){
    for(var x=0;x<this.toolbar.length;x++){
        if(this.shortcutFound(e,toolbar[x]))this.toolbar[x].activate();
    }
}

keyboardshortcuts.insertmenuReaction = function(e){
    for(var x=0;x<this.insertmenu.length;x++){
        if(this.shortcutFound(e,insertmenu[x]))this.insertmenu[x].activate();
    }
}

keyboardshortcuts.imagegalleryReaction = function(e){
    for(var x=0;x<this.imagegallery.length;x++)if(this.shortcutFound(e,this.imagegallery[x]))this.imagegallery[x].activate();
}

keyboardshortcuts.textareaReaction = function(e){
    for(var x=0;x<this.textarea.length;x++)if(this.shortcutFound(e,this.textarea[x]))this.textarea[x].activate();
}

keyboardshortcuts.globalReaction = function(e){
    for(var x=0;x<this.globals.length;x++)if(this.shortcutFound(e,this.globals[x]))this.globals[x].activate();
}

*/

var dialoger = {
  standardtitle:{
    prompt:"please insert",
    confirm:"please confirm",
    alert:" "
  }

};
/*options: object with:
* type: can be four cases: prompt, confirm, alert, dialog
* content: the content to be placed, e.g. message.
    must be a string, a html-node or array with html-nodes
    html-node with id "placeholder" will append all childnodes,
    else will appended node directly
* title: title to be placed on top of dialog - optional
* confirmbutton: text ("ok") for confirmbutton - optional
* cancelbutton: text ("cancel") for cancelbutton - optional
* nocancelbutton: boolean (false) if confirm without cancel - optional
* closebutton: boolean (false) if closebutton is placed on top right - optional
* closebuttontext: text placed before x of button - optional
* closefunction: function to call if canceled or closed - optional
+ focuson: DOM-Node (null) the node that should be focused after build - optional
* afterButtonArea: node to be appended on Area after Buttons (dont bother me...)
* cssclass: css-class added to inner dialogbox
* containerClass: css-class added to container
*/
dialoger.buildDialog = function(options, followfunction){
  if(window.slidenote!=undefined)this.imgpath = slidenote.imagespath;
  else this.imgpath = '/images/';
  var type = options.type;
  var content = options.content;
  //standard-closefunction: optional: options.closefunction
  var closefunction = function(){
    //we set this into a setTimeout so that it happens as last in the stack of close-functions:
    var target = this.target || "dialogcontainer";
    dialoger.closetimeout = setTimeout(function(){
      var dialog = document.getElementById(target);
      dialog.parentElement.removeChild(dialog);
      if(window.slidenote)slidenote.textarea.focus();
    },40);
  };

  //html-structure:
  var container = document.createElement("div");
  if(options.containerClass)container.className=options.containerClass;
  container.classList.add("dialogboxparent");
  //check if multiple dialogues are allowed:
  if(options.multiDialog){
    if(this.multiDialogcounter==undefined)this.multiDialogcounter=0;
    this.multiDialogcounter++;
    container.id = "dialogcontainer"+this.multiDialogcounter;
  }else{
    //one dialog at a time only:
    //check if old container exists, if so delete it:
    var oldcontainer = document.getElementById("dialogcontainer");
    if(oldcontainer){
      oldcontainer.parentElement.removeChild(oldcontainer);
      if(this.closetimeout)clearTimeout(this.closetimeout);
    }
    //set new container:
    container.id = "dialogcontainer";
  }
  var dialogbox = document.createElement("div");
  dialogbox.classList.add("dialogbox");
  if(options.cssclass)dialogbox.classList.add(options.cssclass);
  var title = document.createElement("h1");
  title.classList.add("dialogtitle");
  var titletext = document.createElement("span");
  if(options.title)titletext.innerText = options.title;
  else if(this.standardtitle[type])titletext.innerText = this.standardtitle[type];
  else titletext.innerText = "";

  title.appendChild(titletext);
  //close/abortfunction:
  //closebutton:
  if(options.closebutton){
    var closebutton = document.createElement("button");
    closebutton.classList.add("dialogclosebutton");
    closebutton.id = "dialogclosebutton";
    if(options.closebuttontext){
      var closespantxt = document.createElement("span");
      closespantxt.innerText = options.closebuttontext;
      closebutton.appendChild(closespantxt);
    }
    var closespanimg = new Image();
    closespanimg.src = this.imgpath+"buttons/x.svg";
    closebutton.appendChild(closespanimg);
    if(options.closefunction)closebutton.addEventListener("click",options.closefunction);
    closebutton.onclick = closefunction;
    if(options.multiDialog)closebutton.target=container.id;
    title.appendChild(closebutton);
  }
  dialogbox.appendChild(title);
  var dialogcontent = document.createElement("div");
  dialogcontent.classList.add("dialogcontent");
  //handle content:
  if(options.content.innerHTML!=undefined){
    if(options.content.id==="placeholder"){
      for(var x=content.childNodes.length-1;x>=0;x--){
        //dialogcontent.appendChild(options.content.childNodes[x]);
        dialogcontent.insertBefore(options.content.childNodes[x],dialogcontent.firstChild);
      }
    }else{
      dialogcontent.appendChild(options.content);
    }
  }else if(typeof options.content ==="string"){
    dialogcontent.innerText = options.content;
  }else if(options.content.length>0){
    for(var x=0;x<options.content.length;x++){
      dialogcontent.appendChild(options.content[x]);
    }
  }
  //finish content:
  dialogbox.appendChild(dialogcontent);
  if(type==="confirm" || type==="alert"){
    var buttondiv = document.createElement("div");
    buttondiv.classList.add("buttonarea");
    var confirmbutton = document.createElement("button");
    //confirmbutton.classList.add("dialogconfirmbutton");
    confirmbutton.id = "dialogconfirmbutton";
    confirmbutton.addEventListener("click", followfunction);
    confirmbutton.addEventListener("click",closefunction);
    if(options.confirmbutton)confirmbutton.innerText = options.confirmbutton;
    else confirmbutton.innerText="ok";
    buttondiv.appendChild(confirmbutton);
    //check for button-list:
    if(options.extrabuttons && options.extrabuttons.length>0){
      for(var x=0;x<options.extrabuttons.length;x++){
        buttondiv.appendChild(options.extrabuttons[x]);
      }
    }
    //cancelbutton:
    var cancelbutton = document.createElement("button");
    //cancelbutton.classList.add("dialogcancelbutton");
    cancelbutton.id="dialogcancelbutton";
    if(options.cancelbutton)cancelbutton.innerText=options.cancelbutton;
    else cancelbutton.innerText="cancel";
    cancelbutton.onclick = closefunction;
    if(options.closefunction)cancelbutton.addEventListener("click",options.closefunction);
    if(options.cancelfunction)cancelbutton.addEventListener('click',options.cancelfunction);
    if(type==="confirm" && !options.nocancelbutton)buttondiv.appendChild(cancelbutton);
    dialogbox.appendChild(buttondiv);
  }
  //something pending to get appended after?
  if(options.afterButtonArea){
    dialogbox.appendChild(options.afterButtonArea);
  }
  //finish html-structure
  container.appendChild(dialogbox);
  //append keyboard-shortcuts:
  dialogbox.addEventListener("keydown",function(e){
   //console.log("key on dialog:"+e.key);
    if(window.slidenote && slidenote.keyboardshortcuts)slidenote.keyboardshortcuts.reactOn(e,"dialog");
  });
  if(type==="confirm" || options.arrownavleftright){
    dialogbox.addEventListener("keydown",function(e){
      if(window.slidenote && slidenote.keyboardshortcuts)slidenote.keyboardshortcuts.reactOn(e,"arrowleftright");
    });
  }
  //append dialog to document:
  //document.getElementsByTagName("body")[0].appendChild(container);
  let target = document.getElementById("slidenotediv");
  if(!target || options.multiDialog)target = document.body;
  target.appendChild(container);
  if(options.focuson){
    options.focuson.focus();
  }else if(confirmbutton){
    //focus on confirm-button if exists
    confirmbutton.focus();
  }else{
    //as the first button is the closebutton we want to avoid it by selecting last one:
    //but if its the only one - fuck it.
    var bns = dialogbox.getElementsByClassName("menuitem");
    if(!bns.length>0)bns = dialogbox.getElementsByTagName("button");
    if(!bns.length>0){
      //we did not get any buttons - make dialog tabable and focus:
      dialogbox.tabable = true;
      dialogbox.focus();
    }else{
      if(options.focusOnFirst)bns[0].focus();
      else bns[bns.length-1].focus();
    }
  }
  return container;
}

/*prompt returns a promise with resolve string
* if options.content is a string it builds a standard
* if options.ispassword is true then it builds a standard password dialog
* if options.checkpassword is true then it checks password before resolving
* if content is a html-node without input with id then add input to it
* if options.inputlabel then add that as label to input
*/
dialoger.prompt = async function(options){
  var dialogoptions = options;
  dialogoptions.type="confirm"; //has to be confirm to let ok and cancel
  if(typeof options.content === "string" || (options.content.innerHTML &&
    options.content.innerHTML.indexOf("dialogPromptTextInput")===-1)){


    if(typeof options.content === "string"){
      var content = document.createElement("div");
      content.id = "placeholder";
      var dialogtext = document.createElement("div");
      dialogtext.innerText = options.content;
    }else{
      var content = options.content;
      var dialogtext = document.createElement("div");;
      if(options.inputlabel)dialogtext.innerText = options.inputlabel;
    }
    var inp = document.createElement("input");
    if(options.ispassword)inp.type="password";
    else if(options.inputtype)inp.type = options.inputtype;
     else inp.type="text";
    inp.id = "dialogPromptTextInput";
    inp.addEventListener("keyup",function(e){
      if(e.key!="Enter")return;
      document.getElementById("dialogconfirmbutton").click();
    });
    var wrapper = document.createElement("div");
    wrapper.classList.add("promptInputWrapper");
    wrapper.appendChild(dialogtext);
    wrapper.appendChild(inp);
    content.appendChild(wrapper);
    dialogoptions.content = content;
    dialogoptions.focuson = inp;
  }
  return new Promise(function(resolve,reject){
    dialogoptions.cancelfunction = function(){
      resolve(null);
    }
    var dialog = dialoger.buildDialog(dialogoptions);
    document.getElementById("dialogconfirmbutton").addEventListener('click', function handleButtonClicks(e){
      e.stopPropagation();
      var input = document.getElementById("dialogPromptTextInput");
        if(!input)input = dialog.getElementsByTagName("input")[0];
        if(!input)resolve(null);
        resolve(input.value);
    });
    dialog.addEventListener('keydown',function(e){
      if(e.key==="Escape")resolve(null);
    });

  });

}

/* dialoger.confirm: builds a confirm-dialog and returns a promise
*/
dialoger.confirm = async function(options){
  var dialogoptions = options;
  if(dialogoptions.cssclass===undefined)dialogoptions.cssclass="small"
  dialogoptions.type="confirm"; //has to be confirm to let ok and cancel
  if(typeof options.content === "string" || (options.content.innerHTML &&
    options.content.innerHTML.indexOf("dialogPromptTextInput")===-1)){


    if(typeof options.content === "string"){
      var content = document.createElement("div");
      content.id = "placeholder";
      var dialogtext = document.createElement("div");
      dialogtext.innerText = options.content;
    }else{
      var content = options.content;
      var dialogtext = document.createElement("div");;
      if(options.inputlabel)dialogtext.innerText = options.inputlabel;
    }
    content.appendChild(dialogtext);
    dialogoptions.content = content;
  }
  var dialog = this.buildDialog(dialogoptions);
  return new Promise(function(resolve,reject){
    document.getElementById("dialogconfirmbutton").addEventListener('click', function handleButtonClicks(e){
      e.stopPropagation();
        resolve(true);
    });
    document.getElementById("dialogcancelbutton").addEventListener('click',function (){
      resolve(false)
    });
    dialog.addEventListener('keydown',function(e){
      if(e.key==="Escape")resolve(false);
    });

  });

}

dialoger.alert = function(text, title){
  let options = {
    type:"alert",
    title: "",
    content: text,
  }
  if(title)options.title=title;
  this.buildDialog(options);
}

//just for testing purpose some elements:
revertoptions = {
type: "confirm",
title: "revert to revision",
content: "do you wish to revert to the revision from <br>'+date+'?<br>Progress not added to a revision will be lost.",
confirmbutton:"revert",
cancelbutton:"cancel", //standard
closebutton:false, //standard
closebuttontext:undefined //standard
}

deletepresentationoptions = {
type:"confirm",
title:"delete presentation",
content:"do you wish to delete the published presentation?",
confirmbutton:"delete",
cancelbutton:"cancel", //standard
closebutton:false, //standard
closebuttontext:undefined //standard
}

deleteslidenoteoptions = {
type:"confirm",
title:"delete slidenote",
content:"do you wish to delete the slidenote?",
confirmbutton:"delete"
}

renameslidenoteoptions = {
type:"confirm",
title:"rename",
confirmbutton:"save",
cancelbutton:"cancel",
content:"Enter new name"
}

renameslidenotefunction = function(){
  var newname = document.getElementById("newname");
  if(newname)newname = newname.value; else return;
  if(!newname || newname===slidenoteguardian.notetitle)return;
  slidenoteguardian.notetitle = newname;
  slidenote.menumanager.buildSlidenoteList();
  document.getElementById("slidenotetitle").innerText = newname;
  document.getElementById("username").value = newname;
  //activate password-manager:
  document.getElementById("slidenoteGuardianPasswordPromptEncrypt").click();
  //dialog = document.getElementById("dialogcontainer");
  //if(dialog)dialog.parentElement.removeChild(dialog);
}

function renametest(){
  var content = document.createElement("div");
  content.id = "placeholder";
  var txt = document.createElement("div");
  txt.innerText = "Enter new name";
  var inp = document.createElement("input");
  inp.type = "text";
  inp.id = "newname";
  inp.addEventListener("keyup",function(e){
    if(e.key!="Enter")return;
    document.getElementById("dialogconfirmbutton").click();
  });
  content.appendChild(txt);
  content.appendChild(inp);
  var dialogoptions = renameslidenoteoptions;
  dialogoptions.content = content;
  dialogoptions.focuson = inp;
  dialoger.buildDialog(dialogoptions, renameslidenotefunction);
}

changepassword = {
type:"not possible, just for reference",
title:"change password",
content:"password $passwordfield retype password $retype password field",
confirmbutton:"save",
cancelbutton:"cancel"
}

logoutconfirmoptions = {
type:"confirm",
title:"log out",
content:"You need to be logged in to use slidenotes.io during the beta phase.<br>Log out anyway?",
confirmbutton:"log out",
cancelbutton:"cancel"
}

presentationoptions = {
type:"dialog",
title:"slide design",
content: "design-list",
closebutton:true,
closebuttontext:undefined
}

deleteimageoptions = {
type:"dialog",
title:"delete image",
content: 'button1:"delete connection to tag" or button2:"delete image from slidenote & image gallery"',
closebutton:true,
closebuttontext:"cancel"
}

sizedialogoptions = {
    type:"dialog",
    title:"add image",
    content: "previewimage+ullist",
    closebutton:true,
    closebuttontext:"cancel upload",
    closefunction:function(){
        var fileinput = document.getElementById("fileInput");
        if(fileinput)fileinput.value="";
    }
}

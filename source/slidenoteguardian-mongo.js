
/* load and save module
* handles the interaction with all what has to do with loading and saving
* saves slidenotes localy in localStorage
* saves slidenotes in cms
* exports slidenote to filesystem
* encrypts slidenote before saving
* loads slidenotes from localStorage
* loads slidenotes from cms
* imports slidenotes from filesystem
* imports md-code from filesystem
* decrypts slidenote after loading
* saves config to cms/localStorage destination
* loads config from cms/localStorage destination
* Dependencies: FileSaver.js for saving exports
*/


/*
Slidenotecache: Object which interacts with localStorage
necesary because user wants to open two slidenotes at the same time
*/
var SlidenoteCache = function(){
    this.localstorage = window.localStorage;
    //items in localstorage per slidenote - not sure if really needed inside object but for overview purposes stated here:
    /*this.url;
    this.config;
    this.cryptnote;
    this.slidenotehash;
    this.cryptimagestring;
    this.imghash;
    this.saved;
    this.title;
    this.lastSavedTime;
    */
    //what IS usefull is an Array with localstorage-object-names, so:
    this.cacheItems = ["url","config","cryptnote","slidenotehash",
    "cryptimagestring","imghash","saved","title","lastActiveTime",
    "nid", "dontBotherOnEmptyPassword"];
    this.activeTimeAccuracy = 60000; //How accurant has the lastActiveTime to be? Minute: 60.000 Hh: 3600.000
    this.timeToLife = 24*60*60*1000/this.activeTimeAccuracy; //How long should stuff be cached before deleted normaly
    this.timeToLifeMax = 7*24*60*60*1000/this.activeTimeAccuracy;
    //meta-infos:
    this.id; //an id put in front of item-name in localstorage
    this.allIds; //a string in localstorage, containing all ids seperated by ","
    this.maxSpace; //a number with maximum number of chars possible in browser
    this.version = 3; //a version number to check if we have to rebuild cache. Increase if you want to force rebuild of usercache
}

SlidenoteCache.prototype.init = function(){

    this.allIds = this.localstorage.getItem("allIds");
    //var acturl = window.location.pathname; //href;
    var version = this.localstorage.getItem("slidenotecacheversion");
    if(this.allIds ===null || version === null || version < this.version ){
        //there is no cache in Browser - let things get started:
        //first: clear local-cache totaly, we dont want things from the past lindering inside:
        this.localstorage.clear();
        this.id = "sl1";
        this.allIds="sl1"; this.localstorage.setItem("allIds",this.allIds);
        this.localstorage.setItem("slidenotecacheversion",this.version);
        this.maxSpace = this.calculateMaxSpace(); this.localstorage.setItem("maxSpace",this.maxSpace);
        if(slidenoteguardian.restObject && slidenoteguardian.restObject.nid)this.localstorage.setItem("sl1nid",slidenoteguardian.restObject.nid);
    }else{
        this.maxSpace=this.localstorage.getItem("maxSpace");
        //there is a cache yet. try to find actual cache:
        var ids = this.allIds.split(",");
        var nid = null;
        if(slidenoteguardian.restObject && slidenoteguardian.restObject.nid)nid = slidenoteguardian.restObject.nid;
        for(var x=0;x<ids.length;x++){
            var cachenid = this.localstorage.getItem(ids[x]+"nid");
            if(nid!=null && cachenid == nid){
                this.id=ids[x];
                break;
            }
        }
        if(this.id){
            //we found a cache so load cache:
            //this.loadFromCacheToObject();
            //not necesary anymore as we load it later on with the id
        }else{
            //we did not find a cache for current note so open one, which can be loaded afterwards
            this.id = "sl"+(ids.length+1); //easy try: just put it ongoing
            if(this.allIds.indexOf(this.id)>-1){
              //if easy try fails, put on another id:
              for(var newid=1;newid<=ids.length+20;newid++){
                if(this.allIds.indexOf("sl"+newid)===-1){
                  this.id="sl"+newid;
                  break;
                }
              }
              //hopefully we filled some empty space inside.
              //if not we are in kind of a strange situation
              //where something could have been very wrong with cache-management
              //as there should never be so much id's open at the same time
              if(this.allIds.indexOf("sl"+this.id)>-1){
                //lets clear the cache and start a new:
                this.localstorage.clear();
                this.init();
                return;
              }
            }
            this.allIds +=  ","+this.id;
            this.localstorage.setItem("allIds",this.allIds);
            if(nid)this.localstorage.setItem(this.id+"nid", nid);
            //if(acturl)this.localstorage.setItem(this.id+"url",acturl);

        }
        //set this cache activeTime so it would not be deleted by garbage-cleaning:
        this.localstorage.setItem(this.id+"lastActiveTime",Math.floor(new Date()/this.activeTimeAccuracy));
        //clean the garbage now:
        this.cleanGarbage();
    }
}

SlidenoteCache.prototype.calculateMaxSpace = function(){
  /*new way
  var maxString = "a";
for(var x=0;x<26;x++)maxString+=maxString;
//console.log(maxString.length);
//maxString should be around 64mio signs, from 5mio max for firefox n chromium
var usedSpace = 0;
for(var x=0;x<localStorage.length;x++){
        usedSpace+=localStorage.key(x).length;
        usedSpace+=localStorage.getItem(localStorage.key(x)).length;
}
var Intervall = 102400; //eg. 100kb
var start = 0 //2048000-usedSpace; //lets start with 2mb and go upward from there
var maxSpace = start;
for(var x=0;x<500;x++){ //500 would be 50.000 kb, more than enough
    let teststring = maxString.substring(0,maxSpace);
    try{
        localStorage.setItem("spaceTest",teststring);
    }catch(e){
        console.log("setItem got wrong at:"+maxSpace);
        maxSpace -= Intervall;
        break;
    }
    maxSpace += Intervall;
    console.log("maxSpace is:"+maxSpace)
}
localStorage.removeItem("spaceTest");
return maxSpace + usedSpace;

  */
    return 5200000; //hardcoded maxspace for now, maybe calculating later?
}

SlidenoteCache.prototype.calculateFreeSpace = function(){
    var total = this.maxSpace - 50000; //lets have a buffer of 50.000 chars free for any changes in md-code happening and overhead. just in case image-insert causes to be too much...
    for(var x=0;x<this.localstorage.length;x++){
            total-=this.localstorage.key(x).length;
            total-=this.localstorage.getItem(this.localstorage.key(x)).length;
    }
    return total;
}

SlidenoteCache.prototype.fitsIntoSpace = function(key,value){
    let oldlength = this.localstorage.getItem(key);
    if(oldlength)oldlength=oldlength.length;else oldlength=0;
    valuelength = 0;
    if(value!=undefined){valuelength=""+value;valuelength=valuelength.length};
    if(this.calculateFreeSpace() > valuelength - oldlength){
      return true;//Todo: calculate if it fits inside
    }
}

SlidenoteCache.prototype.setItem = function(key, value){
    var rkey = this.id+key;
    if(key==="config")rkey="config"; //only one config for all notes
    //test if freeSpace is ok:
    if(this.fitsIntoSpace(rkey,value)){
        try{
          this.localstorage.setItem(rkey,value);
        }catch(e){
          alert("your cache is full\n" + e.message);
        }
        //should i here set the time or let it the program do by itself? if here it happens often but is it bad?
        this.localstorage.setItem(this.id+"lastActiveTime",Math.floor(new Date()/this.activeTimeAccuracy)); //only by minute, we dont care the second here
    }else{
        //there is not enough space - help!!!
        let tryToEmptySpace=this.deleteSavedImages(true,false);
        if(tryToEmptySpace===false){
          //we could not get enough space free - be more aggressive
          tryToEmptySpace=this.deleteSavedImages(true,true);
          if(tryToEmptySpace===false){
          //this means also that user has in ONE slidenote nearly 24mb of images
          //warn the user and tell em to delete or scale down images:
          //alert for now, maybe changing it to propper dialog with
          //posibility to change size of images
            alert("your slidenote has too much or too big images. please try to restrain to less than 5MB total. otherwise images can not be hold in cache for you");
            try{
              this.localstorage.setItem(rkey,value);
            }catch(e){
              alert("your cache is full\n" + e.message);
            }
            return;
          }
        }
        //try anew:
        this.setItem(key,value);
    }
}
SlidenoteCache.prototype.deleteSavedImages = function(excludeActualNote, includeNotSaved){
  var ids = this.allIds.split(",");
  var deletedimages = false;
    for(var x=0;x<ids.length;x++){
      var id=ids[x];
      var saved = this.localstorage.getItem(id+"saved");
      var imagestring = this.localstorage.getItem(id+"cryptimagestring");
      if((saved==="true"|| includeNotSaved) &&
      (id!=this.id || excludeActualNote!=true) &&
      imagestring!=null && imagestring!="cmsonly"){
        this.localstorage.setItem(id+"cryptimagestring","cmsonly");
        deletedimages = true;
      }
    }
    return deletedimages;
}
SlidenoteCache.prototype.getItem = function(key){
    if(key==="config") return this.localstorage.getItem(key); //config is stored globaly
    return this.localstorage.getItem(this.id+key);
}

SlidenoteCache.prototype.deleteCache = function(id){
    for(var x=0;x<this.cacheItems.length;x++){
        this.localstorage.removeItem(id+this.cacheItems[x]);
    }
    var allids = this.allIds.split(",");
    for(var x=0;x<allids.length;x++)if(allids[x]===id)allids.splice(x,1);
    this.allIds = allids.join(",");
    this.localstorage.setItem("allIds",this.allIds);
}

SlidenoteCache.prototype.cleanGarbage = function(){
    var ids = this.allIds.split(",");
    for(var x=0;x<ids.length;x++){
        var id=ids[x];
        var saved = this.localstorage.getItem(id+"saved");
        var isempty = (this.localstorage.getItem(id+"cryptnote")===null);
        var timesincelastactive = Math.floor(new Date()/this.activeTimeAccuracy) - this.localstorage.getItem(id+"lastActiveTime");
        if(((saved==="true"||isempty)
          && timesincelastactive> this.timeToLife)||
        timesincelastactive> this.timeToLifeMax){
            this.deleteCache(id);
          }
    }
    this.allIds=this.localstorage.getItem("allIds");
}


/*
the actual slidenoteguardian.
expects a object of type slidenotes
*/

function slidenoteGuardian(slidenote){
  this.slidenote = slidenote;
  this.jsfilesForExport = [];
  this.restObject={}; //stores the state of the slidenote as it is stored in the cms
  this.hascmsconnection=false;

  if(this.restObject.exportedPresentations===undefined)this.restObject.exportedPresentations = new Array();
  this.restObject.combine = function(uploadobj){
    for(var key in uploadobj){
      if(uploadobj.hasOwnProperty(key)){
        if(key==="deletedencimages"){
          var dell = uploadobj[key];
          if(dell && dell.length>0){
            for(var dx=0;dx<dell.length;dx++){
              this.encimages.splice(this.encimages.indexOf(dell[dx]),1);
            }
          }
        } else if(key==="encimages"){
            var newimages = uploadobj[key];
            for(var nx=0;nx<newimages.length;nx++){
              this.encimages.push(newimages[nx]);
            }
            //this[key].push(uploadobj[key]);
        }else{
          this[key]=uploadobj[key];
        }
      }
    }
    uploadobj = {}; //destroy uploadobject?
  }
  this.uploadRestObject = {};

  this.configs; //not used yet
  this.password; //storing password for later use so user has not to retype it all the time he saves (automagicaly)
  this.passwordHash; //better use this than original password?
  this.key = null; //always start with empty key
  this.crypto = window.crypto; //make crypto available
  this.decText; //last decrypted Text - we could get rid of it
  this.encBufferString; //last encrypted String from cms or local storage
  this.encImageString; //last encrypted String from cms or local storage with base64-images
  this.iv; //the initialisation-vector to use - we could get rid of it?
  this.ivlength = 12; //the length of the initialisation vector used for encryption
  this.localstorage = new SlidenoteCache();//window.localStorage; //set local storage
  //this.localstorage.init();
  /*in local-storage there can be saved ONE slidenote only. items:
  * cryptnote: encrypted slidenote
  * cryptimagestring: encrypted string with base64-images
  * title: the title of the saved slidenote
  */
  this.notetitle = "slidenotetest"; //the title of the saved slidenote - normaly set via cms
  //helpers for autosave:
  this.lastNoteFormId;
  this.isencryptingimages = false;
  //this.lastTimeActive = new Date().getTime(); //last time user was active - needed for Timeout before saving

  //add FileSaver.js to meet Dependencie:
  this.slidenote.appendFile("script","filesaver/FileSaver.js");

  if(!this.hascmsconnection){
    var savestatus = document.getElementById("savestatus");
    if(savestatus){
      savestatus.src = slidenote.imagespath+"buttons/clouderror.png";
      savestatus.title = "no connection with the cloud";
    }
    var cloudstatus = document.getElementById("cloudstatus");
    if(cloudstatus){
      cloudstatus.innerText = "no connection";
      cloudstatus.classList.add("error");
    }
    var cloudbutton = document.getElementById("cloud");
    cloudbutton.classList.add("status-error");
    cloudbutton.title = "no connection with the cloud";
  }
  //can we start the init here? why not?
  //this.init(); not, because slidenoteguardian is not initialised yet :(
  this.initialised = false;
  if(location.protocol!="file:"){
    setTimeout("slidenoteguardian.initLoad()",10);
    console.log("get all css from static webserver");
    setTimeout("slidenoteguardian.getCSSFromStaticWebserver(); slidenoteguardian.getJSFromStaticWebserver();",100);

  }else{
    setTimeout("slidenoteguardian.init()",10);
  }
}

/*initLoad completes initial load from cms*/
slidenoteGuardian.prototype.initLoad = async function(){
  var searchurl = location.search;
  if(searchurl.length==0){
    //we dont have an id to load - check for newest one and load that instead:
    let sllist = await mongoguardian.getSlidenoteList();
    if(sllist && sllist[0] && sllist[0].nid){
      location.search="?id="+sllist[0].nid;
    }else{
      //we could not get id to load - either not logged in or no slidenote created.
      //send to login instead:
      location.pathname="/user/";
    }
    return;
  }
  if(location.pathname.indexOf('tutorial')===1 || location.search.indexOf('tutorial')>-1){
    await mongoguardian.initTutorial();
    slidenoteguardian.initTutorial();
  }else{
    let foundnote = await mongoguardian.initload();
    //check for invalid tokens
    if(foundnote=="invalid token"){
      //token is invalid:
      let dialogoptions = {
        title:"400 - token is invalid",
        content:"your token is invalid or expired. please log in a new",
        type:'alert',
        closebutton:'false'
      }
      document.cookie = "authtoken=; expires=0; path=/";
      dialoger.buildDialog(dialogoptions, function(){
        let req = '?req='+this.nid;
        if(this.nid==undefined)req='?req='+location.search.substring(location.search.indexOf('nid=')+'nid='.length);
        if(location.search.length==0)req='';
        if(location.hostname!='localhost')location.href = '/user/'+req;
        else location.href = '/user/login.html'+req;
      });
    }
  //build initial note:
    if(foundnote===false){
      let dialogoptions = {
        title:"404 - file not found",
        content:"we could not find a slidenote with this id. please check your url",
        confirmbutton:"open last edited slidenote",
        type:'alert',
        closebutton:false
      };
      dialoger.buildDialog(dialogoptions,function(){
        location.search='';
      });
      return;
    }
    slidenoteguardian.notetitle = mongoguardian.mongonote.title;
    slidenoteguardian.restObject.encimages = mongoguardian.mongoimages;
    slidenoteguardian.restObject.exportedPresentations = mongoguardian.presentationlist;
    slidenoteguardian.restObject.notehash = mongoguardian.mongonote.notehash;
    slidenoteguardian.restObject.nid = mongoguardian.mongonote.nid;
    slidenoteguardian.restObject.encnote = mongoguardian.mongonote.encnote;
    slidenoteguardian.restObject.title = mongoguardian.mongonote.title;
    slidenoteguardian.hascmsconnection=true;
    slidenoteguardian.loadedSlidenotes = mongoguardian.notelist;
    if(menumanager)menumanager.buildSlidenoteList();
    slidenoteguardian.loadedPresentations = mongoguardian.presentationlist;
    if(menumanager)menumanager.buildPublishedMenu();

    slidenoteguardian.init();
  }

    //start midstate animation:
    document.getElementById("slidenoteloadingscreenwrapper").classList.add("midstate");
    document.getElementById("slidenotediv").classList.add("midstate");

  //progressHandler:
  //not supported by fetch - should implement it for get encImages as they can be huge
  /*
  function(evt){
        if(evt.timeStamp<5000)return; //miliseconds to wait before showing progress
        console.log("Download in Progress:" + evt.loaded + "/" + evt.total);
          var cs = document.getElementById("initialLoadingProgress");
          var ul = Math.floor(evt.loaded / 1024);
          var tt = Math.floor(evt.total / 1024);
          if(tt>0)tt=" / "+tt; else tt="";
          cs.innerHTML = "it seems your download is kind of slow<br> or your slidenote kind of big:<br>"+ul+tt+" kB downloaded";


  }*/
}

slidenoteGuardian.prototype.init = function(){
  //init will be called once the slidenote has been loaded from cms
  //or if it is localy.
  //this.getCMSFields();
  this.localstorage.init();
  if(this.localstorage.getItem("config")!=null){
    //slidenoteguardian is loaded after editor is ready to use so load Config:
    this.loadConfig("local");
    //slidenote.extensions.addAfterLoadingThemesHook(function(){slidenoteguardian.loadConfig("local")});
  }
  var notetitle = this.restObject.title;
  this.notetitle = this.restObject.title;
  //set notetitle into menus etc.:
  document.getElementById("slidenotetitle").innerText=notetitle;

  var notehash = this.restObject.notehash;
  var cachednote = {
    title: this.localstorage.getItem("title"),
    saved: this.localstorage.getItem("saved"),
    nid: this.localstorage.getItem("nid"),
    notehash: this.localstorage.getItem("slidenotehash"),
    url:this.localstorage.getItem("url")
  }
  console.log(
    "cachednote.saved:"+cachednote.saved+
    "\n cmsconnection:"+this.hascmsconnection+
    "\n restObject.notehash:"+notehash+
    "\n cachednote.notehash:"+cachednote.notehash+
    "\n cachednote.url :"+cachednote.url+
    "\n window.location:"+window.location.href+
    //"\n restobj.encnote:"+this.restObject.encnote.substring(0,10)+
    "\n restobj.encnote-empty?"+(this.restObject.encnote==="")
  );

  //lookout if we have to load it from localStorage or from cms:
  if((cachednote.saved === "true" || cachednote.notehash === null) &&
      this.hascmsconnection &&
    this.restObject.encnote && this.restObject.encnote.length>1){
    setTimeout("slidenoteguardian.loadNote('cms')",1);
  }else if(
    (this.hascmsconnection && this.restObject.encnote === undefined)||
    (this.hascmsconnection && this.restObject.encnote === null)||
    (this.restObject.encnote!=undefined && this.restObject.encnote ==="")){
    //new slidenote, save to get password-prompt? seems not necesary
    //first get the name, then the password:
    var dialogoptions = {
      type:"prompt",
      title: "welcome back!",
      content: "please give your slidenote a name",
      inputlabel:"slidenote file name",
      confirmbutton:"save",
      //nocancelbutton:true,
      closefunction: function(){
        var nid = slidenoteguardian.restObject.nid;
        if(!nid)return;
        //slidenoteguardian.deleteFromRest("/node/"+nid,function(){
          window.location.href="/user";
        //});
      },
      cssclass:"initial"
    };
    dialogoptions.content = document.createElement("div");
    dialogoptions.content.id = "placeholder";
    var subtitle = document.createElement("h2");
    subtitle.innerText = "please give your slidenote a name";
    //check if first note:
    if(this.restObject.nid==1){
      subtitle.innerText = "let's start with giving it a name:"
      dialogoptions.title = "welcome to your first slidenote!";
    }
    dialogoptions.content.appendChild(subtitle);


    dialoger.prompt(dialogoptions).then(function(resolve){
      var name = resolve;
      slidenoteguardian.notetitle = name;
      slidenote.menumanager.buildSlidenoteList();
      document.getElementById("slidenotetitle").innerText = name;
      var pwuserfield = document.getElementById("username");
      pwuserfield.value = name;

      slidenoteguardian.passwordPrompt("now choose a password to encrypt your slidenote","encrypt").then(
        function(resolve){
          slidenoteguardian.password = resolve;
          slidenote.textarea.value = '#welcome\nto slidenotes';
          slidenoteguardian.initialised=true;
          slidenoteguardian.saveNote('cms');
          slidenoteguardian.startEditorAnimation();
          slidenote.parseneu();
          //setTimeout("slidenoteguardian.saveNote('cms')",1);

        },
        function(error){
          slidenoteguardian.password = "";
          slidenoteguardian.startEditorAnimation();
        }
      );
    },function(error){

    });



  }else if(notehash===undefined && cachednote.notehash != undefined){
    setTimeout("slidenoteguardian.loadNote('local')",1);
  } else if(window.location.protocol==="file:"){
    //local-start for marie, delete in final version:
    slidenoteguardian.passwordPrompt("You are using the slidenote-editor localy. please choose a password to encrypt your slidenote","encrypt").then(
      function(resolve){
        slidenoteguardian.password = resolve;
        slidenoteguardian.saveNote('local');
        slidenoteguardian.startEditorAnimation();
        //setTimeout("slidenoteguardian.saveNote('cms')",1);

      },
      function(error){
        slidenoteguardian.password = "";
        slidenoteguardian.startEditorAnimation();
      }
    );
  }else{
    if(cachednote.nid == this.restObject.nid){
      //var confirmtext = "You have an unsaved Version of this slidenote in Cache. Show Diff?";
      //if(confirm(confirmtext))setTimeout("slidenoteguardian.loadDiff()",1); //only for now, TODO: always load Diff on this occasion
      //else setTimeout("slidenoteguardian.loadNote('cms')",1);
      setTimeout("slidenoteguardian.loadDiff()",1);
    }/*else if(cachednote.url != undefined){
      var confirmtext = "you have an unsaved version in cache from another slidenote "+this.localstorage.getItem("title");
      confirmtext +="\n open unsaved slidenote? ("+cachednote.url+") \n\n warning - unsaved cache will be lost if not saved to cloud";
      if(confirm(confirmtext)){
        window.location = cachednote.url;
      }else{
          setTimeout("slidenoteguardian.loadNote('cms')",1);
      }
    }*/
  }

  document.getElementById("optionsclose").addEventListener("click",function(event){
      slidenoteguardian.saveConfig("local");
  });

  setTimeout("slidenoteguardian.autoSaveToCMS()",3000);
  slidenote.textarea.addEventListener("focus",function(event){
    if(document.getElementById("slidenoteGuardianPasswortPrompt")!=null){
      document.getElementById("password").focus();
    }
  })
  //Adding import-Function to fileinput:
  this.initFileImport();
  this.initDragNDrop();

  window.onbeforeunload = function(){
    var acthash = slidenoteguardian.localstorage.getItem("slidenotehash");
    if(acthash!=slidenoteguardian.restObject.notehash){
      //console.log(acthash+"\n localstoragehash vs cmshash\n"+slidenoteguardian.cmsSlidenoteHash.value);
      return "do you really want to leave?";
    }
  }


  //savebutton:
  var savebutton = document.getElementById("savebutton");
  if(savebutton)savebutton.addEventListener("click",function(e){
    slidenoteguardian.saveNote("cms");
  });
  var cloudbutton = document.getElementById("cloud");
  if(cloudbutton)cloudbutton.addEventListener("click",function(e){
    slidenoteguardian.saveNote("cms");
  });
    this.savebutton = savebutton;
    this.savebuttontitles = {default:"not in sync with cloud",
                             error:"error while connecting to cloud",
                             sync:"in sync"}

  if(this.hascmsconnection){
    //this.loadSlidenotesList();
    //this.loadPresentationList();
  }

  this.initialised = true;
}

slidenoteGuardian.prototype.initFileImport = function(){
  var fileInput = document.getElementById("importfile");
  fileInput.addEventListener('change', function(e){
    let file = this.files[0];
    let nombre = file.name; //.slidenote
    console.log("file "+nombre + " selected");
    if(nombre.substring(nombre.length-10)===".slidenote"){
      //its an encrypted slidenote
      var reader = new FileReader();
      reader.onload = function(e){
        slidenoteguardian.importFromEncryptedFile(reader.result, nombre);
      }
      reader.readAsText(file);
    } else if(nombre.substring(nombre.length-2)==="md" ||
           nombre.substring(nombre.length-3)==="txt" ||
            nombre.substring(nombre.length-3)==="csv"){
      var reader = new FileReader();
      reader.onload = function(e){
        let mdcode = reader.result;
        let imgstringmarker = '\n||€€imagepart€€||\n';
        let imgstringpos = mdcode.indexOf(imgstringmarker);
        if(imgstringpos>-1){
          mdcode = mdcode.substring(0,imgstringpos);
          let imgstring = reader.result.substring(imgstringpos+imgstringmarker.length);
          slidenoteguardian.insertImport(mdcode, imgstring);
        }else{
          slidenoteguardian.insertImport(mdcode);
        }
      }
      reader.readAsText(file);
    } else {
      //Filetype not supported
      alert("filetype not supported");
    }
  }); //end of fileinput.addEventListener

}

slidenoteGuardian.prototype.initDragNDrop = function(){
  slidenote.textarea.addEventListener('drop', function(e){
      //prevent defaults:
      e.preventDefault();
      e.stopPropagation();
      //handling drag n drop of files
      let dt = e.dataTransfer;
      let files = dt.files;
      let file = files[0];
      let nombre = file.name;
      document.getElementById("importfile").dropfilename = file.name;
      if(nombre.substring(nombre.length-10)===".slidenote"){
        var reader = new FileReader();
        reader.onload = function(e){
          slidenoteguardian.importFromEncryptedFile(reader.result, nombre);
        }
        reader.readAsText(file);
      }else if(nombre.substring(nombre.length-2)==="md" ||
            nombre.substring(nombre.length-3)==="txt" ||
            nombre.substring(nombre.length-3)==="csv"){
              var reader = new FileReader();
              reader.onload = function(e){
                slidenoteguardian.insertImport(reader.result);
              }
              reader.readAsText(file);
      } else {
        //filetype not supported: Image is handled in imgtourl
      }
  }, false); //end of drop-event


}

slidenoteGuardian.prototype.initTutorial = function(){
  this.notetitle = this.restObject.title;
  this.isTutorial = true;
  document.getElementById("slidenotetitle").innerText=this.notetitle;
  var tutorialnote = this.restObject.encnote;

  //as tutorials are unencrypted we can use the values directly:
  this.slidenote.textarea.value = tutorialnote;

  this.slidenote.textarea.selectionEnd = 0;
  this.slidenote.parseneu();
  this.slidenote.textarea.blur();
  this.slidenote.textarea.focus();
  slidenote.base64images.rebuildOldImages();

  //load tutorial-list:
  //this.loadFromRest("/tutoriallist","importSlidenotesList");
  //Adding import-Function to fileinput:
  this.initFileImport();
  this.initDragNDrop();

  //overwriting savefunctions:
  this.autoSaveToLocal = function(){};
  this.autoSaveToCMS = async function(){};
  this.createNewSlidenote = function(){alert('here you could create a new slidenote. go back to editor to use')};
  this.deleteFromRest = function(path,response){alert('this would have deleted your slidenote')};
  this.saveConfig = function(){};
  //this.saveNote = function(){};
  this.saveToRest=function(){};
  //document.getElementById("renamebutton").onclick=function(){alert('here you could rename your slidenote')};
  //document.getElementById("changepasswordbutton").onclick=function(){alert('here you would change your password for your slidenote')};
  //disabling published-menu:
  document.getElementById('publishbutton').disabled=true;
  //overwriting cloud-button:
  var cloudbutton = document.getElementById("cloud");
  var backlink = document.createElement("a");
  //check if user is logged in:
  if(mongoguardian.tokenIsSet()){
    backlink.href = window.location.pathname;
    backlink.innerHTML = "&larr; back to editor"; //←
  }else{
    backlink.href="https://www.slidenotes.io";
    backlink.innerHTML = "&larr; back";
    //disable certain options for not-logged-in-users:
    let linkstohide = document.querySelectorAll('#menuoptionseditor a');
    for(var x=0;x<linkstohide.length;x++){
      linkstohide[x].href="#";
      linkstohide[x].style.opacity = "0.5";
    }
    //add e-mail-field to feedback:
    let fbWrapper = document.getElementById('feedback-allow-contact-wrapper');
    let emailinput = document.createElement('input');
    emailinput.type = "email";
    emailinput.required= true;
    emailinput.name="email";
    emailinput.id="feedback-email";
    let label = document.createElement('label');
    label.setAttribute('for',"feedback-email");
    label.innerText = 'your email: ';
    fbWrapper.appendChild(label);
    fbWrapper.appendChild(emailinput);
  }
  //cloudbutton.replaceWith(backlink);
  cloudbutton.style.display = "none";
  cloudbutton.parentElement.insertBefore(backlink,cloudbutton);

  //adding tutorial.css:
  slidenote.appendFile("css","tutorial.css");

  this.startEditorAnimation();

}

var testresponse; //for testing-purpose
slidenoteGuardian.prototype.loadFromRest = async function(filepath, responseHandler, loadingHandler){
  var oReq = new XMLHttpRequest();
  if(responseHandler!=null && responseHandler!=undefined)
  oReq.responseHandler = responseHandler;
  else oReq.responseHandler = false;
  oReq.addEventListener("load", function(){
    if(this.responseHandler && typeof this.responseHandler==="string"){
      slidenoteguardian[this.responseHandler](this);
    }else if(this.responseHandler && typeof this.responseHandler ==="function"){
      this.responseHandler();
    }else
    slidenoteguardian.loadedFromRest(this.response);
  });
  if(loadingHandler){
    oReq.addEventListener("progress",loadingHandler);
  }
  oReq.open("GET", filepath);
  oReq.setRequestHeader("CONTENT-TYPE","application/json");
  oReq.setRequestHeader('auth-token', this.restToken);
  oReq.send();
  testresponse = oReq; //for checking in testing only, not in production
}

slidenoteGuardian.prototype.loadedFromRest = function(jsonstring){
  //old - unused now?
  var loadedObject = JSON.parse(jsonstring);
  this.loadedObject = loadedObject;
  console.log(loadedObject);
}


//get all Css-Blocks from static webserver:
slidenoteGuardian.prototype.getCSSFromStaticWebserver = function(){
  console.log("load css from themes:"+slidenote.extensions.themes.length);
  console.log("theme-string:"+this.slidenote.extensions.themeObjektString);

  this.cssBlocksPerPlugin = new Array();
  //is this really necesary?:
  /*
  var basicl = new XMLHttpRequest();
  basicl.addEventListener("load",function(){
    if(this.status===200)slidenoteguardian.cssBlocksPerPlugin.push({plugin:"basic", css:this.response});
  })
  basicl.open("GET", slidenote.basepath+"editor.css");
  basicl.send();
  */
  var basepath = slidenote.basepath+"themes/"
  var themes = slidenote.extensions.themeCssString.split(";");//slidenote.extensions.themes;
  themes.pop(); //remove last empty entry
  for(var x=0;x<themes.length;x++)themes[x]= basepath + themes[x];
  themes.push(basepath + "slidenoteguardian");
  themes.push(slidenote.basepath + "slidenoteplayer");
  themes.push(basepath+'katex-fonts-incl');
  themes.push(basepath+'dialoger');
  //adding highlight-themes-styles:
  for(var x=0;x<slidenote.extensions.cssthemes.length;x++){
    let actt= slidenote.extensions.cssthemes[x];
    if(actt.highlightTheme && themes.indexOf(basepath+'highlight/styles/'+actt.highlightTheme)==-1)themes.push(basepath+'highlight/styles/'+actt.highlightTheme);
  }
  var oReqs = new Array();
  for(var x=0;x<themes.length;x++){

    var filename = themes[x]+".css";//themes[x].classname + ".css";
    oReqs[x] = new XMLHttpRequest();
    oReqs[x].addEventListener("load",async function(){
      var pluginname = this.responseURL.substring(this.responseURL.lastIndexOf("/")+1,this.responseURL.lastIndexOf("."));
      console.log("css-file loaded from webserver as textfile:", pluginname);
      if(this.responseURL.indexOf('highlight/styles/')>-1){
        pluginname = "highlight/styles/"+pluginname;
      }
      if(this.responseURL.indexOf('katex')>-1)pluginname="klatex";
      if(this.status ===200){
        let resp = this.response;
        if(pluginname=="slidenoteplayer"){
          resp = resp.substring(0,resp.indexOf('\n/* online stuff */'));
          pluginname="slidenoteplayermini";
        }
        if(resp.indexOf('/fonts/')>-1){
          resp = await slidenoteguardian.replaceCSSFontsWithBase64(resp);
        }
        slidenoteguardian.cssBlocksPerPlugin.push({
          plugin:pluginname, css:resp});
      }
    });
    oReqs[x].open("GET", filename);
    oReqs[x].send();
  }

}

slidenoteGuardian.prototype.replaceCSSFontsWithBase64 = async function(csstext){
  let fontsToLoad = [];
  let urlstart = location.protocol + '//' + location.host;
  let actstart = csstext.indexOf('"/fonts/');
  let actend = csstext.indexOf('"',actstart+5);
  while(actend>-1 && actstart>-1){
    fontsToLoad.push({
      start:actstart, end:actend,
      url:urlstart + csstext.substring(actstart+1,actend),
    });
    actstart = csstext.indexOf('"/fonts/', actend);
    actend = csstext.indexOf('"',actstart+5);
  }
  for(var x=0;x<fontsToLoad.length;x++){
    let resp = await fetch(fontsToLoad[x].url);
    if(resp.status!=200)continue;
    let body = await resp.blob();
    fontsToLoad[x].resp = resp;
    fontsToLoad[x].raw = body;
    fontsToLoad[x].b64 = await toBase64(body);

    //fontsToLoad[x].font = await body.text();
  }
  let result = csstext;
  for(var x=fontsToLoad.length-1;x>=0;x--){
    result = result.substring(0,fontsToLoad[x].start)+
            fontsToLoad[x].b64 + result.substring(fontsToLoad[x].end+1);
  }
  return result;
}
/*
get all js as static text to write it later into html-file on export
*/
slidenoteGuardian.prototype.getJSFromStaticWebserver = function(){
  this.jsfilesForExport = new Array();

  var jsfilenames = ["slidenoteplayermini.js", "slidenoteguardianmini.js"];
  for(var x=0;x<jsfilenames.length;x++){
    var filename = slidenote.basepath + jsfilenames[x];
    var req = new XMLHttpRequest();
    req.addEventListener("load",function(){
      console.log("js-file loaded from webserver as textfile");
      console.log(this);
      slidenoteguardian.jsfilesForExport.push({name: this.responseURL.substring(this.responseURL.lastIndexOf("/")+1),jscode: this.response});
    });
    req.open("GET",filename);
    req.send();
  }
}

/*creates the <style>-block for the html to export*/
slidenoteGuardian.prototype.createCssBlock = function(){
  var cssblock = "";
  var actTheme = slidenote.extensions.activeCssTheme;
  //if(this.restObject.plugincollector == undefined && this.hascmsconnection){
    //this.getAllPlugins();
  //} else
  if(this.cssBlocksPerPlugin){
    for(var x=0;x<this.cssBlocksPerPlugin.length;x++){
      var cssb = this.cssBlocksPerPlugin[x];
      var ltheme = slidenote.extensions.getThemeByName(cssb.plugin);
      if((ltheme && ltheme.active) ||
        cssb.plugin==="basic" ||
        cssb.plugin==="dialoger" ||
      cssb.plugin==="slidenoteguardian" ||
      cssb.plugin==="slidenoteplayermini" ||
      (actTheme.highlightTheme &&
        cssb.plugin.indexOf('highlight/')>-1 &&
        cssb.plugin.indexOf(actTheme.highlightTheme) >-1)
      ){
        cssblock+="\n"+cssb.css+"\n</style><!-- end of "+cssb.plugin+" --><style>";
      }else{
        console.log("plugin "+cssb.plugin +"war nicht aktiv");
      }
    }
    return cssblock;
  } else if(!this.hascmsconnection) return "/*connection to cloud not working*/";

  for(var x=0;x<slidenote.extensions.themes.length;x++){
    var acttheme = slidenote.extensions.themes[x];
    if(acttheme.active && this.restObject.plugincollector[acttheme.classname]!=undefined){
      cssblock+=this.restObject.plugincollector[acttheme.classname].css;
    }
  }
  //cssblock+="\n</style>\n";
  return cssblock;
}

/*
get a rest-token: - not really necesary anymore
*/
slidenoteGuardian.prototype.getRestToken = function(afterwards){
  this.restToken = mongoguardian.token;
  console.warn('used old function, change code please');
}

slidenoteGuardian.prototype.afterToken = function(){
  //placeholder to be overwritten in case needed
  console.warn('used old function, change code please');
}
/*
saveToRest: saves content to cms via Rest:
@param payload: payload to save to the Rest
@param path: path for the Rest-Action
old
slidenoteGuardian.prototype.saveToRest = async function(path, payload){
  console.log("start saveToRest:"+path);
  if(this.restToken===undefined || this.restToken===null){
    console.log("Rest-Token not set yet... getting Token and try again...");
    this.getRestToken("save"); //has to be with await
    if(this.uploadRestObject.inprogress)this.uploadRestObject.inprogress=false;
    if(this.savingtoDestination)this.savingtoDestination=undefined;
    return; //return and wait for next save till we can await
  }
  //var payload = JSON.stringify(payloadobject);
  var putReq= new XMLHttpRequest();
  putReq.addEventListener("load",function(){
    slidenoteguardian.resolve=this;
    console.log(this);
    slidenoteguardian.savedToRest(this);
  });
  putReq.open("PUT",path);
  putReq.upload.addEventListener("progress", function(evt){
      if (evt.lengthComputable) {
        console.log("Upload in Progress:" + evt.loaded + "/" + evt.total);
        var cs = document.getElementById("cloudstatus");
        var ul = Math.floor(evt.loaded / 1024);
        var tt = Math.floor(evt.total / 1024);
        cs.innerText = "uploading in progress: "+ul+"/"+tt+" kB uploaded";
      }
    }, false);
  putReq.setRequestHeader("CONTENT-TYPE","application/json");
  putReq.setRequestHeader('X-CSRF-TOKEN', this.restToken);

  //putReq.withCredentials = true;
  putReq.addEventListener("error",function(evt){
    if(slidenoteguardian.uploadRestObject.inprogress)slidenoteguardian.uploadRestObject.inprogress=false;
    if(slidenoteguardian.savingtoDestination)slidenoteguardian.savingtoDestination=undefined;
    var cloudbutton = document.getElementById("cloud");
    cloudbutton.classList.add("cloud-error");
    var statustext = document.getElementById("cloudstatus");
    statustext.innerText = "an error occured - network seems unreachable. please try again later or check your internet connection.";
  });
  putReq.send(payload);
  console.log("sending payload");
  console.log(putReq);
}
*/

/*
after content is saved to rest this is called:
slidenoteGuardian.prototype.savedToRest = function(resolve){
  console.log("saved to Rest:"+resolve.statusText);
  var statusimg = document.getElementById("savestatus");
  var cloudbutton = document.getElementById("cloud");
  //clear classlist:
  var classList = cloudbutton.classList;
  while (classList.length > 0) {
       classList.remove(classList.item(0));
  }
  var statustext= document.getElementById("cloudstatus");


  if(resolve.statusText==="OK"){
    if(statusimg){
      statusimg.src = slidenote.imagespath+"buttons/cloudsaved.png";
      statusimg.title = "slidenote in sync with cloud";
    }
    cloudbutton.classList.add("status-ok");
    cloudbutton.title = "slidenote in sync with cloud";
    if(statustext)statustext.innerText="in sync with cloud";
    this.restObject.combine(this.uploadRestObject);
    //check if cached-version is same - if so set to saved:
    let cachedhash = this.localstorage.getItem("slidenotehash");
    console.log("savedToRest: cache vs. cms \n"+cachedhash + "\n"+this.restObject.notehash);
    if(cachedhash === this.restObject.notehash)this.localstorage.setItem("saved","true");
    //this.localstorage.setItem("nid",this.restObject.drupal7.nid);
    //this.localstorage.setItem("url",window.location.href);
  }else{
    if(statusimg){
      statusimg.src = slidenote.imagespath+"buttons/clouderror.png";
      statusimg.title=resolve.statusText;
    }
    cloudbutton.classList.add("cloud-error");
    cloudbutton.title = resolve.statusText;
    if(statustext)statustext.innerText="no connection with cloud";
  }
  this.savingtoDestination=undefined; //old? seems to not be used anymore
  this.uploadRestObject = {}; //destroy uploadRestObject?
}
*/

/* exportPresentation:
prepares the presentation to be exported to destination
@param destination: where to save (filesystem, cms)
*/
slidenoteGuardian.prototype.exportPresentation = async function(destination, presentationdiv){
  this.uploadRestObject.enableComments=true;
  try{
    var password;
    if(destination==='filesystem') password = await this.passwordPrompt("choose a password for the presentation", "export", true);
    else password = await this.passwordPrompt("choose a password for the presentation", "exportCMS", true);
  }catch(err){
    console.log('user aborted');
    return;
  }
  if(destination==="filesystem")this.preparePresentationForFilesystem(presentationdiv);
  var presentationstring = '<div class="'+presentationdiv.classList.toString()+'">'+
                            presentationdiv.innerHTML + "</div>";
  if(destination==="cms"){
    presentationstring = slidenote.textarea.value;
    //presentationstring += "§§§€€€€€IMAGEBLOCK€€€€€§§§";
    //presentationstring += slidenote.base64images.allImagesAsString();
  }
  var encResult = await this.encryptForExport(presentationstring, password);
  var encString = this.encBufferToString(encResult);
  this.uploadRestObject.encpresentation = encString;
  if(destination==="cms"){
    this.uploadRestObject.title = encResult.filename;
    //mongo-style:
    let optionobj = this.saveConfig("cms");
    optionobj.enableComments = this.uploadRestObject.enableComments;
    let optionstring = JSON.stringify(optionobj);
    var payload = {
      title:encResult.filename,
      encnote:this.uploadRestObject.encpresentation,
      options:optionstring,
      encimages:null, //add images to presentation
    }
    payload.encimages = await this.prepareImagesForPresentation(password);
    let resp = await mongoguardian.createPresentation(payload);
    if(!resp.error){
      var cdate = new Date();
      this.loadedPresentations.unshift({
        date: cdate,
        slidenote:this.nid,
        title: payload.title,
        enccomments:[],
        url: resp.url,
      });
      var dialogoptions = {
        type:"confirm",
        title:"new presentation ready",
        content:"new presentation ready with url "+resp.url+"\n go there now?",
        confirmbutton:"go to presentation",
        cancelbutton: "back to editor",
        closefunction: function(){
          menumanager.buildPublishedMenu();
        },
      }
      var goto = resp.url;
      dialoger.buildDialog(dialogoptions,function(){
        //go to presentation:
        //location.href = "/presentation.htm?"+goto;
        window.open('/presentation.htm?'+goto, '_blank');
      });
    }
  }else if(destination==="filesystem"){
    this.exportPresentationToFilesystem(encString, true);
  }
}

/*prepareImagesForPresentation:*/
slidenoteGuardian.prototype.prepareImagesForPresentation = async function(pw){
  let localimages = slidenote.base64images.base64images;
  //TODO: filter here to only upload used images
  var encimages = [];
  for(var x=0;x<localimages.length;x++){
    let localmeta = {
      names:localimages[x].names,
      filename:localimages[x].filename
    };
    let encmetahash = await this.hash(JSON.stringify(localmeta));
    let localhash = localimages[x].hash;
    if(localhash===undefined)localhash = await this.hash(localimages[x].base64url);

    encimages.push({
      hash:localhash,
      encb64:await this.encryptText(localimages[x].base64url, pw),
      encmeta: await this.encryptText(JSON.stringify(localmeta),pw),
      encmetahash: encmetahash,
    });
  }
  return encimages;
}
/*
createNewSlidenote:
prepares a new slidenote, saves it to the cms,
then loads it to the browser by redirecting to the url of the
new slidenote
*/
slidenoteGuardian.prototype.createNewSlidenote = async function(){
  document.getElementById("slidenotediv").style.display = "none";
  try{
    let newslidenote = await mongoguardian.createNewSlidenote();
    console.log('created new slidenote:',newslidenote);
    if(newslidenote && newslidenote.nid){
      if(location.search.length>1){
        location.search="id="+newslidenote.nid;
      }else{
        let newpath = location.pathname.substring(0,location.pathname.lastIndexOf('/')+1);
        newpath+=newslidenote.nid;
        location.pathname=newpath;
      }
      return;
    }
  }catch(err){
    console.warn('could not create new slidenote:',err);
  }
}


/*
to export presentations the presentation has to be fully created.
after presentation is created this function is called:
*/
slidenoteGuardian.prototype.exportIsReady = function(presdiv){
  console.log("export is ready to:"+this.exportPresentationDestination);
  if(this.exportPresentationDestination==="unencrypted"){
    this.preparePresentationForFilesystem(presdiv);
    this.exportPresentationToFilesystem(presdiv.innerHTML, false);
  }else{
    this.exportPresentation(this.exportPresentationDestination, presdiv);
  }
  this.exportPresentationDestination = undefined;
  slidenote.presentation.showpresentation();//hide exported-Presentation and return into editormode
}

//this seems old - can i delete it?
//as in cms its not in html
slidenoteGuardian.prototype.exportPresentationToCMS = function(){
  this.exportPresentationDestination ="cms";
  console.log("start exporting to cms");
  slidenote.presentation.showpresentation(true);
}

slidenoteGuardian.prototype.exportPresentationLocal = function(encrypted){
  if(encrypted)this.exportPresentationDestination = "filesystem";
  if(!encrypted)this.exportPresentationDestination = "unencrypted";
  console.log("start exporting to filesystem");
  slidenote.presentation.showpresentation(true); //create a new presentation
}

slidenoteGuardian.prototype.preparePresentationForFilesystem = function(presentationdiv){
  var pages = presentationdiv.getElementsByClassName("ppage");
  if(!this.templatePresentationControls)this.templatePresentationControls = document.getElementById('templateExportControlArea').innerHTML;
  for(var x=0;x<pages.length;x++){
    var template = this.templatePresentationControls;
    var page = pages[x];
    var id = "slide"+(x+1);
    var nav = document.createElement("div");
    //nav.style.position = "fixed";
    //nav.style.bottom = 0;
    //nav.style.width = "100vw";
    nav.classList.add("controlarea");
    let backlink = 'href="#slide'+(x)+'"';
    if(x==0)backlink='';
    let forwlink = 'href="#slide'+(x+2)+'"';
    if(x==pages.length-1)forwlink='href="#slide'+(x+1)+'"';
    /*old:
    var backlink = document.createElement("a");
    if(x>0)backlink.href="#slide"+(x-1);
    backlink.innerText="last slide";
    backlink.classList.add("controlbutton");
    var forwlink = document.createElement("a");
    if(x<pages.length-1)forwlink.href="#slide"+(x+1);
    forwlink.innerText = "next slide";
    forwlink.classList.add("controlbutton");
    nav.appendChild(backlink);
    nav.appendChild(forwlink);
    */
    let lastlink = 'href="#slide'+pages.length+'"';
    template = template.replace('href="#previous"',backlink);
    template = template.replace('href="#next"',forwlink);
    template = template.replace('href="#last"',lastlink);
    nav.innerHTML = template;
    page.appendChild(nav);
    page.id=id;
    page.classList.remove("active");
  }//for-to
  var allimages = presentationdiv.getElementsByTagName('img');
  var defaultimage = slidenote.base64images.defaultImage;
  for (var x=0;x<allimages.length;x++){
    if(allimages[x].src.indexOf("images/imageupload.png")>-1){
      //replace with default-image:
      allimages[x].src=defaultimage;
    }
  }
}

slidenoteGuardian.prototype.exportPresentationToFilesystem = function(presstring, encrypted){
  //get css-codes from all active themes:
  /*
  var allactivethemes = ""; //holds names of all active themes
  for(var x=0;x<slidenote.extensions.themes.length;x++){
    var acttheme=slidenote.extensions.themes[x];
    if(acttheme.active)allactivethemes+=acttheme.classname+";";
  }*/
  var cssblock = this.createCssBlock();
  cssblock+= "\ndiv.ppage{visibility:hidden;}"+
            " \ndiv.ppage:target{visibility:visible;}"+
            "\n.blocks div.ppage.active{visibility:hidden;}"+
            "\n#slide1{visibility:visible;z-Index:1} .ppage{z-index:2}"+
            "\n#passwordgen,#forgottenPasswordDialogButton,#slidenoteGuardianPasswortPrompt #slidenoteGuardianPasswordPromptCommentEnableLabel,#slidenoteGuardianPasswortPrompt #slidenoteGuardianPasswordPromptCommentEnable,#slidenoteGuardianPasswortPrompt #dialogclosebutton.dialogclosebutton{display:none;}"
            ;
  var headerhtml = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>a slidenote presentation</title></head>';
  if(encrypted)headerhtml+='<body onload="slidenoteguardian.decryptPresentation()">'; else headerhtml+="<body>";
  var bodyhtmlbefore = '<div id="slidenotediv" class="'+slidenote.presentation.presentation.classList.toString()+'"><div id="slidenotepresentation">';
  var bodypresentation = "";
  if(!encrypted)bodypresentation = presstring;
  var bodyhtmlafter = '</div></div>';
  var bodyend ='</body></html>';
  var jsblock = "";
  if(encrypted){
    jsblock = "encslidenote = {encBufferString:'"+presstring +
                "', ivlength:"+this.ivlength+
                "}\n";

    for(var jsx = 0;jsx<this.jsfilesForExport.length;jsx++)jsblock += this.jsfilesForExport[jsx].jscode;
  }else{
    for(var jsx = 0;jsx<this.jsfilesForExport.length;jsx++)if(this.jsfilesForExport[jsx].name==="slidenoteplayermini.js")jsblock += this.jsfilesForExport[jsx].jscode;
  }
  var passwordprompt =  "";
  if(encrypted)passwordprompt = document.getElementById("slidenoteGuardianPasswordPromptStore").innerHTML;

  var result = headerhtml+
              "<style>"+ cssblock + "</style>"+
              bodyhtmlbefore+
              bodypresentation +
              bodyhtmlafter+
              "<script>"+jsblock+"</script>"+
              '<div id="slidenoteGuardianPasswordPromptStore">'+passwordprompt+'</div>'+
              bodyend;
  let filename = document.getElementById('username').value;
  if(filename.length==0)filename=slidenoteguardian.notetitle;
  this.exportToFilesystem(result, filename+".html");
}


/* loadNote
loads the slidenote from destination
@param destination: from where to load (cms, local)
@param dontinsert: if we load it just for preview dont insert it into textarea
*/
slidenoteGuardian.prototype.loadNote = async function(destination, dontinsert){
    //loads Note from cmsArea or from local destination
    //destination is "cms" or "local"
    if(destination==="cms"){
      if(!this.hascmsconnection)return;
      if(typeof initial_note!="undefined")this.encBufferString = initial_note.encnote;
      if(mongoguardian && mongoguardian.mongonote.encnote)this.encBufferString = mongoguardian.mongonote.encnote;
      //this.encImageString = this.cmsImages.value;
    }else if(destination==="local"){
      this.encBufferString = this.localstorage.getItem('cryptnote');
    }
    if(this.encBufferString===null || this.encBufferString===undefined || this.encBufferString.length===0){
      console.log("no buffer-string found, aborting load-note");
      return;
    }
    //getting iv of string:
    let iv = new Uint8Array(this.ivlength); //create empty ivarray
    for(let i=0;i<this.ivlength;i++)iv[i]=this.encBufferString.charCodeAt(i)-255;
    this.iv = iv;
    this.encBufferString = this.encBufferString.substring(this.ivlength);//delete iv-chars from string
    let buffer = new Uint8Array(this.encBufferString.length);
    for(let i=0;i<this.encBufferString.length;i++)buffer[i]=this.encBufferString.charCodeAt(i)-255;
    //this.encTextBuffer = buffer.buffer; //changing to ArrayBuffer -- TODO:kann weg oder?
    this.password = "";
    this.decText = await this.decrypt(buffer.buffer, this.iv); //decrypt ArrayBuffer
    if(this.decText === "decryption has failed"){
      this.password = undefined;
      this.decText = await this.decrypt(buffer.buffer, this.iv); //decrypt ArrayBuffer
    }
    //console.log("decryption fail:"+this.decText);
    //error-handling - try again:
    var decfaileddialogoptions = {
      type:"confirm",
      title:"decryption failed - wrong password!",
      content: "decryption failed. try it again?",
      confirmbutton: "try again",
      cancelbutton: "cancel", //delete slidenote
      /*closefunction: function(){
        var nid = slidenoteguardian.restObject.nid;
        if(!nid)return;
        slidenoteguardian.deleteFromRest("/node/"+nid, function(){
          window.location.href="/editor";
        });
      }*/
    };
    //while(this.decText === "decryption has failed" && confirm("decryption failed. try it again?")){
    while(this.decText === "decryption has failed" && await dialoger.confirm(decfaileddialogoptions)){
        this.decText = await this.decrypt(buffer.buffer, this.iv); //decrypt ArrayBuffer anew
    }
    if(this.decText === "decryption has failed"){

      var errl = document.getElementById("texteditorerrorlayer");
      var instext = this.encBufferString.substring(0,4000);
      if(instext.length<4000){
        while(instext.length<4000)instext+=instext+"|";
      }
      var encspan = document.createElement("span");
      instext = begintext + instext;
      encspan.innerText =instext;
      var begintext = "<span>opening file &quot;"+slidenoteguardian.notetitle+"&quot; --- done</span><br>";
      begintext += "<span>please input password: *******</span><br>";
      begintext += "<span>trying to decrypt slidenote ---  error</span><br>";
      begintext += "<span>please click to try again</span><br><br>";
      begintext += "<span>loaded file:</span><br>";
      errl.innerHTML = begintext;
      errl.appendChild(encspan);
      errl.onclick = function(){
        errl.style.overflow = null;
        errl.style.wordBreak= null;
        errl.style.backgroundRepeat= null;
        errl.style.backgroundSize= null;
        errl.style.background = null;
        document.getElementById("slidenoteloadingscreenwrapper").style.display = null;
        var slidenotediv = document.getElementById("slidenotediv")
        slidenotediv.classList.add("initial");
        slidenotediv.classList.add("midstate");
        slidenotediv.classList.remove("abortedDecryption");
        slidenote.textarea.style.display = null;
        slidenoteguardian.loadNote("cms");
      }
      slidenote.textarea.style.display = "none";
      // errl.style.background = "url(images/schloss-rot.png)";
      errl.style.overflow= "hidden";
      errl.style.wordBreak= "break-all";
      errl.style.backgroundRepeat= "no-repeat";
      errl.style.backgroundSize= "contain";
      document.getElementById("slidenoteloadingscreenwrapper").style.display = "none";
      var slidenotediv = document.getElementById("slidenotediv")
      slidenotediv.classList.remove("initial");
      slidenotediv.classList.remove("midstate");
      slidenotediv.classList.add("abortedDecryption");
      return; //password wrong, abort the load
    }
    console.log("decryption ended succesfully:"+this.decText.substring(0,20));
    if(dontinsert)return this.decText;
    this.slidenote.textarea.value = this.decText; //putting result into textarea
    //loading images:
    let imgstring;
    if(destination==="local")imgstring = this.localstorage.getItem('cryptimagestring');
    if(destination==="cms" || !imgstring){
      if(mongoguardian && mongoguardian.mongoimages){
        //as it is first load we dont care about existing image-detection:
        for(var x=0;x<mongoguardian.mongoimages.length;x++){
          let actimg = mongoguardian.mongoimages[x];
          let actm = await this.decryptText(actimg.encmeta);
          var actmeta
          try{
            actmeta = JSON.parse(actm);
            let actbase64url = await this.decryptText(actimg.encb64);
            let newb64img = new base64Image(actmeta.names, actbase64url, actmeta.filename);
            newb64img.hash = actimg.hash; //adding hash here directly
            newb64img.encmetahash = actimg.encmetahash;
            newb64img.meta = actmeta;
            slidenote.base64images.base64images.push(newb64img); //adds image to Database
          }catch(err){
            console.warn('could not load imagemeta:',actm)
          }
        }//forto
      }//if mongoguardian
    }//if dest===cms
    if(imgstring != undefined && imgstring.length>0){
      //images sind vorhanden - TODO: check ob images bereits geladen sind mittels timestamp
      this.encImageString = imgstring;
      await this.loadImages(destination);

    }
    //cleaning up:
    this.slidenote.parseneu(); //let wysiwyg-editor notice change
    this.slidenote.textarea.blur();
    this.slidenote.textarea.focus(); //focus on textarea for further editing
    //start animation
    this.startEditorAnimation();
    slidenote.base64images.rebuildOldImages();
    if(this.password==="" && !this.localstorage.getItem("dontBotherOnEmptyPassword")){
      setTimeout(function(){
        //show dialog after Editor is loaded and password is empty:
        var dialogoptions = {
          type:"confirm",
          title:"missing password",
          content:"your slidenote is not protected with a password. \ndo you want to set a password now?",
          confirmbutton:"yes",
          cancelbutton:"no",
          cssclass:"small"
        };
        var dontarea = document.createElement("div");
        var dontl = document.createElement("label");
        dontl.innerText = "don't remind me again";
        dontl.setAttribute('for', "dontbotherbox");
        var dontbother = document.createElement("input");
        dontbother.type = "checkbox";
        dontbother.id = "dontbotherbox";
        dontbother.onchange = function(){
          slidenoteguardian.localstorage.setItem("dontBotherOnEmptyPassword", this.checked);
        };
        dontarea.appendChild(dontbother);
        dontarea.appendChild(dontl);
        dontarea.classList.add("dontbotherarea");
        dialogoptions.afterButtonArea = dontarea;
        var dialog = dialoger.buildDialog(dialogoptions, function(){
          document.getElementById("changepasswordbutton").click();
        });

      },3100);
    }
};

/* startEditorAnimation
shows the animation after loading is finished:
*/
slidenoteGuardian.prototype.startEditorAnimation = function(){
  var loadingscreen = document.getElementById("slidenoteloadingscreenwrapper");
  var slidenotediv = document.getElementById("slidenotediv");
  if(loadingscreen){
    loadingscreen.classList.remove("midstate");
    slidenotediv.classList.remove("midstate");
    loadingscreen.classList.add("endstate");
    slidenotediv.classList.add("endstate");
    setTimeout(function(){
      var loadsc = document.getElementById("slidenoteloadingscreenwrapper");
      loadsc.parentElement.removeChild(loadsc);
      var pwprompt = document.getElementById("slidenoteGuardianPasswordPromptTemplate");
      pwprompt.classList.remove("initial");
      document.getElementById("slidenotediv").classList.remove("initial");
      document.getElementById("slidenotediv").classList.remove("endstate");
      document.getElementById("slidenotediv").classList.remove("midstate");
      slidenote.textarea.focus();
    },3000);
  }
};

/* saveNote
saves the slidenote to destination (local, cms)
*/
slidenoteGuardian.prototype.saveNote = async function(destination){
  var restObject = this.restObject;
  if(!this.initialised && !this.isTutorial)return;
  if(this.isTutorial && destination!="filesystem")return;
  if(destination==="cms"&&!this.hascmsconnection)return;
  if(destination==="local" && !slidenote.extensions.allThemesLoaded)return;
  if(slidenote ===undefined || this.slidenote.base64images ===undefined)return;
  var starttime = new Date().getTime();
  console.log("starting save note to destination "+destination);
  console.log("saving to somewhere?"+this.savingtoDestination);
  if(this.savingtoDestination!=undefined){
    //setTimeout("slidenoteguardian.saveNote('"+destination+"')",100);
    //in case sometimes something could break - if the initial saving-process is more then x minutes ago
    //retry anyway?
    if(this.savingtoDestination==='local' &&
      this.savingTryTime-starttime<-30000){
        console.warn('saving to local was blocking and needed more then 30 seconds - maybe by presentation opening?');
    }else if(this.savingtoDestination=='cms' &&
      this.savingTryTime-starttime<-180000){
        console.warn('saving to cms was blocking and needed more then 3 minutes... server error?');
    }else{
        return;
      }
  }
  this.savingTryTime = starttime;
  this.savingtoDestination = destination;
  //saves Note to cmsArea -> CMS or to local destination
  //destination is cms, filesystem or local - will be encrypted nevertheless
  if(document.getElementById("slidenoteGuardianPasswortPrompt")!=null)return;
  let slidenotetext = this.slidenote.textarea.value;
  //console.log("encrypting slidenote:"+slidenotetext.substring(0,300));
  let encResult;
  if(destination ==="filesystem"){
    let exportpw;
    if(slidenote.editormodus==="basic-mode")exportpw="";
    let exportstring = slidenotetext +
                        "\n||€€imagepart€€||\n" +
                      this.slidenote.base64images.allImagesAsString();
     encResult = await this.encryptForExport(exportstring,exportpw);
  }else{
    try{
      encResult = await this.encrypt(slidenotetext);
    }catch(err){
      console.log(err);
      this.savingtoDestination=undefined;
      return;
    }
  }
  if(encResult==undefined){
    this.savingtoDestination=undefined;
    return;
  }
  let result = this.encBufferToString(encResult);
  //save Images - has to be done elsewhere
  if(destination ==="cms"){
    if(this.uploadRestObject.inprogress)return; //do only try to save once at a time
    this.uploadRestObject = {inprogress:true};

    //title:
    if(slidenoteguardian.notetitle != this.restObject.title)this.uploadRestObject.title=slidenoteguardian.notetitle;
    //notehash:
    this.uploadRestObject.notehash = await this.hash(slidenotetext);
    //encnote:
    this.uploadRestObject.encnote = result;
    var savestatus = document.getElementById("savestatus")
    if(savestatus){
      savestatus.src=slidenote.imagespath+"buttons/cloudupload.gif";
      savestatus.title="saving note into cloud";
    }
    var cloudbutton = document.getElementById("cloud");
    var classList = cloudbutton.classList;
    while (classList.length > 0) {
      classList.remove(classList.item(0));
    }
    cloudbutton.classList.add("status-syncing");
    var cloudstatus = document.getElementById("cloudstatus");
    cloudstatus.innerText = "saving note into cloud";



    //var drupal7prepare = this.prepareDrupal7Rest("text");
    //TODO: images? new part:
    //check if we have to save:
    if(restObject.reencrypt){
      //reencrypt all images:
      restObject.reencrypt = undefined;
      //console.warn('TODO: reencrypt images!')
      //delete all images,
      //reencrypt all images and upload them again
      //or should we patch them?
      await this.reuploadAllImages();
    }

    console.log("saving to cms via mongoguardian");
    try{
      var response = await mongoguardian.updateSlidenote(this.uploadRestObject);
      console.log('updated note',response);
      if(response.err){
        console.warn('error on updating slidenote',response.err);
        this.uploadRestObject = {}; //cancel upload
        this.savingtoDestination=undefined;
        return;
      }
      this.restObject.combine(this.uploadRestObject);
      this.uploadRestObject = {}; //upload is finished so clear uploadobject
      this.checkCloudStatus(); //check cloud status to set cloud icon
      this.savingtoDestination = undefined;
    }catch(err){
      console.warn('error on updating slidenote',err);
      this.uploadRestObject = {}; //cancel upload
      this.savingtoDestination=undefined;
    }
    if(mongoguardian && (slidenote))this.saveImagesToMongo();
  }else if(destination==="local"){
    //TODO: testing max-size of local storage
    this.localstorage.setItem('cryptnote',result); //saving it to local storage
    //this.localstorage.setItem('cryptnote'+this.notetitle,result); //new approach with multiple notes
    this.localstorage.setItem('title',this.notetitle); //can be deleted in future
    this.localstorage.setItem('url',window.location.href);
    //let titles = this.localstorage.getItem("notetitles"); //multiple notes can be saved
    //if(titles===null)titles=this.notetitle;
    //if(titles.indexOf(this.notetitle)===-1)titles+="#|#"+this.notetitle;

    //if(imghash!=null){
    //  this.localstorage.setItem('cryptimagestring',encimgstring); //TODO: posibility to store images separately
    //  this.localstorage.setItem('imghash',imghash); //TODO: posibility to store images separately
    //}
    //store some images temporarily?

    let notehash = await this.hash(slidenotetext);
    this.localstorage.setItem("slidenotehash", notehash);
    //check if version is saved to cms, else saved is false:
    var savedToCMS = false;
    //check if hashes are the same::
    savedToCMS = (notehash === this.restObject.notehash);
    //console.log("saved or not saved in cms?"+ "\n note-check:"+(result===this.restObject.encnote)+ "\n hash-check:"+(notehash === this.restObject.notehash));
    this.localstorage.setItem("saved", savedToCMS);
    this.localstorage.setItem("url",window.location.href);
    this.savingtoDestination = undefined;
    console.log('saved to localstorage');

  }else if(destination ==="filesystem"){
    //export/save it to the local filesystem
    let exportstring = result;
    let exportfilename = this.notetitle+".slidenote";
    if(encResult.filename){
      exportfilename=encResult.filename;
      if(exportfilename.substring(exportfilename.length-10)!=".slidenote")exportfilename+=".slidenote";
    }
    this.exportToFilesystem(exportstring, exportfilename);
    this.savingtoDestination = undefined;
  }
  var endtime = new Date().getTime();
  var usedtime = endtime - starttime;
  console.log("Timecheck: saved node to destination "+destination+" in"+usedtime+"Ms");

}

slidenoteGuardian.prototype.exportToFilesystemRaw = async function(){
  let slidenotetext = slidenote.textarea.value;
  let exportstring = slidenotetext;
  if(slidenote.base64images.base64images.length>0)exportstring +=  "\n||€€imagepart€€||\n" +
            slidenote.base64images.allImagesAsString();
  let filename = slidenoteguardian.notetitle+".md";
  this.exportToFilesystem(exportstring,filename);
}

slidenoteGuardian.prototype.saveImagesToMongo = async function(){
  if(this.isSavingImagesToMongo)return; //only do it once a time
  let localimages = slidenote.base64images.base64images;
  let localhashes = [];
  let restimages = mongoguardian.mongoimages;
  let deleteimagehashes = [];
  let createimages = [];
  let updateimages = [];

  for(var x=0;x<localimages.length;x++){
    let localmeta = {
      names:localimages[x].names,
      filename:localimages[x].filename
    };
    let encmetahash = await this.hash(JSON.stringify(localmeta));
    let localhash = localimages[x].hash;
    if(localhash===undefined)localhash = await this.hash(localimages[x].base64url);
    localhashes.push(localhash);
    let found = false;
    for(var y=0;y<restimages.length;y++){
      let restimagehash = restimages[y].hash;
      if(localhash===restimagehash){
        //found localimage online.
        found = true;
        //is meta still correct?:
        if(encmetahash!=restimages[y].encmetahash){
          updateimages.push({
            hash:localhash,
            localmeta:localmeta,
            encmetahash:encmetahash,
            });
        }
        break;
      }
    }
    if(!found)createimages.push({
      encb64: await this.encryptText(localimages[x].base64url),
      encmeta: await this.encryptText(JSON.stringify(localmeta)),
      hash: localhash,
      encmetahash: encmetahash
    });
  }
  for(var x=0;x<restimages.length;x++){
    if(localhashes.indexOf(restimages[x].hash)===-1){
      deleteimagehashes.push(restimages[x].hash);
    }
  }
  //now we can iterate through these arrays to update/create/delete images:
  for(var x=0;x<createimages.length;x++){
    try{
      let resp = await mongoguardian.createEncImage(createimages[x]);
      console.log('created new image',resp);
      mongoguardian.mongoimages.push(createimages[x]);
    }catch(err){
      console.warn('could not create new image',err);
    }
  }
  for(var x=0;x<updateimages.length;x++){
    try{
      let localmeta = JSON.stringify(updateimages[x].localmeta);
      let encmeta = await this.encryptText(localmeta);
      let resp = await mongoguardian.updateEncImage({encmeta:encmeta, encmetahash:updateimages[x].encmetahash},updateimages[x].hash)
      for(var y=0;y<restimages.length;y++){
        if(restimages[y].hash===updateimages[x].hash){
          restimages[y].encmetahash = updateimages[x].encmetahash;
          restimages[y].encmeta = updateimages[x].encmeta;
           break;
        }
      }
    }catch(err){
      console.warn('updateimage failed',err);
    }
  }
  for(var x=0;x<deleteimagehashes.length;x++){
//    if(!confirm('deleting image... something goes wrong? not anymore... continue?'+
//            'this.initialised:'+this.initialised+
//          '\ndelete image:'+deleteimagehashes[x]))return;;
    try{
      let resp = await mongoguardian.deleteEncImage(deleteimagehashes[x]);
      console.log('deleted image',resp);
      for(var y=0;y<restimages.length;y++){
        if(restimages[y].hash===deleteimagehashes[x]){
          restimages.splice(y,1); break;
        }
      }
    }catch(err){
      console.warn('deleting image failed',resp);
    }
  }
  //break the lock so it can begin anew next time:
  this.isSavingImagesToMongo = false;
}

slidenoteGuardian.prototype.reuploadAllImages = async function(){
  if(!mongoguardian.mongoimages ||
    mongoguardian.mongoimages.length===0)return;
    console.log('deleting all images');
  try{
      let alldeleted = await mongoguardian.deleteAllEncImagesOfNote();
      console.log('alldeleted?',alldeleted);
      if(alldeleted.deleted){
        mongoguardian.mongoimages=[];
        console.log('')
        await this.saveImagesToMongo();

      }
  }catch(err){
    console.warn('could not reupload images:',err);
  }
}

slidenoteGuardian.prototype.exportToFilesystem = function(exportstring, exportfilename){
  //TODO: Check if saveAs supported. If not bounce exportstring to server
  let blob = new Blob([exportstring],{type:"text/plain;charset=utf-8"});
  saveAs(blob, exportfilename);
}

slidenoteGuardian.prototype.loadImages = async function(){
  //image-part:
  let encimagestring = this.encImageString.substring(0);
  //console.log("load Images" + encimagestring.substring(this.ivlength,30));
  if(encimagestring.length>0){
    //getting iv out of the string
    let imgiv = new Uint8Array(this.ivlength);
    for(let iiv=0;iiv<this.ivlength;iiv++)imgiv[iiv]=encimagestring.charCodeAt(iiv)-255;
    //this.imgiv = imgiv;
    encimagestring = encimagestring.substring(this.ivlength); //delete iv-chars
    let imgbuffer = new Uint8Array(encimagestring.length);
    for(let im=0;im<imgbuffer.length;im++)imgbuffer[im]=encimagestring.charCodeAt(im)-255;
    let decImageString = await this.decrypt(imgbuffer.buffer, imgiv); //decrypt imgbuffer
    this.slidenote.base64images.loadImageString(decImageString); //send it to slidenote

  }
};

slidenoteGuardian.prototype.decryptText = async function(txt){
  //image-part:
  let encimagestring = txt;
  //console.log("load Images" + encimagestring.substring(this.ivlength,30));
  if(encimagestring.length>0){
    //getting iv out of the string
    let imgiv = new Uint8Array(this.ivlength);
    for(let iiv=0;iiv<this.ivlength;iiv++)imgiv[iiv]=encimagestring.charCodeAt(iiv)-255;
    //this.imgiv = imgiv;
    encimagestring = encimagestring.substring(this.ivlength); //delete iv-chars
    let imgbuffer = new Uint8Array(encimagestring.length);
    for(let im=0;im<imgbuffer.length;im++)imgbuffer[im]=encimagestring.charCodeAt(im)-255;
    let decodedString = await this.decrypt(imgbuffer.buffer, imgiv); //decrypt imgbuffer
    return decodedString; //send it to slidenote

  }
};


slidenoteGuardian.prototype.encryptText = async function(txt, pw){
    var imagestring="";
    let encResult = await this.encrypt(txt, pw);
    let imageBuffer = encResult.encbuffer;
    for(let i=0;i<encResult.iv.length;i++)imagestring+=String.fromCharCode(encResult.iv[i]+255);
    let imageutf8 = new Uint8Array(imageBuffer);
    for(let i=0;i<imageutf8.length;i++)imagestring+=String.fromCharCode(imageutf8[i]+255);
    return imagestring;
};

slidenoteGuardian.prototype.loadConfig = async function(destination){
    //new loadnote with JSON
    //loads Config from configarea or from local destination
    //destination is cms or local
    var savedConfigString;
    //if(destination==="cms")savedConfigString = this.cmsConfig.value;
    if(destination==="local")savedConfigString = this.localstorage.getItem('config'); //this means config by slidenote?
    if(slidenote==null){
      setTimeout("slidenoteguardian.loadConfig("+destination+")",2000);
      return;
    }
  var saveobject;
  try {
  saveobject = JSON.parse(savedConfigString);
  }catch{
  //load old config style? naa, just delete it...
    console.log("old config found");
    this.loadConfigOld(destination);
    return;
  }
  //activate and disable Themes depending on config:
  for(var x=0;x<slidenote.extensions.themes.length;x++){
      var act=slidenote.extensions.themes[x];
      if(saveobject.activethemes.indexOf(act.classname)>-1 ||
        act.newFeature){
          act.changeThemeStatus(true);
      }else{
          act.changeThemeStatus(false);
      }
  }
  //choose editor:
  slidenote.choseEditor(saveobject.editorchoice);
  if(saveobject.nightmode){
      var toggler = document.getElementById("nightmodetoggle");
      toggler.classList.remove("off");
      toggler.classList.add("on");
      document.body.classList.add("nightmode");
  }

  //keyboardshortcuts:
  if(slidenote.keyboardshortcuts && saveobject.keyboardmap){
      slidenote.keyboardshortcuts.loadConfigString(saveobject.keyboardmap);
  }

  //load themes-config:
  for(var x=0;x<saveobject.themeConfigs.length;x++){
      var theme = slidenote.extensions.getThemeByName(saveobject.activethemes[x]);
      theme.loadConfigString(saveobject.themeConfigs[x]);
  }
}

slidenoteGuardian.prototype.saveConfig = function(destination){
  //if not initialised slidenoteguardian - return:
  if(!this.initialised)return;
  //saveconfig with JSON instead of manual - slower and more overhead, but more flexible for the future:
  var saveobject = {};
  //var themes = new Array();
  saveobject.activethemes = new Array();
  saveobject.themeConfigs = new Array();
  for(var x=0;x<slidenote.extensions.themes.length;x++){
      var theme = slidenote.extensions.themes[x];
      if(theme.active){
   //      themes.push(theme);
       saveobject.activethemes.push(theme.classname);
       saveobject.themeConfigs.push(theme.saveConfigString('object'));
      }
  }

  saveobject.editorchoice = document.getElementById("editorchoice").value;
  saveobject.nightmode = document.body.classList.contains("nightmode");
  if(slidenote.keyboardshortcuts){
      saveobject.keyboardmap = slidenote.keyboardshortcuts.configString();
  }
  console.log(saveobject);
  var stringToSave = JSON.stringify(saveobject);
    if(destination==="local"){
      this.localstorage.setItem("config",stringToSave);
      console.log("saved to local:"+stringToSave);
    }else if(destination==='cms')return saveobject;
  return stringToSave;

}

slidenoteGuardian.prototype.encrypt = async function(plaintext, pw){
  console.log("encrypt plaintext:"+plaintext.substring(0,20));
    let plainTextUtf8 = new TextEncoder().encode(plaintext); //changing into UTF-8-Array
    let keyguardian = await this.createKey(null, pw);
    if(keyguardian==null)return {encbuffer:null, iv:null};
    //this.iv = keyguardian.iv;
    let encbuffer = await crypto.subtle.encrypt(keyguardian.alg, keyguardian.key, plainTextUtf8);
    return {encbuffer: encbuffer, iv:keyguardian.iv};
    /*the job of encrypt is done - rest of code should be in save*/
}
slidenoteGuardian.prototype.decrypt = async function(buffer, iv){
  let pwtext = "as a matter of principle: everything you write is encrypted before we even store it on our server. please choose a password now. feel free to make one as simple or as complicated as you want. just don't forget it: there is no password recovery!";
  this.password = await this.passwordPrompt(pwtext, "decrypt");
  let keyguardian = await this.createKey(iv);
  console.log("decoding starts");
  //let encstatus = document.getElementById("encstatus");
  try{
    this.plainTextBuffer = await this.crypto.subtle.decrypt(keyguardian.alg, keyguardian.key, buffer);
  } catch(e){
    console.log(e);
    console.log("decryption has failed!");
    this.password = null; //reset password as it has no meaning
    //encstatus.src=slidenote.imagespath+"schloss-rot.png";
    //encstatus.title = "failed to decrypt note - wrong password";
    return "decryption has failed";
  }
  //encstatus.src=slidenote.imagespath+"schloss-gruen.png";
  //encstatus.title = "encryption works as expected - your data is secure";
  console.log("decoding has ended");

  return new TextDecoder().decode(this.plainTextBuffer); //TODO: error-handling
}

slidenoteGuardian.prototype.encryptForExport = async function(plaintext, password){
  console.log("encrypt plaintext:"+plaintext.substring(0,20));
    let plainTextUtf8 = new TextEncoder().encode(plaintext); //changing into UTF-8-Array
    let pw =  password;
    if(pw===null || pw===undefined){
      try{
        pw = await this.passwordPrompt("please type in password for export", "export", true);
      }catch(err){
        return;
      }
    }
    let filename = document.getElementById("username").value;
    let keyguardian = await this.createKey(null,pw); //create new key with no iv
    if(keyguardian==null)return {encbuffer:null, iv:null};
    //this.iv = keyguardian.iv;
    let encbuffer = await crypto.subtle.encrypt(keyguardian.alg, keyguardian.key, plainTextUtf8);
    return {encbuffer: encbuffer, iv:keyguardian.iv, filename:filename};
    /*the job of encryptForExport is done - rest of code should be in saveNote*/
}
slidenoteGuardian.prototype.decryptImport = async function(buffer, iv, filename){
  let pw = "";
  let keyguardian = await this.createKey(iv, pw);
  console.log("decoding starts without pw");
  try{
    this.plainTextBuffer = await this.crypto.subtle.decrypt(keyguardian.alg, keyguardian.key, buffer);
  } catch(e){
    console.log(e);
    console.log("decryption without password has failed!");
    pw = await this.passwordPrompt("please type in password of import", "decrypt",true, filename);
    keyguardian = await this.createKey(iv, pw);
    console.log("decoding starts");
    try{
      this.plainTextBuffer = await this.crypto.subtle.decrypt(keyguardian.alg, keyguardian.key, buffer);
    } catch(e){
      console.log(e);
      console.log("decryption has failed!");
      //this.password = null; //reset password as it has no meaning
      return "decryption has failed";
    }
  }
  console.log("decoding has ended");
  return new TextDecoder().decode(this.plainTextBuffer); //TODO: error-handling
}

slidenoteGuardian.prototype.importFromEncryptedFile = async function(encBufferString, filename){
  let encstring = encBufferString;
  console.log("import of enc-file"+encstring);
  //getting iv of string:
  let iv = new Uint8Array(this.ivlength); //create empty ivarray
  for(let i=0;i<this.ivlength;i++)iv[i]=encBufferString.charCodeAt(i)-255;
  encstring = encBufferString.substring(this.ivlength);//delete iv-chars from string
  let buffer = new Uint8Array(encstring.length);
  for(let i=0;i<encstring.length;i++)buffer[i]=encstring.charCodeAt(i)-255;
  //this.encTextBuffer = buffer.buffer; //changing to ArrayBuffer -- TODO:kann weg oder?
  let decText = await this.decryptImport(buffer.buffer, iv, filename); //decrypt ArrayBuffer
  //console.log("decryption fail:"+this.decText);
  console.log("decryption succesfull?" + decText);
  //error-handling - try again:
  while(decText === "decryption has failed" && confirm("decryption failed. try it again?")){
      decText = await this.decryptImport(buffer.buffer, iv, filename); //decrypt ArrayBuffer anew
  }
  if(decText === "decryption has failed")return; //password wrong, abort the load
  //decText is now the unencrypted MD-Code plus imagestring:
  let MDCodeEnd = decText.indexOf("\n||€€imagepart€€||\n");
  console.log("decryption of import succesfull");
  let decMD;
  if(MDCodeEnd===-1)decMD = decText; else decMD = decText.substring(0,MDCodeEnd);
  console.log(MDCodeEnd + "MDCODEEND");
  console.log("decMD:"+decMD);
  let decImageString;
  if(MDCodeEnd>-1)decImageString = decText.substring(MDCodeEnd+19);//getting rid of ||€€imagepart€€||
  console.log("imagestring"+decImageString);
  this.insertImport(decMD, decImageString);
}

slidenoteGuardian.prototype.getFeedbackImage = async function(){
  return new Promise(function(resolve,reject){
    var upload = document.getElementById('feedback-img-upload');
    var file = upload.files[0];
    var imagetype=/image.*/;
    if(file.type.match(imagetype)){
      var reader = new FileReader();
      reader.onload = function(e){
        resolve(reader.result);
      }
      reader.readAsDataURL(file);
    }
  });
}


slidenoteGuardian.prototype.openFeedback = function(){

  let dialogoptions = {
    type:"confirm",
    title:"create feedback",
    content: document.getElementById('template-feedback-form'),
    confirmbutton: "send feedback",
    closefunction: function(){document.getElementById('templateArea').appendChild(document.getElementById('template-feedback-form'));},
  }
  dialoger.buildDialog(dialogoptions, async function(){
    let radios = document.getElementById('feedback-type-wrapper').querySelectorAll('input[type=radio]');
    let type;
    for(var x=0;x<radios.length;x++)if(radios[x].checked)type=radios[x].value;
    let payload = {
      type: type,
      message: document.getElementById('feedback-body').value ,
      contactByEmail: document.getElementById('feedback-allow-contact').checked,
      //errorlog: ,
    };
    //if user is not logged in add email to payload
    if(!mongoguardian.tokenIsSet())payload.email = document.getElementById('feedback-email').value;

    let imgupload = document.getElementById('feedback-img-upload');
    if(imgupload.files['length']==1){
      payload.base64img = await slidenoteguardian.getFeedbackImage();
    }
    //save the template before it gets deleted:
    document.getElementById('templateArea').appendChild(document.getElementById('template-feedback-form'));

    //we should visualize to user that we are uploading - or is it too fast, as its just a bit of text?
    console.log('create feedback with payload',payload);
    let resp = await mongoguardian.createFeedback(payload);
    if(resp && !resp.error){
      setTimeout(function(){
        dialoger.buildDialog({type:"alert", title:"feedback sent", content:"thank you for your feedback!"},function(){});
      },100);
    }else{
      console.warn('feedback sent went wrong',resp)
      setTimeout(function(){
        dialoger.buildDialog({type:"alert", title:"feedback not sent", content:"something went wrong"},function(){});
      },100);
    }
  });
}

//helper functions - for internal use only:
slidenoteGuardian.prototype.encBufferToString = function(encResult){
  let encTextBuffer = encResult.encbuffer;
  let iv = encResult.iv;
  //getting only displayable chars without control-chars:
  let utf8array = new Uint8Array(encTextBuffer); //changing into utf8-Array
  //console.log(utf8array);
  let utf8string = ""; //starting new string for utf8
  for(let i =0; i<utf8array.length;i++){
    utf8string+=String.fromCharCode(utf8array[i]+255); //fill string with save values
  }
  //converting iv to string with same method:
  let ivstring="";
  for(let i=0; i<iv.length;i++)ivstring+=String.fromCharCode(iv[i]+255);
  return ivstring+utf8string;//save iv in front of code
}

slidenoteGuardian.prototype.insertImport = async function(mdcode, imagestring){
  if(slidenote.textarea.value.length<=1){
    slidenote.textarea.value = mdcode;
  } else{
    var userchoice;
    try{
      userchoice = await this.importPrompt(mdcode, imagestring);
    }catch(err){
      return; //user canceled
    }
    let selend = slidenote.textarea.selectionEnd;
    if(userchoice ==='import'){
      slidenote.textarea.value= slidenote.textarea.value.substring(0,slidenote.textarea.selectionStart)+
         mdcode + slidenote.textarea.value.substring(slidenote.textarea.selectionEnd);
      slidenote.textarea.selectionEnd = selend+mdcode.length;
    }else if(userchoice ==="replace"){
      slidenote.textarea.value=mdcode;
      slidenote.base64images.deleteAllImages(); //empty array
    } else if(userchoice ==="chart"){
      slidenote.textarea.value=slidenote.textarea.value.substring(0,selend)+
                "\n```chart\n"+mdcode+"\n```\n"+slidenote.textarea.value.substring(selend);
    } else if(userchoice ==="table"){
      slidenote.textarea.value=slidenote.textarea.value.substring(0,selend)+
                "\n```table\n"+mdcode+"\n```\n"+slidenote.textarea.value.substring(selend);
    } else{ //user canceled
      //return;
    }

  }
  //reset fileuploadfield to get it anew:
  document.getElementById("importfile").value=null;

  if(imagestring)slidenote.base64images.loadImageString(imagestring);
  slidenote.parseneu();
  slidenote.textarea.focus();

}

slidenoteGuardian.prototype.hash = async function(text){
  let textutf8 = new TextEncoder().encode(text);
  let hash = new Uint8Array(await this.crypto.subtle.digest('SHA-256', textutf8));
  let result = "";
  for(let i=0;i<hash.length;i++)result+=String.fromCharCode(hash[i]+255);
  return result;
}

slidenoteGuardian.prototype.createKey = async function(iv, passw){
  console.log("creating Key with iv"+iv);
  let password = passw;
  if(this.password == null && passw==null){
    //this.password = prompt("please type in your personal password");
    let pwtext = "everything you write is encrypted before we even store it on our server. please choose a password now. feel free to make one as simple or as complicated as you want.";
    try{
      this.password = await this.passwordPrompt(pwtext);
    }catch(err){
      return;
    }
  }
  if(this.password ==null && passw==null)return;
  if(passw==null)password = this.password;
  let pwUtf8 = new TextEncoder().encode(password);
  let passwordHash = await this.crypto.subtle.digest('SHA-256', pwUtf8);
  if(passw==null) this.passwordHash = passwordHash;
  let keyguardian = {};
  if(iv==null){
    keyguardian.iv = crypto.getRandomValues(new Uint8Array(this.ivlength));
  }else{
    keyguardian.iv = iv;
  }
  keyguardian.alg = { name: 'AES-GCM', iv: keyguardian.iv };
  keyguardian.key = await crypto.subtle.importKey('raw', passwordHash, keyguardian.alg, false, ['encrypt', 'decrypt']);
  console.log("key created");
  return keyguardian;
}

slidenoteGuardian.prototype.autoSaveToLocal = function(time){
  //tutorial: dont save:
  if(this.isTutorial)return;
  //TODO: performance-check. if saving costs too much it should save less
  if(slidenote.extensions.allThemesLoaded){
    this.saveNote("local");
    console.log("saved to local:"+time);
  }else{
    console.log("not saved - editor not ready yet");
  }
}

slidenoteGuardian.prototype.autoSaveToCMS = async function(){
  //check if you have to save:
  console.log("autosave to cms started");
  if(this.slidenote.textarea.value.length<1){
    //if empty dont save:
    console.log('autosave aborted, because no text to save');
    setTimeout("slidenoteguardian.autoSaveToCMS()",30000);
    return;
  }
  //console.log("saving to cms...");
  let acthash = await this.hash(this.slidenote.textarea.value); //hash the actual slidenote
  //this.getCMSFields();//getting the fields right:
  let oldhash = this.restObject.notehash;//this.cmsSlidenoteHash.value; //oldhash
  if(oldhash != acthash){
    //acthash diffs from old saved hash in cms so we have to save:
    console.log("autosave oldhash:"+oldhash+"\nnew hash:"+acthash);
    this.saveNote("cms");
  }else console.log("autosave aborted. oldhash === new hash");

  //repeats itself every 30 seconds, 2 minutes
  let autosavetime = 30000;//120000;
  setTimeout("slidenoteguardian.autoSaveToCMS()",autosavetime);
}

slidenoteGuardian.prototype.checkCloudStatus = async function(){
  console.log("checking cloud status");
  var timestrt = new Date();
  let acthash = await this.hash(this.slidenote.textarea.value);
  let oldhash = this.restObject.notehash;
  var savestatus = document.getElementById("savestatus");
  var cloudbutton = document.getElementById("cloud");
  var cloudstatus = document.getElementById("cloudstatus");
  if(acthash != oldhash){
    if(savestatus){
      savestatus.src=slidenote.imagespath+"buttons/cloud.png";
      savestatus.title="not in sync with cloud";
    }
    cloudbutton.className = "status-undefined";
    cloudbutton.title = this.savebuttontitles.default;//"not in sync with cloud";
    cloudstatus.innerText = this.savebuttontitles.default;//"not in sync with cloud";
  }else{
    if(savestatus){
      savestatus.src=slidenote.imagespath+"buttons/cloudsaved.png";
      savestatus.title=this.savebuttontitles.sync;//"in sync with cloud";
    }
    cloudbutton.className = "status-ok";
    cloudbutton.title = this.savebuttontitles.sync;//"in sync with cloud";
    cloudstatus.innerText = this.savebuttontitles.sync;//"in sync with cloud";
  }
  console.log("checking cloud status. in sync:"+(acthash==oldhash));
  var timeneeded = new Date() - timestrt;
  console.log("Timecheck: checking needs "+timeneeded+"MS")
}

slidenoteGuardian.prototype.passwordPrompt = function (text, method, newpassword, dialogtitle){
  /*creates a password-prompt*/
  if(document.getElementById("slidenoteGuardianPasswortPrompt")!=null){
    console.log("second password-prompt");
    return null;
  }
  if(this.password!=null && method==="decrypt" && !newpassword){
    console.log("password allready set");
    return this.password;
  }

	var pwprompt = document.createElement("div"); //the prompt-container
	pwprompt.id= "slidenoteGuardianPasswortPrompt"; //id for css
  var pwpromptbox = document.getElementById("slidenoteGuardianPasswordPromptTemplate");
  if(pwpromptbox===null){
    console.log("no passwordprompt found");
    return;
  }
  pwpromptbox.encmethod = ""+method;
  console.log("template found: using template to comply with password-manager");
  var usernamefield = document.getElementById("username");
  var usernamelabel = document.getElementById("slidenoteGuardianPasswordPromptUsernameLabel");
  var pwinput = document.getElementById("password");
  var pwlabel = document.getElementById("slidenoteGuardianPasswordPromptPasswordLabel");
  var pwcheck = document.getElementById("pwcheckfield");
  var pwchecklabel = document.getElementById("slidenoteGuardianPasswordPromptRetypeLabel");
  var pwtext = document.getElementById("slidenoteGuardianPasswordPromptTemplatePreText");
  var pwokbutton = document.getElementById("slidenoteGuardianPasswordPromptEncrypt");
  var pwnotetitle = document.getElementById("slidenoteGuardianPasswordPromptNotetitle");
  var pwskipbutton = document.getElementById("skippassword");
  var pwgenbutton = document.getElementById("passwordgen");
  var pwaftertext = document.getElementById("slidenoteGuardianPasswortPromptAfterText");
  var commentsenablelable = document.getElementById("slidenoteGuardianPasswordPromptCommentEnableLabel");
  var commentsenable = document.getElementById("slidenoteGuardianPasswordPromptCommentEnable");
  if(commentsenablelable&&commentsenable){
    commentsenablelable.style.display="none";
    commentsenable.style.display="none";
  }
  pwtext.innerText = text;
  //if(this.notetitle==="undefined")this.notetitle=this.localstorage.getItem("title");
  pwinput.value="";
  usernamefield.value = this.notetitle; //+"@slidenotes.io";
  let pwmantitle = "decrypting slidenote \""+this.notetitle+"\"";
  if(dialogtitle)pwmantitle = dialogtitle;
  if(location.href.indexOf('presentation.htm?')>-1)pwmantitle = "decrypting presentation \""+this.notetitle+"\""
  if(pwnotetitle!=null)pwnotetitle.innerText = pwmantitle;
  //standard: skipbutton is hidden
  pwskipbutton.classList.add("hidden");
  if(method==="encrypt" && document.getElementById("slidenotediv").classList.contains("midstate")){
    pwskipbutton.classList.remove("hidden");
  }

  if(method==="decrypt"){
    pwinput.classList.remove("hidden");
    pwlabel.classList.remove("hidden");
    pwaftertext.classList.remove("hidden");
    pwokbutton.innerText="decrypt";
    pwchecklabel.classList.add("hidden");
    pwcheck.classList.add("hidden");//style.display="none";
    pwcheck.value="";
    usernamefield.classList.add("hidden");
    usernamelabel.classList.add("hidden");
    pwgenbutton.classList.add("hidden");
  }else if(method==="export") {
    pwokbutton.innerText="encrypt";
    usernamefield.value=this.notetitle+".slidenote";
    usernamefield.classList.remove("hidden");
    usernamelabel.classList.remove("hidden");
    usernamelabel.innerText = "filename for export";
    //pwchecklabel.style.display="block";
    //pwcheck.style.display="block";
    pwinput.classList.remove("hidden");
    pwaftertext.classList.remove("hidden");
    pwlabel.classList.remove("hidden");
    pwcheck.classList.remove("hidden");
    pwchecklabel.classList.remove("hidden");
    pwnotetitle.innerText = "exporting to filesystem";
    pwgenbutton.classList.remove("hidden");
  }else if(method==="exportCMS"){
    pwnotetitle.innerText="publishing to slidenote.io";
    pwokbutton.innerText="encrypt";
    usernamefield.value=this.notetitle;
    usernamefield.classList.remove("hidden");
    usernamelabel.classList.remove("hidden");
    usernamelabel.innerText = "filename for export";
    //pwchecklabel.style.display="block";
    //pwcheck.style.display="block";
    pwinput.classList.remove("hidden");
    pwaftertext.classList.remove("hidden");
    pwlabel.classList.remove("hidden");
    pwcheck.classList.remove("hidden");
    pwchecklabel.classList.remove("hidden");
    pwgenbutton.classList.remove("hidden");
    if(commentsenablelable&&commentsenable){
      commentsenablelable.style.display=null;
      commentsenable.style.display=null;
    }
  }else if(method==="rename"){
    pwokbutton.innerText = "save";
    usernamefield.value = this.notetitle;
    usernamefield.classList.remove("hidden");
    usernamelabel.innerText = "enter new name";
    pwnotetitle.innerText = "rename";
    //usernamelabel.classList.remove("hidden");
    usernamelabel.classList.add("hidden");
    pwinput.classList.add("hidden");
    pwaftertext.classList.add("hidden");
    pwlabel.classList.add("hidden");
    pwinput.value = this.password;
    pwcheck.classList.add("hidden");
    pwchecklabel.classList.add("hidden");
    pwgenbutton.classList.add("hidden");
  }else if(method==="changepassword"){
    pwokbutton.innerText = "save";
    pwnotetitle.innerText = "change password";
    usernamefield.value = this.notetitle;
    usernamefield.classList.add("hidden");
    pwinput.classList.remove("hidden");
    pwaftertext.classList.remove("hidden");
    pwlabel.classList.remove("hidden");
    pwcheck.classList.remove("hidden");
    pwchecklabel.classList.remove("hidden");
    pwgenbutton.classList.remove("hidden");
  }else {
    if(this.notetitle === "€€€new slidenote€€€"){
      usernamefield.classList.remove("hidden");
      usernamelabel.classList.remove("hidden");
      usernamelabel.innerText = "slidenote filename";
      usernamefield.value="new slidenote";
    }else{
      usernamefield.classList.add("hidden");
      usernamelabel.classList.add("hidden");
    }
    pwokbutton.innerText="encrypt";
    pwchecklabel.style.display="block";
    pwcheck.style.display="block";
    pwnotetitle.innerText="set password for slidenote";
  }

  pwprompt.appendChild(pwpromptbox);
  var dialogoptions = {
    type:"passwordprompt",
    title:pwnotetitle.innerText,
    confirmbutton:"encrypt",
    cancelbutton:"skip",
    content:pwprompt,
    closefunction: function(e){
      var store = document.getElementById("slidenoteGuardianPasswordPromptStore");
      var dialog = document.getElementById("slidenoteGuardianPasswordPromptTemplate");
      store.appendChild(dialog);
    },
  }

  //old stuff:
	document.body.appendChild(pwprompt); //make promptbox visible
	pwinput.focus(); //focus on pwbox to get direct input
  setTimeout("document.getElementById('password').focus()",500); //not the most elegant, but direct focus does not work sometimes - dont know why

	return new Promise(function(resolve, reject) {
	    pwprompt.addEventListener('click', function handleButtonClicks(e) {
	      if ((e.target.tagName !== 'BUTTON' && e.target.parentElement.tagName!='BUTTON') ||
        e.target.id==="passwordgen" ||
        e.target.id==="forgottenPasswordDialogButton" ||
        e.target.id==="skippassword") {
          return;
        }
	      pwprompt.removeEventListener('click', handleButtonClicks); //removes eventhandler on cancel or ok
        if(e.target.id==="dialogclosebutton" ||
        e.target.parentElement.id==="dialogclosebutton"){
          slidenoteguardian.savingtoDestination=undefined;
	        reject(new Error('User canceled')); //return error
	      }
	      if (e.target.id === "slidenoteGuardianPasswordPromptEncrypt") {
          if(pwinput.value===pwcheck.value||(pwcheck.classList.contains("hidden") && pwcheck.value.length===0)){
            let newname = document.getElementById("username").value;
            if(pwpromptbox.encmethod.indexOf("export")==-1 && newname!=slidenoteguardian.notetitle){
              slidenoteguardian.notetitle=newname;
              menumanager.buildSlidenoteList();
              slidenoteguardian.localstorage.setItem("title",newname);
              document.getElementById("slidenotetitle").innerText = newname;
              //slidenoteguardian.saveNote("cms");
            }
            resolve(pwinput.value); //return password
          }
          else {
            return;
            //reject(new Error('Wrong retype'));
          }
	      } else {
          slidenoteguardian.savingtoDestination=undefined;
	        reject(new Error('User canceled')); //return error
	      }
        document.getElementById("slidenoteGuardianPasswordPromptStore").appendChild(pwpromptbox);
		    pwprompt.parentElement.removeChild(pwprompt); //let prompt disapear
	    });
    var handleenter= function handleEnter(e){
      if(pwinput.value===pwcheck.value){
        pwcheck.style.backgroundColor="green";
      }else{
        if(pwcheck.value.length>0 || pwcheck.style.display!="none")pwcheck.style.backgroundColor="red";else pwcheck.style.backgroundColor="white";
      }
  			if(e.keyCode == 13){
          if(pwinput.value===pwcheck.value||(pwcheck.value.length===0 && pwcheck.style.display==="none"))resolve(pwinput.value);
            else {
              return;
            //  alert("password and retype of password differs - please try again");
            //reject(new Error("Wrong retype"));
            }
          document.getElementById("slidenoteGuardianPasswordPromptStore").appendChild(pwpromptbox);
          //if(pwprompt.parentElement === document.body)document.body.removeChild(pwprompt);
          if(pwprompt.parentElement)pwprompt.parentElement.removeChild(pwprompt);
  			}else if(e.keyCode==27){
          document.getElementById("slidenoteGuardianPasswordPromptStore").appendChild(pwpromptbox);
  				if(pwprompt && pwprompt.parentElement)pwprompt.parentElement.removeChild(pwprompt);
          slidenoteguardian.savingtoDestination=undefined;
  				reject(new Error("User cancelled"));
  			}
  		}
		pwinput.addEventListener('keyup',handleenter);
    pwcheck.addEventListener('keyup',handleenter);
	});
}

slidenoteGuardian.prototype.importPrompt = function(mdcode, imagestring){
  var dialogoptions = {
    type:"dialog",
    title:"import md code from file:",
    closebutton:true,
    arrownavleftright:true
  }
  var dialogcontent = document.createElement("div");
  dialogcontent.id="placeholder";
  var mdcodeblock = document.createElement("div"); //md-code-container
  dialogcontent.appendChild(mdcodeblock);
  if(imagestring){
    imageblock = document.createElement("div"); //block for preview-images
    imageblock.classList.add("importfile-image-preview-block");
    imageblocktitle = document.createElement("h2");
    dialogcontent.appendChild(imageblocktitle);
    dialogcontent.appendChild(imageblock);
  }
  //buttons:
  var importbutton = document.createElement("button");
  var cancelbutton = document.createElement("button");
  var replacebutton = document.createElement("button");
  importbutton.innerText = "add to existing code";
  cancelbutton.innerText = "cancel";
  replacebutton.innerText = "replace existing code";
  var buttonwrapper = document.createElement("div");
  buttonwrapper.classList.add("buttonarea");
  buttonwrapper.appendChild(cancelbutton);
  buttonwrapper.appendChild(replacebutton);
  buttonwrapper.appendChild(importbutton);
  dialogcontent.appendChild(buttonwrapper);

  //mdcodeblock.innerText = mdcode;
  var mdcodearr = mdcode.split("\n");
  var mdcodeol = document.createElement("ul");
  for(var x=0;x<mdcodearr.length;x++){
    let li = document.createElement("li");
    li.innerText = mdcodearr[x];
    mdcodeol.appendChild(li);
  }
  mdcodeblock.appendChild(mdcodeol);
  mdcodeblock.id = "slidenoteGuardianCodePreview";


  if(imagestring){
    //old: imagestring is now json, not old-style:
    //var imagepuffer = imagestring.split("<<<");
    //imagepuffer.pop(); //delete last element as it has no meaning
    var imagepuffer = JSON.parse(imagestring);
    imageblocktitle.innerText = "images from slidenote to import: (Total "+imagepuffer.length+" images)";
    var imgul = document.createElement("ul");
    for(let i=0;i<imagepuffer.length;i++){
      let imgdata = imagepuffer[i].base64url;//imagepuffer[i].split(">>>");
      let imgnames = imagepuffer[i].names; //imgdata[0].substring(0,imgdata[0].indexOf("§$§")).split("§€§");
      let imgfilename = imagepuffer[i].filename;//imgdata[0].substring(imgdata[0].indexOf("§$§")+3);
      let li = document.createElement("li");
      //previewimages.push({name:imgdata[0],src:imgdata[1]});
      let imgtitle = document.createElement("div");
      imgtitle.classList.add("imagegallery-name");
      imgtitle.innerText = imgfilename;
      let imgnamediv = document.createElement("div");
      imgnamediv.innerText = imgnames.join(" , ");
      imgnamediv.classList.add("imagegallery-usedslides")
      if(imgnames.length==0){
        imgnamediv.innerText = "unconnected";
        imgnamediv.classList.add("imagegallery-unconnected");
      }
       //+ ": used as <i>![]("+imgnames.join(")</i> and <i>![](")+")</i>";
       //check against xss-attacks:
       let detxss = imgdata.indexOf("\"");
       detxss += imgdata.indexOf("\'");
       detxss += imgdata.indexOf("<");
       if(detxss>-3){
         console.log("possible xss-attack found - aborting import of image");
         continue;
       }
       let b64initstring = imgdata.substring(0,imgdata.indexOf(";base64,"));
       if(b64initstring != "data:image/jpeg" &&
           b64initstring!= "data:image/png" &&
           b64initstring!= "data:image/gif"){
             console.log("no valid base64 image found");
             continue;
       }
      let img = new Image();
      img.src = imgdata;
      li.appendChild(imgtitle);
      li.appendChild(imgnamediv);
      li.appendChild(img);
      imgul.appendChild(li);
    }
    imageblock.appendChild(imgul);
  }
  let nombre=document.getElementById("importfile").files[0];
  if(nombre){
    nombre=nombre.name;
  }else {
    nombre = document.getElementById("importfile").dropfilename;
    if(!nombre)nombre="nothing";else document.getElementById("importfile").dropfilename=null;
  };
  let chartbutton = document.createElement("button");
  let tablebutton = document.createElement("button");
  let insidedatatag = slidenote.parser.CarretOnElement(slidenote.textarea.selectionEnd);
  if(insidedatatag) insidedatatag = (insidedatatag.dataobject!=undefined); else insidedatatag=false;
  if(nombre.substring(nombre.length-3)==="csv" && !insidedatatag){
    //buttons to insert: chart, table:
    chartbutton.innerText="add as new chart";
    tablebutton.innerText = "add as new table";
    buttonwrapper.appendChild(chartbutton);
    buttonwrapper.appendChild(tablebutton);
    buttonwrapper.removeChild(replacebutton);
    //mdcodeblocktitle.innerHTML="Import Data from CSV-File";
    dialogoptions.title = "import data from CSV-file";
    importbutton.innerText = "insert at current carret position";
  }

  //promptwrapper.appendChild(prompt);
  //document.body.appendChild(promptwrapper);
  dialogoptions.content = dialogcontent;
  //make prompt visible
  dialoger.buildDialog(dialogoptions);
  var prompt = document.getElementById("dialogcontainer");
  return new Promise(function(resolve,reject){
    prompt.addEventListener('click', function handleButtonClicks(e){
      if(e.target.tagName!== 'BUTTON'){return;}
      prompt.removeEventListener('click',handleButtonClicks);
      if (e.target === importbutton){
        resolve('import');
      } else if(e.target === replacebutton){
        resolve('replace');
      } else if(e.target === chartbutton){
        resolve('chart');
      } else if(e.target === tablebutton){
        resolve('table');
      } else{
        reject(new Error('User aborted Import'));
      }
      //document.body.removeChild(promptwrapper);
      document.getElementById("dialogcontainer").parentElement.removeChild(document.getElementById("dialogcontainer"));
      document.getElementById("importfile").value="";
    });
  });

}

slidenoteGuardian.prototype.loadDiff = async function(){
  this.initialised = false;
  var cachedText = await this.loadNote("local",true);
  var cmsText = await this.loadNote("cms",true);
  if(cachedText==cmsText){
    //hotfix for bug, dont know why happens:
    this.initialised = true;
    slidenoteguardian.loadNote('cms');
    return;
  }
  //var confirmpage = document.createElement("div");
  //confirmpage.id = "slidenoteguardiandiff";
  var cachedButton = document.createElement("button");
  cachedButton.onclick = function(){
    slidenoteguardian.loadNote("local");
    slidenoteguardian.initialised=true;
    var confirmp = document.getElementById("dialogcontainer");
    confirmp.parentNode.removeChild(confirmp);
  };
  var cmsButton = document.createElement("button");
  cmsButton.onclick = function(){
    slidenoteguardian.loadNote("cms");
    slidenoteguardian.initialised=true;
    var confirmp = document.getElementById("dialogcontainer");
    confirmp.parentNode.removeChild(confirmp);
  };
  cachedButton.innerText = "load cached version";
  cmsButton.innerText = "load version of cloud";
  //var title = document.createElement("h1");
  //title.innerText = "Cached Version differs from Cloud-Status";
  //confirmpage.appendChild(title);
  var dialogcontent = document.createElement("div");
  //dialogcontent.classList.add("dialogcontent");
  dialogcontent.id = "placeholder";
  var pretext = document.createElement("div");
  pretext.innerText = "we found an unsaved version of this note in your local cache. load local cache or cloud?";
  pretext.classList.add("pretext");
  function createList(text){
    var ul = document.createElement("ol");
    var textarr = text.split("\n");
    for(var tx=0;tx<textarr.length;tx++){
      var li = document.createElement("li");
      li.innerText = textarr[tx];
      ul.appendChild(li);
    }
    return ul;
  }
  var cacheContainer = document.createElement("div");
  //cacheContainer.innerText = cachedText;
  var cacheList = createList(cachedText);
  cacheContainer.appendChild(cacheList);
  cacheContainer.classList.add("slidenoteguardian-diff");
  cacheContainer.classList.add("slidenoteguardian-diff-cache");
  var cmsContainer = document.createElement("div");
  cmsContainer.classList.add("slidenoteguardian-diff");
  cmsContainer.classList.add("slidenoteguardian-diff-cms");
  var cmsCList = createList(cmsText);
  cmsContainer.appendChild(cmsCList);
  //cmsContainer.innerText = cmsText;
  dialogcontent.appendChild(pretext);
  dialogcontent.appendChild(cachedButton);
  dialogcontent.appendChild(cmsButton);
  dialogcontent.appendChild(cacheContainer);
  dialogcontent.appendChild(cmsContainer);
  //confirmpage.appendChild(dialogcontent);
  //document.getElementsByTagName("body")[0].appendChild(confirmpage);
  //call dialog:
  var dialogoptions = {
    type:"dialog",
    title: "cached version differs from cloud-status",
    content:dialogcontent,
    cssclass:"slidenoteguardiandiffdialog",
    closebutton:true,
    closefunction: function(){
      console.log("user canceled");
      slidenoteguardian.loadNote("cms");
    }
    //closefunction: if user cancels/Escape load cms
  };
  dialoger.buildDialog(dialogoptions);

}

slidenoteGuardian.prototype.passwordGenerator = function(){
    // put a new password directly into fields, no dialog, title shows password
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!§$%&/()=?+-_#*~;,:.<>|@€ ²³{[]}\"'µ";
    var length = 30;
    var pw = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        pw += charset.charAt(Math.floor(Math.random() * n));
    }
    var rdl = Math.floor(Math.random()*10)+20;
    pw = pw.substring(0,rdl);
    document.getElementById("passwordgen").title = "Generated Password:"+pw;
    document.getElementById("password").value = pw;
    document.getElementById("pwcheckfield").value = pw;
}

slidenoteGuardian.prototype.skipPassword = function(){
  var pw = document.getElementById("password");
  var pwchk = document.getElementById("pwcheckfield");
  if(pw.value!="" || pwchk.value!=""){
    pw.value="";
    pwchk.value="";
    //pw.focus();
    return;
  }
  document.getElementById("slidenoteGuardianPasswordPromptEncrypt").click();
}
slidenoteGuardian.prototype.encryptionHelpDialog = function(){
  dialoger.buildDialog({
    type:'dialog',
    title:'forgotten password',
    cssclass: 'small',
    closebutton:true,
    content:document.getElementById('template-encryption-help-dialog').cloneNode(true),
    multiDialog:true});
}

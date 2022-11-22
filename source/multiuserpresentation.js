var websocketurl = "wss://"+location.hostname+"/ws/";
if(location.hostname=='localhost')websocketurl="ws://"+location.hostname+":3333";
var ws = {server:null};

ws.joinSession = function(roomId){
    this.room = roomId;
    this.init();
    //deactivate controls:
    document.body.classList.add("spectator");
    window.onkeyup = function(e){};
    this.creator = false;
}

ws.createSession = function(){
    this.init();
    this.creator = true;
}

ws.init = async function(){
    if(this.server===null){
        this.server = await new WebSocket(websocketurl);
     }
    this.server.onopen = function(){ws.init2();};
    this.server.onclose = function(){
      console.log('server closed')
      let dialogoptions = {
        title: 'connection to server lost',
        type: 'alert',
        content:'connection to slidenotes.io server lost - maybe internet went down?',
        confirmbutton: 'retry',
        containerClass: 'connection-lost',
        closefunction: function(){
          ws.toggleMultiUserPresentation(false);
          document.getElementById('config-multiusersession').checked = false;
        },
      };
      dialoger.buildDialog(dialogoptions, function(){
        // setTimeout(function(){
          ws.server=null;
          ws.init();
        // },10);
      });
    };
    this.server.onerror = function(e){
      console.log('ws-error',e);
    };
}

ws.init2 = async function(){
        if(!this.room)this.room = await this.createRoomId();//hash(location.search);//hash(location.pathname+slidenoteguardian.password);
        if(this.creator)this.sendMessage(this.room,"createRoom");
        else this.sendMessage(this.room,"joinRoom");

        this.server.onmessage = function incoming(msg){
            let data;
            try{
                data = JSON.parse(msg.data);
            }catch(e){
                console.log(e, msg);
                return;
            };
            // console.log('message recieved',data);
            if(data.action==="syncToSlideNr"){
                slidenoteplayer.gotoPage(data.msg,true);
            }
            if(data.action==="init"){
                ws.id = data.id;
                //peerworker.id = data.id;
            }
            if(data.action==="initCreator"){
                console.log("websocket-session created");
            }
            if(data.action==="userlist"){
                //gets a list with user-ids, including own:
                //for now we only use the length - minus self to show spectators length:
                ws.userlist=data.data;
                //let speclist = document.getElementById("spectatorcount");
                //if(speclist)speclist.innerText = ws.userlist.length-1;
                ws.updateSpectatorCount();
            }
            if(data.action==="sendToAll" && data.options ==="pointerClick"){
              console.log('pointerClick',data.msg);
              pointer.showPointer(data.msg);
            }
            if(data.action==="sendToAll" && data.options ==="videocast"){
              console.log('videoclick',data.msg);
              videocaster.recievePicture(data.msg);
            }
            if(data.action==="sendToAll" && data.options ==="textmarker"){
              console.log('textmarker',data.msg);
              textmarker.markText(data.msg);
            }
            if(data.action==="askCurrentState"){
              console.log('current state',data);
              let mpres = slidenoteguardian.mongopresentation;
              currentState = {
                action:'getCurrentState',
                mongopresentation:{
                  encimages: mpres.encimages,
                  encnote:mpres.encnote,
                  options:mpres.options,
                  title:mpres.title,
                },
                actpage:slidenoteplayer.actpage,
              }
              ws.sendMessage(currentState, 'sendToId',{targetId:data.newUser});
            }

            if(data.action=="sendToId" && data.msg.action==='getCurrentState'){
              console.log(data);
              try {
                slidenoteguardian.mongopresentation = data.msg.mongopresentation;
                slidenoteguardian.encBufferString = data.msg.mongopresentation.encnote;
                slidenoteguardian.notetitle = data.msg.mongopresentation.title;
                slidenoteguardian.options = JSON.parse(data.msg.mongopresentation.options);
              } catch (e) {
                console.warn('could not load options, no valid json');
              }
              slidenoteplayer.actpage=data.msg.actpage;
              if(slidenoteplayer.initialised){
                slidenoteplayer.gotoPage(data.msg.actpage);
              }else{
                slidenoteguardian.init();
              }
            };
            if(data.action=="error" && data.error=="room not created"){
              let dialogoptions = {
                title:"oops, something went wrong",
                content:"the url is not valid. maybe session is not started yet?",
                type: "alert",
                confirmbutton: "try again",
              }
              console.log(ws.room);
              dialoger.buildDialog(dialogoptions, function(){
                if(ws.server){
                  ws.sendMessage(ws.room,"joinRoom");
                }else{
                  ws.joinSession(ws.room);
                }
              });
            }
            /*
            if(data.action==="getUserNames"){
                peerworker.updatePeerConnectionList(data.data);
            }
            if(data.action==="webrtc")peerworker.recieveMessage(data.data);
            */
        }; //end of onmessage
        if(this.userName != undefined && this.userName != null)this.sendMessage(this.userName, "setUserName");

}

ws.sendMessage = function(msg, action, options){
        let data = {msg:msg, room:this.room, action:action, options:options};
        this.server.send(JSON.stringify(data));
}

ws.sendSlideNr = function(){
        if(this.creator===false)return;
        this.sendMessage(slidenoteplayer.actpage, "syncToSlideNr");
}
ws.sendPointer = function(klick){
  if(this.creator===false)return;
  this.sendMessage(klick,"sendToAll", "pointerClick");
}
ws.sendTextmarker = function(transferobj){
  if(this.creator===false)return;
  this.sendMessage(transferobj,"sendToAll", "textmarker");
}

ws.createRoomId = async function(){
  let urlchars = "abcdefghijklmnopqrstuvwxyzABCDEF";
  let prefix = "GHIJKLMNOPQRSTUVWXYZ1234567890_-" + "+=;.:&#";

  let id=location.search.substring(1);
  let textutf8 = new TextEncoder().encode(id);
  //allthough its relatively weak we use SHA1 to diggest smaller url
  let hash = new Uint8Array(await window.crypto.subtle.digest('SHA-1', textutf8));
  var result = "";
  for (let i=0;i<hash.length;i++){
    let a=hash[i];
    if(a>31){
      let d=Math.floor(a/32);
      a=a%32;
      result+=prefix[d];
    }
    result+=urlchars[a];
  }
  return result;
}

//helper functions:
hash = async function(text, url){
  let urlchars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
  let prefix = ";.:&#";
  let textutf8 = new TextEncoder().encode(text);
  let hash = new Uint8Array(await this.crypto.subtle.digest('SHA-256', textutf8));
  console.log('hash:',hash);
  let result = "";
  for(let i=0;i<hash.length;i++){
    if(url){
        let a=hash[i];
        if(a>63){
          let d=Math.floor(a/64);
          a=a%64;
          result+=prefix[d];
        }
        result+=urlchars[a];
    }else
    result+=String.fromCharCode(hash[i]+255);
  }
  // if(url)return btoa(result);

  return result;
}

copylink = function(link, source){
                var text = link;
                var input = document.createElement('input');
                input.setAttribute('value', text);
                document.body.appendChild(input);
                input.select();
                var result = document.execCommand('copy');
                document.body.removeChild(input)
                console.log("copied "+text+" to clipboard:"+result);
                if(source===null||source===undefined)return;
                var oldlinkcopied = document.getElementById("linkcopyalert");
                if(oldlinkcopied)oldlinkcopied.parentElement.removeChild(oldlinkcopied);
                var linkcopied = document.createElement("div");
                var linktext = document.createElement("span");
                linktext.innerText = "link copied";
                //var svgcheck = document.getElementById("cloud-ok");
                linkcopied.innerHTML = '';//svgcheck.innerHTML;
                linkcopied.appendChild(linktext);
                linkcopied.id = "linkcopyalert";
                source.appendChild(linkcopied);
                setTimeout(function(){
                  var oldlinkcopied = document.getElementById("linkcopyalert");
                  if(oldlinkcopied)oldlinkcopied.parentElement.removeChild(oldlinkcopied);
                }, 6000);
}


//showDialog shows the ws-dialog on click on ws-menu-item
//unused at the moment?
ws.showDialog = function(){
    let content = document.createElement("div");
    content.id="placeholder";
    let invitebutton = document.createElement("button");
    invitebutton.id="invitelink";
    invitebutton.onclick = function(){copylink(this.innerHTML,this);};
    let ivlink = location.href;
    if(ivlink.indexOf("#")>-1)ivlink = ivlink.substring(0,ivlink.indexOf("#"));
    ivlink+="?join";
    invitebutton.innerHTML = ivlink;
    content.appendChild(invitebutton);
    content.appendChild( document.createElement("hr"));
    if(ws.server===null){
      //if no websocket-connection yet - start one:
      ws.createSession();
    }
    let spectators = document.createElement("div");
    spectators.id="spectatorcountwrapper";
    let speccount = 0;
    if(this.userlist)speccount=this.userlist.length-1; //dont count yourself
    if(speccount<0)speccount=0; //could happen if userlist is not ready yet
    spectators.innerHTML = 'Spectators: <span id="spectatorcount">'+speccount+'</span>';
    content.appendChild(spectators);
    let dialogoptions ={
        title:"Multiuser-Presentation",
        type:"dialog",
        content:content,
        closebutton:true,
        focuson:invitebutton
    }
    dialoger.buildDialog(dialogoptions);
}
ws.toggleMultiUserPresentation = function(goonline){
  if(ws.server==null && goonline){
    ws.createSession();
  }
  if(ws.server!=null && goonline==false){
    ws.server=null;
    return;
  }
  ws.updateSpectatorCount();
}

ws.updateSpectatorCount = function(){
  let speccount = 0;
  if(this.userlist)speccount=this.userlist.length-1; //dont count yourself
  if(speccount<0)speccount=0; //could happen if userlist is not ready yet
  let spcc = document.querySelector('#spectatorcount');
  if(spcc)spcc.innerText = speccount;
  return speccount;
}



/*pointer*/
/* pointer moved to own file as its now used also in preview
var pointerklick = function(event){
    function validNode(node){
      if(node.classList.contains('ppage'))return node;
      let chain = [];
      let actnode = node;
      while(actnode.parentNode!=document.body &&
        actnode.classList.contains('ppage')==false){ //we dont want to go higher up then ppage
        chain.unshift(actnode);
        actnode=actnode.parentNode;
      }
      let lastValid=0;
      for (var x=0;x<chain.length;x++){
        if(chain[x].offsetParent==undefined)break;
        if(chain[x].clientWidth==0)break;
        lastValid=x;
      }
      console.log('chain:',chain,lastValid);
      return chain[lastValid];
    }
    function buildPath(root, node){
        if(root==node)return [];
        if(!node||!node.parentNode)console.warn('somethings not right in click...node,root:',node,root);
        let returnpath =  buildPath(root, node.parentNode);
        let index = 0;
        for(let x=1;x<node.parentNode.children.length;x++)if(node.parentNode.children[x]==node){
            index=x;
            break;
        }
        //index = Array.from(node.parentNode.children).indexOf(node);
        returnpath.push(index);
        return returnpath;
    }
    //check if selection exists - if so dont point
    if(window.getSelection){
      if(window.getSelection().isCollapsed===false)return;
    }
    let target = validNode(event.target);
    let root = document.getElementById('slidenotepresentation');
    if(root==null)root = document.getElementById('praesentation');
    let path = buildPath(root,target);
    let targetobj = pointer.getPosition(target);
    targetobj.endx = targetobj.x + target.clientWidth;
    targetobj.endy = targetobj.y + target.clientHeight;
    targetobj.width = target.clientWidth;
    targetobj.height = target.clientHeight;
    targetobj.node = target;
    let percX = targetobj.width/100;
    let percY = targetobj.height/100;
    let clickX = event.clientX;
    let clickY = event.clientY;

    let distX = clickX-targetobj.x;
    let distY = clickY-targetobj.y;
    let relativeX = Math.floor(distX/percX);
    let relativeY = Math.floor(distY/percY);

    let klick = {
        path:path,
        //target:targetobj,
        relativeDistanceX:relativeX,
        relativeDistanceY:relativeY
    }
    console.log('pointer makes klick',klick);
    if(ws?.server){
      ws.sendPointer(klick);
    }
    klicks.push(klick);
    pointer.showPointer(klick);
}

var klicks = [];
var pointer = {
  init:function(){
    this.presentation = document.getElementById('slidenotepresentation');
    if(this.presentation==null)this.presentation = document.getElementById('praesentation');
    this.presentation.addEventListener("click",pointerklick);
    this.pointernode = document.getElementById('laserpointer');
    if(!this.pointernode){
      this.pointernode = document.createElement('div');
      this.pointernode.id='laserpointer';
      document.body.appendChild(this.pointernode);
    }
    this.pointernode.onclick = function(){
      //repeat old click
      pointer.showPointer(pointer.lastklick);
    }

  },
  deactivate:function(){
    this.presentation.removeEventListener('click',pointerklick);
    if(this.pointernode)this.pointernode.parentElement.removeChild(this.pointernode);
  },
  // helper function to get an element's exact position
  getPosition: function(el) {
    var xPosition = 0;
    var yPosition = 0;

    while (el) {
      if (el.tagName == "BODY") {
        // deal with browser quirks with body/window/document and page scroll
        var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
        var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

        xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
        yPosition += (el.offsetTop - yScrollPos + el.clientTop);
      } else {
        xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
      }

      el = el.offsetParent;
    }
    return {
      x: xPosition,
      y: yPosition
    };
  },
  showPointer: function(klick){
    if(!this.presentation)this.init();
    this.lastklick = klick;
    let target = this.getElementByPath(klick.path);
    let twidth = target.clientWidth;
    let theight = target.clientHeight;
    let tpercX = twidth/100;
    let tpercY = theight/100;
    let tpos = this.getPosition(target);

    let distX = Math.floor(klick.relativeDistanceX*tpercX);
    let distY = Math.floor(klick.relativeDistanceY*tpercY);
    let posX = tpos.x+distX;
    let posY=tpos.y+distY;
    this.pointernode.style.left = posX+"px";
    this.pointernode.style.top = posY+"px";
    this.pointernode.classList.toggle('active',true);
    console.log('pointer moved to',posX,posY);
    if(this.timeout)clearTimeout(this.timeout);
    this.timeout = setTimeout("pointer.pointernode.classList.toggle('active',false)",3000);
  },
  getElementByPath: function(path){
    let node = this.presentation;
    for(var x=0;x<path.length;x++){
      node = node.children[path[x]];
    }
    return node;
  },

}
//setTimeout("pointer.init()",3000);
*/
/*Text-marker:*/
var textmarker = {
 active:false,
 mouseup: function(e){
   textmarker.getMarkedText();
 },
 init: function(){
    this.root = document.getElementById('slidenotepresentation');
    if(this.root==null)this.root=document.getElementById('praesentation');
    this.active=true;
    this.initOwner();
 },
 initOwner: function(){
   //TODO: check for ownership, e.g. if joined or not...
   this.root.addEventListener('mouseup', this.mouseup);
 },
 deactivate: function(){
   if(this.active==false)return;
   this.active=false;
   this.root.removeEventListener('mouseup',this.mouseup);
 },
 markText: function(transferobj){
    if(this.active==false)this.init();
    console.log('recieved textmarker',transferobj);
    //check for existing selection/clear existing selection:
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
    if(transferobj.deleteSelection)return; //nothing more to do as selection is deleted already
    let startnode = this.getNodeFromPath(this.root, transferobj.startpath);
    let endnode = this.getNodeFromPath(this.root, transferobj.endpath);
    let posinstartnode = transferobj.startpos;
    let posinendnode = transferobj.endpos;
    let range = new Range();
    range.setStart(startnode, posinstartnode);
    range.setEnd(endnode, posinendnode);
    window.getSelection().addRange(range);
  },
  getMarkedText:function(){
    if(this.active==false)return;
    let selection = document.getSelection();
    if(selection.isCollapsed){
        //maybe send a deselect-text?
        let transferobj = {deleteSelection:true};
        if(ws.server){
          console.log('sending textmarker',transferobj);
          ws.sendTextmarker(transferobj);
        }
        return;
    }
    let range = selection.getRangeAt(0);
    let transferobj = {
        startnode:range.startContainer,
        endnode:range.endContainer,
        startpos: range.startOffset,
        endpos: range.endOffset,
    }
    transferobj.startpath = this.buildPath(this.root,transferobj.startnode);
    transferobj.endpath = this.buildPath(this.root,transferobj.endnode);
    if(ws.server){
      console.log('sending textmarker',transferobj)
      ws.sendTextmarker(transferobj);
    }
  },
  buildPath:function(root, node){
    if(root==node)return [];
        let returnpath =  textmarker.buildPath(root, node.parentNode);
        let index = 0;
        for(let x=1;x<node.parentNode.childNodes.length;x++)if(node.parentNode.childNodes[x]==node){
            index=x;
            break;
        }
        returnpath.push(index);
        return returnpath;
  },
  getNodeFromPath: function(root,path){
    let node = root;
    for(let x=0;x<path.length;x++){
        node=node.childNodes[path[x]];
    }
    return node;
  },
}

/*experimental: videocast over websocket*/
var videocaster = {
    ongoingloop: false,
    loopTimeout:null,
    crop: {
      projector:'standard',
      x: 0,
      y: 0,
      width:320,
      height:240,
      resize:true,
      maxInputWidth:640,
    },
    projectors:{
      standard:{
        width:320,
        height:240,
        x:0,
        y:0,
      },
      full:{
        width:640,
        height:480,
        x:0,
        y:0,
      },
      circle:{
        width:200,
        height:200,
        x:60,
        y:20,
      },
      humanoid:{
        width:160,
        height:240,
        x:80,
        y:0,
      }
    },
    role:null,
    msPerFrame:40,
    initSender: async function(){
        if(this.role!=null)return;
        this.videoOutput = document.createElement('canvas');
        // this.videoOutput.style.width=this.crop.width+"px";
        // this.videoOutput.style.height=this.crop.height+"px";
        this.videoOutput.width=this.crop.width;
        this.videoOutput.height=this.crop.height;
        this.videoOutput.id='videoOutput';
        this.videoInput = document.createElement('video');
        this.videoInput.id="inputvideo";
        this.role='sender';
        this.initWrapper();
        await this.captureVideo();
        this.initCropper();
        // this.setProjector('circle');
        // setTimeout(function(){document.querySelector('#video-wrapper #videocast-projector-circle').click()},100);
    },
    initReciever: function(){
      this.videoOutput = document.createElement('img');
      this.videoOutput.id='videoOutput';
      this.role='reciever';
      this.initWrapper();
      if(window.ws && ws.server)ws.sendMessage({newVideoClient:true},"sendToAll", "videocast");
    },
    initWrapper: function(){
      let wrapper = document.createElement('div');
      wrapper.id="video-wrapper";
      wrapper.classList.add(this.role);
      let template = document.getElementById('videocast-wrapper-template');
      if(template)wrapper.innerHTML = template.innerHTML;
      wrapper.appendChild(this.videoOutput);
      if(this.videoInput)wrapper.appendChild(this.videoInput);
      document.body.appendChild(wrapper);
      this.wrapper=wrapper;
    },
    initCropper: function(){
      this.cropper = document.getElementById('videocast-cropper');
      this.cropperpreview = this.wrapper.querySelector('#videocast-cropper-preview');
      this.setProjector('circle');
      this.cropperpreview.onmousedown=function(e){
        console.log(e);
        videocaster.dragbegin(e);
        // e.preventDefault();
      }
      this.cropperpreview.onmousemove=function(e){
        // console.log(e);
        videocaster.drag(e);
        e.preventDefault();
      }
      this.cropperpreview.onmouseup=function(e){
        console.log(e);
        videocaster.dragend(e);
        e.preventDefault();
      }
    },
    calculateCrop: function(maximize) {
      let input = this.videoInput;
      let output = this.videoOutput;
      let inputWidth = input.videoWidth || 640;
      let inputHeight = input.videoHeight || 480;
      let inputFormat = inputWidth/inputHeight;
      let outputWidth = output.width;
      let outputHeight = output.height;
      // let shrinkmultiplier = inputWidth / outputWidth;
      if(maximize || this.wrapper.classList.contains('maximized')){
        inputWidth=640;
      }else{
        inputWidth=320;
      }
      this.crop.width=inputWidth;
      this.crop.height=this.crop.width/inputFormat;

      let diffX = this.crop.width - outputWidth;
      let diffY = this.crop.height - outputHeight;
      if (diffX > 0) this.crop.x = 0 - Math.floor(diffX / 2);
      else this.crop.x = 0;
      if (this.isMirror) this.crop.x *= -1;
      if (diffY > 0) this.crop.y = 0 - Math.floor(diffY / 2);
      else this.crop.y = 0;
    },
    openConfig: function(){
      this.wrapper.classList.toggle('videocast-config-active');
      if(!this.wrapper.classList.contains('videocast-config-active')){
        //use selected config:
        this.setProjector(this.crop.projector);
        this.setManualCrop();
        this.pauseTransmission=false;
        return;
      }
      this.pauseTransmission=true;
      //set maximized and change canvas-size to size without crop:
      // if(!this.wrapper.classList.contains('maximized'))this.maximizeVideo();
      // if(!this.crop.projector)this.setProjector('standard');
      // this.crop.width=640;
      this.calculateCrop(true);
      this.crop.x=0;
      this.crop.y=0;
      this.videoOutput.width=this.crop.width;
      this.videoOutput.height=this.crop.height;
      //get left and top-position of canvas
      this.crop.leftbase=this.videoOutput.offsetLeft;
      this.crop.topbase=this.videoOutput.offsetTop;
      //move cropper over canvas:
      // this.cropper.style.left=this.crop.leftbase+"px";
      // this.cropper.style.top=this.crop.topbase+"px";
      this.dragPreview(this.crop.manualX,this.crop.manualY);
    },
    setProjector: function(projectorname, preview){
      this.cropperpreview.className=projectorname;
      this.crop.projector=projectorname;
      if(!preview){
        this.setProjectorClass();
        this.videoOutput.width=this.projectors[projectorname].width;
        this.videoOutput.height=this.projectors[projectorname].height;
        this.calculateCrop();
        if(window.ws && ws.server)ws.sendMessage({projector:projectorname},"sendToAll", "videocast");
      }else{
        this.crop.multiplierX=this.projectors[projectorname].multiplierX||2;
        this.crop.multiplierY=this.projectors[projectorname].multiplierY||2;
        this.crop.manualX=this.projectors[projectorname].x*this.crop.multiplierX;
        this.crop.manualY=this.projectors[projectorname].y*this.crop.multiplierY;
        this.cropperpreview.style.width=(this.projectors[projectorname].width*this.crop.multiplierX)+"px";
        this.cropperpreview.style.height=(this.projectors[projectorname].height*this.crop.multiplierY)+"px";
        this.cropper.style.left=(this.crop.leftbase+this.projectors[projectorname].x*this.crop.multiplierX)+"px";
        this.cropper.style.top=(this.crop.topbase+this.projectors[projectorname].y*this.crop.multiplierY)+"px";
      }
    },
    setProjectorClass: function(projectorname){
      let projectors = Object.keys(this.projectors);
      for (let x=0;x<projectors.length;x++){
        this.wrapper.classList.toggle(projectors[x],projectors[x]==this.crop.projector);
      }
    },
    setManualCrop: function(){
      if(this.crop.manualX==undefined)return;
      if(this.crop.multiplierX==undefined)this.crop.multiplierX=2;
      if(this.crop.multiplierY==undefined)this.crop.multiplierY=2;
      this.crop.x=Math.floor(this.crop.manualX/this.crop.multiplierX);
      this.crop.y=Math.floor(this.crop.manualY/this.crop.multiplierY);
      if(this.isMirror){
         this.crop.x=320-this.projectors[this.crop.projector].width-this.crop.x;
      }
    },
    dragbegin:function(e){
      this.dragstart = {
        clientX:e.clientX,
        clientY:e.clientY,
        x:this.crop.manualX||0,
        y:this.crop.manualY||0,
      };
    },
    drag:function(e){
      if(this.dragstart==undefined)return;
      let xdif=e.clientX-this.dragstart.clientX;
      let ydif=e.clientY-this.dragstart.clientY;
      let x=this.dragstart.x+xdif;
      let y=this.dragstart.y+ydif;
      if(x<0)x=0;
      if(y<0)y=0;
      if(x+this.cropperpreview.clientWidth>this.videoOutput.width){
        x=this.videoOutput.width-this.cropperpreview.clientWidth;
      }
      if(y+this.cropperpreview.clientHeight>this.videoOutput.height){
        y=this.videoOutput.height-this.cropperpreview.clientHeight;
      }
      this.dragPreview(x,y)
    },
    dragend:function(e){
      this.dragstart=undefined;
    },
    dragPreview: function(x,y){
      this.crop.manualX=x;//-this.crop.leftbase;
      this.crop.manualY=y;//-this.crop.topbase;
      this.cropper.style.left=(this.crop.leftbase+this.crop.manualX)+'px';
      this.cropper.style.top=(this.crop.topbase+this.crop.manualY)+'px';
    },
    maximizeVideo: function(){
      this.maximized = !this.maximized;
      this.wrapper.classList.toggle('maximized',this.maximized);
      if(this.maximized){
        this.maximizedOldProjector=JSON.parse(JSON.stringify(this.crop));
        this.setProjector('full');
      }else{
        this.videoOutput.width=this.projectors[this.maximizedOldProjector.projector].width;
        this.videoOutput.height=this.projectors[this.maximizedOldProjector.projector].height;
        this.setProjector(this.maximizedOldProjector.projector);
        this.crop=this.maximizedOldProjector;

      }
      this.videoToCanvas();
    },
    minimizeVideo: function(){
      this.pauseTransmission= !this.pauseTransmission;
      this.wrapper.classList.toggle('video-off',this.pauseTransmission);
      if(ws && ws.server)ws.sendMessage({videoOff:this.pauseTransmission},"sendToAll","videocast");
    },
    closeSender: function(){
      if(window.ws && ws.server)ws.sendMessage({closeReciever:true},"sendToAll", "videocast");
      this.inputstream.getTracks().forEach(function(track) {
        if (track.readyState == 'live') {
            track.stop();
        }
      });
      clearTimeout(this.loopTimeout);
      this.videoInput.srcObject=null;
      this.videoInput= undefined;
      this.videoOutput = undefined;
      this.role=null;
      document.body.removeChild(this.wrapper);
      this.wrapper=undefined;
    },
    toggleSender: function(){
      if(this.role==null)this.initSender();
      else this.closeSender();
    },
    closeReciever: function(){
      this.videoOutput = undefined;
      this.role=null;
      document.body.removeChild(this.wrapper);
      this.wrapper=undefined;
    },
    captureVideo: function(){
      let video = this.videoInput;
      video.addEventListener('canplay', function() {
        //mirror(); //as we dont want to mirror alway, only if needed
        document.body.classList.add('video-active');
        videocaster.videoToCanvas(false);
      })

      navigator.mediaDevices.getUserMedia({
        video: true
      }).then((stream) => {
        videocaster.videoInput.srcObject = stream;
        videocaster.inputstream = stream;
        videocaster.openConfig();
        document.getElementById('videocast-projector-circle').click();
      });
    },
    videoToCanvas: async function() {
      let activateMirror = this.isMirror;
      let canvas = this.videoOutput;
      this.videoInput.play();
      if (this.ongoingloop) {
        //stop old loop:
        clearTimeout(this.loopTimeout);
        ctx = null;
        //destroy old canvas:
        let newCanvas = document.createElement('canvas');
        newCanvas.id = 'videoOutput';
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        canvas.parentElement.replaceChild(newCanvas, canvas);
        this.videoOutput = newCanvas;
        canvas = this.videoOutput;
        this.ongoingloop = false;
      }
      let video = this.videoInput;
      let output = this.videoOutput;
      this.ctx = canvas.getContext('2d');
      var loop = function() {
        let crop=videocaster.crop;
        videocaster.ctx.drawImage(videocaster.videoInput, 0-crop.x, 0-crop.y,crop.width, crop.height);
        // videocaster.sendPicture(canvas.toDataURL("image/png"));
        let imgdata = videocaster.ctx.getImageData(0,0,crop.width,crop.height);
        // videocaster.sendPicture(imgdata);
        if (videocaster.ongoingloop) videocaster.loopTimeout = setTimeout(loop, videocaster.msPerFrame);
      }
      // if (activateMirror) {
      //   this.ctx.translate(video.videoWidth, 0);
      //   this.ctx.scale(-1, 1);
      // }
      if (!this.ongoingloop) {
        this.ongoingloop = true;
        loop();
        // this.canvasToVideo(activateMirror);
      }
    },
    activateMirror: function(){
      this.isMirror = !this.isMirror;
      if(this.role=='sender')ws.sendMessage({mirror:this.isMirror},"sendToAll", "videocast");
      this.wrapper.classList.toggle('mirror',this.isMirror);
      this.videoToCanvas();
    },
    // activateMirrorCtx: function(){
    //   this.ctx.translate(this.videoInput.videoWidth, 0);
    //   this.ctx.scale(-1, 1);
    // },
    sendPicture: function(base64url){
      //gets image from canvas in b64 and sends it over websocket:
      if(this.pauseTransmission)return;
      let transferobj = {
        base64:base64url
      };
      if(window.ws && ws.server)ws.sendMessage(transferobj,"sendToAll", "videocast");
    },
    recievePicture: function(transferobj){
      if(transferobj.closeReciever){
        this.closeReciever();
        return;
      }
      if(transferobj.newVideoClient){
        if(this.role=='sender')ws.sendMessage({projector:this.crop.projector},"sendToAll", "videocast");
        return;
      }
      if(transferobj.projector){
        this.crop.projector=transferobj.projector;
        this.setProjectorClass(transferobj.projector);
        return;
      }
      if(transferobj.videoOff===false ||transferobj.videoOff ){
        this.wrapper.classList.toggle('video-off',transferobj.videoOff);
        return;
      }
      if(!this.videoOutput && this.role!="sender")this.initReciever();
      this.videoOutput.src=transferobj.base64;
    },
}

/*
for future use: the peerworker, establishes and controls audio and video per webrtc

*/
var peerworker = {
    peerconnections:{},
    iceservers: null,
    id:null
};

peerworker.init = function(){
    //build video-html
    this.slidenoteVideo = document.createElement("video");
    this.slidenoteVideo.id = "slidenoteVideo";
    this.slidenoteVideo.autoplay = true;
    this.guestVideos = document.createElement("div");
    this.guestVideos.id = "guestVideos";

}

peerworker.recieveMessage = function(msg){
    switch(msg.type){
        // Signaling messages: these messages are used to trade WebRTC
       // signaling information during negotiations leading up to a video
      // call.

      case "video-offer":  // Invitation and offer to chat
        handleVideoOfferMsg(msg);
        break;

      case "video-answer":  // Callee has answered our offer
        handleVideoAnswerMsg(msg);
        break;

      case "new-ice-candidate": // A new ICE candidate has been received
        handleNewICECandidateMsg(msg);
        break;

      case "hang-up": // The other peer has hung up the call
        handleHangUpMsg(msg);
        break;

      // Unknown message; output to console for debugging.

      default:
        log_error("Unknown message received:");
        log_error(msg);
    }
}

peerworker.updatePeerConnectionList = function(usernames){
    for(var x=0;x<usernames.length;x++){
        let actid = this.peerconnections[usernames[x].id];
        if(peerconnections[actid]===undefined && actid != this.id){
            peerconnections[actid] = this.createPeerConnection(actid);
        }
    }

}
// direct functions to handle events:
//start negotiation:
function handleNegotiationNeededEvent() {
  var PeerConnection = this;
  PeerConnection.createOffer().then(function(offer) {
    return PeerConnection.setLocalDescription(offer);
  })
  .then(function() {
    ws.sendMessage({
      name: ws.username,
      senderId:ws.id,
      target: PeerConnection.targetUUID,
      type: "video-offer",
      sdp: PeerConnection.localDescription
    },"webrtc");
  })
  .catch(reportError);
}

//recieve video-offer:
function handleVideoOfferMsg(msg){
    var targetUsername = msg.name;
    var targetId = msg.senderId;
    var peerconnection = peerworker.peerconnections[targetId];
    if(peerconnection===undefined)peerconnection = peerworker.createPeerConnection(targetid);
    var desc = new RTCSessionDescription(msg.sdp);
    peerconnection.setRemoteDescription(desc).then(function(){
        return navigator.mediaDevices.getUserMedia({audio:false,video:true});
    }).then(function(stream){
        //handle stream localy, e.g. mirror back to sending user
        peerworker.localStream = stream;
        //peerworker.localStreamVideoTag.srcObject = peerworker.localStream;
        //add stream as track to webrtc-object:
        peerworker.localStream.getTracks().forEach(track => peerconnection.addTrack(track, localStream));
    }).then(function(){
        return peerconnection.createAnswer();
    }).then(function(answer){
        return peerconnection.setLocalDescription(answer);
    }).then(function(){
        var msg = {
            name:ws.username,
            senderId:ws.id,
            target:peerconnection.targetUUID,
            type:"video-answer",
            sdp: peerconnection.localDescription
        };
        ws.sendMessage(msg,"webrtc");
    }).catch(handleGetUserMediaError);
}

//recieve video-answer:
async function handleVideoAnswerMsg(msg) {
  log("*** Call recipient has accepted our call");

  // Configure the remote description, which is the SDP payload
  // in our "video-answer" message.

  var desc = new RTCSessionDescription(msg.sdp);
  await peerworker.peerconnections[msg.senderId].setRemoteDescription(desc).catch(reportError);
}

//exchanging ice-candidates:
//send own ice-candidate:
function handleICECandidateEvent(event){
    if(event.candidate){
        let msg = {
            type:"new-ice-candidate",
            target:this.targetUUID,
            candidate:event.candidate
        };
        ws.sendMessage(msg,"webrtc");
    }
}
//recieve ice-candidate:
function handleNewICECandidateMsg(msg){
    var candidate = new RTCIceCandidate(msg.candidate);
    this.addIceCandidate(candidate).catch(reportError);
}

//recieve video and audio-streams:
function handleTrackEvent(event){
    //add event.streams[0] as srcObject to audio/video object on page
    //adds hangup-button to user-gui
}

//recieve stream-end signal:
function handleRemoveTrackEvent(event){
    //look out for end of tracks:
    //var stream = recievedVideoTag.srcObject;
    //var tracklist = stream.getTracks();
    //if(trackList.length==0)closeVideoCall();
}

function hangUpCall(){
    //closeVideoCall();
    ws.sendMessage({name:ws.userName,senderId:ws.id,type:"hang-up"},"sendToAll");
}


peerworker.createPeerConnection = function (targetid){
    let pc = new RTCPeerConnection(this.iceservers);
  pc.targetUUID = targetid;
  pc.onicecandidate = handleICECandidateEvent;
  pc.ontrack = handleTrackEvent;
  pc.onnegotiationneeded = handleNegotiationNeededEvent;
  pc.onremovetrack = handleRemoveTrackEvent;
  pc.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  pc.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  pc.onsignalingstatechange = handleSignalingStateChangeEvent;

  return pc;
}

function handleGetUserMediaError(e) {
  switch(e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
            "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
  }

  closeVideoCall();
}

/*highly experimental: selfmade-videoencoding (gif-style)*/

var encoder={
  buildCircleArray: function (widthOfSquare){
      let radius=widthOfSquare/2;
      let can = document.createElement('canvas');
      can.width=widthOfSquare;
      can.height=widthOfSquare;
      can.style.position='fixed';
      can.style.top=0;
      can.style.zIndex=99999;
      can.style.border="5px solid red";
      can.id="testcan";
      document.body.appendChild(can);
      let context = can.getContext('2d');
      let centerX = widthOfSquare / 2;
      let centerY = widthOfSquare / 2;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'green';
      context.fill();
    let imgdata = context.getImageData(0,0,widthOfSquare,widthOfSquare);
    let circleArray = [];
    let pixels=imgdata.data;
    let total = 0;
    for(let x=0;x<pixels.length;x+=4){
        //console.log('rgba:',pixels[x],pixels[x+1],pixels[x+2],pixels[x+3]);
        let isInsideCircle=(pixels[x+1]!=0)
        circleArray.push(isInsideCircle)
        if(isInsideCircle)total++;
    }
    document.body.removeChild(can);
    //console.log(circleArray);
    console.log('total inside circle:',total,'saved:',(widthOfSquare*widthOfSquare-total))
    return circleArray;
  },
  init: function(){
    this.circleArray=this.buildCircleArray(200);
    this.bigCircleArray=this.buildCircleArray(400);
  },
  framenr:-1,
  fps:25,
  keyframeAllXSeconds:10,
  lastkeyframe:null,
  encodeFrame: function(imgdata, grayscale, forcekeyframe, reduceColors){
    this.framenr++;
    let sendArray=[]; //should be 8bit-Array or something like this
    let circlex=-1;
    let colors=this.lastColors || {count:{}, map:[]};
    let colordata=[];
    let keyframe=(forcekeyframe || this.framenr%(this.fps*this.keyframeAllXSeconds)==0);
    let circleArray;
    if(this.maximized)circleArray=this.bigCircleArray; else circleArray=this.circleArray;
    // let countvalue=[];
    sendx=0;
    for(let imgx=0;imgx<imgdata.length;imgx+=4){
        circlex++;
        if(circleArray[circlex]){
            if(grayscale){
              let grayvalue = Math.floor((imgdata[imgx]+imgdata[imgx+1]+imgdata[imgx+2])/3);
              sendArray[sendx]=grayvalue;
              sendx++;
            }else{
              sendArray[sendx]=imgdata[imgx];
              sendArray[sendx+1]=imgdata[imgx+1];
              sendArray[sendx+2]=imgdata[imgx+2];
              if(keyframe){
                let cn=imgdata[imgx]+'_'+imgdata[imgx+1]+'_'+imgdata[imgx+2];
              }
              sendx+=3;
            }
        }
    }
    if(keyframe){
        this.lastkeyframe=sendArray;
        this.lastframe=null;
        console.log('keyframe set with length:',sendArray.length);
        return {data:sendArray,keyframe:true, grayscale:grayscale};
    }
    let changedData=[];
    let changedColorData=[];
    let changedx=0;
    let changedPos=[];
    let changedCombined=[];
    colors=this.lastColors || {count:{}, map:[]};
    let newcolors=[];
    let keyf= this.lastframe || this.lastkeyframe;
    if(grayscale){
      for(let x=0;x<sendArray.length;x++){
        let dif=Math.abs(sendArray[x]-this.lastkeyframe[x]);
        if(dif>10){
          changedData.push(sendArray[x]);
          changedPos.push(x);
        }
      }
      console.log('grayscale changedData with length:',changedData.length,'changes:',changedPos.length);
      return {data:changedData,changedPos:changedPos,grayscale:grayscale};
    }else{
      for(let x=0;x<sendArray.length;x+=3){
          if(this.comparePixels(sendArray[x],sendArray[x+1],sendArray[x+2],keyf[x],keyf[x+1],keyf[x+2])==false){
            //pixel has changed:
            changedPos.push(x);
            changedData[changedx]=sendArray[x];
            changedData[changedx+1]=sendArray[x+1];
            changedData[changedx+2]=sendArray[x+2];
            changedx+=3;
          }
        }
        console.log('changedData with length:',changedData.length,'changes:',changedPos.length);
        this.lastframe=sendArray;
        return {data:changedData,changedPos:changedPos, changedCombined:changedCombined, colordata:colordata}
    }
  },

  decodeFrame: function(frame, target){
    if(frame.keyframe){
      if(videocaster.maximized){
        this.lastBigDecodedKeyframe=frame.data;
        this.lastbigdecframe=frame.data;
      }else{
        this.lastDecodedKeyframe=frame.data;
        this.lastdecframe=frame.data;
      }
    }
    let imgdata = []
    let x=0;
    if(!frame.keyframe){
      // imgdata=[];
      //for test-purpose:
      // if(this.lastdecmap&&this.lastColors.map&&this.lastdecmap.length!=this.lastColors.map.length)this.lastdecmap=this.lastColors.map;
      if(frame.grayscale){
        for(let gx=0;gx<frame.changedPos.length;gx++){
          imgdata[frame.changedPos[gx]]=frame.data[gx];
        }
      }else{
        let changepos=0;
        let framedata=frame.data;
        for(x=0;x<frame.changedPos.length;x++){
          let pos=frame.changedPos[x];
          imgdata[pos]=framedata[changepos];
          imgdata[pos+1]=framedata[changepos+1];
          imgdata[pos+2]=framedata[changepos+2];
          changepos+=3;
        }
      }
    }else if(frame.colormap){
      this.lastdecmap=frame.colormap;
    }

    let insertdata;
    let lastframe;
    if(videocaster.maximized){
      insertdata = this.lastBigDecodedInsertData || target.getImageData(0,0,400,400);
      lastframe = this.lastbigdecframe || this.lastBigDecodedKeyframe;
    }else{
      insertdata = this.lastDecodedInsertData || target.getImageData(0,0,200,200);
      lastframe = this.lastdecframe || this.lastDecodedKeyframe;
    }

    let circlex=-1;
    sendx=0;
    let gx=0;
    for(let imgx=0;imgx<insertdata.data.length;imgx+=4){
        circlex++;
        if(this.circleArray[circlex]){
          if(frame.grayscale){
            if(imgdata[gx]==undefined){
              insertdata.data[imgx]=this.lastDecodedKeyframe[gx];
              insertdata.data[imgx+1]=this.lastDecodedKeyframe[gx];
              insertdata.data[imgx+2]=this.lastDecodedKeyframe[gx];
            }else{
              insertdata.data[imgx]=imgdata[gx];
              insertdata.data[imgx+1]=imgdata[gx];
              insertdata.data[imgx+2]=imgdata[gx];
            }
            gx++;
          }else{
            if(imgdata[sendx]==undefined){
              insertdata.data[imgx]=lastframe[sendx];
              insertdata.data[imgx+1]=lastframe[sendx+1];
              insertdata.data[imgx+2]=lastframe[sendx+2];
            }else {
              insertdata.data[imgx]=imgdata[sendx];
              insertdata.data[imgx+1]=imgdata[sendx+1];
              insertdata.data[imgx+2]=imgdata[sendx+2];
              lastframe[sendx]=imgdata[sendx];
              lastframe[sendx+1]=imgdata[sendx+1];
              lastframe[sendx+2]=imgdata[sendx+2];
            }
            insertdata.data[imgx+3]=255;
            sendx+=3;
          }
        }
    }
    // for(let cx=0;cx<frame.changedCombined.length;cx++){
    //   let f=frame.changedCombined[cx];
    //   insertdata[f.pos]=f.r;
    //   insertdata[f.pos+1]=f.g;
    //   insert
    // }
    if(videocaster.maximized){
      if(frame.keyframe)this.lastDecodedInsertData=insertdata;
      this.lastbigdecframe=lastframe;
    }else{
      if(frame.keyframe)this.lastDecodedInsertData=insertdata;
      this.lastdecframe=lastframe;
      if(this.decodeToLastFrame)this.lastframe=lastframe; //why does that better quality? if so maybe we should "decode" on sender to to have this effect 
    }
    // else this.lastDecodedKeyframe=insertdata.data;
    // console.log('insertdata:',insertdata);

    target.putImageData(insertdata,0,0);
  },

  compressPositions: function(positions){
    if(!positions)return;
    let countpositions = new Uint8Array(256);
    let newpositions = new Uint8Array(positions.length);
    for(let p=0;p<positions.length;p++){
        let newpos=positions[p]/3;
        let quotient = Math.floor(newpos/256);
        countpositions[quotient]++;
        newpositions[p]=newpos%256;
    }
    return {count:countpositions,positions:newpositions};
  },
  decompressPositions: function(compressed){
    let realpositions = [];
    let positions = compressed.positions;
    let count = compressed.count;
    let compx=0;
    for(let x=0;x<positions.length;x++){
        while(count[compx]==0 && compx<count.length)compx++;
        realpositions[x]=(positions[x]+(256*compx))*3;
        count[compx]--;
    }
    return realpositions;
  },

  allowedDiff:20,
  comparePixels: function(r,g,b,rr,gg,bb){
    // let rd=Math.abs(r-rr); let gd=Math.abs(g-gg); let bd=Math.abs(b-bb);
    // return (rd<this.allowedDiff && gd<this.allowedDiff &&bd<this.allowedDiff)
    let dif=Math.abs(r-rr+g-gg+b-bb)/3;
    return dif<this.allowedDiff;
  },
  encodeCircle: function(context,grayscale){
    let ctx=context || videocaster.ctx;
    return this.encodeFrame(ctx.getImageData(0,0,200,200).data,grayscale);
  },
  encodeTest:function(maxframes, fps, allowedDiff,hidekeyframes,grayscale){
    if(!this.circleArray)this.init();
    this.framenr=-1;
    if(fps)this.fps=fps;
    if(allowedDiff)this.allowedDiff=allowedDiff;
    var timeouttime = Math.floor(1000/fps);
    var maxFrames=maxframes || 24*30;
    //test circle-encoding for 1 second:
    this.tests=[];
    var tests = this.tests;
    var can=document.getElementById('testcan') || document.createElement("canvas");
    can.width=200
    can.height=200
    can.style.position='fixed';
    can.style.top=0;
    can.style.zIndex=99999;
    can.style.border="5px solid red";
    can.id="testcan";
    var testctx=can.getContext('2d');
    document.body.appendChild(can)
    testfunction = function(){
      if(encoder.maximized && can.width==200){
        can.width=400;
        can.height=400;
      }
      if(can.width=400 && !encoder.maximized){
        can.width=200;
        can.height=200;
      }
      let frame=encoder.encodeCircle(false,grayscale,false,false);
      frame.compressedPositions = encoder.compressPositions(frame.changedPos);
      tests.push(frame);

      if(frame.keyframe && hidekeyframes){
        console.log('hide keyframe');
        testctx.beginPath();
        testctx.arc(100, 100, 100, 0, 2 * Math.PI, false);
        testctx.fillStyle = 'green';
        testctx.fill();
      }else{
        encoder.decodeFrame(frame,testctx);
      }
      if(encoder.framenr<maxFrames)setTimeout(testfunction,timeouttime)
      else {
        let t=0;
        let c=0;
        let col=0;
        let m=0;
        let compressed=0;
        for (let x=0;x<encoder.tests.length;x++){
          t+=encoder.tests[x].data.length;
          if(encoder.tests[x].keyframe)continue;
          c+=encoder.tests[x].changedPos.length;
          if(encoder.tests[x].colordata && encoder.tests[x].colordata.data) col+=encoder.tests[x].colordata.data.length;
          if(encoder.tests[x].colordata && encoder.tests[x].colordata.newcolors)m+=encoder.tests[x].colordata.newcolors.length;
          if(encoder.tests[x].compressedPositions)compressed+=encoder.tests[x].compressedPositions.positions.length+256;
        }
        // let colbiggerone = 0;
        // let colbiggerfive=0;
        // let colbiggertwen=0;
        // let keys=Object.keys(encoder.lastColors.count);
        // for (x=0;x<keys.length;x++){
        //   let n = encoder.lastColors.count[keys[x]];
        //   if(n>1)colbiggerone++;
        //   if(n>5)colbiggerfive++;
        //   if(n>20)colbiggertwen++;
        // }
        console.log("total lengthdata:",t, 'total changedPos-length:',c);
        let kbs=Math.floor((t+c*2)/(maxframes/fps)/100)/10;
        console.log('kb/s changedata+changepos combined:',kbs);
        let kbscomp=Math.floor((t+compressed)/(maxframes/fps)/100)/10;
        console.log('kb/s changedata+changepos compressed:',kbscomp);
        // console.log('total colormaps data-length:',col,'maps:',m);
        // console.log('colormap:',encoder.lastColors.map.length,'biggerone:',colbiggerone,'bigger5',colbiggerfive,'>20',colbiggertwen)
        // console.log("total lengthdata/s:",t, 'total changedPos-length/s:',c);
      }
    }
    testfunction();
  },



}

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

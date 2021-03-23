//mongoguardian - lets slidenoteguardian interact with database
/*

*/
var restpath = '/api/'; //to change on server adecuately

var mongoguardian = {
  token: document.cookie.substring(document.cookie.indexOf('authtoken=')+'authtoken='.length),
  mongonote : null,
  loggedinuser: null,
  nid: document.location.search.substring(location.search.lastIndexOf("=")+1),
  restpath:restpath,
  tokenIsSet: function(){
    if(this.token.length==0 || this.token.length<10){
      return false;
    }
    return true;
  },
  refreshToken: async function(){
    const resp = await this.get_json('/api/user/refresh');
    if(resp.stillvalid)return false;
    if(resp.newtoken){
      this.token = resp.token;
      document.cookie = "authtoken="+resp.token+"; expires=0; path=/";
      console.log('refreshed token & cookie');
      return true;
    }
  },
  tokenTTL: function(){
    try{
      let tokenobj = JSON.parse(atob(this.token.split(".")[1]));
      let timeinseconds = Math.floor(Date.now()/1000);
      let timeleft = tokenobj.ttl - (timeinseconds - tokenobj.iat);
      if(timeleft<0){
        //token is expired
        dloptions = {
          type:"alert",
          content:"your token has been expired - please login a new"
        }
        dialoger.buildDialog(dloptions,function(){
          let req = '?req='+this.nid;
          if(location.search.length==0)req='';
          if(location.hostname!='localhost')location.href = '/user/'+req;
          else location.href = '/user/login.html'+req;
        });
        return false;
      }else if(timeleft<tokenobj.ttl/2){
        console.log("token nearly out of date - refresh token");
        this.refreshToken();
        return true;
      }
    }catch(err){
      console.log(err);
      return false;
    }
    return true;
  },
  initload : async function(){
    //initload is only for slidenotes, not for tutorials
    //only if token is Set, else go to loginpage
    if(!this.tokenIsSet()){
      //user is not logged in - abort and load login-page instead:
      let req = '?req='+this.nid;
      if(location.search.length==0)req='';
      if(location.hostname!='localhost')location.href = '/user/'+req;
      else location.href = '/user/login.html'+req;
      return;
    }
    let refreshedtoken = await this.refreshToken();

    //get username from jwt
    this.loggedinuser = this.parseJwt(this.token);
    this.loadingStarttime = new Date();
    //get note-data
    try{
      let resp = await this.getSlidenote();
      if(resp.error){
        console.log('could not load mongonote');
        if(resp.status===400){
          return "invalid token";
        }
      }else{
        this.mongonote = resp;
        console.log('got slidenote',this.mongonote);
      }
    }catch(err){
      console.log('could not load note',err);
    }
    //if no mongonote is found return false
    //so we can catch a 404
    if(!this.mongonote)return false;
    //get imagelist:
    try{
      this.mongoimages = await this.getEncImages();
    }catch(err){
      console.log('could not load note',err);
    }
    //get list of all notes
    try{
      this.notelist = await this.getSlidenoteList();
    }catch(err){
      console.log('could not load notelist',err);
    }
    //get list of all presentations
    try{
      this.presentationlist = await this.getPresentationsList();
    }catch(err){
      console.log('could not load presentationlist',err);
    }
  },
  initTutorial: async function(){

    //tutorials are loaded with location ?tutorial=tutorialname
    let tutoriallist = await this.get_json('/tutorials/tutoriallist.json');
    let tutorialurl = location.search.substring(location.search.lastIndexOf("=")+1);
    let tutoriallistitem;
    var tutorial;
    var imagestring;
    for(var x=0;x<tutoriallist.length;x++)if(tutoriallist[x].url === tutorialurl){
      tutoriallistitem = tutoriallist[x];
      slidenoteguardian.tutorialNr = x;
      break;
    }
    try{
      let resp = await fetch('/tutorials/'+tutoriallistitem.filename);
      let loadedtutorial = await resp.text();
      let posofimgstring = loadedtutorial.indexOf('\n||€€imagepart€€||\n')
      if(posofimgstring>-1){
        imagestring = loadedtutorial.substring(posofimgstring+'\n||€€imagepart€€||\n'.length);
        tutorial = loadedtutorial.substring(0,posofimgstring);
      }else tutorial = loadedtutorial;
    }catch(err){
      console.warn("could not load tutorial",err);
      return;
    }
    //slidenote.textarea.value = tutorial;
    if(imagestring && imagestring.length>0)slidenote.base64images.loadImageString(imagestring);
    slidenoteguardian.restObject.title = tutoriallistitem.title;
    slidenoteguardian.notetitle = tutoriallistitem.title;
    slidenoteguardian.restObject.encnote = tutorial;
    slidenoteguardian.loadedSlidenotes = tutoriallist;
    menumanager.buildSlidenoteList();

  },
  //create new slidenote:
  createNewSlidenote: async function(){
    let payload = {};
    let url = this.restpath+'notes';
    try{
      let resp = await this.post_json(url, payload);
      console.log(resp);
      return resp;
    }catch(err){
      console.warn(err);
    }
  },
  //get slidenote-data:
  getSlidenote: async function (){
    let url=restpath+"notes/nid/"+this.nid
    console.log("ask for"+url)
    let note = await this.get_json(url);
    console.log('loaded slidenote',note);
    return note;
  },
  //get slidenotelist:
  getSlidenoteList: async function(){
    if(!this.tokenIsSet())return [];
    let url = restpath+'notes/';
    let notelist = await this.get_json(url);
    console.log(notelist);
    return notelist;
  },
  //update Slidenote: expects fields to update including a hash of slidenote
  updateSlidenote: async function(fields){
    if(this.tokenTTL()==false)return;
    let payload = {};
    let allowedFields = ['title','encnote', 'notehash'];
    for(let x=0;x<allowedFields.length;x++){
      let actf = allowedFields[x];
      if(fields[actf]!=undefined)payload[actf]=fields[actf];
    }
    let url = restpath+'notes/nid/'+this.nid;
    try{
      let resp = await this.update_json(url, payload);
      if(resp.err)return resp;
      console.log('updated succesfully');
      for(let x=0;x<allowedFields.length;x++){
        let actf = allowedFields[x];
        if(fields[actf]!=undefined)this.mongonote[actf]=fields[actf];
      }
      return resp;
    }catch(err){
      return err;
    }
  },
  //delete slidenote:
  deleteSlidenote: async function(){
    let url = restpath+'notes/nid/'+this.nid;
    try{
      let resp = await this.delete_json(url);
      console.log(resp);
      //as we deleted this slidenote we could leave the page
      //location.href = '/login/login.html';
      if(location.hostname!='localhost')location.href='/user/';
      //but we do nothing as we want to see the result for now
    }catch(err){
      console.warn(err);
    }
  },

  //create image:
  createEncImage: async function(encimage){
    let payload = {
      encb64:encimage.encb64, //required
      encmeta:encimage.encmeta, //required
      hash:encimage.hash, //required
      encmetahash:encimage.hash //required
    }
    let url = this.restpath+'encimages/nid/'+this.nid;
    let resp = await this.post_json(url,payload);
    console.log(resp);
  },
  updateEncImage: async function(metaobj, hash){
    let url = this.restpath+'encimages/nid/'+this.nid+'-'+hash;
    try{
      let resp = await this.update_json(url, {encmeta:metaobj.encmeta, encmetahash:metaobj.encmetahash});
    }catch(err){
      console.warn(err);
    }
  },
  deleteEncImage: async function(hash){
    let url = this.restpath+"encimages/nid/"+this.nid+"-"+hash;
    let resp = await this.delete_json(url);
    console.log(resp);
  },
  deleteAllEncImagesOfNote: async function(){
    let url = this.restpath+'encimages/allofnid/'+this.nid;
    let resp = await this.delete_json(url);
    return resp;
  },
  getEncImages: async function(){
    let url = this.restpath+'encimages/nid/'+this.nid;
    try{
      let resp = await this.getJsonWithLoadingScreen(url);
      console.log(resp);
      return resp;
    }catch(err){
      console.warn(err);
    }
  },
  //presentations:
  getPresentationsList: async function(){
    let url = this.restpath+'presentation/nid/'+this.nid;
    console.log('get presentationlist');
    try{
      let resp = await this.get_json(url);
      console.log(resp);
      return resp;
    }catch(err){
      console.warn(err);
      return {error:true,err:err};
    }
  },
  createPresentation: async function(payload){
    let url = this.restpath+'presentation/nid/'+this.nid;
    console.log('create presentation for nid:',this.nid);
    try{
      let resp = await this.post_json(url,payload);
      console.log(resp);
      return resp;
    }catch(err){
      console.warn(err);
      return {error:true,err:err};
    }
  },
  deletePresentation: async function(encurl){
    let url = this.restpath+'presentation/url/'+encurl;
    console.log('delete presentation',encurl);
    try{
      let resp = await this.delete_json(url);
      console.log(resp);
      return resp;
    }catch(err){
      console.warn(err);
      return {error:true,err:err};
    }
  },
  createFeedback: async function(payload){
    let url= this.restpath+'feedback';
    if(payload.email)url+='/anonymous';
    payload.nid = this.nid;
    console.log('sending feedback:');
    try{
      let resp = await this.post_json(url,payload);
      return resp;
    }catch(err){
      console.warn(err);
      return {error:true,err:err};
    }
  },
  //helper-functions:
  parseJwt: function (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  },
  post_json: async function(url,payload){
    console.log('post '+url,payload);
    try{
      const resp = await fetch(url,{
        method:'POST',
        headers:{
          'Content-Type' : 'application/json',
          'auth-token': this.token
        },
        body:JSON.stringify(payload)
      });
      console.log(resp.status, resp.responseXML);
      return resp.json();
    }catch(err){
      return {err:err};
    }
  },
  update_json: async function(url,payload){
    console.log('update '+url,payload);
    const resp = await fetch(url,{
      method:'PATCH',
      headers:{
        'Content-Type' : 'application/json',
        'auth-token': this.token
      },
      body:JSON.stringify(payload)
    });
    return resp.json();
  },
  get_json: async function(url){
    console.log('get '+url);
    const resp = await fetch(url,{
      method:'GET',
      headers:{
        'auth-token': this.token
      },

    });
    if(resp.status===404 || resp.status===400){
      resperrors.push(resp);
      return {error:true, status:resp.status};
    }
    return resp.json();
  },
  delete_json: async function(url){
    const resp = await fetch(url,{
      method: 'DELETE',
      headers:{
        'Content-Type' : 'application/json',
        'auth-token': this.token
      },
      //body:JSON.stringify(payload)
    });
    return resp.json();
  },
  getJsonWithLoadingScreen: async function(url){
    return new Promise(function(resolve, reject){
      var oReq = new XMLHttpRequest();
      oReq.addEventListener('load',function(){
        console.log('got response:',this.response);
        var oldcontainerdialog = document.getElementById("dialogcontainer");
        var loadingProgScr = document.getElementById('loadingProgressScreen');
        if(loadingProgScr && oldcontainerdialog)oldcontainerdialog.parentElement.removeChild(oldcontainerdialog);
        if(this.status===200){
          let jsonobj = JSON.parse(this.response);
          resolve(jsonobj);
        }else{
          resolve({error:true, err:this.response});
        }
      });
      oReq.addEventListener('progress',function(evt){
        if(evt.timeStamp<5000)return; //miliseconds to wait before showing progress
        console.log("Download in Progress:" + evt.loaded + "/" + evt.total);
        var ul = Math.floor(evt.loaded / 1024);
        var tt = Math.floor(evt.total / 1024);
        if(tt>0)tt=" / "+tt; else tt="";
        let target = document.getElementById('loadingProgressScreen');
        if(!target){
          target = document.createElement('div');
          target.id = 'loadingProgressScreen';
          dialoger.buildDialog({
              type:'dialog',
              title:'loading Slidenote',
              content:target
          });
        }
        target.innerHTML = "it seems your download is kind of slow<br> or your slidenote kind of big:<br>"+ul+tt+" kB downloaded";
      });
      oReq.open('GET',url);
      oReq.setRequestHeader("CONTENT-TYPE","application/json");
      oReq.setRequestHeader('auth-token', mongoguardian.token);
      //console.log('try to get with token:',this.token);
      oReq.send();
    });
  }
};


let resperrors = [];
var resp = [];
mongotester = async function(){
  mongoguardian.nid = 11;
  await mongoguardian.initload();
  console.log(mongoguardian);
  console.log('create new slidenote');
  const newslidenote = await mongoguardian.createNewSlidenote();
  mongoguardian.nid=newslidenote.nid;
  if(!newslidenote.nid){
    console.log('no nid found');
    return;
  }
  console.log('created slidenote response', newslidenote);
  mongoguardian.nid = newslidenote.nid;
  resp[0] = await mongoguardian.updateSlidenote({title:'new title'});
  resp[1] = await mongoguardian.updateSlidenote({encnote:'new encnote'});
  resp[2] = await mongoguardian.updateSlidenote({title:'changed title', encnote:'changed encnote'});
  resp[3] = await mongoguardian.createEncImage({encb64:'coded image', encmeta:'metadata of img', hash:'the hash1'});
  console.log('created encimage');
  resp[4] = await mongoguardian.createEncImage({encb64:'coded image2', encmeta:'metadata of img', hash:'the hash2'});
  console.log('created encimage');
  resp[5] = await mongoguardian.createEncImage({encb64:'coded image3', encmeta:'metadata of img', hash:'the hash3'});
  console.log('created encimage');
  resp[6] = await mongoguardian.getEncImages();
  resp[7] = await mongoguardian.updateEncImage('new metadata of img', 'the hash1');
  resp[8] = await mongoguardian.updateEncImage('new metadata of img2', 'the hash2');
  resp[9] = await mongoguardian.updateEncImage('new metadata of img3', 'the hash3');
  resp[10] = await mongoguardian.getEncImages();
  resp[11] = await mongoguardian.deleteEncImage('the hash2');
  resp[12] = await mongoguardian.getEncImages();
  resp[13] = await mongoguardian.createPresentation({title:"new presentation", encnote:"encrypted new presentation", options:"enc optionsstring", nid:"10"});
  resp[14] = await mongoguardian.getPresentationsList();
}

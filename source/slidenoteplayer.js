/* slidenoteplayer:
* gets a nearly ready-to-use presentation and gives it a slideshow-effect
*
*
*/

function slidenotePlayer(){
  this.actpage = 0;
  this.presentation;
  this.encpresentation;
  this.decpresentation;
  this.ivlength = 12;
  this.pw;
  this.pages;
  this.controlbuttons = {
    area:null,
    backward:null,
    forward:null,
    firstpage:null,
    lastpage:null,
    gotopage:null,
    pagenumber:null,
    pagenumbertotal:null
  }
  this.comments = {
	container:null,
	list: new Array(),
	perSlide: new Array()
  };
}

var slidenoteplayer = new slidenotePlayer();

slidenoteplayer.init = async function(){
  this.actpage = 0;
  this.presentation = document.getElementById("slidenotepresentation");

  if(this.presentation.classList.contains("encrypted")){
      this.encpresentation = this.presentation.innerHTML;
      this.decpresentation = await this.decryptPresentation();
      this.presentation.innerHTML = this.decpresentation;
  }
  this.pages = this.presentation.getElementsByClassName("ppage");
  this.initButtons();
  this.initKeystrokes();
  this.initCommentfieldCounter();
  //this.initComments();
  this.gotoPage(this.actpage);
  if(ws && ws.server===null && location.search ==="?join"){
    //this is never executed, as ws.server is allready set by now
    ws.joinSession();
  }
  if(location.search.indexOf('?join')>-1){
    //this.goFullScreen(); as expected doesnt work
    dialoger.buildDialog({
      title: 'go fullscreen',
      content: 'do you want to go fullscreen?',
      type: 'confirm',
    },function(){
      slidenoteplayer.goFullScreen('slidenotepresentation');

    });
  }
  this.hideLoadScreen();
  this.commentform = document.getElementById("comment-form");
  //this.commentform.onsubmit = function(){return confirm("wirklich absenden?")};//slidenoteguardian.encryptComment()};
  this.commentblock = document.getElementById("comments");
  this.initComments();
}

slidenoteplayer.initButtons = function(){
  this.controlbuttons.area = document.getElementById("controlarea");
  var cbs = this.controlbuttons.area.getElementsByClassName("controlbutton");
  this.controlbuttons.backward = document.getElementById("controlarea_previous-slide");
  this.controlbuttons.forward = document.getElementById("controlarea_next-slide")
  this.controlbuttons.firstpage = document.getElementById("controlarea_first-slide")
  this.controlbuttons.lastpage = document.getElementById("controlarea_last-slide")
  this.controlbuttons.pagenumber = document.getElementById("controlpagenumber");
  this.controlbuttons.pagenumbertotal = document.getElementById("controlpagenumbertotal");
  this.controlbuttons.commentbutton = document.getElementById("controlcomment");
  this.controlbuttons.commentcount = document.getElementById("controlcommentcount");
  this.controlbuttons.commenttotal = document.getElementById("controlcommenttotal");
  this.options = slidenoteguardian.options;

  /*
  this.controlbuttons.gotopage = document.getElementById("controlgotobutton");
  //add values to gotopage:
  for(var x=1;x<=this.pages.length;x++){
    var opt = document.createElement("option");
    opt.value = x-1;
    opt.innerHTML = "Go to Slide #"+x;
    this.controlbuttons.gotopage.appendChild(opt);
  }
  */
  //add functioncalls to buttons:
  this.controlbuttons.backward.onclick = function(e){slidenoteplayer.lastPage()};
  this.controlbuttons.forward.onclick = function(e){slidenoteplayer.nextPage()};
  this.controlbuttons.firstpage.onclick = function(e){slidenoteplayer.gotoPage(0)};
  this.controlbuttons.lastpage.onclick=function(e){slidenoteplayer.gotoPage(slidenoteplayer.pages.length-1)};
  //this.controlbuttons.gotopage.onchange = function(e){slidenoteplayer.gotoPage(this.value)};

  //this.controlbuttons.pagenumber.innerHTML = "1";
  //this.controlbuttons.pagenumbertotal.innerHTML = this.pages.length;

  this.controlbuttons.commentcount.innerHTML = this.commentCount();
  this.controlbuttons.commenttotal.innerHTML = document.getElementsByClassName("comment").length;
  if(this.options && (this.options.enableComments == true || this.options.enableComments===undefined)){
    this.controlbuttons.commentbutton.onclick = function(e){slidenoteplayer.commentClick(e)};
  }else{
    this.controlbuttons.commentbutton.classList.add('no-comments');
    this.controlbuttons.commentbutton.onclick = function(e){
      let dloptions = {
        type:'alert',
        title:'feedback',
        content:'comments are disabled in this presentation',
        closebutton:true
      }
      dialoger.buildDialog(dloptions,function(){});
    }

  }

  this.formSaveButton = document.getElementById("edit-submit");
  if(!slidenoteguardian.mongopresentation){
    this.commentSaveButton = document.createElement("button");
    this.commentSaveButton.innerText = "Encrypt & Send";
    this.commentSaveButton.onclick = function(){
    document.getElementById("edit-field-pagenr-und-0-value").value=slidenoteplayer.actpage+1;
  	//var test = slidenoteguardian.encryptComment();
  	//if(test)this.formSaveButton.click();
    };
    this.commentSaveButton.classList.add("comment-form");
    document.getElementById("comments").appendChild(this.commentSaveButton);
  }

  this.commentAddCommentButton = document.getElementById("commentAddButton");
  if(this.commentAddCommentButton){
    this.commentAddCommentButton.innerText = "post comment ⌄";
    //this.commentAddCommentButton.id="commentAddButton";
    this.commentAddCommentButton.onclick = function(){
      if(this.innerText==="post comment ⌄"){
        slidenoteplayer.showCommentForm();
        this.innerText="post comment ⌃";
      }else{
        slidenoteplayer.hideCommentForm();
        this.innerText="post comment ⌄";
      }
    }
  }
  this.commentblock = document.getElementById("comments");
  //var commentformtitle = document.querySelector(".title.comment-form");
  //this.commentblock.replaceChild(this.commentAddCommentButton,commentformtitle);
  //this.commentblock.appendChild(this.commentAddCommentButton);
  //this.hideCommentsButton = document.createElement("button");
  //this.hideCommentsButton.innerText = "x";
  //this.hideCommentsButton.classList.add("dialogclosebutton");
  this.hideCommentsButton = document.getElementById("commentCloseButton");
  this.hideCommentsButton.onclick = function(){
    slidenoteplayer.hideCommentBlock();
  }
  /*var cblocktitle = document.createElement("span");
  cblocktitle.innerText="comments";
  cblocktitle.id="commentblocktitle";
  this.commentBlockTitle = cblocktitle;
  var commenttitle = this.commentblock.firstElementChild;
  commenttitle.innerHTML = "";
  commenttitle.appendChild(cblocktitle);
  commenttitle.appendChild(this.hideCommentsButton);
  commenttitle.classList.add("dialogtitle");
  */
  this.commentPreviousSlideButton = document.getElementById("previousCommentSlide");
  this.commentNextSlideButton = document.getElementById("nextCommentSlide");
  this.commentPreviousSlideButton.onclick=function(){slidenoteplayer.goToCommentPage(false)};
  this.commentNextSlideButton.onclick=function(){slidenoteplayer.goToCommentPage(true)};
  this.setCommentFormPagenr();
  this.commentShowAllButton = document.createElement("button");
  this.commentShowAllButton.innerText = "show all";
  this.commentShowAllButton.onclick = function(){slidenoteplayer.showAllComments();};
  //commenttitle.appendChild(this.commentShowAllButton);
}

slidenoteplayer.initKeystrokes = function(){
  this.lastpressednrkey="";
  window.onkeyup = function(event){
    var key=""+event.key;
    console.log(event);
    if(event.target.type==="textarea")return; //dont do anything if user is typing
    if(key==="ArrowRight" || key===" ")slidenoteplayer.nextPage();
    if(key==="ArrowLeft")slidenoteplayer.lastPage();
    if("0123456789".indexOf(key)>-1){
      slidenoteplayer.lastpressednrkey+=key;
    }
    if(key==="Enter" && slidenoteplayer.lastpressednrkey.length>0){
      slidenoteplayer.lastpressednrkey--;
      console.log("lastnrkey:"+slidenoteplayer.lastpressednrkey);
      slidenoteplayer.gotoPage(slidenoteplayer.lastpressednrkey);
      slidenoteplayer.lastpressednrkey="";
    }
    if(key==="f")slidenoteplayer.goFullScreen('slidenotepresentation');
  }
  this.controlbuttons.area.tabIndex=1;
  this.controlbuttons.area.focus();
}

slidenoteplayer.initCommentfieldCounter = function(){
  slidenoteguardian.maximumCommentLength = 160; //overwrites the default max-comment-length
  var cfield = document.getElementById('comment-body');
  var cdisplay = document.getElementById('comment-char-count');
  var charcounter = function(){
    let act = cfield.value.length;
    let max = slidenoteguardian.maximumCommentLength;
    cfield.classList.toggle('char-limit-reached',(act>max));
    cdisplay.innerText = act+"/"+max;
  }
  cfield.addEventListener('click',charcounter);
  cfield.addEventListener('keyup',charcounter);
}

slidenoteplayer.gotoPage = function (pagenumber, dontsend){
  var pn = pagenumber*1;
  var activepages = this.presentation.querySelectorAll(".ppage.active");
  for(var x=activepages.length-1;x>=0;x--)activepages[x].classList.remove("active");
  if(pn<0)pn=0;
  if(pn>=this.pages.length)pn=this.pages.length-1;
  this.pages[pn].classList.add("active");
  this.pages[pn].scrollTop = 0;
  this.actpage = pn;
  pn++;
  console.log(pn +" actpage:" +this.actpage);
  //this.controlbuttons.pagenumber.innerHTML = pn;
  this.controlbuttons.commentcount.innerHTML = this.commentCount(pn);
  if(this.commentblock === undefined)this.commentblock = document.getElementById("comments");
  if(this.commentblock.classList.contains("show"))this.showCommentsOfPage(pn);else this.hideAllComments();
  if(this.commentCount(pn)>0)
    this.controlbuttons.commentbutton.classList.add("hasComments");
    else this.controlbuttons.commentbutton.classList.remove("hasComments");
  this.setCommentFormPagenr();
  window.location.hash="#slide"+(this.actpage+1);
  if(ws && ws.server!=null && dontsend!=true)ws.sendSlideNr();
  this.startGifAnimations(this.pages[pn-1]);
}

slidenoteplayer.startGifAnimations = function(slide){
  slidenote.presentation.startGifAnimations(slide);
}

slidenoteplayer.nextPage = function(){
  this.actpage++;
  if(this.actpage>=this.pages.length)this.actpage = this.pages.length-1;
  this.gotoPage(this.actpage);
}

slidenoteplayer.lastPage = function(){
  this.actpage--;
  if(this.actpage<0)this.actpage=0;
  this.gotoPage(this.actpage);
}

slidenoteplayer.decryptPresentation = async function(){

}
slidenoteplayer.hideLoadScreen = function(){

}

slidenoteplayer.initComments = function(){
  this.comments.container = document.getElementById("comments");
	/*var comments = this.comments;
	comments.list = comments.container.getElementsByClassName("comment");
	for(var x=0;x<comments.list.length;x++){
		var actcom = comments.list[x];
		var cp = actcom.getAttribute('data-pagenr')*1;
		if(comments.perpage[cp]===undefined)comments.perpage[cp]=new Array();
		comments.perpage[cp].push(actcom);
	}
	*/
  this.decryptAllComments();
  this.gotoPage(this.actpage);
  this.setCommentFormPagenr();

}

slidenoteplayer.loadMongoComments = async function(){
  var enccomments = slidenoteguardian.mongopresentation.enccomments;

  var failedcomments = [];
  var template = document.getElementById('')
  for(var x=0;x<enccomments.length;x++){
    let deccommentstring = await slidenoteguardian.decryptText(enccomments[x]);
    try{
      let deccomment = JSON.parse(deccommentstring);
      this.comments.list.push(deccomment);
      if(this.comments.perSlide[deccomment.slidenr]===undefined)this.comments.perSlide[deccomment.slidenr]=new Array();
      this.comments.perSlide[deccomment.slidenr].push(deccomment);
    }catch(err){
      console.warn('could not decrypt comment '+x,err);
      failedcomments.push({enc:enccomments,dec:deccomment,err:err});
    }
  }
  this.controlbuttons.commenttotal.innerText=enccomments.length - failedcomments.length;
  this.writeMongoCommentsHTML();
  //all comments loaded so initialize comments by hiding comment-block:
  slidenoteplayer.hideCommentBlock();
}

slidenoteplayer.writeMongoCommentsHTML = async function(){
  let target = document.getElementById('commentlist');
  if(this.MongoCommentTemplate===undefined)this.MongoCommentTemplate = target.innerHTML;
  let template = this.MongoCommentTemplate;
  let comments = this.comments.list;
  let targetHTML = '';
  for(var x=0;x<comments.length;x++){
    let newcom = template.replace('pagenr', 'pagenr'+comments[x].slidenr);
    targetHTML+=newcom;
  }
  target.innerHTML = targetHTML;
  let commentnodes = target.getElementsByClassName("comment");
  for(var x=0;x<comments.length;x++){
    commentnodes[x].querySelector('.comment-name').innerText = comments[x].name;
    commentnodes[x].querySelector('.comment-body').innerText = comments[x].text;
  }
  slidenoteplayer.gotoPage(this.actpage);
}

slidenoteplayer.decryptAllComments = async function(){
  if(slidenoteguardian.mongopresentation){
    this.loadMongoComments();
    return;
  }
  var clist = document.getElementsByClassName("enccontent");
    var containerlist = document.getElementsByClassName("comment");
	for(var x=0;x<clist.length;x++){
		console.log("decrypting "+clist[x].innerText);
		clist[x].innerText = await slidenoteguardian.decryptText(clist[x].innerText);
		if(clist[x].innerText ==="decryption has failed")containerlist[x].classList.add("failedencryption");
	}
	var remlist = document.getElementsByClassName("failedencryption");
	for(var x=remlist.length-1;x>=0;x--)remlist[x].parentElement.removeChild(remlist[x]);
	this.controlbuttons.commenttotal.innerText=containerlist.length;
  //if(containerlist.length>0)this.controlbuttons.commenttotal.classList.add("show");
  this.parseComments();
}

slidenoteplayer.parseComments = function(){
  var comments = document.getElementsByClassName("comment");
  for(var x=0;x<comments.length;x++){
    let comobj = {
      slidenr:comments[x].getAttribute("data-pagenr"),
      text: comments[x].getElementsByClassName("enccontent")[0].innerText,
      name: comments[x].getElementsByClassName("username")[0].innerText
    }
    this.comments.list.push(comobj);
    if(this.comments.perSlide[comobj.slidenr]===undefined)this.comments.perSlide[comobj.slidenr]=new Array();
    this.comments.perSlide[comobj.slidenr].push(comobj);
  }
}

slidenoteplayer.nextSlideWithComments = function(){
  for(var x=this.actpage+2;x<this.comments.perSlide.length;x++){
    if(this.comments.perSlide[x]!=undefined && this.comments.perSlide[x].length>0){
      return x;
    }
  }
}
slidenoteplayer.previousSlideWithComments = function(){
  for(var x=this.actpage;x>0;x--){
    if(this.comments.perSlide[x]!=undefined && this.comments.perSlide[x].length>0){
      return x;
    }
  }
}
slidenoteplayer.goToCommentPage = function(next){
  var cpnr;
  if(next)cpnr=this.nextSlideWithComments();
  else cpnr=this.previousSlideWithComments();
  if(cpnr!=null){
    cpnr--;
    this.gotoPage(cpnr);
  }
}


slidenoteplayer.commentClick = function(e){
  var cblock = document.getElementById("comments");
  if(cblock.classList.contains("show")){
	this.hideCommentBlock();
  }else if(this.controlbuttons.commentcount.innerHTML!="0"){
    this.showCommentBlock();
	this.showCommentsOfPage(this.actpage+1);
  } else {
	this.showCommentBlock();
	this.hideAllComments();
    this.showCommentForm();
  }
}
slidenoteplayer.showCommentBlock = function(){
	var cblock = document.getElementById("comments");
	cblock.classList.add("show");
  this.setCommentFormPagenr();
}
slidenoteplayer.hideCommentBlock = function(){
	var cblock = document.getElementById("comments");
	cblock.classList.remove("show");
}

slidenoteplayer.showCommentsOfPage = function(pagenr){
	this.hideAllComments();
	var clist = document.getElementsByClassName("pagenr"+pagenr);
	for(var x=0;x<clist.length;x++)clist[x].classList.add("show");
}

slidenoteplayer.showAllComments = function(){
	var clist = document.getElementsByClassName("comment");
	for(var x=0;x<clist.length;x++)clist[x].classList.add("show");
}

slidenoteplayer.hideAllComments = function(){
	var clist = document.getElementsByClassName("comment");
	for(var x=0;x<clist.length;x++)clist[x].classList.remove("show");
}

slidenoteplayer.commentCount = function(pagenr){
	var pn = pagenr;
	if(pn===null)pn=this.actpage+1;
	var clist = document.getElementsByClassName("pagenr"+pn);
	return clist.length;
}

slidenoteplayer.setCommentFormPagenr = function(){
 var pagenrfield = document.getElementById("commentblocktitle");
 pagenrfield.innerText = "comments on slide "+(this.actpage+1);
 let nextB = this.commentNextSlideButton;
 let prevB = this.commentPreviousSlideButton;
 let slideCommentNr = this.previousSlideWithComments();
 if(slideCommentNr){
   prevB.classList.add("active");
 }else{
   prevB.classList.remove("active");
 }
 slideCommentNr = this.nextSlideWithComments();
 if(slideCommentNr){
   nextB.classList.add("active");
 }else{
   nextB.classList.remove("active");
 }
}

slidenoteplayer.showCommentForm = function(){
  var commentform = document.getElementById("comment-form");
  this.setCommentFormPagenr();
  commentform.classList.add("show");
 //var commentbody = document.getElementById("edit-comment-body-und-0-value");
  //var commentformtitle = document.querySelector(".title.comment-form");
  //commentformtitle.classList.add("show");
  if(this.commentSaveButton)this.commentSaveButton.classList.add("show");
}
slidenoteplayer.hideCommentForm = function(){
  var commentform = document.getElementById("comment-form");
  commentform.classList.remove("show");
  this.commentSaveButton.classList.remove("show");
}

slidenoteplayer.goFullScreen = function(targetElementId){
  let target = document.body;
  if(targetElementId)target = document.getElementById(targetElementId);
  if(document.fullscreenElement){
		document.exitFullscreen().then(function(result){
			document.body.classList.remove('fullscreen');
		});
	}else{
		target.requestFullscreen({navigationUI:"hide"}).then(function(result){
			document.body.classList.add('fullscreen');
		}).catch((e)=>{
      console.warn(e);
    });
	}
}

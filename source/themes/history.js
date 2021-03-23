var newtheme = new Theme("history");

//newtheme.backList = new Array();
//newtheme.forwardList = new Array();

newtheme.init = function(){
  this.backList = new Array();
  this.forwardList = new Array();
  //memorise first back-stadium:
/*  this.backList.push({value:slidenote.textarea.value,
  selectionStart : slidenote.textarea.selectionStart,
  selectionEnd : slidenote.textarea.selectionEnd,
  scrollTop : slidenote.textarea.scrollTop});
*/  //initialise buttons:
  this.active = true;
  var backb = document.getElementById("historyBackButton");
  var forwb = document.getElementById("historyForwardButton");

  backb.onclick = function(){slidenote.extensions.getThemeByName("history").goBack()};
  forwb.onclick = function(){slidenote.extensions.getThemeByName("history").goForward()};
  this.backButton = backb;
  this.forwardButton = forwb;
  slidenote.textarea.addEventListener('keyup',function(e){
    let key = e.key;
    if(key.indexOf('Arrow')>-1 || key.indexOf('Page')>-1){
      let h = slidenote.extensions.getThemeByName('history');
      h.lastSelStart = this.selectionStart;
      h.lastSelEnd = this.selectionEnd;
      h.lastScrollTop = this.scrollTop;
    }
  });
  slidenote.textarea.addEventListener('mouseup', function(e){
    let h = slidenote.extensions.getThemeByName('history');
    h.lastSelStart = this.selectionStart;
    h.lastSelEnd = this.selectionEnd;
    h.lastScrollTop = this.scrollTop;
  });
}

newtheme.styleThemeMDCodeEditor = function(){
  //save history:
  console.log("check history");
  var newCode = slidenote.textarea.value;
  var newSelectionStart = slidenote.textarea.selectionStart;
  var newSelectionEnd = slidenote.textarea.selectionEnd;
  var newScrollTop = slidenote.textarea.scrollTop;
  if(this.backList.length===0||
    (this.backList[0] && this.backList[0].value!=newCode)){
    console.log("save history");
    this.backList.unshift({
      value:newCode,
      selectionStart:this.lastSelStart,
      selectionEnd:this.lastSelEnd,
      scrollTop:this.lastScrollTop,
      newSelectionStart:newSelectionStart,
      newSelectionEnd:newSelectionEnd,
      newScrollTop:newScrollTop
    });
    this.lastScrollTop = newScrollTop;
    this.lastSelEnd = newSelectionEnd;
    this.lastSelStart = newSelectionStart;
    this.forwardList = new Array();//on new entry in backList empty forwardList
  }
  if(this.backList.length>100)this.backList.pop();
  if(this.backList.length>1 && this.backButton.classList.contains("disabled"))this.backButton.classList.remove("disabled");
  if(this.forwardList.length>0)this.forwardButton.classList.remove("disabled");else this.forwardButton.classList.add("disabled");
}

newtheme.setTo = function(statusObject, backward, text){
  if(text)slidenote.textarea.value = text;
  else slidenote.textarea.value = statusObject.value;
  if(backward){
    slidenote.textarea.selectionStart = statusObject.selectionStart;
    slidenote.textarea.selectionEnd = statusObject.selectionEnd;
  }else{
    slidenote.textarea.selectionStart = statusObject.newSelectionStart;
    slidenote.textarea.selectionEnd = statusObject.newSelectionEnd;
  }
  console.log('history set to backward:',backward,statusObject);
  slidenote.textarea.scrollTop = statusObject.scrollTop;
  slidenote.textarea.focus();
  slidenote.parseneu();
}

newtheme.goBack = function(){
  if(this.backList.length>1){
    var oldCode = this.backList.shift();
    this.forwardList.unshift(oldCode);
    //this.setTo(this.backList[0]);
    this.setTo(oldCode,true,this.backList[0].value);
    //this.forwardButton.classList.remove("disabled");
    if(this.backList.length===1)this.backButton.classList.add("disabled");
  }
}
newtheme.goForward = function(){
  if(this.forwardList.length>0){
    var oldCode = this.forwardList.shift();
    this.backList.unshift(oldCode);
    //slidenote.textarea.value = this.forwardList.shift();
    this.setTo(oldCode);
    //if(this.forwardList.length===0)this.forwardButton.classList.add("disabled");
  }
}


slidenote.addTheme(newtheme);

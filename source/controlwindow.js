controlWindow = {
  controlWindow: null,
  timer:{
    startDate:null,
    active:true,
    lastDate:null,
    intervallMs: 1000,
    updateTimer: function(){
      if(this.startDate==null)this.startDate=Date.now();
      let totalseconds = Math.floor((Date.now() - this.startDate) / 1000);
      let seconds = totalseconds % 60;
      if(seconds<10)seconds='0'+seconds;
      let minutes = Math.floor(totalseconds / 60);
      let clockdiv = controlWindow.controlWindow.document.getElementById('clock');
      if(clockdiv)clockdiv.innerText = minutes + ':' + seconds;
      if(this.active)setTimeout(function(){controlWindow.timer.updateTimer()},this.intervallMs);
      if(controlWindow.controlWindow.closed){
        document.body.classList.remove('controlwindow-active');
      }
    },
  },
  init: function(){
    window.addEventListener('hashchange',function(){
      controlWindow.onSlideUpdate();
    });
  },
  openWindow: function(){
    let windowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=800,height=800";
    if(this.controlWindow == null || this.controlWindow.closed){
        this.parseNotes();
        this.controlWindow = window.open('controlwindow.htm','presentationWindow',windowFeatures);
        this.timer.startDate = Date.now();
        this.timer.updateTimer();
        document.body.classList.add('controlwindow-active');
        // this.cw.title = this.controlWindow.document.getElementById('title');
        // this.cw.notes = this.controlWindow.document.getElementById('notes');
        // this.cw.clock = this.controlWindow.document.getElementById('clock');
    } else {
        this.controlWindow.focus();
    }
  },
  windowOpened: function(){
    this.controlWindow.onkeyup = this.onKeyUp;
    this.onSlideUpdate();
  },
  closeWindow: function(){
    if(this.controlWindow && !this.controlWindow.closed){
      this.controlWindow.close();
      let inp = document.getElementById("config-multiscreen");
      if(inp)inp.checked=false;
      window.focus();
    }
  },
  onSlideUpdate: function(slidenr){
    if(this.controlWindow==null || this.controlWindow.closed)return;
    let nr = slidenote.presentation.aktpage;
    if(window.slidenoteplayer && slidenoteplayer.actpage!=undefined)nr=slidenoteplayer.actpage;
    nr++; //start with 1, not 0
    if(slidenr!=undefined && slidenr!=null)nr=slidenr;
    let totalnr = slidenote.presentation.pages.length;
    this.controlWindow.document.getElementById('title').innerText = "slide "+nr+"/"+totalnr;
    let notewrapper = this.controlWindow.document.getElementById('notes');
    notewrapper.innerHTML='';
    let newNotes = this.buildNotesForSlide(nr);
    notewrapper.appendChild(newNotes);
  },
  onControlButtonClick: function(button){
    let mainbutton = document.getElementById(button.id);
    if(mainbutton)mainbutton.click();
  },
  onKeyUp: function(e){
    let key = e.key;
    let id='';
    if(key == 'ArrowLeft')id='controlarea_previous-slide';
    if(key == 'ArrowRight')id='controlarea_next-slide';
    if(key == ' ')id='controlarea_next-slide';
    if(key == 'Escape'){
      controlWindow.closeWindow();
      return;
    }
    if(id=='')return;
    let b = document.getElementById(id);
    if(b)b.click();
  },
  parseNotes: function(){
    let notes = [];
    let doublepages = [];
    for (x=0;x<slidenote.parser.map.insertedhtmlelements.length;x++){
      let el=slidenote.parser.map.insertedhtmlelements[x];
      if(el.tag=="comment"){
        let page = slidenote.parser.map.pageAtPosition(el.posinall);
        notes.push({
          content:el.mdcode.substring(2),
          line:el.line,
          page:page,
          slide:page+1,
        });
      }
      //check for double-pages from hidden elements:
      if(el.dataobject && el.dataobject.type=='hidden'){
        doublepages.push(slidenote.parser.map.pageAtPosition(el.posinall));
        }
    }
    //up number of notes after a hidden page
    for (x=0;x<notes.length;x++){
      let upfor=0;
      for(y=0;y<doublepages.length;y++){
        if(doublepages[y]<notes[x].page){
          upfor++;
        }else break;
      }
      notes[x].page+=upfor;
      notes[x].slide+=upfor;
    }
    this.notes = notes;
  },
  buildNotesForSlide: function(slidenr){
    let notes = [];
    for (let x=0;x<this.notes.length;x++){
      if(this.notes[x].slide==slidenr)notes.push(this.notes[x]);
    }
    let list = document.createElement('ul');
    for (x=0;x<notes.length;x++){
      let li = document.createElement('li');
      li.innerText = notes[x].content;
      list.appendChild(li);
    }
    return list;
  }
}

controlWindow.init();

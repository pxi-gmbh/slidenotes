/* hiddenobjects - adds hiddenobjects and bulletpoints to presentationdiv
* syntax: "||hidden|| -  ||hidden||bulletpoints"
*
*/

var newtheme = new Theme("hiddenobjects");

newtheme.helpText = function(dataobject){
  var result = "<h2>Hidden Blocks</h2>"+
          "Content inside ||hidden|| blocks are considered hidden. "+
          "First they are not shown, but after continuing Presentation "+
          "they become visible instead of moving directly to next Slide."+
          "Listcontent inside ||hidden||bullet will be used as Bulletpoints."
  return result;
}
var buttonhtml = '<img src="'+slidenote.imagespath+'buttons/hidden.svg" title="Hidden Element">';
buttonhtml += '<span class="buttonmdcode">+++hidden+++</span>';
buttonhtml += '<span class="buttonmdtext"></span>';
buttonhtml += '<span class="buttonmdcode"></span>';
newtheme.addEditorbutton(buttonhtml, "+++hidden","+++");
slidenote.datatypes.push({type:"hidden", mdcode:true, theme:newtheme});


newtheme.hiddenobjects;
newtheme.afterFinalizeHtml = function(){
  //prepare
  this.hiddenobjects = new Array();
  var datadivs = slidenote.presentationdiv.getElementsByTagName("section");
  for(var datax=slidenote.parser.dataobjects.length-1;datax>=0;datax--){
    if(slidenote.parser.dataobjects[datax].type=="hidden"){
      console.log("found hidden object");

      var hiddendatadiv = datadivs[datax];
      var hiddenpage = hiddendatadiv.parentElement;
      while(!hiddenpage.classList.contains("ppage") && hiddenpage!=document.body){
        hiddenpage = hiddenpage.parentElement;
      }
      console.log("hiddenpage:");
      console.log(hiddenpage);
      var hiddenpagenr;
      for(hiddenpagenr=0;hiddenpagenr<hiddenpage.parentElement.children.length;hiddenpagenr++){
        if(hiddenpage.parentElement.children[hiddenpagenr]==hiddenpage)break;
      }
      var pageexists = false;
      for(var hpn=0;hpn<this.hiddenobjects.length;hpn++){
        if(this.hiddenobjects[hpn].pagenr === hiddenpagenr)pageexists=true;
      }
      var hiddenchilds = new Array();
      for(var hc=0;hc<hiddendatadiv.children.length;hc++)hiddenchilds.push(hiddendatadiv.children[hc]);

      //if(!pageexists)
      this.hiddenobjects.push({
        type:"hidden",
        page:hiddenpage,
        pagenr:hiddenpagenr,
        children:hiddenchilds,
        head:slidenote.parser.dataobjects[datax].head
      });

      //get all subnodes:
      var hiddenchilds = hiddendatadiv.children;
      var parent = hiddendatadiv.parentNode;
      console.log("first hidden child:"+hiddenchilds[0]);
      console.log(hiddenchilds);
      while(hiddenchilds.length>0){
        //add class to child:
        hiddenchilds[0].classList.add("hiddenobject");
        //move elements to parent:
        parent.insertBefore(hiddenchilds[0], hiddendatadiv);
      }
      parent.removeChild(hiddendatadiv); //remove data-tag from html
      slidenote.parser.dataobjects.splice(datax,1);//remove from dataobjects

    }//end of if type=="hidden"
  }//end of for datax

}

newtheme.styleThemeSpecials = function(){
  //does not work here, has to be called before and after
}

newtheme.afterStyleThemeSpecials = function(){
  //generate new pages:
  var hiddenobjects = this.hiddenobjects;
  slidenote.presentation.generatedPages = new Array(); //reset generated Pages
  for(var x=hiddenobjects.length-1;x>=0;x--){
    var actobj = hiddenobjects[x];
    //clone actual div:
    var actclone = actobj.page.cloneNode(true);
    actclone.classList.add("hiddenobjectclone");
    actobj.page.classList.remove("active");
    /*
    var cloneTags = actclone.getElementsByClassName("hiddenobject");
    console.log("page-parent:");
    console.log(actobj.page.parentElement);
    for(var y=cloneTags.length-1;y>=0;y--)cloneTags[y].classList.remove("hiddenobject");
    actobj.page.parentElement.insertBefore(actclone,actobj.page.nextSibling);
    */
    for(var y=0;y<actobj.children.length;y++)actobj.children[y].classList.remove("hiddenobject");
    actobj.page.parentElement.insertBefore(actclone,actobj.page);

    slidenote.presentation.pages.splice(actobj.pagenr,0,actclone);
    slidenote.presentation.generatedPages.push(actobj.pagenr);
  }
}

slidenote.addTheme(newtheme);

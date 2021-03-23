var newtheme = new Theme("imgtourl",1);

newtheme.description = "Converts Images to Data-URLs";
newtheme.active=true;

//ergänze javascript-architektur für verwalten von images:
//grundklasse:
function base64Image(name,base64url,filename){
  //this.name = name;
  this.base64url = base64url;
  //this.id = ???;
  this.names = [];
  if(name){
    if(typeof name==="string")this.names.push(name);
    else this.names = name;
  }
  this.filename = filename;
}
//objekt base64images
slidenote.base64images = {
  base64images : new Array(),
  lastuploadedimage : null,
  preselectedname: null,
  quality: 0.8,
  imagetype: "image/jpeg",
  maxwidth: 1920,//1280, //1920,
  maxheight: 1080,//720, //1080,
  imageByName : function(imagename){  //returns fitting base64-image
    for(var x=0;x<this.base64images.length;x++){
      for(var y=0;y<this.base64images[x].names.length;y++){
        if(this.base64images[x].names[y]===imagename){
          return this.base64images[x];
        }
      }
    }
  },
  imageBySource : function(base64url){
    for(var x=0;x<this.base64images.length;x++){
      if(this.base64images[x].base64url === base64url){
        return this.base64images[x];
      }
    }
  },
  rebuildOldImages: function(){
    this.buildImageGallery();
    this.buildImageSelectionDialog();
    var insertmenu = document.getElementById("insertarea");
    if(insertmenu && insertmenu.style.visibility==="visible")slidenote.presentation.showInsertMenu();
  },
  sizeDialog: function(options){
    var img = options.origimage;
    var filename = options.filename;
    //build content:
    var dialogcontent = document.createElement("div");
    dialogcontent.classList.add("dialogcontent");
    var dialogcontenttitle = document.createElement("div");
    dialogcontenttitle.innerText = "desired image quality";
    dialogcontenttitle.classList.add("imgtourl_dialog_innertitle");
    dialogcontent.appendChild(dialogcontenttitle);
    var previewcontainer = document.createElement("div");
    previewcontainer.classList.add("imageuploadpreview");
    var previewimage = new Image();
    previewimage.src = img.src;
    previewimage.id = "imageuploadoriginalimage";
    previewcontainer.appendChild(previewimage);
    dialogcontent.appendChild(previewcontainer);
    var buttonlist = document.createElement("ul");
    var buttontextlist = [
      {up:"small",down:"(icon)", width:100,height:50},
      {up:"medium",down:"(regular image)",width:400,height:300},
      {up:"large", down:"(background)",width:1024,height:768},
      {up:"original", down:"",width:1920,height:1080}
    ];
    for(var x=0;x<buttontextlist.length;x++){
      var actb = buttontextlist[x];
      var li = document.createElement("li");
      var b = document.createElement("button");
      var upt = document.createElement("div");
      var dt = document.createElement("div");
      upt.innerText = actb.up;
      dt.innerText = actb.down;
      b.appendChild(upt);b.appendChild(dt);
      b.classList.add("resizebutton"+actb.up);
      b.classList.add("resizebutton");
      b.resizevaluewidth = actb.width;
      b.resizevalueheight = actb.height;
      b.name=filename;
      b.onclick = function(){
        var img = new Image();
        img.src = document.getElementById("imageuploadoriginalimage").src;
        var base64url = slidenote.base64images.resizeImage(img,this.resizevaluewidth,this.resizevalueheight);
        slidenote.base64images.addImage(this.name, base64url);
        var fileinput = document.getElementById("fileInput");
        if(fileinput)fileinput.value="";
        var dialog = document.getElementById("dialogcontainer");
        dialog.parentElement.removeChild(dialog);
      }
      li.appendChild(b);
      buttonlist.appendChild(li);
    }
    dialogcontent.appendChild(buttonlist);
    dialogcontent.id="placeholder";

    dialogoptions = {
      type:"dialog",
      title:"add image",
      cssclass:"imgtourlresizedialog",
      content: "previewimage+ullist",
      closebutton:true,
      closebuttontext:"cancel upload",
      closefunction:function(){
          var fileinput = document.getElementById("fileInput");
          if(fileinput)fileinput.value="";
      }
    }
    dialogoptions.content = dialogcontent;
    dialoger.buildDialog(dialogoptions);
  },
  buildImageSelectionDialog: function(){
    var oldfiles = document.getElementById("imageselectionlist");
    if(!oldfiles){
      console.log("no imageuploaddialog found - abort");
      return;
    }
    var newlist = this.buildImageList(false);
    oldfiles.innerHTML = "";
    oldfiles.appendChild(newlist);
  },
  buildImageGallery: function(){
    var imggalleryparent = document.getElementById("imagegallery");
    if(!imggalleryparent){
      console.log("no image-gallery found - aborting");
      return;
    }
    /*imggalleryparent.innerHTML = "";
    var imggallery = document.createElement("div");
    imggallery.classList.add("arrow_box");
    imggallery.id = "imagegallerybox";
    let title = document.createElement("div");
    title.innerText = "image gallery";
    imggallery.appendChild(title);
    let uploadbutton = document.createElement("button");
    uploadbutton.innerHTML = '<img src="images/buttons/plus.svg"><span>add image</span>';
    uploadbutton.classList.add("plusbutton");
    uploadbutton.title="add image to imagegallery";
    */
    let uploadbutton = document.querySelector("#imagegallery .plusbutton");
    uploadbutton.onclick = function(){
      slidenote.base64images.uploadmode="imagegallery";
      document.getElementById("fileInput").value="";
      document.getElementById("fileInput").click();
    };
    //imggallery.appendChild(uploadbutton);
    var imggallery = document.getElementById('imagegallerybox');
    let oldlist = document.querySelector("#imagegallerybox ul");
    if(oldlist)imggallery.removeChild(oldlist);
    let oldempty = document.querySelector("#imagegallerybox .imagegallery-empty");
    if(oldempty)imggallery.removeChild(oldempty);
    var imagelist = this.buildImageList(true);
    imggallery.appendChild(imagelist);

    //imggalleryparent.appendChild(imggallery);
  },
  buildImageList: function(imagegallery){
    var images = this.allImagesByName();
    var imagelist = document.createElement("ul");
    for(var x=0;x<images.length;x++){
      var actimg = images[x];
      var li = document.createElement("li");
      if(imagegallery){
        var delbutton = document.createElement("button");
        delbutton.classList.add("imagegallery-delbutton");
        delbutton.innerHTML = '<img src="images/buttons/minus.svg">';
        if(actimg.unnamed){
          delbutton.delurl = actimg.base64url;
          delbutton.onclick = function(){
            slidenote.base64images.deleteImage(this.delurl);
          }
        }else{
          delbutton.delname = actimg.name;
          delbutton.delurl = actimg.base64url;
          delbutton.onclick = function(){
            var dialogoptions = {
              type:"dialog",
              title:"delete image",
              closebutton:true,
              closebuttontext:"cancel"
            }
            var placeholder = document.createElement("div");
            placeholder.id="placeholder";
            var b1 = document.createElement("button");
            b1.innerText="delete connection to tag";
            b1.delname = this.delname;
            b1.onclick = function(){
              slidenote.base64images.deleteImageByName(this.delname);
              var dialog = document.getElementById("dialogcontainer");
              if(dialog)dialog.parentElement.removeChild(dialog);
            }
            var b2 = document.createElement("button");
            b2.innerText = "delete image from slidenote & image gallery";
            b2.delurl = this.delurl;
            b2.onclick = function(){
              slidenote.base64images.deleteImage(this.delurl);
              var dialog = document.getElementById("dialogcontainer");
              if(dialog)dialog.parentElement.removeChild(dialog);
            }
            var trenner = document.createElement("div");
            trenner.innerText = "or";
            placeholder.appendChild(b1);
            placeholder.appendChild(trenner);
            placeholder.appendChild(b2);
            dialogoptions.content = placeholder;
            dialoger.buildDialog(dialogoptions);
          }
        }
        li.appendChild(delbutton);
      }
        //image-name-div:
      var imgname = document.createElement("div");
        let prespan = document.createElement('span'); let afterspan=document.createElement('span');
        prespan.className="buttonmdcode"; afterspan.className="buttonmdcode";
        prespan.innerText = "![]("; afterspan.innerText=")";
        let namespan = document.createElement('span');
        namespan.innerText = actimg.name;
        imgname.appendChild(prespan);
        imgname.appendChild(namespan);
        imgname.appendChild(afterspan);

      if(actimg.unnamed)imgname.classList.add("imagegallery-unnamed");
      imgname.classList.add("imagegallery-name");
      imgname.title = actimg.name;
      li.appendChild(imgname);
      // go to last/next tag
      //let goto = document.createElement("div");
      //goto.classList.add("imagegallery-goto-wrapper");
      let lastb = document.createElement('button'); lastb.className="imagegallery-goto-last";
      let nextb = document.createElement('button'); nextb.className="imagegallery-goto-next";
      lastb.innerText ='<'; nextb.innerText='>';
      lastb.name=actimg.name; nextb.name=actimg.name;
      lastb.onclick=function(){slidenote.base64images.moveCursorToTag(this.name,this,true)};
      nextb.onclick=function(){slidenote.base64images.moveCursorToTag(this.name,this,false)};
      //goto.appendChild(lastb); goto.appendChild(nextb);

        //used in slides-div
      var usedslides = document.createElement("div");
      usedslides.classList.add("imagegallery-usedslides");
      var tagpositions = this.allPositionsOfTag(actimg.name,true);
      var usedslidestext;
      if(tagpositions.length===0){
        usedslidestext = "not used yet";
        usedslides.classList.add("imagegallery-unconnected");
      }else{
        usedslidestext = "slide ";
        for(var us=0;us<tagpositions.length;us++){
          if(us>0)usedslidestext+=", ";
          usedslidestext+= tagpositions[us].page;
        }
      }
      let usedslidesspan = document.createElement('span');

      usedslidesspan.innerText = usedslidestext;
      usedslides.appendChild(lastb);
      usedslides.appendChild(usedslidesspan);
      usedslides.appendChild(nextb);
      li.appendChild(usedslides);
        //image
      var imgbutton = document.createElement("button");
      imgbutton.classList.add("imagegallery-image");
      imgbutton.name = actimg.name;
      if(imagegallery){
        //if(tagpositions.length>0){
          imgbutton.onclick = function(){
            //slidenote.base64images.moveCursorToTag(this.name,this);
            //check if we are inside an image-tag:
            element = slidenote.parser.CarretOnElement();
            let cstart=slidenote.textarea.selectionStart;
            let cpos=slidenote.textarea.selectionEnd;
            let txt=slidenote.textarea.value;
            if(!element || element.typ!="image"){
              //inserting new image-tag:
              if(slidenote.textarea.selectionEnd!=slidenote.textarea.selectionStart){
                //we have to insert a new image-tag and using selection as alt-text
                txt=txt.substring(0,cstart)+'!['+txt.substring(cstart,cpos)+']('+this.name+')'+txt.substring(cpos);
              }else{
                //just insert to selectionEnd:
                txt=txt.substring(0,cpos)+'![]('+this.name+')'+txt.substring(cpos);
              }
            }else{
              //we are inside an image-tag: change image-name to actual image
              let imgnamepos = element.posinall+element.midpos-element.pos+2;
              let imgnameposend = element.posinall+element.endpos-element.pos;
              txt=txt.substring(0,imgnamepos)+this.name+txt.substring(imgnameposend);
            }
            slidenote.textarea.value=txt;
            slidenote.textarea.selectionStart=cstart+2;
            slidenote.textarea.selectionEnd=cpos+2;
            slidenote.parseneu();
          }
        //}
      }else{
        imgbutton.onclick = function(){
          var imgtag = this.getElementsByTagName("img")[0];
          var img = slidenote.base64images.imageByName(this.name);
          if(!img && imgtag)img = slidenote.base64images.imageBySource(imgtag.src);
          slidenote.base64images.addImage(this.name,img.base64url);
        }
      }
      var imgnode = new Image();
      imgnode.src = actimg.base64url;
      imgbutton.appendChild(imgnode);
      li.appendChild(imgbutton);
      imagelist.appendChild(li);
    }
    if(images.length>0){
      return imagelist;
    }else{
      var emptydiv = document.createElement("div");
      emptydiv.classList.add("imagegallery-empty");
      // emptydiv.innerHTML = "<p>Your image gallery is empty. </p> <p>Press the button above to upload an image into the image gallery.</p> <p>Or type in an image tag in the text input field.</p>";
      // emptydiv.innerHTML = "<p>Your image gallery is empty. </p> <p>Press the “add image” button to upload an image into the image gallery</p>";
      emptydiv.innerHTML = "<p>Your image gallery is empty. </p> <p>Press the “add image” button to upload an image into the image gallery.</p> <p>Or type in an image tag in the text input field.</p>";
      return emptydiv;
    }
  },
  allPositionsOfTag: function(tag, oneperslide){
    var insertedimages = slidenote.parser.map.insertedimages;
    var positions = new Array();
    for(var x=0;x<insertedimages.length;x++){
      if(insertedimages[x].src===tag){
        positions.push({
          name:tag,
          posinall:insertedimages[x].posinall,
          page:slidenote.parser.map.pageAtPosition(insertedimages[x].posinall)
        });
      }
    }
    //only one element per slide?:
    if(oneperslide)for(var x=positions.length-2;x>=0;x--){
      if(positions[x].page===positions[x+1].page)positions.splice(x,1);
    }
    return positions;
  },
  moveCursorToTag: function(tag, button, reversed){
    var positions = this.allPositionsOfTag(tag, false);
    var actcursorpos = slidenote.textarea.selectionEnd;
    var oldcursorpos = actcursorpos;
    var lastpos = actcursorpos;
    for(var x=positions.length-1;x>=0;x--){
      if(positions[x].posinall>oldcursorpos)actcursorpos=positions[x].posinall;
    }
    if(actcursorpos===oldcursorpos){
      //no tag found till end of file, search from the beginning:
      for(var x=0;x<positions.length;x++){
        if(positions[x].posinall<actcursorpos)actcursorpos = positions[x].posinall;
      }
    }
    for(var x=0;x<positions.length;x++){
      if(positions[x].posinall<lastpos)lastpos=positions[x].posinall;
      //if we pass oldcursorpos and lastpos is not smaller than oldcursorpos we look for the last one instead
      if(positions[x].posinall>=oldcursorpos && lastpos>=oldcursorpos)lastpos=positions[x].posinall;
    }
    if(actcursorpos===oldcursorpos){
      // no tag found??
      return;
    }
    if(reversed)actcursorpos=lastpos;
    var imggallery = document.getElementById("imagegallery");
    imggallery.classList.remove("autohidemenu");
    slidenote.textarea.selectionEnd = actcursorpos;
    slidenote.textarea.selectionStart = actcursorpos;
    //slidenote.parser.renderNewCursorInCodeeditor()
    slidenote.parseneu();
    slidenote.textarea.blur();
    slidenote.textarea.focus();

    //  if(button)button.focus();
      var cursor = document.getElementById("carret");
      if(cursor)cursor.classList.add("unfocused");
      imggallery.classList.add("autohidemenu");

  },
  allImagesByName: function(){
    var images = new Array();
    for(var x=0;x<this.base64images.length;x++){
      var actimg = this.base64images[x];
      for(var y=0;y<actimg.names.length;y++){
        images.push({
          name:actimg.names[y],
          base64url:actimg.base64url,
          filename:actimg.filename,
          base64image:actimg,
          unnamed:false
        });
      }
      if(actimg.names.length===0){
        images.push({
          name:"unnamed",
          base64url:actimg.base64url,
          filename:actimg.filename,
          base64image:actimg,
          unnamed:true
        });
      }
    }
    return images;
  },
  addImage: function(name,base64url){
    //check if valid image:
    if(base64url.indexOf("\"")>-1 || base64url.indexOf("<")>-1){
      console.log("illegal character in base64url");
      return;
    }
    let b64initstring = base64url.substring(0,base64url.indexOf(";base64,"));
    if(b64initstring != "data:image/jpeg" &&
        b64initstring!= "data:image/png" &&
        b64initstring!= "data:image/gif"){
          console.log("no valid base64 image found");
    }
    //clean name:
    name = name.replace(/[<\"\'\`]/g,"")

    var activeimage =slidenote.parser.CarretOnElement();
    if(!activeimage||activeimage.typ!="image" || this.uploadmode==="imagegallery")activeimage=false;
    var nombre = name.replace(/[<\"\'\`]/g,"");
    //if(this.preselectedname!=null)nombre=this.preselectedname;
    if(activeimage &&
      activeimage.src &&
      activeimage.src.length>0)nombre = activeimage.src;
    if(activeimage && activeimage.src==''){
      //we should add nombre to textarea
      let inspos = activeimage.posinall+activeimage.endpos - activeimage.pos;
      let ntxt = slidenote.textarea.value;
      ntxt = ntxt.substring(0,inspos)+nombre+ntxt.substring(inspos);
      slidenote.textarea.value = ntxt;
    }
    console.log("add image"+nombre);
    /*
    if(this.imageByName(nombre)!=null) {
      this.imageByName(nombre).base64url = base64url;
    } else {
      this.base64images.push(new base64Image(nombre,base64url)); //adds image to Database
    }*/
    var imgbysrc = this.imageBySource(base64url);
    var imgbyname = this.imageByName(nombre);
    if(imgbysrc && imgbysrc != imgbyname){
      //image found in database, so add name to it:
      imgbysrc.names.push(nombre);
      //delete old connection if exists:
      if(imgbyname)for(var x=0;x<imgbyname.names.length;x++){
        if(imgbyname.names[x]===nombre)imgbyname.names.splice(x,1);
      }
    }else if(!imgbysrc){
      //image not found in database - add new image:
      this.base64images.push(new base64Image(nombre,base64url,name)); //adds image to Database
      //delete old connection if exists:
      if(imgbyname)for(var x=imgbyname.names.length;x>=0;x--){
        if(imgbyname.names[x]===nombre)imgbyname.names.splice(x,1);
      }
    }
    console.log("parseneu forced by base64imageadded");
    slidenote.parseneu();
    setTimeout('slidenoteguardian.saveNote("cms");',500);

    var uploadmode = this.uploadmode;
    if(uploadmode==="imagegallery"){
      //rebuild imagegallery:
      this.buildImageGallery();
      var imggallery = document.getElementById("imagegallery");
      var imggalb = imggallery.getElementsByTagName("button");
      if(imggalb.length>0)imggalb[imggalb.length-1].focus();
    }else{
      if(activeimage){
        //hide imagesblock
        document.getElementById("imagesblock").classList.remove("visible");
        slidenote.textarea.selectionStart = activeimage.posinall - activeimage.pos + activeimage.midpos;
        slidenote.textarea.selectionEnd = slidenote.textarea.selectionStart; //activeimage.posinall + activeimage.mdcode.length - 1;
        slidenote.parseneu();
        slidenote.textarea.focus();
      }else{
        //insert with filename
        this.insertImage(name);
       //console.log("imageinsert nombre name:"+nombre+"-"+name)
      }
    }
    this.uploadmode=undefined;

    this.preselectedname=null; //old stuff - delete in future
    this.rebuildOldImages(); //rebuild old images for further use
    return;
  },
  deleteImage: function(base64url){
    for(var x=this.base64images.length-1;x>=0;x--){
      if(this.base64images[x].base64url===base64url)this.base64images.splice(x,1);
    }
    this.rebuildOldImages();
    slidenote.parseneu();
    setTimeout('slidenoteguardian.saveNote("cms");',500);
  },
  deleteImageByName:function(name){
    for(var x=this.base64images.length-1;x>=0;x--){
      if(this.base64images[x].names.indexOf(name)>-1){
        this.base64images[x].names.splice(this.base64images[x].names.indexOf(name),1);
      }
    }
    this.rebuildOldImages();
    slidenote.parseneu();
    setTimeout('slidenoteguardian.saveNote("cms");',500);
  },
  deleteAllImages: function(){
    this.base64images.length = 0;
    this.rebuildOldImages();
  },
  insertImage: function(name){
    //adds image to md-code
   //console.log("imageinsert name"+name);
    insertbutton('%b64'+name);
    //TODO: "close/hide" the image-selection-div
    document.getElementById("imagesblock").classList.remove("visible");
  },
  lastImage: function(){
    return this.base64images[this.base64images.length-1];
  },
  allImagesAsString: function(){
    let allimages = [];
    for(var x=0;x<this.base64images.length;x++){
      let b=this.base64images[x];
      allimages.push({names:b.names,filename:b.filename,
                base64url:b.base64url});
      //i do this to avoid including hash & encrypted image
    }
    return JSON.stringify(allimages);
  },
  loadImageString: function(jsonstring){
    let loadimages;
    try{
      loadimages = JSON.parse(jsonstring);
    } catch(e){
      console.log("failed to load imagestring:"+jsonstring);
      return; //something went wrong
    }
    //if(!loadimages.length)return; //something went wrong
    for(var x=0;x<loadimages.length;x++){
        let loadi = loadimages[x];
        let existingimage = this.imageBySource(loadi.base64url);
        if(!existingimage){ //image does not exist yet
          this.base64images.push(new base64Image(loadi.names,loadi.base64url,loadi.filename));
        }else{ //image is in database, put name to it:
          for(var n=0;n<loadi.names.length;n++){
            if(this.imageByName(loadi.names[n])===null){
              existingimage.names.push(loadi.names[n]);
            }
          }
        }
    }
    this.rebuildOldImages();
  },
  allImagesAsStringold: function(){
    let imagestring = "";
    for(let x=0;x<this.base64images.length;x++){
      imagestring+=this.base64images[x].names.join("§€§")+
                  "§$§"+this.base64images[x].filename+
                  '>>>'+this.base64images[x].base64url+'<<<';
    }
    return imagestring;
  },
  loadImageStringold: function(imagestring){
    let aktpos=0;
    let imgstring = imagestring;
    while(imgstring.indexOf('>>>')>0){
      let aktimg = imgstring.substring(0,imgstring.indexOf('<<<'));
      //check if imagename is yet in database - if so replace image-data:
      let aktimgmeta = aktimg.substring(0,aktimg.indexOf(">>>"));
      let aktimgbase64 = aktimg.substring(aktimgmeta.length+3);
      let aktimgnames = aktimgmeta.substring(0,aktimgmeta.indexOf("§$§")).split("§€§");
      let aktimgfilename = aktimgmeta.substring(aktimgmeta.indexOf("§$§")+3);
      let existingimage = this.imageBySource(aktimgbase64);
      if(!existingimage){
        //only load image if not existend in database:
        this.base64images.push(new base64Image(aktimgnames, aktimgbase64, aktimgfilename));
      }else{
        //image exists
        for(var x=0;x<aktimgnames.length;x++){
          if(this.imageByName(aktimgnames[x])===null){
            existingimage.names.push(aktimgnames[x]);//add name to it
          }
        }
      }
      /*let existingimage = this.imageByName(aktimgname);
      if(existingimage!=null)
            existingimage.base64url = aktimg.substring(aktimg.indexOf('>>>')+3); else
            this.base64images.push(new base64Image(aktimg.substring(0,aktimg.indexOf('>>>')), aktimg.substring(aktimg.indexOf('>>>')+3)));
            */

      imgstring = imgstring.substring(imgstring.indexOf('<<<')+3);
    }
    this.rebuildOldImages();
  },
  notempty: function(){
    return (this.base64images.length>0);
  },
  resizeImage: function(img, maxw, maxh){
    var maxwidth = slidenote.base64images.maxwidth;
    var width = maxwidth;
    var maxheight = slidenote.base64images.maxheight;
    if(maxw!=null && maxw<maxwidth)maxwidth=maxw;
    if(maxh!=null && maxh<maxheight)maxheight=maxh;
    if(img.width<maxwidth){
      console.log("image has only width:"+img.width);
      document.getElementById("downsizedimage").src = img.src;
      return img.src;
    }
     var canvas = document.createElement('canvas'),
         ctx = canvas.getContext("2d"),
         oc = document.createElement('canvas'),
         octx = oc.getContext('2d');

     canvas.width = maxwidth; // destination canvas size
     canvas.height = canvas.width * img.height / img.width;

     if(canvas.height > maxheight){
       canvas.height = maxheight;
       canvas.width = canvas.height * img.width / img.height;
       width = canvas.width;
     }

     var cur = {
       width: Math.floor(img.width * 0.5),
       height: Math.floor(img.height * 0.5)
     }

     oc.width = cur.width;
     oc.height = cur.height;

     octx.drawImage(img, 0, 0, cur.width, cur.height);

     while (cur.width * 0.5 > width) {
       cur = {
         width: Math.floor(cur.width * 0.5),
         height: Math.floor(cur.height * 0.5)
       };
       octx.drawImage(oc, 0, 0, cur.width * 2, cur.height * 2, 0, 0, cur.width, cur.height);
     }

     ctx.drawImage(oc, 0, 0, cur.width, cur.height, 0, 0, canvas.width, canvas.height);
     //document.getElementById("downsizedimage").src = canvas.toDataURL();
     var dsimg = document.getElementById("downsizedimage");
     let imagetype = slidenote.base64images.imagetype;
     if(img.src.indexOf("image/png")>-1)imagetype="image/png";
     if(dsimg)dsimg.src = canvas.toDataURL(imagetype,slidenote.base64images.quality);
     var rbase64url = canvas.toDataURL(imagetype,slidenote.base64images.quality);
     return rbase64url;
  },//end of resizeImage
  changeMaxSize: function(size){
    if(size){
      var mw = size.substring(0,size.indexOf("x"));
      var mh = size.substring(size.indexOf("x")+1);
      this.maxwidth = mw;
      this.maxheight = mh;
      var targetimg = document.getElementById("downsizedimage");
      if(targetimg){
        if(this.lastuploadedimage)this.resizeImage(this.lastuploadedimage);
      }
    }else{
      this.maxwidth=1024;
      this.maxheight=768;
    }
  }

};//end of new object slidenote.base64images

newtheme.insideFinalizeHtml = function(template){
 //console.log("imgtourl - scan for images and replace them with data-urls");
  var imgtags =  template.content.querySelectorAll("img");//slidenote.presentationdiv.getElementsByTagName("img");
  for(var x=0;x<imgtags.length;x++){
    var imgtagname =  decodeURIComponent(imgtags[x].src);//imgtags[x].src.substring(imgtags[x].src.lastIndexOf("/")+1);
    var baseurl;
    baseurl = window.location.origin+window.location.pathname;
    if(imgtagname.substring(0,baseurl.length)===baseurl)imgtagname=imgtagname.substring(baseurl.length);
    baseurl = window.location.href.substring(0,window.location.href.lastIndexOf("/")+1);
    if(imgtagname.substring(0,baseurl.length)===baseurl)imgtagname=imgtagname.substring(baseurl.length);

   //console.log("image mit src "+imgtagname+" gefunden");
    var b64image = slidenote.base64images.imageByName(imgtagname);
    if(b64image!=null){
     //console.log("image in datenbank gefunden. b64code:"+b64image.base64url);
      imgtags[x].src=b64image.base64url;
    } else {
      //no image-tag found - replace image-src with error-image:
      imgtags[x].src = slidenote.imagespath + "imageupload.png";
    }
  }
};
newtheme.init = function(){
  if(!document.getElementById('fileInput')){
    console.log("imgtourl: no fileinput found");
    return;//do nothing if no fileinput is present, therefore no editor
  }
 //console.log("imgtourl wird initialisiert");
  //add imagebutton to texteditorbuttons
  var texteditorbuttons = document.getElementById("texteditorbuttons");
  var button = document.createElement("button");
  button.title ="add image";
  button.name="image";
  button.classList.add("basicbutton");
  var buttonimage = new Image();
  buttonimage.src=slidenote.imagespath+"buttons/image.svg";
  buttonimage.title = "image";
  //var buttontext = document.createTextNode("Image");
  var fileInput = document.getElementById('fileInput');
  var fileDisplayArea = document.getElementById('filePreview');
  button.appendChild(buttonimage);
  var buttonpretext = document.createElement("span");
  buttonpretext.classList.add("buttonmdcode");
  buttonpretext.innerText = "![](";
  var buttonintext = document.createElement("span");
  buttonintext.classList.add("buttonmdtext");
  buttonintext.innerText="image";
  var buttonendtext = document.createElement("span");
  buttonendtext.classList.add("buttonmdcode");
  buttonendtext.innerText=")";
  button.appendChild(buttonpretext);
  button.appendChild(buttonintext);
  button.appendChild(buttonendtext);
  button.onclick = function(event){
    slidenote.base64images.preselectedname = null;
    var el = slidenote.parser.CarretOnElement(slidenote.textarea.selectionEnd);
    if(el!=null && el.typ==="image"){
      slidenote.base64images.preselectedname = el.src;
      var b64image = slidenote.base64images.imageByName(el.src);
      if(b64image !=null){
        var fprew = document.getElementById("filePreview");
        fprew.innerHTML="";
        var b64img = new Image();
        b64img.src = b64image.base64url;
        b64img.id = "downsizedimage";
        b64img.onclick=function(){
          document.getElementById("imagesblock").classList.remove("visible");
          slidenote.textarea.focus();
        };
        fprew.appendChild(b64img);
      }
    }

    document.getElementById('imagesblock').classList.add('visible');
  };
  //texteditorbuttons.appendChild(button);
  var li=document.createElement("li");
  li.appendChild(button);
  document.getElementById("toolbarbuttons").appendChild(li);

 //console.log(fileInput);
  fileInput.addEventListener('change', function(e) {
        //console.log("adding eventlistener to fileinput");
  			var file = fileInput.files[0];
        var nombre = fileInput.files[0].name;
  			var imageType = /image.*/;

  			if (file.type.match(imageType)) {
  				var reader = new FileReader();

  				reader.onload = function(e) {
  					fileDisplayArea.innerHTML = "";

  					var img = new Image();
            img.onload = function() {
              slidenote.base64images.resizeImage(img);
            }
            var targetimg = new Image();
            targetimg.id = "downsizedimage";
            targetimg.name = nombre;
            targetimg.onclick = function(){
              slidenote.base64images.addImage(this.name,this.src);
            };

  					fileDisplayArea.appendChild(targetimg);

            //load image
            img.src = reader.result;
            //save last uploaded image in orig size:
            slidenote.base64images.lastuploadedimage = img;
            if(img.src.indexOf('image/gif')>-1){
              //add to slidenote:
              slidenote.base64images.addImage(nombre,reader.result);
            }else{
              //call sizechoose-dialog:
              slidenote.base64images.sizeDialog({
                origimage:img,
                caller:this.caller,
                filename:nombre
              });
            }
  				}

  				reader.readAsDataURL(file);
  			} else {
  				fileDisplayArea.innerHTML = "File not supported!";
  			}

  });
  slidenote.textarea.addEventListener("drop", function(e){
   //console.log("dropevent:");
   //console.log(e);
    var dt = e.dataTransfer;
    var file = dt.files[0];
    var nombre = file.name;
    var imageType = /image.*/;
    if(file.type.match(imageType)){
      //check if on actual image if so use that images src as name:
      var activeelement = slidenote.parser.CarretOnElement(slidenote.textarea.selectionEnd);
      if(activeelement && activeelement.typ==="image"){
        slidenote.base64images.preselectedname=activeelement.src;
        nombre = activeelement.src;
      }
      var reader = new FileReader();
      reader.onload = function(e){
        fileDisplayArea.innerHTML = "";
        var img = new Image();
        img.onload = function(){slidenote.base64images.resizeImage(img);};
        var targetimg = new Image();
        targetimg.id="downsizedimage";
        targetimg.name=nombre;
        targetimg.onclick = function(){slidenote.base64images.addImage(this.name, this.src);};
        fileDisplayArea.appendChild(targetimg);
        img.src = reader.result;
        slidenote.base64images.lastuploadedimage = img;
      }
      reader.readAsDataURL(file);
      document.getElementById("imagesblock").classList.add("visible");
    }
  },false);
  slidenote.textarea.addEventListener("keyup",function(event){
    var key = ""+event.key;
    if(key==="undefined")key=getKeyOfKeyCode(event.keyCode);
    if(key===")"){
      console.log(") pressed");
      slidenote.parseneu();
      var cursorpos = slidenote.textarea.selectionEnd -1;
      var activeelement = slidenote.parser.CarretOnElement(cursorpos);
      if(activeelement!=null &&
            activeelement.typ ==="image" &&
            activeelement.src.substring(0,4)!="http" &&
            slidenote.base64images.imageByName(activeelement.src)==null){
              console.log("image keyup with src "+activeelement.src );
        slidenote.base64images.preselectedname = activeelement.src;
        document.getElementById("filePreview").innerHTML = "";
        //var oldimages = document.querySelectorAll("#fileOld img");
        //for(var oi=0;oi<oldimages.length;oi++)oldimages[oi].onclick = function(event){slidenote.base64images.addImage(this.name, this.src)};
        document.getElementById("imagesblock").classList.add("visible");
        slidenote.textarea.selectionEnd=slidenote.textarea.selectionEnd-1;
        slidenote.textarea.selectionStart = slidenote.textarea.selectionEnd;
      }
    }
  });
  document.getElementById("imagesblock").addEventListener("keyup",function(event){
    var key=""+event.key;
    if(key==="undefined")key=getKeyOfKeyCode(event.keyCode);
    if(key==="Escape")this.classList.remove("visible");
  });
}

newtheme.insertMenu = function(element){
  var b64img = slidenote.base64images.imageByName(element.src);
  var result = document.createElement("div");
  var previewimage = new Image();
  previewimage.classList.add("insertmenu-preview-image");
  if(b64img){
    previewimage.src = b64img.base64url;
  }else{
    previewimage.src = slidenote.imagespath+"/imageupload.png";
  }
  result.appendChild(previewimage);

  var uploadlink = document.createElement("button");
  //uploadlink.href="#";
  uploadlink.name = element.src;
  uploadlink.title = "select image for current tagname";
  uploadlink.onclick=function(){
    slidenote.base64images.preselectedname = this.name;
    var imggal = document.getElementById("imagesblock");
    imggal.classList.add("visible");
    var bs = imggal.getElementsByTagName("button");
    if(bs.length>0)bs[bs.length-1].focus();
  };
  //uploadlink.innerHTML = "Upload an Image to the slidenote";
  var uploadlinkimg = new Image();
  uploadlinkimg.classList.add("uploadlink");
  uploadlinkimg.src=slidenote.imagespath+"/buttons/image.svg";
  uploadlink.appendChild(uploadlinkimg);
  result.appendChild(uploadlink);

  var descriptionlink = document.createElement("button");
  //descriptionlink.href = "#";
  descriptionlink.title = "set Description";
  descriptionlink.innerText = "set Description";
  var descpos = element.posinall+2;
  descriptionlink.name = descpos;
  descriptionlink.onclick = function(){
    slidenote.textarea.selectionEnd = this.name;
    slidenote.textarea.selectionStart = this.name;
    slidenote.textarea.focus();
  }
  result.appendChild(descriptionlink);

  var setAsBackgroundLink = document.createElement("button");
  setAsBackgroundLink.title="Set Image as Background of current Page or Layoutsection";
  setAsBackgroundLink.innerText = "set as Background";
  setAsBackgroundLink.onclick = function(){
    var el = slidenote.parser.CarretOnElement();
    var elpos = el.posinall;
    var elpage = slidenote.parser.map.pageAtPosition(elpos);
    var lastpagestart = slidenote.parser.map.pagestart[elpage].posinall;
    var dobj = slidenote.parser.dataobjects;
    var lastlayoutstart;
    for(var x=0;x<dobj.length;x++){
      var dob = dobj[x];
      if(dob.type==="layout" && dob.startline<el.line && dob.endline>el.line){
        lastlayoutstart = slidenote.parser.map.linestart[dob.startline+1];
        break;
      }
    }
    var inspos = lastpagestart;
    if(lastlayoutstart)inspos = lastlayoutstart;
    var newtext = slidenote.textarea.value.substring(0,inspos)+
                  el.mdcode + "\n\n"+
                  slidenote.textarea.value.substring(inspos,el.posinall)+
                  slidenote.textarea.value.substring(el.posinall+el.mdcode.length);
    slidenote.textarea.value = newtext;
    slidenote.textarea.selectionEnd = inspos;
    slidenote.textarea.selectionStart = inspos;
    slidenote.textarea.focus();
    slidenote.parseneu();
  }
  result.appendChild(setAsBackgroundLink);

  return result;
}
slidenote.base64images.defaultImage=`data:image/gif;base64,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`
slidenote.addTheme(newtheme);

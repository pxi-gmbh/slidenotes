//was, wenn ich alles komplett neu denke und ein mapping-objekt erstelle:
/*
var mapobject = {	//link:
	line:0,			//0
	pos:12,
	posinall:12,
	html:"<b>",		//"<a href='url'>text</a>"
	mdcode:"*",		//[text](url)
	typ:"start",	// "link"
	//brotherelement: end,
	linktext: null,	//"text"
	linkurl: null	//"url"

};
*/

/* mapper object to track mapping between md-code/source-code
and rendered html code in editor
*/

function mapping (parser) {
	 this.insertedhtmlelements = new Array();
	 this.insertedhtmlinline = new Array();
	 this.insertedimages = new Array();
	 this.codeblocks = new Array();
	 this.codeblocklines = new Array();
	 this.lastline=0;
	 //this.linepos = [0];
	 this.linestart = [0];
	 this.lineend = new Array();
	 this.pagestart = [{line:0,posinall:0}];
	 this.pageend = new Array();
	 this.lastcursorpos = 0;//

	var origtext = parser.sourcecode;
	var lastpos=origtext.indexOf("\n");
	while(lastpos>-1){
		//this.linepos.push(lastpos+1); //wrong - should be lastpos +1 because \n is on the end
		this.lineend.push(lastpos);
		this.linestart.push(lastpos+1);
		this.lastline++;
		lastpos=origtext.indexOf("\n",lastpos+1);
	}
	this.lineend.push(origtext.length);
	//lastline steht jetzt auf der letzten linie


	for(var x=0;x<=this.lastline;x++)this.insertedhtmlinline[x]=new Array();
};

mapping.prototype.init = function(){
	//sort array by absolute pos of elements
	if(this.insertedhtmelements!=null)this.insertedhtmlelements.sort(function(a,b){return a.posinall - b.posinall})

}

mapping.prototype.addElement = function(element2){
	var element=element2;
	if(element.posinall==null)element.posinall=element.pos+this.linestart[element.line];
	this.insertedhtmlelements.push(element);
	this.insertedhtmlinline[element.line].push(element);
	if(element.typ === "image")this.insertedimages.push(element);
};




mapping.prototype.allElementsInLine = function(linenr){
	return this.insertedhtmlinline[linenr];
};

mapping.prototype.positionInHtml = function(position, line){
	var newpos=position;
	var onelement = false; //braucht das? vielleicht nicht blöd für schnelle abfrage
	var onelements = new Array();
	var posinelements = new Array();
	var lastelement;
	var nextelement = this.insertedhtmlinline[line][0];
	this.insertedhtmlinline[line].sort(function (a,b){return a.pos - b.pos || a.mdcode.length - b.mdcode.length});
	if(line!=null){
		if(position==0){
			for(var el=0;el<this.insertedhtmlinline[line].length;el++){
				var elem = this.insertedhtmlinline[line][el];
				if(elem.pos ==0 && elem.typ=="start"){
					newpos+=elem.html.length;
					if(elem.mdcode.length > 0)nextelement=elem;
				}
			}
		}else
		//position ist mit lineangabe:
		for(var x=0;x<this.insertedhtmlinline[line].length;x++){
			var elem = this.insertedhtmlinline[line][x];
				if(elem.pos<position){
					newpos+=elem.html.length-elem.mdcode.length;
					if(elem.mdcode.length>0)lastelement=elem;
					nextelement=this.insertedhtmlinline[line][x+1];
				}
				if(elem.pos<position && position<elem.pos+elem.mdcode.length){
					//auf element gelandet:
					newpos+=elem.mdcode.length-elem.html.length; //erstmal wieder rückgängig machen
					var posinelement=position-elem.pos;
					newpos-=posinelement; //newpos steht jetzt auf anfang des elements
					//hier wirds kompliziert mit dem link wegen element in element und der newpos:
					if(elem.typ=="link" || elem.typ=="image"){
						//mal gucken, was ich da machen muss, klingt komplizierter
						//fürs austauschen html-position merken:
						elem.htmlpos = newpos;
						//einfach nix machen??? sieht so aus! goil. ah, doch: wieder im element vorrücken
						newpos+=posinelement;
						//ok, jetzt stimmt die position. aber das austauschen wird schwer :(

					}
					if(elem.typ=="start"){
						//rücke html-vor:
						newpos+=elem.html.length;
					}
					//end: tue nix, stehst schon richtig
					//ansonsten erstmal:
					onelements.push(elem);
					posinelements.push(posinelement);
				}
		}
	}
	return {position:newpos,onelements:onelements, posinelements:posinelements, lastelement:lastelement,nextelement:nextelement};
};

mapping.prototype.pageAtPosition = function(position){
	var result = 0;
	var p=position || slidenote.textarea.selectionEnd;

	for(var x=0;x<this.pagestart.length;x++){
		if(this.linestart[this.pagestart[x].line]<=p)result = x;
		//console.log(this.pagestart[x].line+"<"+position);
	}
	//console.log("Page at Position "+position+"/"+p+" : "+x);
	return result;

}
/*alter teil des Programms:*/

/* einfaches parse-objekt wie bspw. Sternchen und ähnliches
*	*/
function parseobjekt(emdedstart, emdedend, htmlstarttag, htmlendtag, nombre){
	//init der klasse
		this.emdstart = emdedstart;
		this.emdend = emdedend;
		this.htmlstart = htmlstarttag;
		this.htmlend = htmlendtag;
		this.nombre = nombre;
}
parseobjekt.prototype.htmlencapsule = function(text,position, errorlog){
	//text ist alles
	var temptext = text.substring(position+this.emdstart.length);
	if(temptext.indexOf(this.emdend)==-1){
		//error aufgetreten:
		//zeilen zählen:
		var zeilencounttext = text.substring(0,position);
		var zc=0;
		var zscan=true;
		var zlnpos=0;
		while(zeilencounttext.indexOf("\n",zlnpos)>-1){
			zc++;
			zlnpos=zeilencounttext.indexOf("\n",zlnpos)+1;
		}
		zlnpos--; //zlnpos ist jetzt der letzte zeilenumbruch vorm fehler:
		errorlog.push(new parsererror(zc,position-zlnpos,20,this.nombre,"missing endsymbol "+this.emdend));
		//errorlog.push(new parsererror(zc,0,
		return text;
	}else {
		temptext = temptext.substring(0,temptext.indexOf(this.emdend));
		var returntext = this.htmlstart + temptext + this.htmlend;
		if(this.emdend=="\n")returntext+="\n";
		if(this.emdstart.indexOf("\n")>-1)returntext = "\n"+returntext;
		return text.substring(0,position)+returntext + text.substring(position + temptext.length+this.emdstart.length+this.emdend.length);
	}
};

function parsererror(line, row, rowend, errorclass, errortext, parseobjekt){
	this.line = line;
	this.row = row;
	this.rowend = rowend;
	this.errorclass = errorclass;
	this.errortext = errortext;
	this.htmlstart = '<span class="error">';
	this.htmlend = "</span>";
	this.parseobjekt = parseobjekt;
	console.log("new error found"+errorclass+errortext);
}
parsererror.prototype.proposeEnding = function(){
	if(this.errortext.indexOf("missing endsymbol ")>-1)return this.errortext.substring(this.errortext.indexOf("missing endsymbol ")+18);
	else return "";
};
parsererror.prototype.encapsulehtml=function(linetext){
	//if(this.rowend<linetext.length)return linetext.substring(0,this.row)+this.htmlstart+linetext.substring(this.row, this.rowend)+this.htmlend+linetext.substring(this.rowend);
		//else
		var realstart = this.row;
		if(this.parseobjekt!=null){
			//console.log("error an stelle:"+realstart+" zu finden:" +this.parseobjekt.emdstart + " momentaner fund:"+linetext.substring(realstart,realstart+this.parseobjekt.emdstart.length));
		}
		if(realstart>0 && this.parseobjekt != null && linetext.substring(realstart,realstart+this.parseobjekt.emdstart.length)!=this.parseobjekt.emdstart){
			//realstart = linetext.indexOf(this.parseobjekt.emdstart, realstart);
			while(linetext.substring(realstart,realstart+this.parseobjekt.emdstart.length)!=this.parseobjekt.emdstart && realstart>0)realstart--;
		}
		return linetext.substring(0,realstart)+this.htmlstart+linetext.substring(realstart)+this.htmlend;
};
parsererror.prototype.logformat=function(){
	return this.line+"/"+this.row+" ["+this.errorclass+"]:"+this.errortext;
};

function emdparser(text){
	this.sourcecode = text;  //the sourcecode of everything, normaly gotten from editor-textfield
	this.lines = new Array(); //array with ready html-code parsed as lines into array
	this.lineswithhtml = new Array(); //array lineswithhtml[linenummer] = string with element-code: text,ol,ul,table...
	this.parsedcode = text;  //string with the code parsed to html
	this.errorcode = text; //string with the code parsed to html including error-spans and error-description-spans
	this.errorsourcecode = text; //string with the code including error-spans
	this.lineswitherrors = new Array(); // array with strings of errorcode parsed as lines into array
	this.errorsourcelines = new Array(); //array with strings of errorsourcecode parsed as lines into array
	this.imgurlpre = "images/"; //string with the beginning for image-urls, depending on the server and the nodeid, maybe not necesary
	this.dataobjects = new Array(); //array with dataobjects of data-blocks
	//var aktpos = 0;
	this.parselines(text);  //parsing the sourcecode on init into lines
	this.perror = new Array(); //array with parsing-errors as objects/array
	if(slidenote && slidenote.parseelemente){
		this.parseelemente = slidenote.parseelemente; //makes parseelemente changeable through themes
		//because emdparser will be defined anew every parseneu - so it has to be saved in slidenote which stays stable
	} else {
		//standard-parseelemente if no parseelmenetearray is defined in slidenote
		this.parseelemente = new Array(); //array with simple parseelements which can go over lines
		//erstelle einfache parseobjekte:
		this.parseelemente.push(new parseobjekt('***','***',"<b><i>","</i></b>","bolditalic"));
		this.parseelemente.push(new parseobjekt('**','**',"<b>","</b>","bold"));
		this.parseelemente.push(new parseobjekt('__','__',"<b>","</b>","bold"));
		this.parseelemente.push(new parseobjekt('*','*',"<i>","</i>","italic"));
		this.parseelemente.push(new parseobjekt('_','_',"<i>","</i>","italic"));
		this.parseelemente.push(new parseobjekt("~~","~~","<strike>","</strike>","strike"));
		this.parseelemente.push(new parseobjekt("~","~","<mark>","</mark>","mark"));
		//this.parseelemente.push(new parseobjekt("`","`","<code>","</code>","code")); //darf auch nicht über eine zeile hinausgehen
		//this.parseelemente.push(new parseobjekt("-----","\n","<hr>","","pagebreak")); //ist ein zeilending, kein einfaches element
	}
	//create new map:
	this.map = new mapping(this);
}

/*not really necesary, could be done by split easily:*/
emdparser.prototype.parselines= function(text){
	var aktpos = 0;
	this.lines = new Array();
	while(text.indexOf("\n",aktpos)>-1){
		this.lines.push(text.substring(aktpos,text.indexOf("\n",aktpos)));
		aktpos=text.indexOf("\n",aktpos)+1;
	}
	this.lines.push(text.substring(aktpos));
};

/* returnparsedlines
returns the sourcecode as an array of lines
todo: change it to use split as it seems more efficient
in modern browsers
*/
emdparser.prototype.returnparsedlines = function(text){
	var aktpos = 0;
	var lines = new Array();
	while(text.indexOf("\n",aktpos)>-1){
		lines.push(text.substring(aktpos,text.indexOf("\n",aktpos)));
		aktpos=text.indexOf("\n",aktpos)+1;
	}
	lines.push(text.substring(aktpos));
	//console.log("last line:"+lines[lines.length-1]+"eol");
	return lines;
};

/*lineAtPosition:
returns the linenumber of position in sourcecode-text
*/
emdparser.prototype.lineAtPosition = function(pos){
	let position = pos;
	if(pos===null || pos===undefined)position=slidenote.textarea.selectionEnd;
	var linepos = 0;
	line = 0;
	while(this.sourcecode.indexOf("\n",linepos)<position &&
		this.sourcecode.indexOf("\n",linepos)>-1){
		linepos=this.sourcecode.indexOf("\n",linepos)+1;
		line++;
	}
	linepos--;
	return line;
};

/* positionOfLine
returns the absolute position in the sourcecode-text of the
start of the line with number line
@param line: number of line to check for
*/
emdparser.prototype.positionOfLine = function(line){
	var linepos = 0;
	var aktline=0;
	while(this.sourcecode.indexOf("\n",linepos)>-1 && aktline<line){
		linepos=this.sourcecode.indexOf("\n",linepos)+1;
		aktline++;
	}
	return linepos;
};


/* parseerrorsourcehtml
* old style, not used anymore
* delete in the future
* erstellt html für die erweiterte fehlerdarstellung des sourcecodes
*/
emdparser.prototype.parseerrorsourcehtml= function(){
	var lines = this.returnparsedlines(this.sourcecode);
	var temptext = '<ol start="0">';
	for(var x=0;x<this.perror.length;x++)lines[this.perror[x].line]=this.perror[x].encapsulehtml(lines[this.perror[x].line])+'<span class="errordescription">'+this.perror[x].errorclass+': '+this.perror[x].errortext+"</span>";
	for(var x=0;x<lines.length;x++)temptext+='<li>'+lines[x]+'</li>\n';
	temptext += "</ol>";
	//var errorsourcecodediv = document.getElementById("fehlercode");
	//if(errorsourcecodediv!=null)errorsourcecodediv.innerHTML = temptext;
	this.errorsourcelines = lines;
	this.errorsourcecode = temptext;
};


/* renderCodeeditorBackground:
 *  makes use of the map to render background for md-Code-Editor
 */
emdparser.prototype.renderCodeeditorBackground = function(){
	 var lines = this.returnparsedlines(this.sourcecode); //raw sourcecode
	 var changes = new Array(); //saves the changes we have to do
	 var imagesinline = new Array(); //array with array of images-changes
	 //create cursor-change:
	 var cursorposinall = slidenote.textarea.selectionStart;
	 //var linediff = this.lineAtPosition(cursorposinall);
	 //cursorposinall -=linediff; //\n counts in cursorpos
	 var cursorline = this.lineAtPosition(cursorposinall);
	 var cursorposinline = cursorposinall - this.map.linestart[cursorline];
	 //console.log("new cursor at line:"+cursorline+", posinall:"+cursorposinall+", pos:"+cursorposinline);
	 //if(cursorposinline<0)cursorposinline=0;
	 var cursorchange = {
	 	line:cursorline,
	 	posinall:cursorposinall,
	 	pos:cursorposinline,
	 	html:'<span id="carret">&zwj;</span>',
	 	mdcode:'',
	 	typ:'cursor'
	 };
	 if(slidenote.textarea.value.charAt(cursorposinall-1)==="-"){
		 cursorchange.html = '<span id="carret"></span>';
	 }
	 changes.push(cursorchange);
	 /*
	 if(slidenote.textarea.selectionEnd-
		 	slidenote.textarea.selectionStart!=0){
		 //marc selection:
		 var selstartob = {
			 line:cursorline,
			 posinall:cursorposinall,
			 pos:cursorposinline,
			 html:'<u class="selectioncarretmarker">',
			 mdcode:'',
			 typ:"cursor"
		 };
		 var cursorendline = this.lineAtPosition(slidenote.textarea.selectionEnd);
		 var selendob = {
			 line:cursorendline,
			 posinall:slidenote.textarea.selectionEnd,
			 pos:slidenote.textarea.selectionEnd - this.map.linestart[cursorendline],
			 html:"</u>",
			 mdcode:"",
			 typ:"cursor"
		 }
	 }*/

	 //looking for simple changes:
	 var mdsimples = "***__~~<&`"; //< is also a simple change
	 for (var x=0;x<slidenote.inlinedatatypes.length;x++){
	 	mdsimples+=slidenote.inlinedatatypes[x].start;
		mdsimples+=slidenote.inlinedatatypes[x].end;
	 }
	 for(var x=0;x<this.map.insertedhtmlelements.length;x++){
		 var element = this.map.insertedhtmlelements[x];
		 //iterate through map and get changes we have to do to orig-text:
		 if(element.mdcode.length>0 && mdsimples.indexOf(element.mdcode)>-1){
			 	//console.log("adding change "+element.mdcode);
			 //a simple thing - just do the changes later on:
			 //end should be changed after element
			 if(element.typ==="start" || element.typ==="<") changes.push(element);
			 if(element.typ==="start" &&
								 element.brotherelement &&
								 element.brotherelement.line!=element.line){
				 //console.log("element"+element.mdcode+element.typ+element.line+" brotherelement:"+element.brotherelement.mdcode+element.brotherelement.typ+element.brotherelement.line);
				 //console.log(element);
				 changes.push({
					 line:element.line,
					 posinall:this.map.lineend[element.line],
					 pos:lines[element.line].length,
					 html:element.brotherelement.html,
					 mdcode:element.brotherelement.mdcode,
					 typ:element.brotherelement.typ
				 });
				 for(var ellines=element.line+1;ellines<element.brotherelement.line;ellines++){
					 changes.push({
						 line:ellines,
						 posinall:this.map.linestart[ellines],
						 pos:0,
						 html:element.html,
						 mdcode:element.mdcode,
						 typ:"start"
					 });
					 changes.push({
						 line:ellines,
						 posinall:this.map.lineend[ellines],
						 pos:lines[ellines].length,
						 html:element.brotherelement.html,
						 mdcode:element.brotherelement.mdcode,
						 typ:"end"
					 });
				 }//for-to schleife
			 }//now lines are filled with nearly all changes
			 if(element.typ==="end"){
				 changes.push({
					line:element.line,
					posinall:element.posinall+element.mdcode.length,
					pos:element.pos+element.mdcode.length,
					html:element.html,
				 	mdcode:element.mdcode,
			 		typ:element.typ
				});
				if(element.brotherelement && element.brotherelement.line!=element.line){
					changes.push({
						line:element.line,
						posinall:this.map.linestart[element.line],
						pos:0,
						html:element.brotherelement.html,
						mdcode:element.brotherelement.mdcode,
						typ:element.brotherelement.typ
					})
				}
			}
		 }
		 if(element.typ === "image"){
			 //record in imagesinline;
			 if(imagesinline[element.line]==null)imagesinline[element.line] = new Array();
			 imagesinline[element.line].push(element);
			 //check if image is over http and if so if it exists:
			 var imgparsefalse = false;
			 var imagenotfound = " ";
			 if(element.src.substring(0,4)==="http"){
				 	 if(slidenote.HTTPImagesNotFound === undefined)slidenote.HTTPImagesNotFound = "";
					 if(slidenote.HTTPImagesNotFound.indexOf(element.src)>-1){
						 imagenotfound+="imagenotfound";

					 } else{
						 var imgtocheck = new Image();
						 //console.log("image httpsrc: "+element.src);
						 imgtocheck.onerror = function(){
							 //alert("image not found")
							 console.warn("image not found:"+this.src);
							 imagenotfound += "imagenotfound";
							 if(slidenote.HTTPImagesNotFound==undefined)slidenote.HTTPImagesNotFound = "";
							 slidenote.HTTPImagesNotFound += this.src;
							 var imgsrcs = document.getElementsByClassName("imagesrc");
							 for(var i=0;i<imgsrcs.length;i++){
								//console.log("imgsrcs innerhtml:"+imgsrcs[i].innerHTML);
								 if(imgsrcs[i].innerHTML === this.src || imgsrcs[i].innerHTML+"/"===this.src){
									 imgsrcs[i].classList.add("imagenotfound");
								 }
							 }
					 		}
							imgtocheck.src = element.src;
				 };
				 //imgtocheck.onload = function(){alert("image geladen")};
			 }else {
				 //image is not over http - check if it exists in database:
				 if(slidenote.base64images && slidenote.base64images.imageByName(element.src)==null){
					 console.warn("image not in database:"+element.src);
					 imagenotfound+="imagenotfound";
				 }
			 }
			 //add span for image-tag to get highlighting
			 changes.push({
				 line:element.line,
				 posinall:element.posinall,
				 pos:element.pos,
				 html:'<span class="imagetag">',
				 mdcode:"",
				 typ:"image-tag"
			 });
			 if(element.alt.length>0){
				 changes.push({
					 line:element.line,
					 posinall:element.posinall+2,
					 pos:element.pos+2,
					 html:'<span class="imagealt">',
					 mdcode:"",
					 typ:"image-alt"
				 });
				 changes.push({
					 line:element.line,
					 posinall:element.posinall+2+element.alt.length,
					 pos:element.midpos,
					 html:'</span>',
					 mdcode:"",
					 typ:"end",
					 tag: "image-alt-end"
				 });
			 }
			 changes.push({
				 line:element.line,
				 posinall:element.posinall+2+element.alt.length+2,
				 pos:element.midpos+2,
				 html:'<span class="imagesrc'+imagenotfound+'">',
				 mdcode:"",
				 typ:"image-src"
			 });
			 changes.push({
				 line:element.line,
				 posinall:element.posinall+element.endpos-element.pos,
				 pos:element.endpos,
				 html:'</span>',
				 mdcode:"",
				 typ:"end"
			 });
			 changes.push({
				 line:element.line,
				 posinall:element.posinall+element.mdcode.length,
				 pos:element.pos+element.mdcode.length,
				 html:"</span>",
				 mdcode:"",
				 typ:"end"
			 });
		 }
		 if(element.tag ==="footnote-anchor"){
			 if(element.typ==="start"){
				 changes.push({
					 line:element.line,
					 posinall:element.posinall,
					 pos:element.pos,
					 html:'<span class="footnoteanchor">',
					 mdcode:element.mdcode,
					 typ:"start"
				 });
			 }else{
				 changes.push({
					 line:element.line,
					 posinall:element.posinall+1,
					 pos:element.pos+1,
					 html:"</span>",
					 mdcode:element.mdcode,
					 typ:"end"
				 });
			 }
		 }
		 if(element.tag ==="footnote"){
			 if(this.lineswithhtml[element.line-1]!="footnote"){
				 changes.push({
					 line:element.line,
					 posinall:element.posinall,
					 pos:0,
					 html:'<span class="footnote firstfootnote">',
					 mdcode:element.mdcode,
					 typ:"start"
				 });
			 }else{
				 changes.push({
					 line:element.line,
					 posinall:element.posinall,
					 pos:0,
					 html:'<span class="footnote">',
					 mdcode:element.mdcode,
					 typ:"start"
				 });
			 }
			 changes.push({
				 line:element.line,
				 posinall:this.map.lineend[element.line],
				 pos:lines[element.line].length,
				 html:'</span>',
				 mdcode:"",
				 typ:"end"
			 });
		 } //footnote
		 if(element.tag==="comment"){
			 changes.push({
				 line:element.line,
				 posinall:element.posinall,
				 pos:element.pos,
				 html:'<span class="comment">',
				 mdcode:element.mdcode,
				 typ:"start"
			 });
			 changes.push({
				 line:element.line,
				 posinall:this.map.lineend[element.line],
				 pos:lines[element.line].length,
				 html:'</span>',
				 mdcode:"", typ:"end"
			 });
		 }
		 if(element.typ==="pagebreak"){

		 }
	 }
	 //add error-spans:
	 this.perror.sort(function(a,b){
		 if(a.line-b.line==0)return a.row-b.row;
		 return a.line - b.line;
	 }
	 );
	 var lasterrorpos;
	 for(var er=0;er<this.perror.length;er++){
		 if(this.perror[er].row!=lasterrorpos){
			 lasterrorpos = this.perror[er].row;
			 if(this.perror[er].errortext!="missing space after *" &&
		 			!(this.perror[er].row<cursorposinline &&
						this.perror[er].rowend>cursorposinline &&
						(this.perror[er].errortext==="missing endsymbol **" ||
					   this.perror[er].errortext==="missing endsymbol ***" ||
						 this.perror[er].errortext==="missing endsymbol ]" ||
						 this.perror[er].errortext==="missing endsymbol __")
					)){
				 changes.push({
					 line:this.perror[er].line,
					 posinall:this.map.linestart[this.perror[er].line]+this.perror[er].row,
					 pos:this.perror[er].row,
					 html:this.perror[er].htmlstart,
					 mdcode:"",
					 typ:"error",
					 tag:this.perror[er].errorclass
				 });
				 if(this.perror[er].errorclass="image"){
					 changes.push({
						 line:this.perror[er].line,
						 posinall:this.map.linestart[this.perror[er].line]+this.perror[er].rowend,//this.map.linestart[this.perror[er].line]+lines[this.perror[er].line].length,
						 pos:this.perror[er].rowend,
						 html:this.perror[er].htmlend,
						 mdcode:"",
						 typ:"error",
						 tag:"imageerror end"
					 });
				 }else{
					 changes.push({
						 line:this.perror[er].line,
						 posinall:this.map.lineend[this.perror[er].line],//this.map.linestart[this.perror[er].line]+lines[this.perror[er].line].length,
						 pos:lines[this.perror[er].line].length,
						 html:this.perror[er].htmlend,
						 mdcode:"",
						 typ:"error",
						 tag:this.perror[er].errorclass
					 });
			 		}
				}
		 }
	 }

	 //sort the array:
	 changes.sort(function(a,b){
		 if(a.typ==="cursor"&&b.typ==="end" &&
		  					a.posinall-b.posinall==0){
			  return 1;
		 }else if(a.typ==="end" && b.typ==="cursor" &&
	 					a.posinall-b.posinall===0){
				return -1;
		 }else{
		 		return a.posinall - b.posinall;
	 	 }
	 });
	 //console.log(changes);
	 //do the changes from behind to beginning:
	 for(var c=changes.length-1;c>=0;c--){
		 actchange = changes[c];
		 if(actchange.typ==="<"){
			 lines[actchange.line] = lines[actchange.line].substring(0,actchange.pos) +
  		 												actchange.html +
  														lines[actchange.line].substring(actchange.pos+1);
		 }else {
			// if(actchange.typ ==="start"){
		 	 		lines[actchange.line] = lines[actchange.line].substring(0,actchange.pos) +
		 												actchange.html +
														lines[actchange.line].substring(actchange.pos);
				//}else{
					//lines[actchange.line] = lines[actchange.line].substring(0,actchange.pos+actchange.mdcode.length) +
		 				//								actchange.html +
					//									lines[actchange.line].substring(actchange.pos+actchange.mdcode.length);
				//}
			}
	 }

	 //add proposedsymbol:
	 if(slidenote.extensions.getThemeByName('extraoptions').showProposedSymbols){
		var lasterrorline;
	 	var x;
	 	//* before ** :
	 	var doppelsternchen = new Array();
		var carretelement = this.CarretOnElement();
		var lineswithprintederror = new Array();

	 	for(x=0;x<this.perror.length;x++){
	 			if(lasterrorline != this.perror[x].line && this.perror[x].errortext!="missing space after *"){ //only one error per line, dont parse missing space after * because it sucks
	 				//lines[this.perror[x].line]=this.perror[x].encapsulehtml(lines[this.perror[x].line]);
	 				var proposedsymbol = this.perror[x].proposeEnding();
	 				if(proposedsymbol != "" && lineswithprintederror[this.perror[x].line]==undefined){
	 					//if(this.perror[x].errorclass=="**")doppelsternchen.push(x);
						//else
						if(carretelement &&
							carretelement.line == this.perror[x].line &&
							carretelement.pos == this.perror[x].row
						){
							//do nothing when carret is on error
							let bla;
						}else{
							//print proposed symbol
							lines[this.perror[x].line]+=' <span class="proposedsymbol" name="'+x+'">'+proposedsymbol+'</span>';
							//console.log("proposedsymbol:"+proposedsymbol);
							lineswithprintederror[this.perror[x].line] = proposedsymbol;
							lasterrorline = this.perror[x].line;
						}
	 				}

	 			}

	 	}
	 	//doppelsternchenfehler anzeigen lassen:
	 	for(x=0;x<doppelsternchen.length;x++){
			let pe = this.perror[doppelsternchen[x]];
			if(carretelement &&
				carretelement.line == pe.line &&
				carretelement.pos == pe.row){
						continue;
			}
			lines[this.perror[doppelsternchen[x]].line]+='<span class="proposedsymbol" name="2">' + this.perror[doppelsternchen[x]].proposeEnding() + '</span>';
		}
	}
	//adding pagenr to pagebreak:
	for(x=1;x<this.map.pagestart.length;x++){
		var pline =this.map.pagestart[x].line-1;
		if(pline<0)pline=0;
		var pbpos = lines[pline].length;
		if(pline>0 || this.lineswithhtml[pline]==="pagebreak")lines[pline]+='<span class="pagenr">  start slide '+(x+1)+'</span>';
		changes.push({
			line:pline,
			posinall:this.map.lineend[pline],//this.map.linestart[this.perror[er].line]+lines[this.perror[er].line].length,
			pos:pbpos,
			html:'<span class="pagenr">  start slide '+(x+1)+'</span>',
			mdcode:"",
			typ:"pagenr",
			tag:"pagebreak pagenr"
		});
	}
	//console.log(this.map.pagestart);
	//putting it inside line-spans and returning as whole text:
	var temptext = "";
	var returnlines = new Array();
	for(x=0;x<lines.length;x++){
		var lineclass="backgroundline";
		var imgtemptext ="";
		var emptyline = "";
		//if(this.lineswithhtml[x]==="data" && (lines[x].length==0 || lines[x]==='<span id="carret"></span>'))emptyline="&nbsp;";
		if(lines[x].length==0 || lines[x]==='<span id="carret"></span>')emptyline="&nbsp;";
		if(slidenote.parser.lineswithhtml[x]){
			lineclass += " "+slidenote.parser.lineswithhtml[x];
		}else if(this.map.lineswithmdcodeinsidedatablock){
			lineclass +=" "+this.map.lineswithmdcodeinsidedatablock[x];
			//if(lines[x].length==0||lines[x]==='<span id="carret"></span>')emptyline="&nbsp;";
		}
		temptext += imgtemptext +
								//'<span class="linenr">'+x+'</span>'+
								'<span class="'+lineclass+'">'+lines[x]+
								emptyline+
								'</span>';

		temptext+="<br>";
		returnlines.push(temptext);
		temptext="";
	}
	//console.log("changes:");//console.log(changes);
	this.mdcodeeditorchanges = changes;
	return returnlines; //temptext;
};

emdparser.prototype.renderNewCursorInCodeeditor = function(){
	var cursorposinall = slidenote.textarea.selectionStart;
	var selstart = slidenote.textarea.selectionStart;
	var cursorline = this.lineAtPosition(cursorposinall);
	if(cursorline == 0){ //error in line0 - quickfix TODO: Why does it not work in line0?
		//slidenote.parseneu();
		//return;
	}
	var cursorposinline = cursorposinall - this.map.linestart[cursorline];
	//console.log("new cursor at line:"+cursorline+", posinall:"+cursorposinall+", pos:"+cursorposinline);
	var codeofline = this.sourcecode.substring(this.map.linestart[cursorline],this.map.lineend[cursorline]);

	var changes = new Array();
	var cursorchange = {
	 line:cursorline,
	 posinall:cursorposinall,
	 pos:cursorposinline,
	 html:'<span id="carret">&zwj;</span>',
	 mdcode:'',
	 typ:'cursor'
	};
	if(slidenote.textarea.value.charAt(cursorposinall-1)==="-"){
		cursorchange.html = '<span id="carret"></span>';
	}
	changes.push(cursorchange);
  	var issel = false;
	var ismlsel = false;
	/*
	var selectionstartline;
	var selectionlinechanges = new Array();
	var selectioncodeofline;
	var oldselection = document.getElementById("selectioncarretmarker");
	if(oldselection)oldselection.parentElement.removeChild(oldselection);
	if(cursorposinall-selstart!=0){
		//there is a selection:
		issel=true;
		var cursorendchange = {
			line:cursorline,
			posinall:cursorposinall,
			pos:cursorposinline,
			html:'</u>',
			mdcode:'',
			typ:'cursor'
		}
		changes.push(cursorendchange);
		selectionstartline = this.lineAtPosition(selstart);
		var cursorstartchange = {
			line:selectionstartline,
			posinall:selstart,
			pos:selstart - this.map.linestart[selectionstartline],
			html:'<u class="selectioncarretmarker">',
			mdcode:'',
			typ:'cursor'
		};
		if(selectionstartline!=cursorline){
			//ismlsel=true;
			selectionlinechanges.push(cursorstartchange);
			selectioncodeofline = this.sourcecode.substring(this.map.linestart[selectionstartline],this.map.lineend[selectionstartline]);

		}else{
			changes.push(cursorstartchange);
		}
	}
 */
	for(var x=0;x<this.mdcodeeditorchanges.length;x++){
		//add parsed changes of cursorline to actual changes
		if(this.mdcodeeditorchanges[x].line===cursorline &&
			 this.mdcodeeditorchanges[x].typ!='cursor')changes.push(this.mdcodeeditorchanges[x]);
		if(issel && this.mdcodeeditorchanges[x].line===selectionstartline &&
			this.mdcodeeditorchanges[x].typ!='cursor')selectionlinechanges.push(this.mdcodeeditorchanges[x]);
	}
	changes.sort(function(a,b){
		if(a.typ==="cursor"&&b.typ==="end" &&
			 a.posinall-b.posinall==0){
			return 1;
		}else if(a.typ==="end" && b.typ==="cursor"
			&& a.posinall-b.posinall===0){
			return -1;
		}else
		return a.pos-b.pos});
	if(ismlsel)selectionlinechanges.sort(function(a,b){
			if(a.typ==="cursor"&&b.typ==="end" &&
				 a.posinall-b.posinall==0){
				return 1;
			}else if(a.typ==="end" && b.typ==="cursor"
				&& a.posinall-b.posinall===0){
				return -1;
			}else
			return a.pos-b.pos});
	//console.log(changes);
	//console.log(selectionlinechanges);
	//console.log(selectioncodeofline);
	for(var x=changes.length-1;x>=0;x--){
		var actchange = changes[x];
		if(actchange.typ==="<"){
			codeofline = codeofline.substring(0,actchange.pos) +
														 actchange.html +
														 codeofline.substring(actchange.pos+1);
		}else {
		 // if(actchange.typ ==="start"){
				 codeofline = codeofline.substring(0,actchange.pos) +
													 actchange.html +
													 codeofline.substring(actchange.pos);
		}
	}
	if(ismlsel)for(var x=selectionlinechanges.length-1;x>=0;x--){
		var actchange = selectionlinechanges[x];
		if(actchange.typ==="<"){
			selectioncodeofline = selectioncodeofline.substring(0,actchange.pos) +
														 actchange.html +
														 selectioncodeofline.substring(actchange.pos+1);
		}else {
		 // if(actchange.typ ==="start"){
				 selectioncodeofline = selectioncodeofline.substring(0,actchange.pos) +
													 actchange.html +
													 selectioncodeofline.substring(actchange.pos);
		}
	}
	//console.log(changes);
	var backgroundlines = document.getElementsByClassName("backgroundline");
	if(backgroundlines.length>cursorline)backgroundlines[cursorline].innerHTML=codeofline;
	if(ismlsel && selectionstartline<backgroundlines.length)backgroundlines[selectionstartline].innerHTML = selectioncodeofline;
	//console.log("backgroundline neu:"+codeofline);
	//console.log(backgroundlines[cursorline]);
	//console.log(slidenote.textarea.clientWidth + " : "+slidenote.texteditorerrorlayer.clientWidth)
	for(var x=0;x<slidenote.extensions.themes.length;x++){
		if(slidenote.extensions.themes[x].active)slidenote.extensions.themes[x].styleThemeMDCodeEditor(); //Hook-Funktion
	}
	this.setDropDownMenu();
};

/*
i think this is old and has to be deleted:
*/
emdparser.prototype.renderCodeeditorImagePreview = function(){
	var images = new Array();
	var lines = this.returnparsedlines(this.sourcecode); //raw sourcecode

	for(var x=0;x<this.map.insertedhtmlelements.length;x++)if(this.map.insertedhtmlelements[x].typ ==="image")images.push(this.map.insertedhtmlelements[x]);
	//images is now filled with all image-elements
	images.sort(function(a,b){return a.posinall -b.posinall}); //sort them
	for(var x=0;x<lines.length;x++){
		lines[x]="";
	}
	//lines are now empty

	for(var x=0;x<images.length;x++){
		img = images[x];
		if(lines[img.line]===""){
			var beforetmp="";
			var arrowtoimage="";
			for(var bf=0;bf<img.pos+img.mdcode.length;bf++)beforetmp+="&nbsp;";
			var afterspace = 75-img.pos-img.mdcode.length;//(slidenote.textarea.clientWidth / 16) - img.pos - img.mdcode.length;
			for(var ai=0;ai<afterspace;ai++)arrowtoimage+="-";
			lines[img.line]+=beforetmp+arrowtoimage+">";
			//console.log(slidenote.textarea.clientWidth + ":clientwidth"+ beforetmp+arrowtoimage+afterspace);
		}
		if(img.src.substring(0,4)!="http" && slidenote.base64images){
			//base64images is active, so check if image is in database:
			if(slidenote.base64images.imageByName(img.src)!=null){
				//base64image found in database:
				//console.log("image found: "+img.src);
				lines[img.line]+= '<img src="'+slidenote.base64images.imageByName(img.src).base64url+'">';
			}else{
				//base64image not found in database:
				//console.log("imagesrc:"+img.src);
				//imgurl = "images/imageupload.png";
				lines[img.line]+= '<img src="images/imageupload.png">';
			}
		} else {
			lines[img.line]+='<img src="'+img.src+'">';
		}
	}
	var imgtemptext ="";
	for(var x=0;x<lines.length;x++)imgtemptext+='<span>'+lines[x]+"&nbsp;</span><br>";
	return imgtemptext;
}


/*	sets the dropdown menu for the context-menu
*
*/
emdparser.prototype.setDropDownMenu = function (){
	//var timecheckstart = new Date();
	//var timecheckposition;
	//carretsymbol.innerHTML='&nbsp;<img src="images/buttons/droptilde.png">&nbsp;<img src="images/buttons/cursorline.png">';
	var nicesymbol = document.getElementById("nicesidebarsymbol");//document.createElement("div");
	//nicesymbol.id="nicesidebarsymbol";
	//var carretsymbol = document.getElementsByClassName("carretline")[0];
	var sidebar = document.getElementById("sidebar");
	//var newtop = carretsymbol.offsetTop + sidebar.offsetTop;
	var carret = document.getElementById("carret");
	//if(!nicesymbol || !sidebar || !carret){
	//	if(nicesymbol){
	//		nicesymbol.style.top="10px";
	//		document.getElementById("insertarea").style.visibility = "hidden";
	//	}else{
	//		return;
	//	}
	if(slidenote.editormodus==="raw-text" || slidenote.editormodus==="audio-mode"){
		nicesymbol.style.top="10px";
		nicesymbol.classList.remove("top");
	} else {
		if(carret===null || carret===undefined){
			console.warn("carret not found in setDropDownMenu");

			return;
		}
		//look out for attached menu:
		var insertmenu = document.getElementById("insertarea");
		if(insertmenu && insertmenu.style.visibility==="visible"){
			//setTimeout("slidenote.presentation.showInsertMenu(); document.getElementById('insertarea').getElementsByTagName('button')[0].focus();",1);
			//insertmenu.style.visibility==="hidden";
		}

		var newtop = carret.parentElement.offsetTop + sidebar.offsetTop;
		newtop -=3;
		newtop -= slidenote.textarea.scrollTop;
		nicesymbol.classList.remove("out")
		nicesymbol.style.opacity=null;
		if(newtop<slidenote.textarea.offsetTop-20){
			var diff = slidenote.textarea.offsetTop - 20 - newtop;
			diff = diff / 2000;
			if(diff>1)diff=1;
			diff=1-diff;
			nicesymbol.style.opacity = diff;
			newtop=slidenote.textarea.offsetTop-20;
			nicesymbol.classList.add("out");

		}else if(newtop>slidenote.textarea.offsetHeight + slidenote.textarea.offsetTop - (nicesymbol.offsetHeight/2)){
			var diff = newtop - (slidenote.textarea.offsetHeight + slidenote.textarea.offsetTop - (nicesymbol.offsetHeight/2));
			diff = diff / 2000;
			if(diff>1)diff=1;
			diff=1-diff;
			nicesymbol.style.opacity = diff;
			newtop = slidenote.textarea.offsetHeight + slidenote.textarea.offsetTop - (nicesymbol.offsetHeight/2);
			nicesymbol.classList.add("out");
		}

		nicesymbol.style.top = newtop +"px";
		//hack für safari:
		//var sidebar = document.getElementById("sidebar");
		//nicesymbol.style.left = sidebar.offsetLeft + "px";
	}
	//timecheckposition = new Date();
	//nicesymbol.style.position="absolute";
	var celement = slidenote.parser.CarretOnElement();
	var nicelabel = document.getElementById("nicesidebarsymbollabel");
	var nicecontainer = document.getElementById("nicesidebarsymbolcontainer");
	if(nicecontainer)nicecontainer.style.visibility = "visible";
	if(celement && celement.label){
		nicelabel.innerText = celement.label;
	}else if(celement && celement.dataobject){
		nicelabel.innerText = celement.dataobject.type;
	}else{
		if(nicecontainer)nicecontainer.style.visibility = "hidden";
		nicelabel.innerText = "";
	}

	//for code-area add class so carret can change color:
	let insidecodearea = (celement!=undefined && (celement.label==="code" || celement.tag==="inlinecodestart"));
	slidenote.textarea.classList.toggle("insidecodearea",insidecodearea);
	//console.log("nicesymbol:"+nicesymbol.style.top+"carretsymbol:"+carretsymbol.offsetTop);
	//nicesymbol.innerHTML='&nbsp;<a href="javascript:slidenote.presentation.showInsertMenu();"<img src="images/buttons/droptilde.png"></a>&nbsp;<img src="images/buttons/cursorline.png">';
	//var timecheckend = new Date();
	//console.log("Timecheck: insertmenu internal: positioning: "+(timecheckposition-timecheckstart) + "Ms; labelsetting: "+(timecheckend-timecheckposition)+"Ms");

}


/* Returns the element in the map the current carret is on
 * usefull for many things in the md-Code-Editor
 * returns null if there is no element
*/
emdparser.prototype.CarretOnElement = function(carrethardpos, secondcall){
	var element;
	var carretpos = carrethardpos;
	if(carretpos===undefined || carretpos ===null)carretpos = slidenote.textarea.selectionEnd;
	var line = this.lineAtPosition(carretpos);
	this.map.insertedhtmlinline[line].sort(function(a,b){return a.pos-b.pos;});
	for(var x=0;x<this.map.insertedhtmlinline[line].length;x++){
		var actel = this.map.insertedhtmlinline[line][x];
		var actelstart = actel.posinall;
		var actelend = actel.posinall+actel.mdcode.length ;
		//var linenr = this.lineAtPosition(carretpos);
		//if(this.map.lineswithhtml[linenr]==="data")
		if(actel.mdcode.substring(0,1) === "#"){actelstart --; actelend = this.map.lineend[actel.line];} //TODO:linepos
		if(actel.typ==="start" && actel.brotherelement)actelend = actel.brotherelement.posinall+actel.brotherelement.mdcode.length;
		if(actel.typ==="end")actelend = 0; //do nothing on end-elements
		if(actel.html ==="<section>"){actelstart--;actelend++;}
		if(actel.typ==="end" && actel.brotherelement &&
			actel.brotherelement.dataobject){
				actelstart = actel.brotherelement.posinall;
				actelend = actel.posinall+actel.mdcode.length;
				actel = actel.brotherelement;};

		if(actelstart<=carretpos && actelend >= carretpos){
			//element getroffen:
			var allowed = "###***__~~"
			element = actel;
			//break;
		}

	}
	if(element == null){
		var linetype = this.lineswithhtml[line];
		if(linetype === "pagebreak" || linetype === "h1"
				&& this.map.insertedhtmlinline[line].length ===1){
			element = this.map.insertedhtmlinline[line][0];
		}
		if(linetype==="code" || linetype==="data"){
			var sline = line;
			while(sline>=0 && this.lineswithhtml[sline]===linetype)sline--;
			sline++;
			element = this.map.insertedhtmlinline[sline][0];
		}
		if(linetype && (linetype.indexOf("list")>=0)){
			var eil = this.map.insertedhtmlinline[line];
			for(var ex=0;ex<eil.length;ex++)if(eil[ex].html==="<li>"){
				element=eil[ex];
				break;
			}
		}
		if(linetype==="quote"){
			//console.log("quotelog:start");
			var eil = this.map.insertedhtmlinline[line];
			//console.log("quotelog:");console.log(eil);
			for(var ex=0;ex<eil.length;ex++){
				//console.log("quotelog:"+eil[ex].label);
				if(eil[ex].label==="quote"){
				//console.log("quotelog:"+eil[ex].label);
				element=eil[ex];
				break;
			}}

		}
		var otherlinetype;
		if(this.map.lineswithmdcodeinsidedatablock)otherlinetype = this.map.lineswithmdcodeinsidedatablock[line];
		if(element ==null && (otherlinetype==="layout" || otherlinetype==="node")){
			var lline = line;
			for(lline = line;lline>=0;lline--){
				var eil = this.map.insertedhtmlinline[lline];
				var eilfound=false;
				for(var eilx=0;eilx<eil.length;eilx++){
					if(eil[eilx].dataobject && eil[eilx].dataobject.type===otherlinetype){
						element=eil[eilx];
						eilfound=true;
						break;
					}
				}
				if(eilfound)break;
			}
		}

	}
	//console.log(element);
	if(element && slidenote.textarea.selectionEnd-slidenote.textarea.selectionStart!=0 && !secondcall){
		var secondelement = this.CarretOnElement(slidenote.textarea.selectionStart,true);
		if(secondelement && secondelement.parentelement && element.parentelement &&
				element.parentelement===secondelement.parentelement)return element;
		if(secondelement!=element)return null;
	}
	return element;
}

/* *carretInsideTag: function to check if carret is inside a tag of given tag
this is usefull for checking if we want to know if we are inside the tag, even
if the carret is inside another tag. for example "a*bcd**ef|gh**i*j" CarretOnElement
would return the inner ** but if we want to check if we are inside a * this
function should be used instead
@param carretpos: position to check for - if null act textarea.selectionEnd is used
@param tag: tag to look out for
* returns start-element or false
*/

emdparser.prototype.carretInsideTag = function(carretpos, tag, morethansimple){
	let actpos = carretpos || slidenote.textarea.selectionEnd;
	let actel = this.CarretOnElement(actpos);
	if(actel==undefined)return false;
	if(actel.mdcode==tag)return actel;

	let simpleelements = slidenote.parseelemente || slidenote.parser.parseelemente;
	if(!simpleelements)return false;
	let allElementsInLine = slidenote.parser.map.insertedhtmlinline[actel.line];
	if(typeof tag =='string'){
		//comes from toolbarbutton
		let nr = -1;
		let html = "€€€€€€€€€€€";
		for (let x=0;x<simpleelements.length;x++){
			if(simpleelements[x].emdstart==tag){
				nr = x;
				html = simpleelements[x].htmlstart;
				break;
			}
		}
		if(nr==-1 && !morethansimple)return false;
		let starte; let ende;
		for(let x=0;x<allElementsInLine.length;x++){
			if(allElementsInLine[x].typ=='start' && allElementsInLine[x].brotherelement){
				let a = allElementsInLine[x];
				let b = a.brotherelement;
				if(a.html.indexOf(html)>-1 && a.posinall<actpos && b.posinall>=actpos){
					starte=a;
					return a;
				}
			}
		}
	}
}

/*	* replace: method to avoid using regex
@param text: string to search through,
@param symbol: string to look out for in text
@param newsymbol: replacement-string for symbol
*	returns a string with replaced symbols
 */

emdparser.prototype.replace = function(text,symbol,newsymbol){
	var temptext = text;
	var letztertreffer=0;
	while(temptext.indexOf(symbol, letztertreffer)>=0){
		var treffer=temptext.indexOf(symbol,letztertreffer);
		temptext = temptext.substring(0,treffer)+newsymbol+temptext.substring(treffer+symbol.length);
		//letztertreffer=treffer+1;
	}
	return temptext;
};
/* 	* sanitizeemdcodeline(text)
	* wechselt emdzeichen im text (aktuelle line) durch html-code aus, damit sie nicht geparst werden:
	* gibt string mit sanisiertem text zurück.
 	* soll ersetzen: *	 		> 	  ~ 	# [91,93 ] (40,41) < |124
 	* durch		: &lowast;  &gt; &tilde; &#91,93,40,41; &lt;
 */

emdparser.prototype.sanitizeemdcodeline = function(text){
	var santext = text;
	//lt rausnehmen, da es an andrer stelle ja bereits ist. hier nur emd-code sanitizen
	var oldsymbol = new Array("*",">","~","_","#",						"[","]",		"(",")","|","-",". ");
	var newsymbol = new Array("&lowast;","&gt;","&tilde;","&lowbar;","&num;","&#91;","&#93;","&#40;","&#41;","&#124;","&#45;",".&nbsp;");
	for(var sym=0;sym<oldsymbol.length;sym++)santext = this.replace(santext,oldsymbol[sym],newsymbol[sym]);
	return  ""+santext;
};

emdparser.prototype.sanitizedemdcodelinepositions = function(text){
	//sucht positionen raus von den symbolen und liefert sie im array zurück
	var hotpos = new Array();
	var oldsymbol = new Array("*",">","~","_","#",						"[","]",		"(",")","|","-",". ");
	//var newsymbol = new Array("&lowast;","&gt;","&tilde;","&lowbar;","&num;","&#91;","&#93;","&#40;","&#41;","&#124;","&#45;",".&nbsp;");
	for(var sym=0;sym<oldsymbol.length;sym++){
		//santext = this.replace(santext,oldsymbol[sym],newsymbol[sym]);
		var aktpos = 0;
		while(text.indexOf(oldsymbol[sym], aktpos)>-1){
			hotpos.push(text.indexOf(oldsymbol[sym],aktpos));
			aktpos=text.indexOf(oldsymbol[sym],aktpos+1);
		}
	}
	if(hotpos.length>1)hotpos.sort(function(a,b){return a - b});
	return hotpos;
}
emdparser.prototype.sanitizedcodepositions = function(text){
	var newsymbol = new Array("&lowast;","&gt;","&tilde;","&lowbar;","&num;","&#91;","&#93;","&#40;","&#41;","&#124;","&#45;","&nbsp;");
	var codepos = new Array();
	var text= this.replace(text, "&lt;", "<"); //html wurde bereits ausgetauscht, daher gefährlich!
	for(var sym=0;sym<newsymbol.length;sym++){
		var aktpos=0;
		while(text.indexOf(newsymbol[sym],aktpos)>-1){
			codepos.push(new Array(text.indexOf(newsymbol[sym],aktpos),newsymbol[sym]));
			//alert(aktpos+newsymbol[sym]);
			aktpos=text.indexOf(newsymbol[sym],aktpos)+1;
		}
	}
	if(codepos.length > 1)codepos.sort(function(a, b){return a[0] - b[0]});
	//codepos ist jetzt sortiert, um auf richtige position im source zu kommen jetzt zeichen abziehen
	//ab dem zweiten element die länge des vorherigen elements -1 steigend
	var veraenderung=0;
	for(var f=0;f<codepos.length;f++){
		codepos[f][0]-=veraenderung;
		veraenderung+=codepos[f][1].length-1;
	}
	//console.log("codepositions: vom text:"+text);
	//console.log(codepos);
	//console.log(this.insertedhtmlinline);
	return codepos;
};

/*	pageAtPosition: searchs for page at Position in sourcecode
@param position:position in sourcecode
@param mode: pagenr, pagepos or null
 *	returns: number of page or position of last page-begin
 or array with both - depending on mode
*/
emdparser.prototype.pageAtPosition = function(position, mode){
	//sucht die page raus vom selection-text
	var aktpos = 0;
	var altpos = 0;
	var pagecount = 0;
	while(this.sourcecode.indexOf("\n---",aktpos)<position && aktpos>-1){
		altpos = aktpos;
		aktpos = this.sourcecode.indexOf("\n---",aktpos+6);
		pagecount++;
	}
	if(pagecount>0)pagecount--; //pagecount auf richtige seite bringen
	//altpos ist jetzt die position vom letzten page-start
	if(mode=="pagenr") return pagecount;
	if(mode=="pagepos") return altpos;
	if(mode==null) return new Array(pagecount, altpos);
}
/* positionAtPage: sucht die anfangsposition der gefragten seite heraus
 * erwartet: pagenummer returns: position
*/
emdparser.prototype.positionAtPage = function(page){
	var position = 0;
	var aktpos =0;
	//console.log("searching for position of page "+page+"...");
	for(var x=0;x<page;x++){
		if(aktpos>-1){
			position=aktpos;
			aktpos=this.sourcecode.indexOf("\n---",aktpos+4);
		}
	}
	if(aktpos>position)position=aktpos+5;
	//console.log("found position at:"+position);
	return position;
}


/*comparePages:
* compares slidenotes by pages. meant to cutting rendering to
* only changed content. is it used right now?
* was created for sideBar but could be used by other
* means to fasten up rendering and such
*/
emdparser.prototype.comparePages = function(){
	var oldparser = slidenote.oldparser;
	var newparser = slidenote.parser;
	var oldpages = oldparser.map.pagesCode;
	var newpages = newparser.map.pagesCode;
	//var starttime = new Date();

	var startpage = null;
	if(!oldpages)return;
	for(var x=0;x<newpages.length;x++){
		if(x>oldpages.length)break;
		if(oldpages[x]!=newpages[x]){
			startpage=x;
			break;
		}
	}
	//console.log("startpage found:"+startpage);
	//console.log("oldpages0:'"+oldpages[0]+ "', newpages0:'"+newpages[0]+"'");

	if(startpage===newpages.length-1){
		//console.log("startpage is last page - return"+startpage);
		return {start:startpage, end:startpage};
	}
	if(startpage===null){
		//console.log("startpage is null - no changes happened");
		return{start:null, end:null};
	}
	var endpage;
	var oldendpage;
	for(var y=0;y<5;y++){
		var searchpage = oldpages[startpage+y];
		for(var x=1;x<6;x++){
			if(startpage+x>=newpages.length)break;
			var newpage = newpages[startpage+x];
			if(newpage===searchpage){
				endpage=startpage+x;
				oldendpage = startpage+y;
				break;
			}
		}
		if(startpage+y>=oldpages.length || endpage!=null)break;
	}

	//sonderfall:
	if(startpage<oldpages.length-1 && oldpages[startpage]===oldpages[startpage+1]){
	/*var olddiffpage = oldpages[startpage];
	var oldfoundpage;
	var olddiffpagepos;
		for(var x=startpage+1;x<oldpages.length;x++){
			if(oldpages[x]!=olddiffpage){oldfoundpage=oldpages[x];break;}
		}
		for(var x=startpage+1;x<newpages.length;x++){
			if(newpages[x]===oldfoundpage){endpage=x;break;}
		}
	*/
	//console.log("sonderfall: startpage:"+startpage+" end: null")
	return{start:startpage, end:null};
	}
	//console.log("startpage:"+startpage+" endpage:"+endpage+" oldendpage:"+oldendpage);
//	var endtime = new Date();
//	var usedtime = endtime - starttime;
//	console.log("Timecheck: comparing Pages needed "+usedtime+"Ms");
	if(startpage>=0 && endpage >0 && oldendpage>0){
		return{start:startpage, nextEqualPage:endpage, nextEqualPageInOld:oldendpage,
				startline:newparser.map.pagestart[startpage].line,
				endline:newparser.map.pageend[endpage-1].line,
				oldendline:oldparser.map.pageend[oldendpage-1].line};
	}
  return {};
}

/*helper function to check if line is empty or just contains blanks and should be considered as such*/
emdparser.prototype.lineIsEmpty = function(line){
	for (var x=0;x<line.length;x++){
		if(line.charAt(x)!=" ")return false;
	}
	return true;
}


/* 	renderMapToPresentation is a function which takes the map and lineswithhtml
*		information to prerender the presentation-page. it renders into pure basic html
* 	with pagebreaks and such
*/
emdparser.prototype.renderMapToPresentation = function(){
  var lines = this.returnparsedlines(this.sourcecode);
  var changes = this.map.insertedhtmlelements;
	//find imagelines:
	for(var im=0;im<this.map.insertedimages.length;im++){
		var actimg = this.map.insertedimages[im];
		if(this.lineswithhtml[actimg.line]==="imageline")continue; //do nothing if imageline is set yet to avoid duplicates
		//find images-md-code in line:
		var imgLength = 0;
		var imgMdCode = "";
		var imagesInLine = new Array();
		for(var el=0;el<this.map.insertedhtmlinline[actimg.line].length;el++){
			if(this.map.insertedhtmlinline[actimg.line][el].typ ==="image"){
				imgLength += this.map.insertedhtmlinline[actimg.line][el].mdcode.length;
				imagesInLine.push(this.map.insertedhtmlinline[actimg.line][el]);
				imgMdCode += this.map.insertedhtmlinline[actimg.line][el].mdcode;
			}
		}
		if(imgLength === lines[actimg.line].length){
			//there are only images in this line, because md-code is just image-md-code
			this.lineswithhtml[actimg.line]="imageline";
			//console.log("simple imageline found"+actimg.line);
		} else{
			//there could be spaces inside this line
			//console.log("not so simple imageline found"+actimg.line);
			var imgline = lines[actimg.line];
			imgline = imgline.replace(/\s/g,"");
			imgMdCode = imgMdCode.replace(/\s/g,"");
			//console.log("imageline:"+imgline+"\nimgMdCode:"+imgMdCode);
			if(imgline.length === imgMdCode.length){
				this.lineswithhtml[actimg.line]="imageline";
			}
		}
	}//end imagelines
  //add missing parts to changes - eg p-tags, imageblock, empty line etc.
  for(var lwh=0;lwh<lines.length;lwh++){
    if(this.lineswithhtml[lwh]==null&& (lines[lwh].length==0 || slidenote.parser.lineIsEmpty(lines[lwh]))){
      this.lineswithhtml[lwh]="empty";
    }else if(this.lineswithhtml[lwh]==null){

      this.lineswithhtml[lwh]="text";
      var linestart = this.map.linestart[lwh];
      changes.push({
				line:lwh, pos:0, posinall:linestart,
				html:"<p>", mdcode:"", typ:"start",
				weight:0
			});

			//add span to first line:
			//add span:
			changes.push({
				line: lwh, pos:0, posinall: linestart,
				html:'<span class="">', mdcode:"", typ:"start",weight:0.1
			});
			changes.push({
				line: lwh, pos:lines[lwh].length, posinall: linestart + lines[lwh].length,
				html:"</span>", mdcode:"", typ:"start",weight:8
			});
			//*/
      var followlines=lwh+1;
      while(followlines<lines.length && lines[followlines].length>0 &&//dont parse in empty lines, break on them
							(this.lineswithhtml[followlines]==null || this.lineswithhtml[followlines]==="imageline")
              ){
        this.lineswithhtml[followlines]="text";
				//add span to line:
				//check for imageline
				let lineclass="";
				if(this.map.insertedhtmlinline[followlines].length>0){
					let linecode = lines[followlines];
					let imginline = this.map.insertedhtmlinline[followlines].filter(el => el.typ=="image").sort((a,b)=>b.pos-a.pos);
					for (let x=0;x<imginline.length;x++){
						linecode = linecode.substring(0,imginline[x].pos)+linecode.substring(imginline[x].pos+imginline[x].mdcode.length);
					}
					if(imginline.length>0 && this.lineIsEmpty(linecode))lineclass="imageline"
				}
				changes.push({
					line: followlines, pos:0, posinall: this.map.linestart[followlines],
					html:'<span class="'+lineclass+'">', mdcode:"", typ:"start",weight:0
				});
				changes.push({
					line: followlines, pos:lines[followlines].length, posinall: this.map.lineend[followlines],
					html:"</span>", mdcode:"", typ:"start",weight:8
				});
				// */
        followlines++;
        //console.log("fll++");
      }
	    followlines--; //followlines geht jetzt bis zur letzten zeile
	    var lineend = this.map.lineend[followlines];

	    changes.push({line:followlines, pos:lines[followlines].length,
	      posinall:lineend, html:"</p>", mdcode:"", typ:"start", weight:10});
	  	}//lineswithhtml==null
			if(this.lineswithhtml[lwh]==="imageline"){
				//search for imageblock:
				var followlines = lwh+1;
				while(followlines < lines.length && lines[followlines].length>0 &&
					(this.lineswithhtml[followlines]==null || this.lineswithhtml[followlines]=="imageline")
				){
					this.lineswithhtml[followlines]="imageblock";
					followlines++;
				}
				followlines--;
				if(lwh<followlines){
					this.lineswithhtml[lwh]="imageblock";
					var lineend = this.map.lineend[followlines];
					changes.push({
						line:lwh, pos:0, posinall: this.map.linestart[lwh],
						html:'<div class="imageblock">',mdcode:"",typ:"start",
						weight:0
					});
					changes.push({line:followlines, pos:lines[followlines].length,
					posinall:lineend, html:"</div>", mdcode:"", typ:"end",weight:10});
					//add brs to lines:
					for(var brx=lwh;brx<followlines;brx++)
					changes.push({
						line:brx, pos:lines[brx].length,
						posinall:this.map.lineend[brx],
						html:"<br>", mdcode:"", typ:"end", weight:9
					});

				}
			}//end of imageblock-search
	} //end of for

  changes.sort(function (a,b){
		if(a.posinall!=b.posinall) return a.posinall-b.posinall;
		if(a.weight!=undefined && b.weight!=undefined) return a.weight - b.weight;
		var x = a.weight;
		var y = b.weight;
		if(x===undefined)x=1;
		if(y===undefined)y=1;
		return x-y;
	});
	//console.log("changes of parsetopresentation");//console.log(changes);
  //helper function for change:
  function execute(element){
    line = lines[element.line];
    begin = element.pos;
    end = element.pos + element.mdcode.length;
    line = line.substring(0,begin)+element.html+line.substring(end);
    lines[element.line]=line;
  }
	//console.log(changes);
  for(var x=changes.length-1;x>=0;x--){
    var change = changes[x];
		//console.log(change);
    if(change.tag==="title"){
			//console.log("title found");
      lines[change.line] = change.html + lines[change.line].substring(change.mdcode.length)+change.htmlend;
    }else{
      execute(change);
    }
  }

  var temptext ="";
  for(var lx=0;lx<lines.length;lx++){
		temptext +=lines[lx];
		//if(lines[lx].indexOf(">",lines[lx].length-2)==-1 && lines[lx].substring(0,5)!="-----")temptext+="<br>";
		if(this.lineswithhtml[lx]=="text" && lines[lx].indexOf("</p>")==-1 && lx<lines.length-1)temptext+="<br>";
		//if(this.lineswithhtml[lx]=="code"&& lx<lines.length-1)temptext+="<br>";
		//if(this.lineswithhtml[x]=="text")alert(lines[x]+lines[x].indexOf("</div>"));
		//alert(this.lineswithhtml[x]);
		if(lx<lines.length-1)temptext +="\n";

	}
	this.parsedcode=temptext;
  this.parselines(temptext);

}


/*  parseMap is the parsefunction which parses the lines of the sourcecode into
 +  a map (parser.map) and into lineswithhtml (parser.lineswithhtml)
 + with this information the page can be rendered for mdcodeeditor and page later on
 */
emdparser.prototype.parseMap = function(){
  var TimecheckStart = new Date().getTime();
  //new parser parsing only information, does not render anything
  function substitutewitheuro(textlength){
    var signs = "€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€";
    while(textlength>signs.length)signs+=signs;
    return signs.substring(0,textlength);
  }
	var sourcecode = this.sourcecode;
	//sourcecode  = sourcecode.replace(/(\S)([_])(\S)/g,"$1€$3");
	//sourcecode  = sourcecode.replace(/([^\s_])([_])(\S)/g,"$1€$3");
	//console.log("Timecheck: replace T_T needed:"+(new Date().getTime() - TimecheckStart));
  var lines = this.returnparsedlines(sourcecode);
	var origlines = lines.slice(0);
	this.map.origLines = origlines;
  var linestartpos = 0;
	this.map.sidebarelements = new Array();

  //sort out <:
  for(var x=0;x<lines.length;x++){
    var symbols = ["<", "&", '\\***', "\\**", "\\*", "\\__", "\\_", "\\~~", "\\![", "\\```","\\`"];
    var newsymbols = ["&lt;","&amp;", "***", "**","*","__","_", "~~", "![","```", "`"];
    var temptext = lines[x];
		for(var s=0;s<symbols.length;s++){ //its not working for some reason so avoid it
			var symbol = symbols[s];
			var newsymbol = newsymbols[s];
	    while(temptext.indexOf(symbol)>=0){
	      var actpos = temptext.indexOf(symbol);
	      temptext = temptext.substring(0,actpos)+substitutewitheuro(symbol.length)+temptext.substring(actpos+symbol.length);
	      this.map.addElement({
	        line:x,pos:actpos,posinall:linestartpos+actpos,
	        html:newsymbol,mdcode:symbol,typ:"<"
	      });
	    }
		}
    lines[x]=temptext;
    linestartpos+=lines[x].length+1; //+1 for \n
  } //end of <

  //scann all lines:
  for(var x=0;x<lines.length;x++){
    var linestart = lines[x].substring(0,1);

    //scan line for title
    if(linestart === "#"){
      var rauten="#";
      //how many? as jakob only wants till ### we just check it this way:
      if(lines[x].substring(0,2)==="##")rauten="##";
      if(lines[x].substring(0,3)==="###")rauten="###";
			var label = ["title","chapter title","section title"];
      var ersatz = "€€€";
      ersatz = ersatz.substring(0,rauten.length);
      this.map.addElement({
				line:x,pos:0,html:"<h"+rauten.length+">",mdcode:rauten,
				typ:"start", tag:"title", htmlend:"</h"+rauten.length+">",
				label: label[rauten.length-1]
			});
			this.lineswithhtml[x]="h"+rauten.length;
			var rautentext = ["", "H1", "H2", "H3"];
			this.map.sidebarelements.push({
				typ:"singleline",text:rautentext[rauten.length],
				startline:x, endline:x
			});
    }//end title
		//scan for lists:
		/*	SCAN FOR LISTS (ul and ol)
		*		This part needs regex, and because lists can be recursive
		*  	ol and ul should be both treaded as list.
		* 	findthemall: regex which finds every possible combination of list-md-code:
		*  numlistregexlist: every valid combination as separate regexlist (has to start without spaces)
		*		linetosearch: as we go with spaces in front, we have to get rid of them before
		* 								we check against a valid regex
		*		Big TODO: Can i prevent regex as much as possible?
		*/

		var findthemall = /^(\s*)([\+\-\*]|(\s*)([0-9]+(\.|\)|\.\))|([a-z]|[IVX]+)\)))\s/;
		var listspaces = -1;
		if(this.lineswithhtml[x]==undefined || this.lineswithhtml[x].substring(0,7)==="sublist")
		listspaces = lines[x].search(findthemall);
		//console.log("listsearch:"+lines[x]+"->"+listspaces);
		if(listspaces>-1){
		  //setting listspaces to right pos:
		  listspaces = lines[x].search(/\S/);
		  if(listspaces==-1)listspaces=0; //is it really necesary?
		  var linetosearch = lines[x].substring(listspaces);
		  //found a new list:
		  var numlistregexlist = [
													/^[0-9]+\.\s/, //1. - regex#0 ul
		                      /^[0-9]+\.\)\s/, //1.) - regex#1 ul
		                      /^[0-9]+\)\s/, //1) - regex#2 ul
		                      /^[a-z]\)\s/, //a) - regex#3 ul
		                      /^[IVX]+\)\s/, //I) - regex#4 ul
		                      /^\-\s/, //"- " - regex#5 ol
		                      /^\*\s/,  //"* " -regex#6 ol
													/^\+\s/   //"+ "- regex#7 ol
												];
			var numlistsymbollist = [
				"1. ", "1.) ","1) ","a) ","I) ","- ","* ", "+ "
			];
			var listclasses = [
				"num", "numpointparenthesis", "numparenthesis", "alphabetical", "latin", "minus", "star","plus"
			]
		  var nlregnr;
		  //get the right regex to search for:
		  for(var nlrit=0;nlrit < numlistregexlist.length;nlrit++){
		    if(linetosearch.search(numlistregexlist[nlrit])===0){
		      nlregnr = nlrit;
		      break;
		    }
		  }
		  //nlregnr is now the right regex to find the list in further lines
		  var listregex = numlistregexlist[nlregnr]; //save the regex for easier writing
		  var listtyp = "ul";
		  if(nlregnr < 5){ //5 and upward are ul, else is ol, check if you add another regex above
		    listtyp = "ol";
		  }
		  var start ="";
		  if(listtyp === "ol"){
		    //get start for ol:
		    if(nlregnr<2)start = ' start="'+lines[x].substring(listspaces,lines[x].indexOf("."))+'" ';
		    if(nlregnr>=2)start = ' start="'+lines[x].substring(listspaces,lines[x].indexOf(")"))+'" ';
		  }
			let listclass=listclasses[nlregnr];
		  var liststarthtml = '<'+listtyp+start+' class="'+listclass+'">';
			var listzeichenarr = [". ", ".) ", ") ", ") ", ") ", "- ", "* ", "+ "];
		  var listzeichen = listzeichenarr[nlregnr];
			// add ul/ol-tag element to map:
			var listtmpelement = {
		    line:x, pos:0, html:liststarthtml, mdcode:"", typ:"start",
		    weight:1, tag:"liststart", listtyp:listtyp, label:"list",
				listregex: listregex, listmarker: listzeichen, olstart:start,
				listchilds:[], listmdsymbol: numlistsymbollist[nlregnr],
		  };
			this.map.addElement(listtmpelement);

		  var listmdcode = lines[x].substring(0,lines[x].indexOf(listzeichen)+listzeichen.length);
			//add first li-tag element to map:
		  var listtmpli = {
		    line:x, pos:0, html:"<li>", mdcode: listmdcode,
		    typ:"start", parentelement:listtmpelement,
		    tag:listtyp+"-li-start", weight:2, label:"list"
		  }
			this.map.addElement(listtmpli);
			listtmpelement.listchilds.push(listtmpli);
		  //ol/ul-start-tag + first li-tag are now set
			//get weight of list - as to mean which number of recursion are we in
			var listweight = 0;
			//sublist-check in lineswithhtml:
			if(this.lineswithhtml[x]&&
				this.lineswithhtml[x].substring(0,7)==="sublist"){ //only on lineswithhtml == list are we on a sublist.
				//console.log(this.map.insertedhtmlinline[x-1][0])
				listweight+=this.lineswithhtml[x].length - 7;
			}
			//console.log("listweight:"+listweight+"lineswithhtml:"+this.lineswithhtml[x]);
		  var listx = x+1;
		  var sublist = false;
		  var listfound = true; //= (linetosearch.search(listregex)===0);
		  var otherlistfound = true;// = (linetosearch.search(findthemall)===0);
			//get rid of list-md-code in line:
			lines[x] = substitutewitheuro(listmdcode.length)+lines[x].substring(listmdcode.length);
			//console.log("found list "+listtyp+" in line "+x+" with start "+liststarthtml+"\nnew lines-x:"+lines[x]);
			//start looking for further list till end of list
		  for(listx=x+1;listx<lines.length;listx++){
		    linetosearch=lines[listx].substring(listspaces); //get line to search for
		    listfound = (linetosearch.search(listregex)===0);
		    otherlistfound = (linetosearch.search(findthemall)===0);
				//console.log("listsearch: listfound:"+listfound+"otherlistfound:"+otherlistfound);
		    if(!listfound && otherlistfound && !sublist){
		      //other listtype found: add br to last line
		      this.map.addElement({
		        line:listx-1, pos:lines[listx-1].length, html:"<br>", mdcode:"",
		        typ:"end", label:"list",
		        tag:listtyp+"-sublist-start-br", weight:3+listweight
		      });
		      sublist = true;
					//add sublist to lineswithhtml:
					if(this.lineswithhtml[listx]&&this.lineswithhtml[listx].substring(0,7)==="sublist"){
						this.lineswithhtml[listx]+="€€€€€";//with this we add 5 to the linesweight;
					} else{
						this.lineswithhtml[listx]="sublist€€€€€";
					}
		    } else if(!listfound && otherlistfound){
		        //other listtype found, but we are in a sublist, so just continue search:
						//add sublist to lineswithhtml:
						if(this.lineswithhtml[listx] && this.lineswithhtml[x].substring(0,7)==="sublist"){
							this.lineswithhtml[listx]+="€€€€€";//with this we add 5 to the linesweight;
						} else{
							this.lineswithhtml[listx]="sublist€€€€€";
						}

		    } else if(listfound && sublist){
		      //found other element of origlist, so close sublist in previous line:
		      this.map.addElement({
		        line:listx-1, pos:lines[listx-1].length, html:"</li>", mdcode:"",
		        typ:"end", label:"list",
		        tag:listtyp+"-sublist-end-li", weight:3+listweight,
						whitespaces:listspaces
		      });
		      sublist = false;
					//get mdcode for list-start-element:
					listmdcode = lines[listx].substring(0,lines[listx].indexOf(listzeichen)+listzeichen.length);
		      var listtmpli2 = {
		        line:listx, pos:0, html:"<li>", mdcode:listmdcode,
		        typ:"start", label:"list", parentelement:listtmpelement,
		        tag:listtyp+"-start-li", weight:0,
						whitespaces:listspaces
		      };
					this.map.addElement(listtmpli2);
					listtmpelement.listchilds.push(listtmpli2);
					//get rid of mdcode in line:
					//console.log("linelistx before change"+lines[listx]);
					lines[listx] = substitutewitheuro(listmdcode.length)+lines[listx].substring(listmdcode.length);
					//console.log("linelistx after change:"+lines[listx]);
		    } else if(listfound && !sublist){
		      //found other element of origlist without being in a sublist
		      this.map.addElement({
		        line:listx-1, pos:lines[listx-1].length, html:"</li>", mdcode:"",
		        typ:"end", label:"list",
		        tag:listtyp+"-sublist-end-li", weight:3+listweight,
						whitespaces:listspaces
		      });
					//get mdcode for list-start-element:
					listmdcode = lines[listx].substring(0,lines[listx].indexOf(listzeichen)+listzeichen.length);
					var listtmpli3 = {
		        line:listx, pos:0, html:"<li>", mdcode:listmdcode,
		        typ:"start", label:"list", parentelement:listtmpelement,
		        tag:listtyp+"-start-li", weight:0,
						whitespaces:listspaces
		      }
					this.map.addElement(listtmpli3);
					listtmpelement.listchilds.push(listtmpli3);
					//get rid of mdcode in line:
					//console.log("linelistx before change"+lines[listx]);
					lines[listx] = substitutewitheuro(listmdcode.length)+lines[listx].substring(listmdcode.length);
					//console.log("linelistx after change:"+lines[listx]);
		    } else{
		      //no listelement in line - add /li and end the loop
		      this.map.addElement({
		        line:listx-1, pos:lines[listx-1].length, html:"</li>", mdcode:"",
		        typ:"end", label:"list",
		        tag:listtyp+"-end-li", weight:3+listweight,
						whitespaces:listspaces
		      });
		      break;
		    }

		  }//for-to-loop
			var test=false;
		  if(sublist && test){
		    //last line is still a sublist, so one /li is missing
		    this.map.addElement({
		      line:listx-1, pos:lines[listx-1].length, html:"</li>", mdcode:"",
		      typ:"end", label:"list",
		      tag:listtyp+"sublist-end-li", weight:2,
					whitespaces:listspaces
		    });
		  }
		  //all li and /li tags should be set by now. close ol/ul tag:
		  //var sublistweight = 0;
		  //if(sublist)sublistweight=3;
		  this.map.addElement({
		    line:listx-1, pos:lines[listx-1].length, html:"</"+listtyp+">", mdcode:"",
		    typ:"end", listtyp:listtyp, label:"list",
		    tag:"listend", weight:4+listweight
		  });
			//set lineswithhtml:
			for(var lx=x;lx<listx;lx++){
				if(this.lineswithhtml[lx]==undefined)this.lineswithhtml[lx]="list";
			}
			listtmpelement.lastline = listx-1;
			this.map.sidebarelements.push({
				typ:"multiline",text:listtyp, tag: listtyp,
				startline:x, endline:listx-1
			});

		}// end of list block

      //scan for quotes quotes
  		if(linestart==">" && !(lines[x].substring(0,2)=="> ")){
  		    this.perror.push(new parsererror(x,1,lines[x].length,"quotes","missing space after >"));
  		}
  		if(lines[x].substring(0,2)=="> "){
  			qlc=x;
  			//console.log("quote gefunden: "+lines[qlc]);
  			//console.log("wasn los? qlc="+qlc+" lines-länge:"+lines.length + "lines[qlc]="+lines[qlc]);
  			while(qlc<lines.length && lines[qlc].substring(0,2)=="> " ){ //}&& confirm("weiter in line?"+qlc+"llenght:"+lines.length)){
  				lines[qlc] = "€€"+lines[qlc].substring(2);
  				qlc++;
  			}
  			//console.log("quote gefunden von"+x+" bis:"+qlc)
  			qlc--;
  			//if(this.map.insertedhtmlinline[x]==null)this.insertedhtmlinline[x]=new Array();
  			this.map.addElement({line:x,pos:0,html:"<quote>",
				mdcode:"> ",typ:"start", label:"quote"});

  			for(var ql=x;ql<qlc;ql++)this.map.addElement({line:ql,pos:lines[ql].length,
          html:"<br>",mdcode:"",typ:"end", label:"quoteend"
        })//lines[ql]+="<br>";
  			//console.log("quotes br-tags abgeschlossen");
  			//lines[qlc]+="</quote>";
        this.map.addElement({line:qlc,pos:lines[qlc].length,
          html:"</quote>",mdcode:"",typ:"end", label:"quoteend"
        })
  			for(var qil=x+1;qil<=qlc;qil++){
  				this.map.addElement({line:qil,pos:0,html:"",mdcode:"> ",
					typ:"start", label:"quote"});
  			}
  			letztezeile = qlc;
  			for(var lwh=x;lwh<=letztezeile;lwh++)this.lineswithhtml[lwh]="quote";
				this.map.sidebarelements.push({
					typ:"multiline",text: "quote", tag:"quote",
					startline:x, endline:qlc
				});
  		}//lines[x] fängt jetzt mit <quote> an

			//codeblock and datablock:
			if(lines[x].substring(0,3)==="```" || lines[x].substring(0,3)==="+++"){
				//possible code or datablock found
				var dtsymbol = lines[x].substring(0,3); //use this further on instead of hardcoded symbol to switch easier
				var head=lines[x];
				//look out for datablock:
				var datablocktypefound =null;
				//check for default:
				if(lines[x]===dtsymbol){
					//set default to
				}
				for(var blocktype=0;blocktype<slidenote.datatypes.length;blocktype++)if(head.indexOf(slidenote.datatypes[blocktype].type)>-1)datablocktypefound = slidenote.datatypes[blocktype];
				//datablocktypefound is now either null for default or the datatype
				//check for default:
				if(datablocktypefound===null && dtsymbol==="```"){
					datablocktypefound==="code";
				}else if(datablocktypefound===null && slidenote.standarddatablocktype){
					datablocktypefound=slidenote.standarddatablocktype;
				}
				if(datablocktypefound && datablocktypefound.type!="code"){
					//datablock found:
					var datahead = head;
					var datatyp = datablocktypefound.type;
					//console.log("datablock found:"+datahead + "->"+datatyp);
					//look out for dataend:
					var dataende = x+1;
					var innerblocks = 0;
					while(dataende<lines.length){
						if(lines[dataende].substring(0,3)===dtsymbol){
							if(lines[dataende].length===3){
								if(innerblocks===0)break; else innerblocks--;
							}else{
								innerblocks++;
							}
						}
			      dataende++;
			    }
					if(dataende===lines.length){
						 //error no dataend found
			            this.perror.push(new parsererror(x,0,lines[x].length-1,"data","missing endsymbol "+dtsymbol));
			    		this.perror.push(new parsererror(dataende-1,0,lines[x].length-1,"data","missing endsymbol "+dtsymbol));
					}else{
						var rawdata = new Array();
			              for(var rdx=x+1;rdx<dataende;rdx++){
			                rawdata.push(origlines[rdx]);
			                if(slidenote.datatypes.elementOfType(datatyp).mdcode==false){ //is mdcode allowed? if not:
			                          lines[rdx]=substitutewitheuro(lines[rdx].length); //prevent further parsing
											}else{ //mdcode is allowed
												if(lines[rdx].substring(0,3)=="---"){ //even if mdcode is allowed - if its a new page-sign:
													lines[rdx]=substitutewitheuro(lines[rdx].length); //prevent further parsing so that a section is not broken by page
												}
											}
			              }
										if(slidenote.datatypes.elementOfType(datatyp).mdcode==false){
			              	for(var lwh=x;lwh<=dataende;lwh++)this.lineswithhtml[lwh]="data"; //fill lineswithhtml with data
										}else{
											this.lineswithhtml[x]= datatyp;//"layout";
											this.lineswithhtml[dataende]= datatyp;//"layout";
											if(!this.map.lineswithmdcodeinsidedatablock)this.map.lineswithmdcodeinsidedatablock = new Array();
											for(var lwh=x;lwh<=dataende;lwh++)this.map.lineswithmdcodeinsidedatablock[lwh]=datatyp;//"layout";
										}
			              var mapstartel = {line:x,pos:0,html:"<section>",mdcode:lines[x],typ:"start"};
			    					var mapendel = {line:dataende,pos:0,html:"</section>",mdcode:lines[dataende],typ:"end", brotherelement: mapstartel};
			    					mapstartel.brotherelement = mapendel;
			    					//this.map.addElement({line:dataende,pos:altelinieende.length-1,html:"</section>",mdcode:"",typ:"end"});
			    					//save dataobject:
			    					if(this.dataobjects == null)this.dataobjects = new Array();
										if(datahead.indexOf("//")>-1){
											var headcomment = datahead.substring(datahead.indexOf("//"));
											datahead = datahead.substring(0,datahead.indexOf("//"));
											//add new comment to map:
											this.map.addElement({
												line:x,pos:datahead.length,html:"",
												mdcode:headcomment,typ:"start",tag:"comment", label:"comment"
											});
										}
			    					this.dataobjects.push({
											type:datatyp, head:datahead, raw:rawdata,
											startline:x, endline:dataende, posinall: this.map.linestart[x]
										});
			    					mapstartel.dataobject = this.dataobjects[this.dataobjects.length-1];
			    					this.map.addElement(mapstartel); //save parsing to map
			    					this.map.addElement(mapendel); //
										lines[dataende] = substitutewitheuro(lines[dataende].length); //prevent further parsing
										lines[x] = substitutewitheuro(lines[x].length);
										this.map.sidebarelements.push({
											typ:"multiline",text:datatyp,tag:datatyp,
											startline:x, endline:dataende
										});
			    					//console.log("neues dataobjekt hinzugefügt");
			    					//console.log(this.dataobjects);
					}

				} else{
					//codeblock found:
					//codeblock is much easier as no inner blocks are allowed. the next line with ``` breaks the codeblock:
					var codeende = x+1;
			        while(codeende < lines.length){
			          if(lines[codeende].substring(0,3)===dtsymbol)break;
			          codeende++;
			        }
			        if(codeende===lines.length || lines[codeende].substring(0,3)!=dtsymbol){
			          //error: no codeend found
			          this.perror.push(new parsererror(x,0,lines[x].length-1,"code","missing endsymbol "+dtsymbol));
			        }else{
			          //codeend found:
								var codeblock = {
									line:x, head:lines[x], endline:codeende
								}
								var codebegin = {
									line:x,pos:0,html:'<code class="codeblock">',mdcode:origlines[x],typ:"start",
									tag:"codestart", endline:codeende, label:"code"
								};
								var codeend = {
			            line:codeende, pos:0, html:"</code>", mdcode:lines[codeende], typ:"end",
			            tag:"codeende", label:"code", brotherelement:codebegin
			          };
								codebegin.brotherelement = codeend;
								this.map.addElement(codebegin);
			          this.map.addElement(codeend);
								this.map.codeblocks.push(codeblock);
			          for(var cx = x;cx<=codeende;cx++){
									this.map.codeblocklines.push({codeblock:codeblock, origtext:origlines[cx], line:cx}); //numeral list of all codelines in editor
									lines[cx]=substitutewitheuro(lines[cx].length); //substitute line to avoid further parsing
			            this.lineswithhtml[cx]="code"; //mark lines as codelines
			          }
								this.map.sidebarelements.push({
									typ:"multiline",text:"code",tag:"code",
									startline:x, endline:codeende
								});
			        }

				}
			}//end of code and datablocks
			//comment: a whole line is signed as a comment:
			if(lines[x].substring(0,2)==="//"){
					//valid comment found:
					var mapcomstart = {
						line:x, pos:0, html:"", mdcode:lines[x],
						typ:"start", tag:"comment", label:"comment"
					}
					this.map.addElement(mapcomstart);
					//prevent further parsing:
					lines[x]=substitutewitheuro(lines[x].length);
			}//end of comment-block
			//all blocks are scanned. now for one-line-elements - eg image, link, code...

			//inline code: has to be first of all one-line-elements to prevent parsing inside of it
			if(lines[x].indexOf("`")>-1){
				var codepos=0;
				while(lines[x].indexOf("`",codepos)>-1){
					codepos = lines[x].indexOf("`",codepos);
					var codestart = codepos;
					var codeend = lines[x].indexOf("`",codestart+1);
					var nextspace = lines[x].indexOf(" ",codestart);
					if(nextspace==-1)nextspace = lines[x].length;
					if(codeend ==-1){
						//codeend not in actual line - continue looking next lines? no - inlinecode is just for the same line
						this.perror.push(new parsererror(x,codepos,nextspace,"inlinecode","missing endsymbol `"));
					}else{
						//codeend found in same line:
						var mapcstart = {
							line:x, pos:codestart, html:"<code>",mdcode:"`",
							typ:"start",
							tag: "inlinecodestart"
						};
						var mapcend = {
							line:x, pos:codeend, html:"</code>", mdcode:"`",
							typ:"end",
							tag:"inlinecodeend", brotherelement:mapcstart
						};
						mapcstart.brotherelement=mapcend;
						this.map.addElement(mapcstart);
						this.map.addElement(mapcend);
						//prevent further parsing of inline-code:
						lines[x]=lines[x].substring(0,codestart)+
											substitutewitheuro(codeend+1-codestart)+
											lines[x].substring(codeend+1);
											//console.log("inlinecodeline after change:"+lines[x])
					}//end of codeend found in same line

					codepos++; //continue scan regardless of result
				}//end of while

			}//end of inline code
			//now we should check for inline-latex and others who may do not allow inside-code either
			for(let ic=0;ic<slidenote.inlinedatatypes.length;ic++){
				var dt=slidenote.inlinedatatypes[ic];
				if(dt.theme.active==false)continue;
				var codepos=0;
				while(lines[x].indexOf(dt.start,codepos)>-1){
					codepos = lines[x].indexOf(dt.start,codepos);
					var codestart = codepos;
					var codeend = lines[x].indexOf(dt.end,codestart+1);
					var nextspace = lines[x].indexOf(" ",codestart);
					if(nextspace==-1)nextspace = lines[x].length;
					if(codeend ==-1){
						//codeend not in actual line - continue looking next lines? no - inlinecode is just for the same line
						this.perror.push(new parsererror(x,codepos,nextspace,"inline"+dt.type,"missing endsymbol "+dt.end));
					}else{
						//codeend found in same line:
						var mapcstart = {
							line:x, pos:codestart, html:dt.htmlstart,mdcode:dt.start,
							typ:"start", dataobject:dt,
							tag: "inline"+dt.type+"start"
						};
						var mapcend = {
							line:x, pos:codeend, html:dt.htmlend, mdcode:dt.end,
							typ:"end", dataobject:dt,
							tag:"inline"+dt.type+"end", brotherelement:mapcstart
						};
						mapcstart.brotherelement=mapcend;
						this.map.addElement(mapcstart);
						this.map.addElement(mapcend);
						//prevent further parsing of inline-code:
							lines[x]=lines[x].substring(0,codestart)+
											substitutewitheuro(codeend+1-codestart)+
											lines[x].substring(codeend+1);
											//console.log("inlinecodeline after change:"+lines[x])
					}//end of codeend found in same line

					codepos++; //continue scan regardless of result
				}//end of while

			}

      //image:
			//console.log("imagesearch in line:"+lines[x]);
			//console.log("index:"+lines[x].indexOf("!["));
      if(lines[x].indexOf("![")>-1){
				//console.log("image found");
        var imgaktpos=0;
        while(lines[x].indexOf("![",imgaktpos)>-1 ){
          var imgpos = lines[x].indexOf("![",imgaktpos);
          var imgposmid = lines[x].indexOf("](",imgpos);
          var imgposend = lines[x].indexOf(")",imgpos);
          var imginimg = lines[x].indexOf("![",imgpos+1);
          var nextspace = lines[x].indexOf(" ",imgpos);
          if(nextspace==-1)nextspace = lines[x].length;
          var error = "";
          if(imginimg>-1 && imginimg<imgposend){
            this.perror.push(new parsererror(x,imgpos,nextspace,"image","image in image"));//
  					error="imginimg";
  					//console.log("image in image: imgpos:"+imgpos+"imginimg"+imginimg+"imgposend"+imgposend);
          }
          if(imgposend==-1 && imginimg==-1){
            this.perror.push(new parsererror(x,imgpos,nextspace,"image","missing endsymbol )"));//
  					error="imgende";
  					//console.log("image: missing endsymbol"+imgpos+"->"+nextspace);
          }
          if(imgposmid==-1){
            this.perror.push(new parsererror(x,imgpos,lines[x].length-1,"image","missing midsymbol )"));//
            error="imgmid";
          }
					if(imgpos>imgaktpos)imgaktpos = imgpos;
					imgaktpos+=2;//next scan after found imagepos regardless of result
          if(error.length==0){
            var imgurl = lines[x].substring(imgposmid+2,imgposend);
            var imgalt = lines[x].substring(imgpos+2,imgposmid);
            var imghtml = '<img alt="'+imgalt+'" src="'+imgurl+'">';
            //add element to map:
            this.map.addElement({
              line:x, pos:imgpos, html: imghtml,
              mdcode:lines[x].substring(imgpos,imgposend+1),
              typ:"image", label:"image",
              src:imgurl, midpos:imgposmid, endpos:imgposend,
              alt:imgalt
            });
            //check if its the only image because its fast - or shouldnt because of datablock?
            //if(imgpos==0 && lines[x].length==imgposend+1)this.lineswithhtml[x]="image";
            //image is now parsed - get rid of it:
            lines[x]=lines[x].substring(0,imgpos)+substitutewitheuro(imgposend+1-imgpos)+lines[x].substring(imgposend+1);
          }//end of error.length = 0
        }//end of image-while
      }//end of imageblock
      //linkblock:
      if(lines[x].indexOf("](")>-1){
        var linkpos = 0;
        while(lines[x].indexOf("](",linkpos)>-1){
          var linkmid = lines[x].indexOf("](",linkpos);
          var linkstart = lines[x].indexOf("[");
          var linkend = lines[x].indexOf(")",linkmid);
          var nextspace = lines[x].indexOf(" ",linkmid);
          var error="";
          if(nextspace==-1)nextspace=lines[x].length;
          if(linkstart==-1||linkstart>linkmid){
            error= "linkstart not found:";
            this.perror.push(new parsererror(x,linkmid,nextspace,"link","missing startsymbol ["));
          }
          if(linkend==-1){
            error="linkend not found";
            this.perror.push(new parsererror(x,linkmid,nextspace,"link","missing endsymbol ]"));
          }
          if(error===""){
            //no error found - do your things:
            var linktext = lines[x].substring(linkstart,linkmid);
            var linkurl = lines[x].substring(linkmid+2,linkend);
            var linkmapelstart = {
              line:x, pos:linkstart,
              html: '<a href="'+linkurl+'">',
              mdcode: "[",
              typ:"link", label:"link",
              tag:"linkstart",
              linkurl:linkurl,
              linktext:linktext
            };
            var linkmapelend = {
              line:x, pos:linkmid,
              html:"</a>",
              mdcode:']('+linkurl+')',
              typ:"link", label:"link",
              tag:"linkend",
              brotherelement:linkmapelstart
            };
            linkmapelstart.brotherelement = linkmapelend;
            this.map.addElement(linkmapelstart);
            this.map.addElement(linkmapelend);
            //get rid of the non-parsing part of the link:
            lines[x]=lines[x].substring(0,linkstart)+"€"+
                      lines[x].substring(linkstart+1,linkmid)+
                      "€€"+substitutewitheuro(linkurl.length)+"€"+
                      lines[x].substring(linkend+1);
          }
          linkpos = linkmid+2; //scan further after actual link regardless of result
        }//end of while link in line
      }//end of linkblock
      //pagebreak:
      if(lines[x].substring(0,3)==="---"){
        var error="";
          //search for missing ---
          var checkforminus = "----------------------------------------------";
          while(checkforminus.length<lines[x].length)checkforminus+=checkforminus;
          if(lines[x]!=checkforminus.substring(0,lines[x].length)){
            error = "not only minus found";
            this.perror.push(new parsererror(x,0,lines[x].length,"pagebreak","not only - in pagebreak"));
          }else{
            this.lineswithhtml[x] = "pagebreak";
            this.map.addElement({
              line:x,pos:0,html:"<hr>",mdcode:lines[x],typ:"pagebreak",
							label:"new slide"
            });
            this.map.pageend.push({line:x-1, posinall: this.map.lineend[x-1]});
            this.map.pagestart.push({line:x+1, posinall: this.map.linestart[x+1]});
            lines[x]=substitutewitheuro(lines[x].length);
          }

      }//end of pagebreak
      //footnote-anchor:
      if(lines[x].indexOf("[^")>0){ //footnote-anchors arent allowed at linestart
          while(lines[x].indexOf("[^")>-1){
            var actpos = lines[x].indexOf("[^");
    				var endpos = lines[x].indexOf("]",actpos);
    				var footname;
    				var error=null;
    				if(endpos!=-1){
    					footname = lines[x].substring(actpos+2,endpos);
    					var footident = "[^"+footname+"]:";
    					//search for footnote:
    					var footnoteline=null;
    					for(var fx=x+1;fx<lines.length;fx++){
    						//console.log("footnoteparse fx"+fx);
    						if(lines[fx].substring(0,3)==="---")break;
    						if(lines[fx].substring(0,footident.length)===footident){
    							footnoteline=fx;
    							//console.log("footnoteline:"+footnoteline+"fx"+fx);
    						}
    					}
    					//console.log("footnote "+footident+" line:"+footnoteline);
    					if(footnoteline==null){
    						//error: no footnote found
    						error="no footnote found";
    						this.perror.push(new parsererror(x,actpos,endpos+1,"footnote-anchor",error));
    					}else{
    						//footnote anchor is ready, footnote found on same page at line footnoteline
    						//check if footnote is last element on page or only followed by other footnotes:
    						var islastelement=true;
    						for(var fx=footnoteline;fx<lines.length;fx++){
    							if(this.lines[fx].substring(0,3)==="---")break;
    							if(lines[fx].substring(0,2)!="[^" && this.lineswithhtml!="footnote"){
    								islastelement=false;
    								//console.log("footnote afterline "+fx+":"+lines[fx])
    							}
    						}
    						if(islastelement){
    							//everything is good, save the map-parsing:
    							this.lineswithhtml[footnoteline]="footnote";
    							var fstart = {line:x,pos:actpos,html:"<sup>",
										mdcode:"[^", label:"footnoteanchor",
    								typ:"start", footnoteline:footnoteline, tag:"footnote-anchor"};
    							var fend = {line:x, pos:endpos, html:"</sup>",
									typ:"end",mdcode:"]", label:"footnoteanchor",
    								brotherelement:fstart, tag:"footnote-anchor"};
    							fstart.brotherelement = fend;
    							var fnote = {line:footnoteline, pos:0, typ:"start",
    								html:"<p>"+footname+":",mdcode:footident,
    							 	footanchor:fstart, tag:"footnote", label:"footnote"};
    							fstart.footer = fnote;
    							this.map.addElement(fstart);
    							this.map.addElement(fend);
    							this.map.addElement(fnote);
                  //delete footnote-tag in footnoteline to prevent further parsing of it:
                  lines[footnoteline]=substitutewitheuro(footident.length)+lines[footnoteline].substring(footident.length);
									//delete footnote-anchor-tag to prevent further parsing of it:
									lines[x]=lines[x].substring(0,actpos)+substitutewitheuro(endpos+1-actpos)+lines[x].substring(endpos+1);

    						}else{
    							//error footnote is not the last element on the page
    							error = "footnote is not last element on the page";
                  //this.perror.push(new parsererror(footnoteline,0,lines[x].length,"footnote",error));
    						}
    					}
    				}else{
    					error= "footnote-anchor not ready yet - missing symbol ]";
    					var nextspace = lines[x].indexOf(" ",actpos);
							if(nextspace===-1)nextspace = lines[x].length;
    					this.perror.push(new parsererror(x,actpos,nextspace,"footnote-anchor","missing endsymbol ]"));
							//console.log(this.perror);
    				}
    				if(error!=null){
    					//console.log("footnote error:"+error);
    					break; //dont look further for other footnote-anchor
    				}
    				lines[x] = lines[x].substring(0,actpos)+ "€€"+
    											lines[x].substring(actpos+2);
          }//while footnote in line
      }//end of footnote-anchor
      //footnote
  		if(lines[x].substring(0,2)==="[^"){
  			//footnote shouldnt appear right now, therefore its missing an anchor or else:
  			var endpos = lines[x].indexOf("]:");
  			if(endpos===-1){
  				var nextspace = lines[x].indexOf(" ");
					if(nextspace===-1)nextspace = lines[x].length;
  				this.perror.push(new parsererror(x,0,nextspace,"footnote","missing endsymbol ]:"));
  			}else{
  				this.perror.push(new parsererror(x,0,endpos+2,"footnote","missing footanchor"));
  				//console.log("footnote missing footanchor");
  			}
  		}
  		//end of footnote

  }//end of for(x<lines) / parseperlines
  //simple-element-block
  //now parse the simple-elements:
  for(var x=0;x<lines.length;x++){
      //check if line has to be parsed:
      //dont parse if lineswithhtml is one of the following:
      var checkstring = "pagebreak, code";
      if(checkstring.indexOf(this.lineswithhtml[x])>-1)continue; //jump to next line
      checkstring += "h1,h2,h3,ul,ol,quote"; //dont parse further this line if next line is one of these
      var breakline = null;
      for (var chkx=x;chkx<lines.length;chkx++){
        if(checkstring.indexOf(this.lineswithhtml[chkx])>-1){
          breakline = chkx;
          break;
        }

      }
      if(breakline==null)breakline=lines.length;//if no breakline found - its lines.length
      //check for link has to be with found positions in found line, so not collect here
      for(var pare=0;pare<this.parseelemente.length;pare++){
        var pelement = this.parseelemente[pare];
        var mdstart = pelement.emdstart;
        var mdend = pelement.emdend;
        var startpos = 0;
        var endline = x;
        var endpos = null;
        //check if pelement is in line:
        while(lines[x].indexOf(mdstart,startpos)>-1){
          startpos = lines[x].indexOf(mdstart,startpos);
          endpos = lines[x].indexOf(mdend,startpos+mdstart.length);
          var found=false;
          if(endpos>-1){
            //endpos found in line
            endline = x;
            found=true;
          } else{
            //search for lines: endpos is -1
            endline=x+1;
            while(!found && endline<breakline){
                endpos=lines[endline].indexOf(mdend,endpos);
                if(endpos>-1){
                  //check if mdend is * or _
                  if(mdend.length===1 && lines[endline].substring(endpos+1,endpos+2)===mdend){
                    endpos+=2; //continue loop in same line
                    continue;
                  }else{
                    //found endsymbol
                    found=true;
                  }
                }else{
                  endline++;
                }
            }//end of while endpos-1
            if(!found){
              //error: next line is not parseable:
              this.perror.push(new parsererror(x,startpos,lines[x].length,mdstart,"missing endsymbol "+mdend));
							this.perror[this.perror.length-1].nextlinenotparseable=true;
              startpos+=mdstart.length;
              continue; //next while-loop
            }
          }//end of multiline-part
          //start and end are collected. TODO: check if one is inside a link-tag:
          //dont bother with link right now. links suck
          if(found){
            var mapstart = {
              line:x, pos:startpos, html:pelement.htmlstart,
              mdcode:mdstart, typ:"start",
							weight:1, tag:"simpleelement"
            };
            var mapend = {
              line:endline, pos:endpos, html:pelement.htmlend, mdcode:mdend,
							typ:"end",
              brotherelement:mapstart,
							weight:1, tag:"simpleelement"
            };
            mapstart.brotherelement = mapend;
            this.map.addElement(mapstart);
            this.map.addElement(mapend);
            lines[x]=lines[x].substring(0,startpos)+substitutewitheuro(mdstart.length)+lines[x].substring(startpos+mdstart.length);
            lines[endline]=lines[endline].substring(0,endpos)+substitutewitheuro(mdend.length)+lines[endline].substring(endpos+mdend.length);
          }//end of found
          startpos+=mdstart.length; //search for next element regardless of result
        }//end of while start in this line found

      }//end of iterating through parseelements
  }//end parsing simple elements per line
  //add last pageend:
  this.map.pageend.push({line:lines.length, posinall:sourcecode.length-1});
  //save cursorpos:
	this.parsedcursorpos = slidenote.textarea.selectionEnd;
	this.map.insertedhtmlelements.sort(function(a,b){return a.posinall-b.posinall});
 //console.log("finished parsing elements");
  //console.log(this.lineswithhtml);
  //console.log(this.map);
  var TimecheckEnd = new Date().getTime();
  var TimecheckUsed = TimecheckEnd - TimecheckStart;
  console.log("parsed in "+TimecheckUsed+" Ms");
	//save pages to later compare them:
	this.map.pagesCode = new Array();
	for(var x=0;x<this.map.pagestart.length;x++){
		this.map.pagesCode.push(
			sourcecode.substring(this.map.pagestart[x].posinall,
				this.map.pageend[x].posinall));
	}


}




/*	*stylepager: objekt mit einem muster, nach welchem die page per zeile geparst wird und mit zusätzlichem html und/oder klassen versehen wird
	* braucht beim erstellen muster nach dem gescannt werden kann -> array mit zeilenelement-code: text, table, ul, li, head usw.
	* start: htmlcodestarttag, end: htmlcodeendtag
	* nicht mehr wirklich genutzt zur zeit, aber hat potential
*/

function stylepager(muster, start, end){
	this.muster = muster;
	this.starthtml = start;
	this.endhtml = end;
}
/* stylepager.find(pagetaglines,startline):
 * sucht nach muster des jeweiligen stylepagers in den pagetaglines
 * returns array mit anfangszeile und endzeile des gefundenen musters, -1 bedeutet kein treffer gefunden
*/

stylepager.prototype.find = function(pagetaglines, startline){
	if(pagetaglines==null)pagetaglines = new Array();
	var found=false;
	var foundstartpos=-1;
	var foundendpos = -1;
	var musterpos=0;
	var pseudonodestructure = new Array(); //shortened array of [tagline][startlinenr in orig][endlinenr in orig] to sort through
	var aktcode = "";
	//alert(pagetaglines.toString());
	//console.log("pagetaglinesanzahl: "+pagetaglines.length);
	for(var y=startline;y<pagetaglines.length;y++){
		if(pagetaglines[y]!=aktcode){
			//if(pseudonodestructure.length>0 && y>startline && pseudonodestructure[y-startline-1] != null)pseudonodestructure[y-startline-1][2]=y-1;
			pseudonodestructure.push(new Array(pagetaglines[y],y,y));
			aktcode = pagetaglines[y];
		}
		if(pagetaglines[y]==aktcode && pseudonodestructure.length>0)pseudonodestructure[pseudonodestructure.length-1][2]=y;
	}
	//console.log("pseudonodestructure:"+pseudonodestructure.toString());
	if(pseudonodestructure.length>0)pseudonodestructure[pseudonodestructure.length -1][2]=pagetaglines.length-1;
	for(var x=0;x<pseudonodestructure.length;x++){
		if(musterpos<this.muster.length && pseudonodestructure[x][0]==this.muster[musterpos]){
			if(musterpos==0)foundstartpos=pseudonodestructure[x][1];
			if(musterpos==this.muster.length-1)foundendpos = pseudonodestructure[x][2];
			musterpos++;
			found=true;
		}else{
			if(musterpos>0 && musterpos<this.muster.length){
				found=false;
				//musterpos=this.muster.length; //suche abbrechen, da muster nicht gefunden wurde? oder neu beginnen?
				musterpos = 0; //lieber neu beginnen? muster könnte ja noch auftauchen. bspw. überschrift - überschrift>aufzählung>überschrift>aufzählung
				//neu prüfen, ob mit muster[0] getroffen wird. sonst wird in dieser zeile nicht geguckt:
				if(pseudonodestructure[x][0]==this.muster[musterpos]){
					foundstartpos=pseudonodestructure[x][1];
					musterpos++;
					found=true;
				}
			}
		}

	}
	if(musterpos<this.muster.length)found=false; //muster nicht bis zum ende prüfen können
	if(foundendpos<foundstartpos)found=false; //kein ende gefunden, eigentlich das selbe wie oben oder?
	if(found)console.log("muster "+ this.muster+" found at:"+foundstartpos+","+foundendpos)
	//if(found)return [foundstartpos,foundendpos]; else return [-1,-1];
	//besser objektorientiert:
	if(found)return {start:foundstartpos, end:foundendpos}; else return {start:-1,end:-1};
}

/* stylepager.encapsuleHtml(pagelines, pagetaglines)
 * sucht in den pagelines mittels der find-methode (s.o.) nach dem muster des styles und ummantelt diese mit dem html-code des styles
 * erwartet: pagelines: array mit text-strings, pagetaglines: array mit parse-code-zeilen (ul,ol,text,table, usw. )
 * gibt array mit pagelines zurück
*/
stylepager.prototype.encapsuleHtml = function(pagelines,pagetaglines){
	//alert(pagetaglines.toString());
	//console.log("encapsulehtml pagetaglines-length:"+pagetaglines.length);
	var startend = this.find(pagetaglines,0);
	//console.log("encapsulehtml startend:"+startend.start + "-"+startend.end+"muster:"+this.muster);
	//console.log(pagetaglines);
	//alert(pagetaglines.toString() + "\n" +startend.toString());
	//alert(pagetaglines==null);
	var aktline=0;
	//while(startend[0]>-1&&startend[1]>-1){
	while(startend.start>-1&&startend.end>-1){
	//if(startend[0]>-1&&startend[1]>-1){
		//console.log("encapsulehtml treffer:"+this.starthtml + " on line"+ startend.start);
		pagelines[startend.start]=this.starthtml + pagelines[startend.start];
		pagelines[startend.end]+=this.endhtml;
		aktline=startend.end+1;
		startend = this.find(pagetaglines,aktline);
	}
	return pagelines;

}

/* Pagegenerator-Objekt
 * Pagegenerator ist für das Erstellen und Steuern der Präsentation aus geparstem EMD-Code zuständig.
 * Pagegenerator wird NICHT jedesmal neu erschaffen, sondern es gibt nur EINEN pagegenerator auf der Seite (momentaner name: presentation)
 * Über die init() - Funktion können Werte neu gesetzt und eingelesen werden
 * Über die addTheme() - Funktion können dem Pagegenerator neue Themes zugewiesen werden
 * Braucht: emdparsobjekt vom typ emdparser, ausgabediv: ein HTML-Objekt, in welches die Präsentation eingefügt wird
*/

function pagegenerator(emdparsobjekt, ausgabediv, slidenote){
	this.slidenote = slidenote;
	this.sourcecode = emdparsobjekt.parsedcode;
	this.emdparsobjekt = emdparsobjekt;
	this.pages = new Array(); //strings with ready-for-output-pages parsed by pagebreak
	this.pagesperline = emdparsobjekt.returnparsedlines(this.sourcecode);
	this.pagestaggedlines = new Array();
	this.presentation = ausgabediv; //actual div-objekt which contains the presentation
	this.htmlstart = '<div class="presentation">';
	this.htmlend = "</div>";
	this.pagestart = '<div class="ppage">';
	this.pageend = '</div>';
	this.aktpage = 0;
	this.presentationhtml;
	this.pagestyles = new Array(); //array of stylepagers
	this.themes = new Array(); //array of theme-names/strings
	this.jsfilepath = "themes/";
	this.cssfilepath = "themes/";
	//scan den sourcecode in pages:
		/*dirty and quick:
	var aktpos=0;
	while(this.sourcecode.indexOf("<hr>",aktpos)>-1){
		this.pages.push(this.sourcecode.substring(aktpos,this.sourcecode.indexOf("<hr>",aktpos)));
		aktpos=this.sourcecode.indexOf("<hr>",aktpos)+4;
	}
	this.pages.push(this.sourcecode.substring(aktpos));
	*/
	//pages ist jetzt mit html gefüttert
	//pagestaggedlines füttern:
	//pages enthält html inkl. \n's nach denen weiter gescannt werden kann, allerdings fehlen die hr-zeilen.
	//daher erneutes scannen wie oben nur mit lines:
	this.init();

}
pagegenerator.prototype.init = function(emdparsobjekt, ausgabediv){
	this.themes = this.slidenote.extensions.themes;
	var pagec = 0;
	//bestimmte werte neu einlesen:
	if(emdparsobjekt!=null)this.emdparsobjekt = emdparsobjekt;
	if(ausgabediv != null)this.presentation = ausgabediv; //actual div-objekt which contains the presentation
	this.sourcecode = this.emdparsobjekt.parsedcode;
	this.pages = new Array(); //strings with ready-for-output-pages parsed by pagebreak
	this.pagesperline = this.emdparsobjekt.returnparsedlines(this.sourcecode);
	this.pagestaggedlines = new Array();
	if(this.aktpage>this.pagesperline.length)this.aktpage=this.pagesperline.length-1;
	if(this.aktpage==-1)this.aktpage==0;
	var lineswithtags = new Array();
	this.sourcecode = this.emdparsobjekt.parsedcode;
	this.pagesperline = this.emdparsobjekt.returnparsedlines(this.sourcecode);
	for(var x=0;x<this.emdparsobjekt.lineswithhtml.length;x++)lineswithtags.push(this.emdparsobjekt.lineswithhtml[x]); //echte kopie der strings anlegen


	//alert("lineswithtags0:"+lineswithtags[0].toString()+" lineswithtags:"+lineswithtags.toString());
	this.pagestaggedlines.push(new Array());
	this.pagesperline = new Array();
	this.pagesperline.push(new Array());
	for(var x=0;x<lineswithtags.length;x++){
		if(lineswithtags[x]=="pagebreak"){
			pagec++;
			this.pagestaggedlines.push(new Array());
			this.pagesperline.push(new Array());
		}else {
		this.pagestaggedlines[pagec].push(lineswithtags[x]);
		if(this.pagesperline[pagec]!=null)this.pagesperline[pagec].push(this.emdparsobjekt.lines[x]);
		   else alert("pagec:"+pagec+"pagesperline.length:"+this.pagesperline.length);
		}
	}
	//this.pagestaggedlines
	//alert("ppllength:"+this.pagesperline.length+"erster inhalt:"+this.pagesperline[0].toString());
	//alert("pagestaggedlines[x]"+this.pagestaggedlines[0]+"vs pagesperline[x]"+this.pagesperline[0]);
	//alert(this.pagestaggedlines[0].toString());
	//pagesperline enthält jetzt array mit lines sortiert nach pages ohne pagebreaks
	//grundmuster erstellen um überhaupt was zu stylen
	this.pagestyles = new Array(); //pagestyles löschen
	//this.pagestyles.push(new stylepager(new Array("h2","ol"),'<div class="listblock">','</div>'));
	//this.pagestyles.push(new stylepager(new Array("h2","ul"),'<div class="listblock">','</div>'));
	//this.pagestyles.push(new stylepager(new Array("h2","ol","h2","ol"),'<div class="procontra">',"</div>"));
	//this.pagestyles.push(new stylepager(new Array("h2","text"),'<div class="textblock">','</div>'));
	//this.pagestyles.push(new stylepager(new Array("h2","text"),'<div class="textblockliste">','</div>',"multiple")); komplexere muster erlauben: alle einschließen
	this.pagestyles.push(new stylepager(new Array("footnote"),'<footer>','</footer>'));


}

/* Pagegenerator.finalizeHtml()
 * Erstellt den finalen HTML-Code nach Seiten und pflegt ihn ins ausgabediv ein
 + Hier finden keine Hooks statt
*/
pagegenerator.prototype.finalizeHtml = function(){
	//jetzt stylen: - findet hier nicht statt
	//this.stylePages();
	//abfrage ob presentation gesetzt ist:
	if(this.presentation==null){
		//console.log("präsentation war nicht gesetzt");
		this.presentation = document.getElementById("praesentation");
	}
	//pages als ein-string-pro-page einlesen:
	this.pages = new Array();
	for(var pg=0;pg<this.pagesperline.length;pg++){
		var pagestring = "";
		for(var x=0;x<this.pagesperline[pg].length;x++)pagestring+=this.pagesperline[pg][x]+"\n";
		this.pages.push(pagestring);
	}
	//this.presentation.innerHTML = this.htmlstart+this.pages[this.aktpage]+this.htmlend;
	this.presentationhtml = this.htmlstart;
	for(var x=0;x<this.pages.length;x++)this.presentationhtml +=this.pagestart + this.pages[x] + this.pageend;

	this.presentationhtml += this.htmlend;
	//this.presentation.innerHTML = this.presentationhtml;
	var presentationtemplate = document.createElement("template");
	presentationtemplate.innerHTML = this.presentationhtml;
	for(var t=0;t<this.themes.length;t++){
		if(this.themes[t].active)this.themes[t].insideFinalizeHtml(presentationtemplate);
	}
	this.presentation.innerHTML = presentationtemplate.innerHTML; //presentationtemplate.content.cloneNode(true);
	//console.log("präsentation ins div geschrieben:"+this.presentation.innerHTML);
	this.pagedivs = document.getElementsByClassName("ppage");
	if(this.aktpage === undefined || this.aktpage>this.pagedivs.length)this.aktpage=0;
	this.pagedivs[this.aktpage].classList.add("active");
	//add bgimg-class to background-images:
	var allimages = this.presentation.getElementsByTagName("IMG");
	for(var i=0;i<slidenote.parser.map.insertedimages.length;i++){
		var image = slidenote.parser.map.insertedimages[i];
		var pg = slidenote.parser.map.pageAtPosition(image.posinall);
		var pagestartline = slidenote.parser.map.pagestart[pg].line;
		//console.log("image"+i+" line:"+image.line +"pgstart:"+pagestartline);
		if(image.line === pagestartline){
			allimages[i].classList.add("bgimg");
		}

	}
	//alert(this.pages.toString());
}

/* pagegenerator.addStyler(muster, starthtml, endhtml)
 * erstellt ein neues pagestyle-objekt mit einem muster, starthtml-tag und endhtml-tag und fügt es dem pagestyles-array hinzu
*/

pagegenerator.prototype.addStyler = function(muster,starthtml,endhtml){
	this.pagestyles.push(new stylepager(muster,starthtml,endhtml));
	//this.stylePages();
}
// pagegenerator.resetStyler: löscht den pagestyles-array, bisher nicht verwendet
pagegenerator.prototype.resetStyler = function(){
	this.pagestyles = new Array();
}
/* pagegenerator.stylePages()
 * ist die Theming-Funktion des pagegenerators: in ihr werden
 * 1. zusätzliche styles mittels der stylepager-objekte aus dem pagegenerator.pagestyles-array ausgeführt
 * 2. zusätzliche styles aus den stylepager-objekten der Themes-Objekte ausgeführt
 * 3. durch den Aufruf von finalizeHtml das endgültige HTML-Objekt der Präsentation erstellt und ans ausgabediv übergeben
 * 4. durch den Aufruf der styleThemeSpecials()-Funktion zusätzliche Styles der jeweiligen Themes eingeführt (Hook-Funktion)
 * 5. dem Präsentations-HTML-Objekt (ausgabediv) werden die Klassen der aktivierten Themes angehängt um CSS des jew. Themes zu aktivieren
 * Hier finden Hooks statt
*/
pagegenerator.prototype.stylePages = function(){
	//alert(this.pagesperline[0].toString());
	//grundpagestyles ausführen:
	//console.log("stylepages:");
	for(var x=0;x<this.pagestyles.length;x++){
		for(var pg=0;pg<this.pagesperline.length;pg++){
			//console.log("stylePages pagestaglines:"+this.pagestaggedlines);
			this.pagesperline[pg]=this.pagestyles[x].encapsuleHtml(this.pagesperline[pg], this.pagestaggedlines[pg]);
			//console.log("after:"+this.pagesperline[pg]);
		}
	}
	//jetzt theme-styles ausführen: (Hook)
	for(var x=0;x<this.themes.length;x++){
	if(this.themes[x].active){ //nur ausführen falls theme aktiv ist
		//console.log("theme-styles von theme "+this.themes[x].classname+": "+this.themes[x].styles.length);
		//console.log(this.themes[x]);
		for(var y=0;y<this.themes[x].styles.length;y++){
			if(this.themes[x].styles[y]!=null)for(var pg=0;pg<this.pagesperline.length;pg++){
				this.pagesperline[pg] = this.themes[x].styles[y].encapsuleHtml(this.pagesperline[pg],this.pagestaggedlines[pg]); //Hook-Funktion
			}
		}
	}
	}
	//html ist vorgestyled. jetzt html finalisieren:
	this.finalizeHtml();
	//afterfinalize ausführen:
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active)this.themes[x].afterFinalizeHtml();
	}
	//jetzt special theme-styles ausführen:
	//console.log(this.themes.length+" Themes");
	//console.log(document.
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active){
			var checkbefore = slidenote.presentationdiv.innerHTML.length;
			this.themes[x].styleThemeSpecials(); //Hook-Funktion
			var checkafter = slidenote.presentationdiv.innerHTML.length;
			var checkdiff = checkafter - checkbefore;
			if(checkdiff!=0){
				//console.log("checkresult of theme "+ this.themes[x].classname+":"+checkdiff+" added");
			}else{
				//console.log("checkresult of theme "+this.themes[x].classname+": no change");
			}

		}
	}
	//afterStyleThemeSpecials ausführen:
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active)this.themes[x].afterStyleThemeSpecials();
	}
	//alles gestyled: klassen anhängen:
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active){
			this.presentation.classList.add(this.themes[x].classname);
		}else{
			this.presentation.classList.remove(this.themes[x].classname);
		}
	}
	this.presentationhtml = this.presentation.innerHTML;
	//console.log("final output\n"+this.presentationhtml);


}
/*  afterStyle is the last function to call after pages are styled
 *
*/
pagegenerator.prototype.afterStyle = function(){
	//blocks are generated and everything is on its place. call hook-function of theme:
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active)this.themes[x].afterStyle();
	}
	var loadingscreen = document.getElementById("slidenoteLoadingScreen");
	this.calculationtimeend = new Date();
	var calctime = this.calculationtimeend - this.calculationtimestart;
	console.log("Timecheck: Presentation generated in "+calctime+"Ms");
	//as we work with transitions the following could be deleted:
	//if(calctime<2000 && calctime > 500){
	//	setTimeout(function(){
	//	var loadingscreen = document.getElementById("slidenoteLoadingScreen");
	//		loadingscreen.classList.remove("active");
	//		slidenote.presentation.animatePresentationControl(true);
	//	},2000-calctime);
	//}else{
		loadingscreen.classList.remove("active");
		slidenote.presentation.animatePresentationControl(true);
	//}
	//remove animation to not render all the time:
	loadingscreen.ontransitionend=function(){
		var blobs = document.querySelectorAll(".loading-blob.active")
		for(var x=blobs.length-1;x>=0;x--)blobs[x].classList.remove("active");
	}
	if(this.forExport)slidenoteguardian.exportIsReady(this.presentation);

}

//nextPage: "blättert um" zur nächsten Seite der Präsentation durch Anhängen der ".active" CSS-Klasse an das nächste Element
pagegenerator.prototype.nextPage = function(){
	this.showPage(this.aktpage+1);
}
//lastPage: "blättert zurück"
pagegenerator.prototype.lastPage = function(){
	this.showPage(this.aktpage-1);
}
//showPage(pagenummer): blättert zur seite pagenummer
pagegenerator.prototype.showPage = function(page){
	if(page*0!=0 || page===-1)return;
	this.pagedivs[this.aktpage].classList.remove("active");
	//seems not enough or too late,
	//aktpage has changed to new aktpage after new init
	//so seek old one and if there remove active-state:
	let oldaktpage = document.querySelector('.ppage.active');
	if(oldaktpage)oldaktpage.classList.remove('active');

	if(page>=this.pages.length)page= this.pages.length-1;
	if(page<0)page=0;
	this.aktpage = page;
	var slidenr = page;
	slidenr++;
	document.location.hash = "slide"+slidenr;
	//console.log("aktpage:"+this.aktpage+" pagedivslength:"+this.pagedivs.length+" page:"+page);
	this.pagedivs[page].classList.add("active");
	this.pagedivs[page].scrollTop = 0;
	this.startGifAnimations(this.pagedivs[page]);
}
pagegenerator.prototype.startGifAnimations = function(slide){
  let allimages = slide.getElementsByTagName("img");
  for (var x=0;x<allimages.length;x++){
    let actsrc = allimages[x].src;
    let expectedGif = 'data:image/gif'
    if(actsrc.substring(0,expectedGif.length)==expectedGif){
      var b64= allimages[x].src;
      var image = allimages[x];
      allimages[x].src="";
			image.src=b64;
    }
  }
}

/*
when the dropdown-menu is activated show the actual insertMenu:
*/
pagegenerator.prototype.showInsertMenu = function(){
	//helperfunction:
	function constructButton(innerhtml, insertfunction){
		var b = document.createElement("button");
		b.innerHTML = innerhtml;
		b.onclick = insertfunction;
		return b;
	}

	var insertmenu = document.getElementById("insertarea");
	var xtram = document.getElementById("extrainsertmenu");
	var container = document.getElementById("nicesidebarsymbol");
	let editorblockfade = document.getElementById('editorblockfade');

	if(container.classList.contains('active')){
		container.classList.remove('active');
		editorblockfade.classList.remove('nofade');
		return;
	}
	editorblockfade.classList.add('nofade');
	container.classList.add("active");

	//check if we are on an object:
	var onObject = slidenote.parser.CarretOnElement(slidenote.textarea.selectionEnd);
	//console.log("show insertMenu with "+onObject);
	if(onObject && onObject.dataobject){
		//console.log("insertmenu: dataobject found");
		//get theme:
		var theme = slidenote.datatypes.elementOfType(onObject.dataobject.type).theme;
		var extrainsertmenuarea=null;
		if(theme.hasInsertMenu)extrainsertmenuarea=theme.insertMenuArea(onObject.dataobject);

		//console.log(theme);
		if(theme.hasInsertMenu && extrainsertmenuarea!=null){

				//console.log("theme found");
				insertmenu.classList.add("insertmenu-extra");
				var extrainsertmenu = document.getElementById("extrainsertmenu");
				extrainsertmenu.innerHTML = "";
				extrainsertmenu.appendChild(extrainsertmenuarea);
				document.getElementById("insertmenulabel").innerText = onObject.dataobject.type.toUpperCase();
		}else{
			insertmenu.classList.remove("insertmenu-extra");
			document.getElementById("insertmenulabel").innerText = "INSERT";
			document.getElementById("extrainsertmenu").innerHTML = "nothing";
		}
	}else if(onObject && onObject.typ ==="image"){
		//insertmenu of image:
		insertmenu.classList.add("insertmenu-extra");
		var extrainsertmenu = document.getElementById("extrainsertmenu");
		extrainsertmenu.innerHTML = "";
		extrainsertmenu.appendChild(slidenote.extensions.getThemeByName("imgtourl").insertMenu(onObject));
		document.getElementById("insertmenulabel").innerText = "IMAGE";
	}else if(onObject && (onObject.tag === "codestart" || onObject.tag === "codeende")
		&& slidenote.datatypes.elementOfType("code").theme){
		var codemenu = slidenote.datatypes.elementOfType("code").theme.insertMenuArea(onObject);
		//console.log(codemenu);
		insertmenu.classList.add("insertmenu-extra");
		var xtram = document.getElementById("extrainsertmenu");
		xtram.innerHTML = "";
		xtram.appendChild(codemenu);
		document.getElementById("insertmenulabel").innerText = "CODE";
	}else if(onObject && onObject.typ==="pagebreak"){
		insertmenu.classList.add("insertmenu-extra");
		xtram.innerHTML = "";
		xtram.appendChild(constructButton("add background&shy;image", function(){
			var pagenr = slidenote.parser.map.pageAtPosition(slidenote.textarea.selectionEnd)+1;
			//console.log("Add Backgroundimage to slide"+pagenr);
			var inserttext = "![](backgroundslide"+pagenr+")\n\n";
			var pos = slidenote.parser.map.pagestart[pagenr].posinall;
			slidenote.textarea.value = slidenote.textarea.value.substring(0,pos)+
																	inserttext+
																	slidenote.textarea.value.substring(pos);
			slidenote.textarea.selectionEnd=pos+inserttext.length-3;
			slidenote.parseneu();
			slidenote.textarea.focus();
			setTimeout("slidenote.presentation.showInsertMenu()",500);
		}));
	}else if(onObject && onObject.tag ==="title"){
			insertmenu.classList.add("insertmenu-extra");
			xtram.innerHTML="";
			var titlef = function(){
				var el = slidenote.parser.CarretOnElement();
				var selend = slidenote.textarea.selectionEnd;
				var pos = el.posinall;
				var newel = this.insert;
				var newpos = pos+el.mdcode.length;
				slidenote.textarea.value = slidenote.textarea.value.substring(0,pos)+
													newel + slidenote.textarea.value.substring(newpos);
				slidenote.textarea.selectionEnd = selend+newel.length-el.mdcode.length;
				slidenote.parseneu();
				slidenote.textarea.focus();
			}
			var h1b = constructButton("H1",titlef);
			h1b.insert = "#";
			var h2b = constructButton("H2",titlef);
			h2b.insert = "##";
			var h3b = constructButton("H3",titlef);
			h3b.insert ="###";
			xtram.appendChild(h1b);
			xtram.appendChild(h2b);
			xtram.appendChild(h3b);
	}else if(onObject && onObject.label ==="list"){
		insertmenu.classList.add("insertmenu-extra");
		xtram.innerHTML="";
		var listfunc = function(){
			slidenote.changeListType(this.insert);
		}//end of insertfunction

		var lbuttonlist = ["- ", "+ ", "* ","1. ","1.) ","1) ", "a) ","I) "];
		for(var lbx=0;lbx<lbuttonlist.length;lbx++){
			var b=constructButton(lbuttonlist[lbx],listfunc);
			b.insert=lbuttonlist[lbx];
			xtram.appendChild(b);
			if(lbx===2)xtram.appendChild(document.createElement("hr"));
		}
	}else if(onObject){
		//standard-Object:
		insertmenu.classList.add("insertmenu-extra");
		//console.log(onObject);
		xtram.innerHTML = "";
		var b=constructButton("select element",function(){
			var el = slidenote.parser.CarretOnElement();
			if(el && el.brotherelement){
				slidenote.textarea.selectionStart = el.posinall;
				slidenote.textarea.selectionEnd = el.brotherelement.posinall+el.brotherelement.mdcode.length;
			}else if(el){
				slidenote.textarea.selectionStart = el.posinall;
				slidenote.textarea.selectionEnd =slidenote.parser.map.lineend[el.line];
			}
			slidenote.textarea.blur();
			slidenote.textarea.focus();
		});
		xtram.appendChild(b);
		xtram.appendChild(constructButton("none"),function(){alert('hi')});

	}else{
		insertmenu.classList.remove("insertmenu-extra");
		container.classList.remove("active");
		return;
		//document.getElementById("insertmenulabel").innerText = "INSERT";
		//document.getElementById("extrainsertmenu").innerHTML = "nothing";
	}
	//safari-hack:
	//insertmenu.style.left = document.getElementById("sidebar").offsetLeft + "px";

	//console.log("show insertMenu");
	//insertmenu.style.visibility = "visible";
	insertmenu.tabIndex = 0;
	//position insertmenu after carretsymbol or above:
	//var carretline = document.getElementsByClassName("carretline")[0];
	var cursorlinesymbol = document.getElementById("cursorlinesymbol");
	var symbol = document.getElementById("nicesidebarsymbol");

	var top = symbol.offsetTop + (symbol.offsetHeight);
	var topmax = slidenote.textarea.offsetHeight - insertmenu.offsetHeight;
	//console.log("top vs. topmax:"+top+"/"+topmax+"\ntextarea.offsetHeight:"+slidenote.textarea.offsetHeight+", symbol.offsetHeight:"+symbol.offsetHeight+", offsetTop:"+symbol.offsetTop);
	if(top>topmax && symbol.offsetTop>symbol.offsetHeight){
		//top-=insertmenu.offsetHeight;
		//top-=(symbol.offsetHeight/2);
		insertmenu.classList.add("top");

		//var cursorlinesymboltop = insertmenu.offsetHeight -9;
		//cursorlinesymbol.style.top = cursorlinesymboltop+"px";
	} else{
		insertmenu.classList.remove("top");
		//cursorlinesymbol.style.top ="-7px";
	}
	//insertmenu.style.top = top+"px";


	//slidenote.textarea.blur();
	//slidenote.textarea.focus(); //get focus on slidenote again to regain cursor
	var carretdiv = document.getElementById("carret");
	if(carretdiv)carretdiv.classList.add("show");
	//insertmenu.focus();
	//if(carretline)carretline.style.visibility="hidden";
	//symbol.style.visibility = "hidden";

	this.closeMenu = function(e){
		//console.log("closed insertmenu");
		//console.log(e);
		slidenote.textarea.removeEventListener("click",slidenote.presentation.closeMenu);
		slidenote.textarea.removeEventListener("keydown",slidenote.presentation.closeMenu);
		slidenote.textarea.removeEventListener("keyup",slidenote.presentation.closeMenu);
		slidenote.textarea.removeEventListener("focus",slidenote.presentation.closeMenu);
		slidenote.textarea.removeEventListener("scroll",slidenote.presentation.closeMenu);
		setTimeout(function (){
			var cursor = document.getElementById("carret");
			if(cursor)cursor.classList.remove("show");
			var insertmenu = document.getElementById("insertarea");
			var symbol = document.getElementById("nicesidebarsymbol");
			symbol.classList.remove("active");
			//symbol.style.visibility = "visible";
			insertmenu.tabIndex = undefined;
			//insertmenu.style.visibility = "hidden";
			document.getElementById("extrainsertmenu").innerHTML = "";
			//var carretline = document.getElementsByClassName("carretline")[0]
			//if(carretline)carretline.style.visibility="visible";
			slidenote.textarea.focus();
		},2);

	}
	//how often will this be called? when do i have to focus?
	//console.log("insert menu ready to focus?" + xtram.firstChild.innerHTML);
	//setTimeout("console.log('focus on insertmenu-button:');document.getElementById('extrainsertmenu').firstChild.focus()",500);
	//xtram.firstChild.focus();
	//insertmenu.onclick = this.closeMenu;
		slidenote.textarea.addEventListener("click", this.closeMenu);
		slidenote.textarea.addEventListener("focus",this.closeMenu);
		slidenote.textarea.addEventListener("scroll",this.closeMenu);
		for(var x=0;x<slidenote.extensions.themes.length;x++){
			if(slidenote.extensions.themes[x].active)slidenote.extensions.themes[x].styleThemeMDCodeEditor("insertAreaVisible"); //Hook-Funktion
		}


}

pagegenerator.prototype.startLoadingScreen = function(){
	var loadingscreen = document.getElementById("slidenoteLoadingScreen");
	loadingscreen.classList.add("active");
	var blobs = loadingscreen.getElementsByClassName("loading-blob");
	var randomnr = Math.floor(Math.random()*(blobs.length));
	for(var x=0;x<blobs.length;x++){
		if(x===randomnr)blobs[x].classList.add("active");
		else blobs[x].classList.remove("active");
	}

}

/* pagegenerator.showpresentation() startet und beendet die präsentation
 * startet die eigentliche präsentation durch aufruf von
 * 1. this.init() - erneutes und finales einlesen des geparsten codes etc. aus dem emdparse-objekt
 * 2. this.stylePages() - styled die Seiten mit zusätzlichem HTML und hängt CSS-Klassen an
 * 3. this.showPage(presentation.emdparsobjekt.pageAtPosition(quelle.selectionStart)[0]) - springt zur aktuell bearbeiteten Seite
 * 4. praesesrahmen.classList.add("fullscreen") setzt die Präsentation auf Vollbildmodus
 *
 * beendet die präsentation
 * 1. entfernen der klasse fullscreen
 * 2. springen und scrollen an die Stelle der zuletzt in der Präsentation dargestellten Seite
*/
var fullscreen = false;
pagegenerator.prototype.showpresentation = function(forExport, close){
	slidenote.parseneu();
	if(forExport)this.forExport = true; else this.forExport = false;
	var praesesrahmen = slidenote.presentationdiv.parentElement;//document.getElementById("praesentationrahmen");
	var quelle = slidenote.textarea;
	var loadingscreen = document.getElementById("slidenoteLoadingScreen");
	this.calculationtimestart = new Date();
	if(loadingscreen ===undefined || loadingscreen ===null){
		loadingscreen = document.createElement("div");
		loadingscreen.id="slidenoteLoadingScreen";
		loadingscreen.innerText="Please wait while presentation is generated";
		document.getElementsByTagName("body")[0].appendChild(loadingscreen);
	}

	var cursorpos = slidenote.textarea.selectionEnd;
	//this.cursorposBeforePresentation = cursorpos;
	if(!fullscreen && !close){
		//history-hack:
		document.location.hash = "editor";
		//this.init();
		//loadingscreen.classList.add("active");
		this.startLoadingScreen();
		slidenote.presentation.animatePresentationControl(false);
		fullscreen=true;
		slidenote.parser.renderMapToPresentation();
		//document.getElementById("praesentation").innerHMTL = "";
		slidenote.presentationdiv.innerHTML = "";
		this.init(slidenote.parser, slidenote.presentationdiv);
		//var test2 = document.getElementsByTagName("code");
		//if(test2!=null)console.log(test2.length+"codes");
		this.stylePages();
		//var test = document.getElementsByTagName("code");
		//if(test!=null)console.log(test.length+"codes code1: ");
		//console.log("querycodeanzahl:"+document.querySelectorAll(".presentation code")[0].innerHTML);

		//console.log("querycodeanfang:"+document.querySelectorAll(".presentation code")[0].innerHTML.substring(0,20));
		//this.showPage(presentation.emdparsobjekt.pageAtPosition(quelle.selectionStart)[0]);
		//console.log("show page:"+this.emdparsobjekt.map.pageAtPosition(cursorpos) + " pos:"+cursorpos);
		//this.showPage(this.emdparsobjekt.map.pageAtPosition(cursorpos));
		var showpagenr = this.emdparsobjekt.map.pageAtPosition(cursorpos);
		if(this.generatedPages){
			for(var gpx=this.generatedPages.length;gpx>=0;gpx--){
				if(this.generatedPages[gpx]<showpagenr)showpagenr++;
			}
			//console.log("changed pagenr to:"+showpagenr + " gp-length:"+this.generatedPages.length);

		}
		this.showPage(showpagenr);
		praesesrahmen.classList.add("fullscreen");
		praesesrahmen.tabIndex=-1; //make it tabable to get keystrokes
		praesesrahmen.focus(); //focus it to get keystrokes
		//document.getElementById("praesentation").focus();
		//praesesrahmen.style.height = document.height;
		document.body.style.height = "100vh";
		document.body.style.overflow = "hidden";
		//start presentation-preview in fullscreen:
		//if(!document.fullscreenElement)slidenote.goFullScreen(false, true);
	} else{
		//close presentation
		fullscreen=false;
		//history-hack:
		document.location.hash = "editor";
		praesesrahmen.tabIndex = undefined; //undo tabable so it cant get accessed by accident/screenreader
		if(this.generatedPages){
			for(var gpx=0;gpx<this.generatedPages.length;gpx++){
				if(this.generatedPages[gpx]<this.aktpage)this.aktpage--;
			}
			//console.log("changed aktpage to:"+this.aktpage);
		}
		//presentation.ausgabediv.classList.remove("active");
		//console.log("map.linestart"+this.aktpage+":"+slidenote.parser.map.linestart[slidenote.parser.map.pagestart[this.aktpage].line]);
		var oldPage = slidenote.parser.map.pageAtPosition(quelle.selectionEnd);//slidenote.parser.pageAtPosition(quelle.selectionEnd, "pagenr");
		//console.log("oldpage:"+oldPage+"aktpage:"+this.aktpage);
		if(oldPage != this.aktpage){
			quelle.selectionEnd = slidenote.parser.map.lineend[slidenote.parser.map.pagestart[this.aktpage].line];
			quelle.selectionStart = quelle.selectionEnd;
			quelle.focus();
			//quelle.selectionEnd = slidenote.parser.map.linestart[slidenote.parser.map.pagestart[this.aktpage].line];//presentation.emdparsobjekt.positionAtPage(presentation.aktpage);
			//we scroll to the line before the carret to show slidenr
			slidenote.scrollToPosition(slidenote.parser.map.pagestart[this.aktpage].posinall-1);
		} else{
			quelle.focus();
		}
		//console.log("parse neu ein");
		slidenote.parseneu();
		praesesrahmen.classList.remove("fullscreen");
		document.body.style.height = "unset";
		document.body.style.overflow = "unset";
		//praesesrahmen.style.height = "unset";
		//check for fullscreen-preview:
		//if(document.fullscreenElement && !document.body.classList.contains('fullscreen-editor')){
		//	slidenote.goFullScreen(document.fullscreenElement, true); //close fullscreen
		//}
	}
}

//sets the presentation to selected previewmode
pagegenerator.prototype.setPreviewStyle = function(mode){
		var pres = document.getElementById("praesentation");
		var dim = document.getElementById("previewdimension");
		var previewmodes = [
			{id:"fullhd",dimension:"1920x1080px"},
			{id:"widescreen",dimension:"1440x720px"},
			{id:"beamer",dimension:"1024x768px"},
			{id:"ipad",dimension:"unknown"},
			{id:"iphone",dimension:"unknown"},
			{id:"galaxy",dimension:"unknown"},
		];
		for(var x=0;x<previewmodes.length;x++){
			pres.classList.remove("preview-"+previewmodes[x].id);
			if(previewmodes[x].id===mode){
				pres.classList.add("preview-"+mode);
				dim.innerText = previewmodes[x].dimension;
			}
		}
}

pagegenerator.prototype.enterPreviewMode = function(){
	var presselect = document.getElementById("previewselection");
	this.setPreviewStyle(presselect.value);
	var preswrapper = document.getElementById("praesentationrahmen");
	preswrapper.classList.toggle("previewmode");
}

pagegenerator.prototype.animatePresentationControl = function(toOpen){
	var animations;
	if(toOpen){
		document.getElementById("controlarea").classList.remove("closed");
		animations = document.getElementsByClassName("animateToOpen");
	}else{
		document.getElementById("controlarea").classList.add("closed");
		animations = document.getElementsByClassName("animateToClose");
	}
	for(var i=0;i<animations.length;i++){
		animations[i].beginElement();
	}
}

/* Theme-Objekt
 * Das Theme-Objekt ist die Hauptschnittstelle um Themes einzuspielen. Durch ein Plug-In ähnliches System können so zusätzliche
 * HTML-Tags und CSS-Klassen an die Präsentation gebracht werden.
 * Erwartet: nombre= Name des Themes.
 * optional: weight= Gewicht des Themes. Darüber wird die Reihenfolge der Theme-Anwendungen gesteuert von niedrigem Gewicht zu hohem. Default ist 0
 * Hook-Funktion: styleThemeSpecials () ist dazu gedacht, im .js-File des Themes bei Bedarf überschrieben zu werden
 * Hilfsfunktionen:
 * HtmlElements ( css-query-code ) liefert alle HTML-Elemente einer Präsentation des gefragten Types
 * cycleThroughHtmlElements (css-query-code) durchläuft die gefundenen Elemente des css-query-codes einer Präsentation und ersetzt innerHTML
											 durch Ergebnis von specialStylePerElement
 * interne  Hook-Funktion: specialStylePerElement (text / innerHTML) wird in der Hilfsfunktion cycleThroughHtmlElements aufgerufen
 * 			bekommt: textstring des innerHTML des durchlaufenen HTMLElements, erwartet return: text für selbiges
*/

function Theme(nombre, weight){
	this.classname = nombre;  //string für die klasse
	this.styles = new Array(); //array of stylepager
	this.jsfile;
	this.cssfile;
	this.active = true;
	this.filepath = "themes/";
	if(weight !=null)this.weight = weight; else this.weight = 0; //gewicht der klasse: höheres gewicht wird später ausgeführt, niedrigeres früher
	this.htmlelements;
	this.querycode = "#praesentation .ppage ";
	this.themetype = "extension";
	this.descriptiontext = "";
	this.designoptions;
	this.globaloptions;
//	console.log("Theme "+this.classname+" found "+this.htmlelements.length + " of "+htmlelement);
}

/* Theme.addStyle erwartet ein zeilenmuster, nach welchem gescannt wird
* sowie ein start und ein end html-tag mit welchem gefundene muster ummantelt werden
* muster ist ein Array mit zeilencode, bspw: text, h2, code etc.
*/
Theme.prototype.addStyle = function(muster, start, end){
	this.styles.push(new stylepager(muster,start,end));
}

/* Theme.specialStylePerElement ist eine Hook-Funktion, welche
* dazu gedacht ist überschrieben zu werden in einem angepassten
* theme. sie wird aus der funktion cycleThroughHtmlElements aufgerufen
* und bearbeitet das fertige innerHTML des betreffenden HTML-Elements
*/

Theme.prototype.specialStylePerElement = function(text){
	return text;
}

/* Theme.HtmlElements erwartet htmlelement-css-code für eine query
* und liefert alle gefundenen elemente innerhalb der präsentation zurück
*/

Theme.prototype.HtmlElements = function (htmlelement){
	var elements;
	if(htmlelement!=null)elements =  document.querySelectorAll(this.querycode + htmlelement);
		//else return document.querySelectorAll(this.querycode);
	return elements;
}

/* Theme.cycleThroughHtmlElements wird aufgerufen mit dem querycode
* nach welchem html-elemente durchlaufen werden sollen.
* es sucht die betreffenden html-elemente innerhalb der präsentation raus
* und führt anschließend für jedes gefundene html-element die
* specialStylePerElement-Hook-Funktion aus
*/

Theme.prototype.cycleThroughHtmlElements = function(htmlelement){
	var querycode = "#praesentation .ppage "+htmlelement;
	var elements;
	if(htmlelement!=null)elements = document.querySelectorAll(querycode);
	if(elements != null){
	//console.log("cycle through "+elements.length+" elements of type "+htmlelement);
		for(var x=0;x<elements.length;x++){
			var styledtext = this.specialStylePerElement(elements[x].innerHTML);
			elements[x].innerHTML = styledtext;
		}
	}
}

Theme.prototype.styleThemeSpecials = function(){
	//Hook-Funktion, gedacht zum überschreiben in .js-Datei des Themes
}
Theme.prototype.insideFinalizeHtml = function(template){
	//HookFunction inside Finalize Html, before adding template to body and rendering it
}
Theme.prototype.afterFinalizeHtml = function(){
	//Hook-Function, called before styleThemeSpecials
}
Theme.prototype.afterStyleThemeSpecials = function(){
	//Hook-Function, called after styleThemeSpecials
}
Theme.prototype.afterStyle = function(){
	//Hook-Function, called after all styling is done
}
Theme.prototype.styleThemeMDCodeEditor = function(){
	//Hook-Funktion, gedacht zum überschreiben in .js-Datei des Themes
	//Wird ausgelöst wenn MDCodeEditor ausgewählt ist
}
Theme.prototype.insertMenuArea = function(){
	//Hook-Function, returns null or html for insertmenuarea:
}

Theme.prototype.addDesignOption = function(type, description, labels, values, selected){
	//type: html-element-unterscheidung:
	var htmlelements ="radio,select,checkbox,button";
	if(this.designoptions==null)this.designoptions = new Array();
	this.designoptions.push({type:type,description:description,labels:labels,values:values,selected:selected});
}

Theme.prototype.changeDesignOption = function(optionnr, value){
	//Hook-Funktion, gedacht zum Überschreiben in .js-Datei des Themes
}

Theme.prototype.addGlobalOption = function(type, description, labels, values){
	var htmlelements = "radio, select, checkbox, button";
	if(this.globaloptions==null)this.globaloptions = new Array();
	this.globaloptions.push({type:type,description:description, labels:labels, values:values});
}

Theme.prototype.changeGlobalOption = function(optionnr, value){
	//Hook-Funktion, gedacht zum Überschreiben in .js-Datei des Themes
}
Theme.prototype.addEditorbutton = function(buttoninnerhtml,startcode,endcode, insertfunction){
	if(this.editorbuttons==null)this.editorbuttons = new Array();
	this.editorbuttons.push({mdstartcode:startcode, mdendcode:endcode,innerhtml:buttoninnerhtml, insertfunction:insertfunction});
}
Theme.prototype.init = function(){
	//Hook-Funktion, gedacht zum Überschreiben in .js-Datei des Themes
	//wird nach zufügen des Themes aufgerufen
}
Theme.prototype.changeThemeStatus = function(status){
	this.active = status;
	if(this.themetype==="css"){
		//on css-choice look out for highlight-theme-selection:
		let hltheme = slidenote.extensions.getThemeByName('highlight');
		if(hltheme && hltheme.active &&
			this.highlightTheme != undefined &&
			this.active ){
			hltheme.changeDesignOption(0,this.highlightTheme);
		}
	}
	this.afterThemeStatusChange();
}
Theme.prototype.afterThemeStatusChange = function(){
	//Hook-Funktion, zum Überschreiben im Theme
}
Theme.prototype.saveConfigString = function(){
	//Hook-Funktion, gedacht zum Überschreiben in .js-Datei des Themes
	//wird von slidenoteguardian benutzt um Configs zu speichern
	return null;
}
Theme.prototype.loadConfigString = function(data){
	//Hook-Funktion, gedacht zum Überschreiben in .js-Datei des Themes
	//wird von slidenoteguardian benutzt um Configs zu laden
}


/* new extension manager: to separate code better as own object
 * handles all extension-related stuff like
 * loading the themes etc.
 */

function ExtensionManager(slidenote, options){
	this.slidenote = slidenote; //the active slidenote
	this.options = options || {};  //options-object for future use
	this.themes = new Array();
	this.loadingThemes = new Array();
	this.failedThemes = new Array();
	this.allThemesLoaded = false;
	this.themeObjektString = "";
	this.themeCssString = "";
	this.loadBasicThemes();
	this.hooksAllThemesLoaded = new Array();
}

ExtensionManager.prototype.loadBasicThemes = function(){
	var themenamesToLoad = this.options.basicThemes;
	console.log("load basic themes:");
	console.log(this.options);
	if(themenamesToLoad===undefined){
	this.loadTheme("history");
	this.loadTheme("hiddenobjects");
	this.loadTheme("blocks");
	this.loadTheme("stickytitles", true);
	this.loadTheme("highlight");
	//this.loadTheme("transition");
	this.loadTheme("chartist");
	this.loadTheme("table", true);
	this.loadTheme("imgtourl");
	this.loadTheme("klatex", true);
	this.loadTheme("switchparseelements", true);
	this.loadTheme("sections");
	this.loadTheme("outline");
	this.loadTheme("speaker");
	this.loadTheme("footnote",true);
	this.loadTheme("progressbar");
	this.loadTheme("extraoptions",true);
	this.loadTheme("node");
	//css-themes:
	//this.loadTheme("azul");
	//this.loadTheme("redalert");
	//this.loadTheme("luminoso");
	this.loadTheme("minimalist");
	this.loadTheme("dark");
	this.loadTheme("colorful");
	//this.loadTheme("tufte");
	//this.loadTheme("prototyp");
	}else{
		console.log("extraoptions found");
		for(var x=0;x<themenamesToLoad.length;x++)this.loadTheme(themenamesToLoad[x].name, themenamesToLoad[x].css);
	}
}

ExtensionManager.prototype.loadTheme = function(themename, nocss){
	if(this.themeObjektString.indexOf(themename)==-1){
		console.log("load Theme "+themename);
		this.allThemesLoaded = false;
		this.loadingThemes.push({name:themename});
		var newtheme = this.slidenote.appendFile('script',themename+".js");
		newtheme.id = "Theme"+themename;
		newtheme.onerror = function(){slidenote.extensions.failTheme(this.id.substring(5));};
		if(!nocss){
			this.slidenote.appendFile('css',themename+".css");
			this.themeCssString += themename+";";
		}
		this.themeObjektString +=themename+";";
	}
	//console.log(this.themeObjektString);
}
/* ExtensionManager.addTheme(theme)
 * fügt ein Theme dem ExtensionManager hinzu
 * erwartet: Theme-objekt
 * Normalerweise wird in einer theme.js datei ein neues theme erstellt und mittels dieser Funktion dem ExtensionManager übergeben
*/
ExtensionManager.prototype.addTheme = function (theme){
	this.themes.push(theme);
	if(theme.loadingFiles !=undefined){
		console.log("extra files"+theme.classname+". load "+theme.loadingFiles.length+" extra scriptfiles");
		for(var x=0;x<theme.loadingFiles.length;x++){
			var file = theme.loadingFiles[x];
			var filename = file.src.substring(file.src.lastIndexOf("/"))
			file.id = "Theme"+filename;
			this.loadingThemes.push({name:filename});
			file.onerror = function(){slidenote.extensions.failTheme(this.id.substring(5));};
			file.onload = function(){
				slidenote.extensions.removeFromLoadingList(this.id.substring(5));
				//console.log("file "+file.id+" loaded");
			};
		}
	}
	this.removeFromLoadingList(theme.classname);
	//console.log("neues Theme geladen: "+theme.classname);
	//css-mixup vermeiden:
	this.changeThemeStatus(this.themes.length-1, theme.active);
	//this.stylePages();
	//theme.init(); should be called after all themes are initialized
}

ExtensionManager.prototype.failTheme = function(themename){
	//instead we should retry at least once, better 3 times to make shure
	this.failedThemes.push({name:themename});
	this.removeFromLoadingList(themename);
}

ExtensionManager.prototype.removeFromLoadingList = function(themename){
	for(var x=0;x<this.loadingThemes.length;x++)if(this.loadingThemes[x].name===themename)this.loadingThemes.splice(x,1);
	console.log("removed file from loading list:"+themename);
	if(this.loadingThemes.length===0)this.afterLoadingThemes();
}

ExtensionManager.prototype.addAfterLoadingThemesHook = function(hookfunc){
	if(this.allThemesLoaded)hookfunc(); else this.hooksAllThemesLoaded.push(hookfunc);
}

ExtensionManager.prototype.afterLoadingThemes = function(){
	this.allThemesLoaded = true;
	console.log("all themes loaded - ready to engage");
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].active)this.themes[x].init();
	}
	var failedthemes = "\n";
	for(var x=0;x<this.failedThemes.length;x++)failedthemes+=this.failedThemes[x].name+"\n";
	if(this.failedThemes.length>0)console.log("Failed to load "+this.failedThemes.length+" Themes:"+failedthemes);
	//this.slidenote.parseneu();
	for(var x=0;x<this.hooksAllThemesLoaded.length;x++)this.hooksAllThemesLoaded[x]();
	//now toolbar should be complete so sort it:
	this.sortToolbar();
	//this.enableKeyboardShortcuts()
	if(document.getElementById("slidenoteeditor"))
	slidenote.appendFile("script","keyboardshortcuts.js");
}

ExtensionManager.prototype.sortToolbar = function(){
	const toolbarorder = [
		"newslide",
		"title",
		"image",
		"italic",
		"bold",
		"marked",
		"crossed",
		"ulist",
		"olist",
		"quote",
		"footnote",
		"link",
		"inlinecode",
		"code",
		"chartist",
		"node",
		"table",
		"sections",
		"hiddenobjects",
		"klatex",
		"comment",
	];

	let toollist = document.getElementById('toolbarbuttons');
	if(!toollist)return; //nothing to do if there is no toollist
	let lilist = toollist.getElementsByTagName('li');
	let buttons = toollist.getElementsByTagName('button');
	let buttonarr = [];
	for(var x=0;x<buttons.length;x++)buttonarr[x]=buttons[x];
	buttonarr.sort(function(a,b){
		return toolbarorder.indexOf(a.name)-toolbarorder.indexOf(b.name);
	});
	for(var x=0;x<lilist.length;x++){
		lilist[x].appendChild(buttonarr[x]);
	}
}

/*
ExtensionManager.prototype.keyboardshortcuts = {
	toolbararrow : function(e){
		if(e.key === "ArrowUp" && this.previousElementSibling && this.previousElementSibling.tagName==="BUTTON"){
			this.previousElementSibling.focus();
		}else if(e.key === "ArrowDown" && this.nextElementSibling){
			this.nextElementSibling.focus();
		}
	}
}

ExtensionManager.prototype.enableKeyboardShortcuts = function(){
	var toolbarbuttons = document.getElementById("texteditorbuttons").getElementsByTagName("button");
	for(var x=0;x<toolbarbuttons.length;x++)toolbarbuttons[x].onkeyup = this.keyboardshortcuts.toolbararrow;


} */

/*getThemeByName returns the Theme found by name:
*/
ExtensionManager.prototype.getThemeByName = function(name){
	for(var x=0;x<this.themes.length;x++)if(this.themes[x].classname ===name)return this.themes[x];
}
//initial dialog for advanced menu:
ExtensionManager.prototype.showAdvancedMenu = function(){
	var dialognode = document.createElement("div");
	var editoroptions = document.createElement("button");
	editoroptions.classList.add("menuitem");
	editoroptions.title = "Open Editor Options";
	editoroptions.innerText = "advanced editor options";
	editoroptions.onclick = function(){slidenote.extensions.showEditorMenu()};
	dialognode.appendChild(editoroptions);
	var keyboardoptions = document.createElement("button");
	keyboardoptions.classList.add("menuitem");
	keyboardoptions.title = "Open Keyboard Configuration";
	keyboardoptions.innerText = "keyboard configuration";
	keyboardoptions.onclick = function(){slidenote.extensions.showKeyboardConfig()};
	dialognode.appendChild(keyboardoptions);
	var extensionsbutton = document.createElement("button");
	extensionsbutton.classList.add("menuitem");
	extensionsbutton.title = "Open Extensions Option";
	extensionsbutton.innerText = "extensions";
	extensionsbutton.onclick = function(){slidenote.extensions.showExtensionMenu()};
	dialognode.appendChild(extensionsbutton);
	var speakerbutton = document.createElement("button");
	speakerbutton.classList.add("menuitem");
	speakerbutton.title = "open speaker option";
	speakerbutton.innerText = "speaker";
	speakerbutton.onclick = function(){slidenote.extensions.showSpeakerConfig()};
	dialognode.appendChild(speakerbutton);
	var dialogoptions = {
		type:"dialog",
		title: "advanced options",
		content: dialognode,
		closebutton: true,
		focusOnFirst:true
	}
	var dialog = dialoger.buildDialog(dialogoptions);
}
//dialog for Editormenu / ex global options:
ExtensionManager.prototype.showEditorMenu = function(){
	var parent = document.createElement("ul");
	for(var x=0;x<this.themes.length;x++){
		var acttheme = this.themes[x];
		if(acttheme.globaloptions!=null && acttheme.active){
			//var actp = document.createElement("div");
			//var acttitle = document.createElement("h3");
			//acttitle.innerText = acttheme.classname;
			//actp.appendChild(acttitle);
			//var actplist = document.createElement("ul");
			//actp.appendChild(actplist);
			for(var glop=0;glop<acttheme.globaloptions.length;glop++){
				var actopt = acttheme.globaloptions[glop];
				var actoptli = document.createElement("li");
				actoptli.classList.add("globaloption");
				if(actopt.type==="checkbox"){
					var actinp = document.createElement("input");
					actinp.type="checkbox";
					actinp.nr = glop;
					actinp.id='global-option-checkbox-'+acttheme.classname+glop;
					actinp.name = acttheme.classname;
					actinp.classList.add("menuitem");
					if(actopt.values)actinp.checked = true;
					actinp.onclick = function(){
						slidenote.extensions.getThemeByName(this.name).changeGlobalOption(this.nr,this.checked);
						if(slidenoteguardian)slidenoteguardian.saveConfig("local");
						console.log("parseneu forced by config-change");
						slidenote.parseneu();
					}
					var actlabel = document.createElement("label");
					actlabel.innerText = actopt.description;
					actlabel.setAttribute("for",actinp.id);// for=actinp.name;
					actoptli.appendChild(actinp);
					actoptli.appendChild(actlabel);
					//actplist.appendChild(actoptli);
					parent.appendChild(actoptli);
				}
			}
			//parent.appendChild(actp);
		}
	}
	var dialogoptions = {
		type:"dialog",
		title:"advanced editor configuration",
		content:parent,
		closebutton:true,
		focusOnFirst:true
	};
	dialoger.buildDialog(dialogoptions);
}

//dialog for keyboard-config:
ExtensionManager.prototype.showKeyboardConfig = function(focusOnOptionName){
	var dialogoptions = {
		type:"dialog",
		title:"keyboard configuration",
		closebutton:true,
		focusOnFirst:true
	};
	dialogoptions.content = slidenote.keyboardshortcuts.buildOptionsMenu();
	var inputs = dialogoptions.content.getElementsByTagName("input");
	for(var x=0;x<inputs.length;x++)inputs[x].classList.add("menuitem");
	var buttons = dialogoptions.content.getElementsByTagName("button");
	for(var x=0;x<buttons.length;x++){
		buttons[x].classList.add("menuitem");
		if(buttons[x].name === focusOnOptionName)dialogoptions.focuson = buttons[x];
	}
	dialoger.buildDialog(dialogoptions);
}
//dialog for speakerConfig:
ExtensionManager.prototype.showSpeakerConfig = function(){
	var dialogoptions = {
		type:"dialog",
		title:"speaker configuration",
		closebutton:true,
		focusOnFirst:true
	};
	dialogoptions.content = slidenoteSpeaker.buildConfigMenu();
	dialoger.buildDialog(dialogoptions);
}

//dialog activate/deactivate Extensions:
ExtensionManager.prototype.showExtensionMenu = function(){
	var parent = document.createElement("div");
	var plist = document.createElement("ul");
	for(var x=0;x<this.themes.length;x++){
		var acttheme = this.themes[x];
		if(acttheme.themetype==="css")continue;
		var actli = document.createElement("li");
		var actinp = document.createElement("input");
		actinp.classname = acttheme.classname;
		actinp.type = "checkbox";
		actinp.classList.add("menuitem");
		actinp.onclick = function(){
			slidenote.extensions.changeThemeStatusByClassname(this.classname, this.checked);
			if(slidenoteguardian)slidenoteguardian.saveConfig("local");
			slidenote.parseneu();
		}
		if(acttheme.active)actinp.checked = true;
		var label = document.createElement("label");
		label.innerText = acttheme.description;
		if(!acttheme.description)label.innerText = acttheme.classname;
		actli.appendChild(actinp);
		actli.appendChild(label);
		plist.appendChild(actli);
	}
	parent.appendChild(plist);
	var dialogoptions = {
		type:"dialog",
		title:"extensions",
		closebutton:true,
		content:parent
	}
	dialoger.buildDialog(dialogoptions);
}
	/*showThemes zeigt die Themes in einem Div an und lässt sie dort aktivieren etc.
	*/
ExtensionManager.prototype.showThemes = function(tabnr){
	var breaktext = "<br>";
	var themetabtext = '';
	var designtabtext = '<h3>Basic Theme Selection</h3>';
	var designoptions = '<hr><h3>Design Options</h3>';
	var globaloptionstext = '';
	var chosencssclass;
	for(var x=0;x<this.themes.length;x++){
		var acttheme = this.themes[x];
		if(acttheme.themetype == "css"){
			var acttext = '<input type="radio" name="design" onchange="slidenote.extensions.changeThemeStatus('+x+',this.checked)"';
			if(acttheme.active)acttext +=' checked>'; else acttext+='>';
			if(acttheme.active)chosencssclass=acttheme.classname;
			acttext += '<label>';
			acttext += acttheme.classname + ": ";
			acttext+= acttheme.description;
			acttext +='</label>';
			designtabtext += acttext + breaktext;
		}else{
			var acttext = '<input type="checkbox" onchange="slidenote.extensions.changeThemeStatus('+x+',this.checked)"';
			if(acttheme.active)acttext +=' checked>'; else acttext+='>';
			acttext += '<label>';
			if(acttheme.description==null)acttext += acttheme.classname; else acttext+= acttheme.description;
			acttext +='</label>';
			themetabtext += acttext + breaktext;
		}
		if(acttheme.designoptions!=null && acttheme.active){
			//designoptions:
			designoptions +='<div class="designoptions">';
			designoptions +='<h3>'+acttheme.classname+'</h3>';
			for(var deso=0;deso<acttheme.designoptions.length;deso++){
				actoption = acttheme.designoptions[deso];
				designoptions+='<div class="designoption">';
				//console.log(actoption);
				if(actoption.type=="select"){
					designoptions+="<label>"+actoption.description+"</label>";
					designoptions+='<select onchange="slidenote.extensions.changeDesignOption('+x+','+deso+',this.value)">';
					for(var selopt = 0;selopt < actoption.labels.length;selopt++){
						designoptions+='<option value="'+actoption.values[selopt]+'"';
						if(actoption.selected==selopt)designoptions+=' selected="selected"';
						designoptions+='>';
						designoptions+=actoption.labels[selopt];
						designoptions+='</option>';
					}

					designoptions+='</select>';
				}
			}
			designoptions +='</div>';
		}
		if(acttheme.globaloptions!=null && acttheme.active){
			globaloptionstext+='<h3>'+acttheme.classname+'</h3>';
			for(var glop=0;glop<acttheme.globaloptions.length;glop++){
				actoption=acttheme.globaloptions[glop];
				globaloptionstext+='<div class="globaloption">';
				if(actoption.type=="checkbox"){
					var acttext = '<input type="checkbox" onchange="slidenote.extensions.changeGlobalOption('+x+','+glop+',this.checked)"';
					//console.log(actoption);
					if(actoption.values)acttext +=' checked>'; else acttext+='>';
					acttext += '<label>';
					if(actoption.description==null)acttext += actoption.classname; else acttext+= actoption.description;
					acttext +='</label>';
					globaloptionstext+=acttext;

				}
				globaloptionstext+='</div>';
			}
		}
	}
	//themeauswahlvoschau:
	var vorschau='<div id="designvorschau">' +
					'<h1>title</h1><h2>second title</h2><ol start="1"><li>nummeric</li><li>list</li></ol>'+
					'<p>some Text</p><ul><li>unordered list</li><li>unordered list</li></ul><p><b>some </b> '+
					'<i>text</i> <strike>to see</strike> <b><i>it all</i></b><br></p>'+
					'</div>';

	var seltab = document.getElementById("themeselectiontab");
	var destab = document.getElementById("designoptionstab");
	var gloptab= document.getElementById("globaloptionstab");
	var options = document.getElementById("options");
	seltab.innerHTML = themetabtext;
	destab.innerHTML = vorschau+designtabtext+designoptions;
	gloptab.innerHTML = globaloptionstext;
	options.classList.add("visible");
	var optiontabbar = options.getElementsByClassName("tabbar")[0].getElementsByTagName("h2");
	var tabbs = options.getElementsByClassName("optiontab");
	//console.log(optiontabbar);
	for(var otb=0;otb<optiontabbar.length;otb++){
		optiontabbar[otb].classList.remove("active");
		tabbs[otb].classList.remove("active");
	}
	var tabbnr = tabnr;
	if(tabbnr==null)tabbnr=0;
	optiontabbar[tabbnr].classList.add("active");
	tabbs[tabbnr].classList.add("active");
	if(tabbnr==0){
		document.getElementById("designvorschau").classList.add(chosencssclass);
	}


}

/*optionsTab zeigt den jeweiligen Tab an:
* not used anymore, its from old optionsMenu
*/
ExtensionManager.prototype.optionsTab = function(tabnr){
	this.showThemes(tabnr);
}

//hideThemes versteckt die Theme-auswahl bei klick auf close
// not used anymore
ExtensionManager.prototype.hideThemes = function(){
	document.getElementById("options").classList.remove("visible");
	slidenote.textarea.focus();
	console.log("parseneu forced after optionsclose");
	slidenote.parseneu();
}

ExtensionManager.prototype.changeThemeStatusByClassname = function(classname,status){
	for(var x=0;x<this.themes.length;x++)if(this.themes[x].classname===classname){
		this.changeThemeStatus(x,status);
		break;
	}
}

//changeThemeStatus erwartet eine themenr und ändert das entsprechende theme
ExtensionManager.prototype.changeThemeStatus = function(themenr, status){
	if(this.themes[themenr].themetype=="css" && status){
		//es darf nur ein css ausgewählt werden?
		var vorschau = document.getElementById("designvorschau");
		var designchoice = document.getElementsByName("design");

		for(var x=0;x<this.themes.length;x++)if(this.themes[x].themetype=="css"){
			this.themes[x].active=false;
			if(vorschau!=null)vorschau.classList.remove(this.themes[x].classname);
		}
		if(vorschau!=null)vorschau.classList.add(this.themes[themenr].classname);
		for(var x=0;x<designchoice.length;x++)if(designchoice[x].number ===themenr)designchoice[x].checked = true;
	}
	//this.themes[themenr].active = status;
	this.themes[themenr].changeThemeStatus(status);
	var toolbox = document.getElementById("texteditorbuttons");
	if(toolbox)var toolboxbuttons = toolbox.getElementsByTagName("button");
	var toolboxlist = document.getElementById("toolbarbuttons");

	if(this.themes[themenr].editorbuttons!=null && toolbox !=null){
		if(status){
			for(var x=0;x<this.themes[themenr].editorbuttons.length;x++){
				var actbutton = this.themes[themenr].editorbuttons[x];
				var newhtmlbutton = document.createElement("button");
				newhtmlbutton.type = "button";
				newhtmlbutton.classList.add(this.themes[themenr].classname+"button");
				newhtmlbutton.name=this.themes[themenr].classname;
				newhtmlbutton.classList.add("menuitem");
				newhtmlbutton.innerHTML = actbutton.innerhtml;

				//var actbuttonfunction = "insertbutton('null','"+actbutton.mdstartcode+"','"+actbutton.mdendcode+"');";
				newhtmlbutton.value = actbutton.mdstartcode;
				//console.log("actbuttonfunction:"+actbuttonfunction);
				//newhtmlbutton.setAttribute("onclick",""+actbuttonfunction);
				if(this.themes[themenr].editorbuttons[x].insertfunction==undefined){
					newhtmlbutton.onclick = function(){
						slidenote.insertbutton(this.value);
					}
				}else {
					newhtmlbutton.onclick =
						slidenote.extensions.themes[themenr].editorbuttons[x].insertfunction;
				}
				//add keyboardsupport:
				//newhtmlbutton.onkeyup = slidenote.extensions.keyboardshortcuts.toolbararrow;
				//document.getElementById("standardinsertmenu").appendChild(newhtmlbutton);
				if(toolboxlist){
						var li = document.createElement("li");
						li.appendChild(newhtmlbutton);
						toolboxlist.appendChild(li);
				}else if(toolbox)toolbox.appendChild(newhtmlbutton);
			}
		}else{
			var oldbuttons = document.getElementsByClassName(this.themes[themenr].classname+"button");
			for(var x=oldbuttons.length-1;x>=0;x--)oldbuttons[x].parentNode.removeChild(oldbuttons[x]);
		}
		this.sortToolbar();
	}
	//console.log("themenr"+themenr+" "+this.themes[themenr].classname+" active geändert auf"+status);
}

ExtensionManager.prototype.changeDesignOption = function(themenr,optionnr, value){
	this.themes[themenr].changeDesignOption(optionnr, value);
	//console.log("themenr"+themenr+" "+this.themes[themenr].classname+" active geändert auf"+status);
}
ExtensionManager.prototype.changeGlobalOption = function(themenr,optionnr, value){
	this.themes[themenr].changeGlobalOption(optionnr, value);
	//console.log("themenr"+themenr+" "+this.themes[themenr].classname+" active geändert auf"+value);
}

ExtensionManager.prototype.CssThemes = function(){
	var cssthemes = new Array();
	for(var x=0;x<this.themes.length;x++){
		if(this.themes[x].themetype==="css"){
			cssthemes.push(this.themes[x]);
			if(this.themes[x].active){
				this.activeCssTheme = this.themes[x];
			}
		}
	}
	this.cssthemes = cssthemes;
	return cssthemes;
}

ExtensionManager.prototype.buildOptionsMenu = function(){
	if(this.optionmenu===undefined)this.optionmenu = document.getElementById("optionmenu");
	var optionmenu = this.optionmenu;
		//get all themes:
		var themelist = document.getElementById("optionmenupresentationdesign");
		themelist.innerHTML = "";
		var themeul = document.createElement("ul");
		var themes = slidenote.extensions.themes;
		var themedesctext = "";
		for(var tx=0;tx<themes.length;tx++){
			if(themes[tx].themetype ==="css"){
				//var acttext = '<input type="radio" name="design" onchange="slidenote.extensions.changeThemeStatus('+tx+',this.checked)"';
				var themeli = document.createElement("li");
				var themeinput = document.createElement("input");
				themeinput.type = "radio";
				themeinput.name = "design";
				themeinput.number = tx;
				//themeinput.onchange = function(){slidenote.extensions.changeThemeStatus(this.number,this.checked)};
				if(themes[tx].active)	themeinput.checked = true; else themeinput.checked=false;
				var themelabel = document.createElement("label");
				themelabel.innerText = themes[tx].classname;
				themeli.appendChild(themeinput);
				themeli.appendChild(themelabel);
				themeul.appendChild(themeli);
				if(themes[tx].active)themedesctext = themes[tx].description;
				themeinput.description = themes[tx].description;
				themeinput.onchange = function(){
					slidenote.extensions.changeThemeStatus(this.number,this.checked);
					if(this.checked)document.getElementById("themedescription").innerText=this.description;
					slidenoteguardian.saveConfig("local");

				}
			}
		}
		themelist.appendChild(themeul);
		var themedescription = document.getElementById("themedescription");
		themedescription.innerText = themedesctext;
		optionmenu.classList.add("active");

}

/*
* the actual slidenotes-object:
@param texteditor: textarea where the sourcecode is inside
@param texteditorerrorlayer: background of editor, where rendered sourcecode is put into
@param htmlerrorpage: not used anymore
@param presentationdiv: div where to place the created presentation into
@param bpath: where this script is located
*/

function slidenotes(texteditor, texteditorerrorlayer, htmlerrorpage, presentationdiv, bpath){
	this.basepath = bpath;
	if(bpath===null||bpath===undefined)this.basepath="";
	this.imagespath = this.basepath+"images/";
	//grundlegender zugriff auf alle wichtigen html-elemente:
	this.textarea = texteditor;
	this.texteditorerrorlayer = texteditorerrorlayer;
	this.htmlerrorpage = htmlerrorpage;
	//this.htmlerrorpagerahmen = htmlerrorpage.parentNode;
	this.presentationdiv = presentationdiv;
	this.keydown = false; //hilfsboolean um nicht zu oft zu parsen
	var extoptions;
	//console.log("extensionoptions?"+(slidenoteguardian)+(slidenoteguardian.extensionoptions));
	//console.log(slidenoteguardian.extensionoptions);
	if(slidenoteguardian && slidenoteguardian.extensionoptions)extoptions=slidenoteguardian.extensionoptions;
	this.extensions = new ExtensionManager(this, extoptions);

	//das wichtigste: das parsingobjekt:
	this.parser = new emdparser(this.textarea.value);
	//als letztes die präsentation:
	this.themeobjekts="";
	this.presentation = new pagegenerator(this.parser,this.presentationdiv, this);

	//datablock types:
	this.datatypes = new Array(); //objects with type, mdcode, theme
	this.inlinedatatypes = new Array(); //objects with inline-code-syntax - contains type, mdcode allowed, theme, startsymbol, endsymbol
	this.datatypes.isvalid = function(datatype){
		var result=false;
		for(var x=0;x<this.length;x++){
			if(this[x].type===datatype)result=true;
		}
		return result;
	}
	this.datatypes.elementOfType = function(datatype){
		var result;
		for(var x=0;x<this.length;x++)if(this[x].type===datatype)result=this[x];
		return result;
	}
	this.datatypes.push({type:"code",mdcode:false,theme:null});
	/*examples:
	slidenote.datatypes = [
		{type:"chart", mdcode:false, theme:chartjs},
		{type:"table", mdcode:true, theme:table},
		{type:"latex", mdcode:false, theme:latex},
		{type:"flow", mdcode:false, theme:flowjs},
		{type:"section", mdcode:true, theme:section},
		{type:"header",mdcode:true, theme:persistantheaderjs}
	]

	*/

	//edit-modus:
	this.texteditorerroractivated = true;
	this.texteditorerrorlayer.classList.remove("hidden");

	//markdowneditor-sachen:
	this.lasttyping = new Date().getTime();
	this.lastpressedkey = "";

	setTimeout("slidenote.initHistoryHack()",100);
}

slidenotes.prototype.initHistoryHack = function(){
	//history-hack:
	window.onpopstate = function(){
		//console.log("onpopstate:"+document.location.hash);
		if(document.location.hash==="#editor" && fullscreen){
			slidenote.presentation.showpresentation();
		}
	};
	window.onhashchange = function(event){
		if(location.hash==="#editor")return;
		var hashnr = location.hash.split("#slide")[1];
		//console.log("hash:"+location.hash+"nr:"+hashnr);
		hashnr--;
		if(hashnr===-1)return;
		if(hashnr && (hashnr-slidenote.presentation.aktpage<0||hashnr-slidenote.presentation.aktpage>0)&&fullscreen){
			slidenote.presentation.showPage(hashnr);
	}};

}

slidenotes.prototype.choseEditor = function(editor){
	this.editormodus=editor;
	var sldiv = document.getElementById("slidenotediv");
	sldiv.className = editor;
	 if(editor=="md-texteditor"){
		this.texteditorerroractivated = true;
		//this.texteditorerrorlayer.classList.remove("hidden");
		//document.getElementById("nicesidebarsymbol").style.display=null;
	}else if(editor=="focus"){
		this.texteditorerroractivated = true;
		//this.texteditorerrorlayer.classList.remove("hidden");
		//document.getElementById("sidebar").innerHTML="";
		//document.getElementById("nicesidebarsymbol").style.display="none";
	}else if(editor==="raw-text"){
		this.texteditorerroractivated = false;
		//this.texteditorerrorlayer.classList.add("hidden");
		//document.getElementById("nicesidebarsymbol").style.display=null;
	}else if(editor==="big-mode"){
		this.texteditorerroractivated=true;
	} else if(editor==="basic-mode"){
		this.texteditorerroractivated=true;
		sldiv.classList.add("big-mode"); //big-mode as css-design
	}else if(editor==="audio-mode"){
		this.texteditorerroractivated=false;
	}else {
		this.texteditorerroractivated = false;
		this.texteditorerrorlayer.classList.add("hidden");
	}

	document.getElementById("editorchoice").value = editor;
	//console.log("choseEditor parse:");
	this.parseneu();
	this.textarea.focus();
	//save config imediately:
	if(slidenoteguardian)slidenoteguardian.saveConfig("local");
}

/*	texteditorrahmensetzen
* this function serves to get the textarea and the rendered sourcecode
* to the same size, so that they overlap perfectly
*/
//var hardcodedwith = 521;
slidenotes.prototype.texteditorrahmensetzen = function(){
	//setzt den rahmen vom errorlayer auf textarea-größe:
	var texteditorrahmen = this.textarea.parentElement;//document.getElementById("texteditor");
	var eingabeblock = this.textarea;
	var texteditorfehlerlayer = this.texteditorerrorlayer;
	var maxspace = texteditorrahmen.offsetWidth-2;
	//2 is a magic number... it works somehow but dont know why
	//have to check different browsers
	/*the calculation i have from error on width 523 is the following:
	 523-19 = 504 and 504 is dividable by 8...
	 so maybe sometimes it comes to a rounding-error where
	 textarea rounds differently then html-rendered block.
	 therefore we should add 1 px if textarea.clientWidth is dividable by 8
	 whereas 8 is character-width which could change if people activate enlarging
	 therefore we should check it out and use that as dividor?
	 in chromium it works well for now with 8 even if i enlarge the page
	*/
	let charwidth = 8;
	//set texteditor-width to max-space:
	eingabeblock.style.width = maxspace+"px";
	if(eingabeblock.clientWidth % charwidth==0){
		console.log('changed width of textarea to avoid error on float to integer');
		maxspace+=1;
		eingabeblock.style.width = maxspace+"px";
	}
	texteditorfehlerlayer.style.width = (maxspace)+"px";
	/*old stuff:
	//check if textarea bigger than space available:
	var maxspace = window.innerWidth - 30 - hardcodedwith; //521 is hard-coded widths from neighbours, could change in future
	maxspace = maxspace - (maxspace/16);
	var normalizedwidth = [{minwidth:1400, maxwidth:1920, width:900}];
	var newwidth;
	for(var x=0;x<normalizedwidth.length;x++){
		if(normalizedwidth[x].minwidth < window.innerWidth && normalizedwidth.maxwidth >= window.innerWidth){
			newwidth = normalizedwidth[x].width;
		}
	}
	if(newwidth)eingabeblock.style.width = newwidth;
	if(eingabeblock.offsetWidth > maxspace)eingabeblock.style.width = maxspace + "px";
	texteditorrahmen.style.width = eingabeblock.offsetWidth + "px";
	texteditorrahmen.style.height = eingabeblock.clientHeight+"px";
	texteditorfehlerlayer.style.width = (eingabeblock.offsetWidth-4) + "px";
	//texteditorfehlerlayer.style.height = (eingabeblock.offsetHeight-4)+"px";
	//eingabeblock.style.height = document.getElementById("sidebarcontainer").offsetHeight+"px";
	texteditorfehlerlayer.style.height = (eingabeblock.clientHeight-4)+"px";
	//frag mich nicht warum 4px abgezogen werden müssen, aber dann passts.
	//vermutung ist der focus-rahmen vom texteditor...
	*/
};
slidenotes.prototype.androidDisplayChangeHack = function(e){
	//does not work on fullscreen-mode!
	let actheight = window.innerHeight;
	let actwidth = window.innerWidth;
	let firstheight = this.androidBiggerHeight;
	let firstwidth = this.androidWidth;
	let minheight = 100; //min-height of keyboard
	if(firstheight==undefined || firstheight<actheight){
		this.androidBiggerHeight=actheight;
		firstheight = actheight;
	}
	let keyboardout = (actheight+minheight<firstheight && actwidth==firstwidth);
	if(firstwidth == undefined || actwidth != firstwidth){
		//we start from new or user changed portrait/landscape
		this.androidWidth=actwidth;
		this.androidBiggerHeight = actheight;
	}
	//if keyboardout is true its nearly certain that a keyboard has popped out
	document.body.classList.toggle('android-keyboard-out',keyboardout);

	if(keyboardout){
		//scroll such as current line is top-line
		/*let htmllines = document.getElementsByClassName("backgroundline");
		let gotoline = slidenote.parser.lineAtPosition();
		if(gotoline<htmllines.length){
			var oftop=0;
			if(gotoline>0)oftop=htmllines[gotoline-1].offsetTop;
			if(oftop==undefined)oftop=0;
			this.textarea.scrollTop = oftop;
			//console.log("scroll to:"+oftop);
			this.scroll();
		}*/
		slidenote.scrollToPosition();
	}

	/*
	if(keyboardout && this.editormode!='raw-text'){
		//toggle to raw-mode:
		this.androidSelectedMode = this.editormode;
		slidenote.choseEditor('raw-text');
	}else{
		//toggle to selected mode:
		let mode = this.androidSelectedMode;
		if(this.androidSelectedMode==undefined)mode='md-texteditor';
		slidenote.choseEditor(mode);
		slidenote.parseneu(); //parse as it could be that its not parsed yet
	}*/
	/*document.getElementById('sidebar').innerText = `
	aktuelle höhe: ${actheight}, breite: ${actwidth}, standardhöhe:${firstheight}
	standardbreite: ${firstwidth}
	`;*/
}

slidenotes.prototype.androidKeyDisplayHack = function(e){
	//not used at the moment
	let actval = slidenote.textarea.value;
	let actselstart = slidenote.textarea.selectionStart;
	let actselend = slidenote.textarea.selectionEnd;
	let ah = slidenote.androidhack;
	var parsenew = false;
	//we check if there are changes.
	if(actval.length<ah.lastValue.length ||
		 actselend - actselstart !=0){
		//we should parse a new
		//slidenote.parseneu();
		parsenew = true;
	}else {
		let newtext = actval.substring(ah.selend, actselend);
		if(newtext.indexOf('*')>-1 ||
		newtext.indexOf('_')>-1 ||
		newtext.indexOf('~')>-1 ||
		newtext.indexOf('\n')>-1 ||
		newtext.indexOf('#')>-1 ){
			//slidenote.parseneu();
			parsenew = true;
		}else{
			let carret = document.getElementById('carret');
			if(carret)carret.innerText = newtext;
		}
	}
	if(parsenew){
		slidenote.parseneu();
		ah.selend = slidenote.textarea.selectionEnd;
		ah.selstart = slidenote.textarea.selectionStart;
		ah.lastValue = slidenote.textarea.value;
		ah.startValue = slidenote.textarea.value;
	}
	if(document.body.classList.contains('android-keyboard-out')){
		//as long as keyboard is out repeat it every 10ms
		ah.lastValue = actval;

		ah.timer = setTimeout(slidenote.androidKeyDisplayHack, 10);
	}
}

slidenotes.prototype.androidOnTextareaFocus = function(e){
	//whenever textarea gets focus the keyboard gets out
	//unused at moment
	document.body.classList.add('android-keyboard-out');

	//the displayhack with keystrokes from textarea.value:
	//does not work very well - unused at moment
	if(slidenote.androidhack.timer)clearTimeout(slidenote.androidhack.timer);
	var ah = slidenote.androidhack;
	ah.selend = slidenote.textarea.selectionEnd;
	ah.selstart = slidenote.textarea.selectionStart;
	ah.lastValue = slidenote.textarea.value;
	ah.startValue = slidenote.textarea.value;
	slidenote.androidKeyDisplayHack();
}
slidenotes.prototype.androidLeaveTextareaFocus = function(e){
	//whenever textarea loses focus the keyboard disappears
	//unused at moment
	document.body.classList.remove('android-keyboard-out');
	if(slidenote.androidhack.timer)clearTimeout(slidenote.androidhack.timer);

}

var oldrendermode = false;

/* 	parseneu
* whenever the editor needs to be re-rendered because the sourcecode
* changed this function has to be called once.
* it parses the sourcecode and calls the rendering-functions afterwards
*/
slidenotes.prototype.parseneu = function(){
	//error-handling: dont parse if editor is not ready/still loading themes:
	if(!this.extensions.allThemesLoaded)return;
	var startzeit = new Date();
	this.oldparser = this.parser;
	this.parser = new emdparser(this.textarea.value);
	this.parser.parseMap();
	var zwischenzeit = new Date();
	var nachrendernzeit;
	var dropdownmenuzeit;
	var sidebarzeit;
	var themechangeszeit;
	var handlingproposedsymbolszeit;
	var scrollzeit;
	var rahmensetzenzeit;
	//var compareResult = this.parser.comparePages();

	//MDCodeEditor:
	if(this.texteditorerroractivated){
		//this.texteditorerrorlayer.innerHTML = this.parser.parseerrorsourcebackground();
		//this.texteditorerrorlayer.innerHTML = this.parser.renderCodeeditorBackground();
		var newerrorlines = this.parser.renderCodeeditorBackground();
		var newerrortext;
		var changedlines;
		if(oldrendermode){
			newerrortext = newerrorlines.join("\n");
			var newerrorlayer = document.createElement("div");
			newerrorlayer.innerHTML = newerrortext;
			renderMinimizedSwitchOfInnerHtml(this.texteditorerrorlayer,newerrorlayer);
		}else{
			this.parser.renderedBackgroundLines = newerrorlines;
			if(this.oldparser.renderedBackgroundLines){
				//remove old cursor so it does not stay if not inside changedlines
				//let oldcarret = document.getElementById("carret");
				//while(oldcarret){
				//	oldcarret.parentElement.removeChild(oldcarret);
				//	oldcarret = document.getElementById("carret");
				//}
				changedlines = this.parser.insertChangedLines(this.texteditorerrorlayer,newerrorlines, this.oldparser.renderedBackgroundLines);
			}else{
				this.texteditorerrorlayer.innerHTML = newerrorlines.join("\n");
			}
		}

	nachrendernzeit = new Date();
		//add sidebar here
		this.parser.setDropDownMenu();
		//setTimeout("slidenote.parser.setDropDownMenu()",1);
		dropdownmenuzeit = new Date();
		if(this.editormodus!="focus" && document.getElementById("editorchoice").value!="focus"){
			//this.parser.generateSidebar(compareResult);
			//if(compareResult)	setTimeout("slidenote.parser.generateSidebar({start:"+compareResult.start+",end:"+compareResult.end+"})",10);
			  //else this.parser.generateSidebar();
			 //this.parser.generateSidebar();
				//this.parser.setDropDownMenu();
		}

		sidebarzeit = new Date();
		if(this.afterCodeEditorrender)this.afterCodeEditorrender();
		themechangeszeit = new Date();
		//getting rid of false lines from proposedsymbols:
		var proposedsymbols = document.getElementsByClassName("proposedsymbol");
		for(var pps = 0;pps<proposedsymbols.length;pps++){
			if(proposedsymbols[pps].offsetLeft<10) proposedsymbols[pps].style.display = "none";
		}
		handlingproposedsymbolszeit = new Date();
		this.scroll(this.textarea);
		scrollzeit = new Date();
		//this.texteditorImagesPreview = document.getElementById("texteditorimagespreview");
		//this.texteditorImagesPreview.innerHTML = this.parser.renderCodeeditorImagePreview();
		//warum musste ich an dieser stelle den rahmen neu setzen???
		//this.texteditorrahmensetzen();
		rahmensetzenzeit = new Date();
		//now check for wrong carrets, as i dont get where it comes from:
		let allcarrets = document.querySelectorAll('#carret');
		if(allcarrets.length>1){
			//we have wrong carrets here:
			for (var x=0;x<allcarrets.length;x++){
				let bgline = allcarrets[x].parentElement;
				while(bgline.classList.contains('backgroundline')==false && bgline.parentElement!=document.body){
					bgline=bgline.parentElement;
				}
				let actlinenr = slidenote.parser.lineAtPosition();
				if(bgline!=bgline.parentElement.children[actlinenr])allcarrets[x].parentElement.removeChild(allcarrets[x]);
			}
		}
		for(var x=0;x<this.extensions.themes.length;x++){
			if(this.extensions.themes[x].active){
				var themezeit = new Date();
				this.extensions.themes[x].styleThemeMDCodeEditor(changedlines); //Hook-Funktion
				var usedzeit = new Date()-themezeit;
				if(usedzeit>0)console.log("Timecheck: stylemdeditor:"+this.extensions.themes[x].classname + ":"+usedzeit+"Ms");
			}
		}
	}else if(slidenote.editormodus==="raw-text" || slidenote.editormodus==="audio-mode"){
		this.parser.setDropDownMenu();
	}

	var endzeit = new Date();
	var parszeit = zwischenzeit - startzeit;
	var renderzeit = endzeit - zwischenzeit;
	var gesamtzeit = endzeit - startzeit;
	console.log("Timecheck: Parsen von "+this.textarea.value.length+" Zeichen und "+this.parser.map.insertedhtmlelements.length+" Elementen brauchte: "+parszeit+"ms - Rendern brauchte:"+renderzeit+"ms" );
	var purerenderzeit = nachrendernzeit - zwischenzeit;
	var sidebarrenderzeit = sidebarzeit - dropdownmenuzeit;
	var insertmenuzeit = dropdownmenuzeit - nachrendernzeit;
	var highlightzeit = themechangeszeit - sidebarzeit;
	var ppszeit = handlingproposedsymbolszeit - themechangeszeit;
	var scrllzt = scrollzeit - handlingproposedsymbolszeit;
	var rahmenzeit = rahmensetzenzeit - scrollzeit;
	var styleMDzeit = endzeit - rahmensetzenzeit;
	console.log("Timecheck: pures rendern:"+purerenderzeit+
							"Ms\ninsertmenuzeit"+insertmenuzeit+
							"Ms\nsidebar:"+sidebarrenderzeit+
							"Ms\n highlight:"+highlightzeit+"Ms\n proposedsymbolverarbeitung:"+ppszeit+
							"MS\n scroll:"+scrllzt+" rahmensetzen:"+rahmenzeit +"\n"+
							"styleMDZeit:"+styleMDzeit);
	if(slidenoteguardian)slidenoteguardian.autoSaveToLocal(new Date().getTime());
	if(slidenoteguardian && slidenoteguardian.hascmsconnection){
		var beforecheckcloud = new Date();
		slidenoteguardian.checkCloudStatus();
		var aftercheckcloud = new Date();
		var calccheckcloud = aftercheckcloud - beforecheckcloud;
		console.log("Timecheck: checkcloudstatus"+calccheckcloud+"Ms");
	}
};



slidenotes.prototype.parseAfterPause = function(){
	this.keypressstack--;
	//console.log("keypressstack:"+this.keypressstack);
	if(this.keypressstack>0)return;
	//console.log("keypresstack = 0, check if you have to parse:");
	var carrettext = document.getElementById("carret").innerHTML;
	//console.log("carret:"+carrettext+" charnumberat0:"+ carrettext.charCodeAt(0))
	if(carrettext.length>1 || carrettext.charCodeAt(0)!=8205)slidenote.parseneu();
}

slidenotes.prototype.keypressdown = function(event, inputobject){
	var key = ""+event.key;
	//console.log(event);
	if(key=="undefined"){
			webkit = true;
			//console.log("keycode:"+event.keyCode)
			//console.log("webkit-test:"+event.keyIdentifier);
			//console.log("webkit-test2:"+event.which);
			//if(event.keyCode=="16")key="Shift";else
			//key=String.fromCharCode(event.keyCode);
			//key=event.keyCode;
			key = getKeyOfKeyCode(event.keyCode);
			event.key = key;
	}
	//check for alt-right:
	if(key=="AltGraph"||event.code=="AltRight"){
		this.altright = true;
	}
	//automatic closure:
	if(slidenote.keyboardshortcuts){
		if(slidenote.textarea.selectionEnd-slidenote.textarea.selectionStart!=0){
			slidenote.keyboardshortcuts.tmpSelection = slidenote.textarea.value.substring(slidenote.textarea.selectionStart,slidenote.textarea.selectionEnd);
		}else{
			slidenote.keyboardshortcuts.tmpSelection = "";
		}
		var abort = slidenote.keyboardshortcuts.closeAutomagic(event);
		if(abort==="break"){
			console.log("parseneu forced by closeautomagic");
			setTimeout("slidenote.parseneu()",10);
			return;
		}
	}
	/*
	var automatic_closure = false;
	if(automatic_closure){
		if(key==="*" || key==="_"){
			var selend = slidenote.textarea.selectionEnd;
			var selstart = slidenote.textarea.selectionStart;
			var txt = slidenote.textarea.value;
			if(txt.substring(selstart-1,selstart)!="\n"){
				event.preventDefault();
					txt = txt.substring(0,selstart)+key+txt.substring(selstart,selend)+key+txt.substring(selend);
					slidenote.textarea.value=txt;
					slidenote.textarea.selectionEnd = selend+1;
					slidenote.textarea.selectionStart = selstart+1;
			}
		}
	}*/
	//mdcode-editor-part:
	if(key.indexOf("Page")>-1){
		event.preventDefault();//does not work for some reason i dont know...
		this.parser.map.lastcursor = {selectionStart:this.textarea.selectionStart, selectionEnd:this.textarea.selectionEnd, selectionDirection:this.textarea.selectionDirection};
	}
	if(this.texteditorerroractivated){
		//var renderkeys = "*_#"
		if(key == " "){
			//should always render - but still continue normal behavior
			setTimeout(function(){
				slidenote.parseneu();
				console.log('parse on space');
			},20);
		}

		if(key==="Enter"){// || key==="Backspace" || renderkeys.indexOf(key)>-1){
			setTimeout(function(){
				console.log("parse keypressdown");
				slidenote.parseneu();//on Enter you should always parse anew
				slidenote.scroll();

			},10);
		}else if(key.indexOf("Arrow")>-1){
			//if(document.getElementById("editorchoice").value!="focus")
			//setTimeout("slidenote.parser.generateSidebar({start:null,end:null,cursorchange:true})",10);
		}else if(key.indexOf("Page")>-1){
			this.parser.map.lastcursorpos = this.textarea.selectionEnd;
			event.preventDefault();
		}else{
			if(key.length===1 && !event.ctrlKey && !event.metaKey){ //TODO: Mac-Command-Taste?
				//this.lastcarretpos = carretpos;
				if(this.textarea.selectionEnd-this.textarea.selectionStart>0){
					console.log("parseneu forced because of selection");
					setTimeout("slidenote.parseneu()",50); //on selection parse anew
				}else if(this.lastpressedkey==="Dead"){
					//last key pressed was a dead key, so parse anew:
					console.log("parseneu forced because of dead-key");
					setTimeout("slidenote.parseneu()",50);
				}else{
					//now we should insert the key - but if we have apples-behaviour we shouldnt:

					if(!event.repeat)this.repeatStarted=false;
					//emulate mac-behaviour:
					//if(event.repeat)event.preventDefault();
					if(event.repeat && !this.repeatStarted){
						    this.repeatStarted=true;
						    this.repeatStartedAt = slidenote.textarea.selectionEnd;
					}else if(event.repeat && this.repeatStarted){
						    var actcursorpos = slidenote.textarea.selectionEnd;
								console.log("Cursor on Repeat:"+this.repeatStartedAt + " vs cursorOn: "+actcursorpos);
						    if(actcursorpos>this.repeatStartedAt){
						        //normal behaviour
						    }else{
						        //apple-behaviour: do nothing. i.e. return
										console.log("hi macuser :) "+actcursorpos+"/"+this.repeatStartedAt);
										return;
						    }
					}
					if(slidenote.keyboardshortcuts.metakey === key ||
						slidenote.keyboardshortcuts.pressedkeys[slidenote.keyboardshortcuts.metakey] ||
					event.code === slidenote.keyboardshortcuts.metakey ||
					(slidenoteSpeaker.isActive()&&(
					slidenote.keyboardshortcuts.pressedkeys[slidenoteSpeaker.metakey] ||
					event.code === slidenoteSpeaker.metakey ||
					key === slidenoteSpeaker.metakey))
					)return;
					var allcursors = document.querySelectorAll('#carret');
					var cursor = allcursors[0];
					if(!cursor || allcursors.length>1){
						setTimeout('slidenote.parseneu()',5);
						console.warn('parseneu forced because of wrong carret-node - found carrets:',allcursors.length);
						return;
					}
					if(this.altright){
					setTimeout(function(){
						let realkey = slidenote.textarea.value.charAt(slidenote.textarea.selectionEnd-1);
						console.log(key,"vs",slidenote.textarea.value.charAt(slidenote.textarea.selectionEnd-1));
						cursor.innerHTML = cursor.innerHTML+""+realkey;
					},1);
					}else{
						cursor.innerHTML = cursor.innerHTML+""+key;
					}
					if(this.keypressstack===undefined)this.keypressstack=0;
					this.keypressstack++;
					setTimeout("slidenote.parseAfterPause()", 500);
					//console.log("actkey:"+key+"last key:"+this.lastpressedkey);
				}
			}
		}
	}
};


slidenotes.prototype.keypressup = function(event, inputobject){
	var key = ""+event.key;
	var renderkeys = "*_#]:\\";


	/*var carretpos = this.textarea.selectionEnd;
	if(carretpos - this.lastcarretpos!=1){
		console.log("parseneu forced by carretpos on keyup"+carretpos+"->"+this.lastcarretpos);
		this.parseneu();
	}
	this.lastcarretpos = carretpos;*/
	if(key=="undefined")key=getKeyOfKeyCode(event.keyCode);//key=String.fromCharCode(event.keyCode);
	//check for alt-right:
	if(key=="AltGraph"||event.code=="AltRight"){
		this.altright=false;
	}

	if(this.texteditorerroractivated){
		if(key==="Enter" || key==="Backspace" || key==="Delete" || renderkeys.indexOf(key)>-1){
			console.log("parseneu forced after key "+key);

			this.parseneu();
			this.scroll();
			this.lasttyping = new Date().getTime();
		}
		//console.log("Key pressed:"+key);
		if(key.indexOf("Arrow")>-1 || key==="Home" || key==="End"){
			//console.log("home, end or arrow pressed");
			var actcursor=document.getElementById("carret");
			if(actcursor==null || (actcursor && actcursor.innerHTML.length>1 && actcursor.innerHTML !="&zwj;")){
				console.log("parseneu forced after arrowkey");
				//console.log(actcursor)
				this.parseneu();
				this.scroll();
			}else{
				console.log("parse only new cursor after arrowkey");
				var cursorparent = actcursor.parentElement;
				cursorparent.removeChild(actcursor);
				//console.log(">>>"+cursorparent.innerHTML+"<<<"+cursorparent.innerHTML.length);
				if(cursorparent.innerHTML.length===0)cursorparent.innerHTML="&zwj;";
				this.parser.renderNewCursorInCodeeditor();
			}
			return;
		}

		if(key==="PageUp" || key==="PageDown"){
			var selstart = this.textarea.selectionStart;
			var selend = this.textarea.selectionEnd;
			var currentline;
			var gotoline=null;
			var currentpos;
			if(this.textarea.selectionDirection === "backward"){
				currentline = this.parser.lineAtPosition(selstart);
				currentpos=selstart;
			}	else {
				currentline = this.parser.lineAtPosition(selend);
				currentpos = selend;
			}
			if(key==="PageUp"){

				for(var gtl=this.parser.map.pagestart.length-1;gtl>=0;gtl--){
						var pageel = this.parser.map.pagestart[gtl];
						if(pageel.line<currentline && gotoline==null){
							gotoline=pageel.line;
							gotopage=gtl;
						} else if(pageel.line===currentline &&
											this.parser.map.linestart[pageel.line]<currentpos && gotoline==null){
							gotoline=pageel.line;
							gotopage=gtl;
							//console.log("from:"+selstart+"to:"+this.parser.map.linestart[pageel.line]+"line"+gtl);
						}
					}
					if(gotoline==null)gotoline=0;
			} else {
				for(var gtl=0;gtl<this.parser.map.pagestart.length;gtl++){
						var pageel = this.parser.map.pagestart[gtl];
						if(pageel.line>currentline && gotoline==null){
							gotoline=pageel.line;
							gotopage=gtl;
						}
				}
				if(gotoline==null)gotoline=this.parser.map.lineend.length-1;
			}

			if(event.shiftKey){
				if(key==="PageUp"){
					if(this.textarea.selectionDirection==="backward")this.textarea.selectionStart = this.parser.map.linestart[gotoline];
					if(this.textarea.selectionDirection === "forward"){
						if(this.parser.map.linestart[gotoline]>=selstart)this.textarea.setSelectionRange(this.textarea.selectionStart, this.parser.map.linestart[gotoline],"forward");
						if(this.parser.map.linestart[gotoline]<selstart)this.textarea.setSelectionRange(this.parser.map.linestart[gotoline], this.textarea.selectionStart,"backward");
					}
				}
				if(key==="PageDown"){
					if(this.textarea.selectionDirection==="forward")this.textarea.selectionEnd = this.parser.map.linestart[gotoline];
					if(this.textarea.selectionDirection==="forward" && gotoline===currentline)this.textarea.selectionEnd = this.parser.map.lineend[gotoline];
					if(this.textarea.selectionDirection==="backward"){
						//console.log("from:"+currentline+"to:"+gotoline+"selection:"+selstart+"/"+selend);
						if(this.parser.map.linestart[gotoline]<=selend)this.textarea.setSelectionRange(this.parser.map.linestart[gotoline],this.textarea.selectionEnd,"backward");
						if(this.parser.map.linestart[gotoline]>selend)this.textarea.setSelectionRange(this.textarea.selectionEnd, this.parser.map.linestart[gotoline],"forward");
					}
				}
			}else{
					this.textarea.selectionStart = 	this.parser.map.linestart[gotoline];
					this.textarea.selectionEnd = this.textarea.selectionStart;
			}
			console.log("parseneu forced by pageup/down");
			this.parseneu();
			var htmllines = document.getElementsByClassName("backgroundline");
			if(gotoline<htmllines.length){
				var oftop=0;
				if(gotoline>0)oftop=htmllines[gotoline-1].offsetTop;
				if(oftop==undefined)oftop=0;
				this.textarea.scrollTop = oftop;
				//console.log("scroll to:"+oftop);
				this.scroll();
			}
			//console.log("from "+currentline+"go to line:"+gotoline +" page:"+gotopage + "from"+this.parser.map.pagestart.length);
			return;
		}//end of pageup-down
		if(key==="Escape"){
			var imguploadscreen = document.getElementById("imagesblock");
			if(imguploadscreen && imguploadscreen.classList.contains("visible")){
				imguploadscreen.classList.remove("visible");
				this.textarea.selectionEnd = this.textarea.selectionEnd +1;
				this.textarea.selectionStart = this.textarea.selectionEnd;
			}else{
				//this.parseneu();
				//this.presentation.showpresentation();
			}
		}
		if(this.lastpressedkey==="Dead"){
			console.log("parseneu forced by dead key");
			this.parseneu();

		}
		if(this.lastpressedkey ==="Dead" && key ==="Shift")this.lastpressedkey = "Dead";
			else	this.lastpressedkey = key;
	} //end of if texteditoractivated
	if(!this.texteditorerroractivated && this.editormodus ==="raw-text"){
		if(key==="ArrowUp"||key==="ArrowDown")this.parser.setDropDownMenu();
		if(key==="Enter" || key==="Backspace" || key==="Delete" || renderkeys.indexOf(key)>-1)this.parseneu();
		if(key==="PageUp" || key==="PageDown"){
			this.textarea.selectionStart = this.parser.map.lastcursor.selectionStart;
			this.textarea.selectionEnd = this.parser.map.lastcursor.selectionEnd;
			//this.textarea.selectionDirection = this.
		}
		if(key==="PageUp"){
			event.preventDefault();
			var gotopos = slidenote.textarea.selectionEnd;
			if(this.textarea.selectionDirection==="backward")gotopos=slidenote.textarea.selectionStart;
			//gotopos=slidenote.textarea.value.lastIndexOf("\n",gotopos);
			gotopos=slidenote.textarea.value.lastIndexOf("\n",gotopos-2);
			gotopos = slidenote.textarea.value.lastIndexOf("\n---",gotopos-1);
			if(gotopos>=0)gotopos = slidenote.textarea.value.indexOf("\n",gotopos+1)+1;
			if(gotopos<0)gotopos=0;
			if(event.shiftKey){
				if(this.textarea.selectionDirection==="backward")this.textarea.selectionStart = gotopos;
				if(this.textarea.selectionDirection === "forward"){
					if(gotopos>=this.textarea.selectionStart)this.textarea.setSelectionRange(this.textarea.selectionStart, gotopos,"forward");
					if(gotopos<this.textarea.selectionStart)this.textarea.setSelectionRange(gotopos, this.textarea.selectionStart,"backward");
				}
			}else{
				slidenote.textarea.selectionEnd = gotopos;
				slidenote.textarea.selectionStart = gotopos;
			}

		}else if(key==="PageDown"){
			event.preventDefault();
			var gotopos = this.textarea.selectionStart;
			if(this.textarea.selectionDirection==="forward")gotopos=slidenote.textarea.selectionEnd;
			gotopos = slidenote.textarea.value.indexOf("\n---",gotopos);
			if(gotopos>=0)gotopos = slidenote.textarea.value.indexOf("\n",gotopos+1)+1;
			if(gotopos<0)gotopos=slidenote.textarea.value.length-1;
			if(event.shiftKey){
				if(this.textarea.selectionDirection==="forward")this.textarea.selectionEnd = gotopos;
				if(this.textarea.selectionDirection==="backward"){
					if(gotopos<=this.textarea.selectionEnd)this.textarea.setSelectionRange(gotopos,this.textarea.selectionEnd,"backward");
					if(gotopos>selend)this.textarea.setSelectionRange(this.textarea.selectionEnd, gotopos,"forward");
				}
			} else{
				slidenote.textarea.selectionEnd = gotopos;
				slidenote.textarea.selectionStart = gotopos;
			}
		}
		if(key==="PageDown"||key==="PageUp"){
			this.textarea.blur();
			this.textarea.focus();
			this.parser.setDropDownMenu();
		}
	}

};

slidenotes.prototype.removeElementFromTextarea = function(element, tag){
	let a = element;
	let b = a.brotherelement;
	let selstart = slidenote.textarea.selectionStart;
	let selend = slidenote.textarea.selectionEnd;
	if(a && b){
		let amd = a.mdcode;
		bmd = b.mdcode;
		let delcount = 0;
		if(a.mdcode=="***" || a.mdcode=="___"){
			//tripple-codes cannot be inserted by toolbar directly, so strip mdcode to actual length
			amd = amd.substring(0,tag.length);
			bmd = bmd.substring(0,tag.length);
			delcount = 3-tag.length;
		}
		let txt = this.textarea.value;
		txt = txt.substring(0,a.posinall)+txt.substring(a.posinall+amd.length,b.posinall)+txt.substring(b.posinall+bmd.length);
		this.textarea.value = txt;
		slidenote.textarea.selectionStart = a.posinall+delcount;//selstart-a.mdcode.length;
		slidenote.textarea.selectionEnd = b.posinall-amd.length;//selend-a.mdcode.length;
	}else{
		//only a, not b:
		let txt = slidenote.textarea.value;
		txt = txt.substring(0,a.posinall)+txt.substring(a.posinall+a.mdcode.length);
		slidenote.textarea.selectionStart = selstart - a.mdcode.length;
		slidenote.textarea.selectionEnd = selend - a.mdcode.length;
	}
	slidenote.textarea.focus();
	slidenote.parseneu();
};

/* insertbutton
* 	inserts a md-symbol into textarea (from toolbar)
*/
slidenotes.prototype.insertbutton = function(emdzeichen, mdstartcode, mdendcode){
	console.log("insert button:"+emdzeichen+"mdstart:"+mdstartcode);
	var textarea = this.textarea;
	var startemdl = new Array('**','*','~~','~',"%head","%list","%nrlist","%link","%quote","%image","%table","-----", "\\(");
	var endemdl = new Array('**','*','~~','~',"\n","\n","\n","%link","\n","%image","%table","\n","\\)");
	var emdnr;
	var emdstart="";
	var emdend="";
	var multilineselection = false;
	var selstart = slidenote.textarea.selectionStart;
	var selend = slidenote.textarea.selectionEnd;
	var actelement = this.parser.CarretOnElement(textarea.selectionEnd);
	if(actelement!=null && actelement.dataobject!=null){
		if(this.datatypes.elementOfType(actelement.dataobject.type)!=null &&
			 this.datatypes.elementOfType(actelement.dataobject.type).mdcode ==false){
				 dialoger.alert("mdcode insert not allowed inside datablocks of type "+actelement.dataobject.type);
				 return;
			 }
	}
	var usedElement = this.parser.carretInsideTag(null, emdzeichen);
	if(usedElement){
		//delete used element
		this.removeElementFromTextarea(usedElement, emdzeichen);
		return;
	}
	if(emdzeichen.substring(0,5)=="%head"){
		emdstart="\n#";
		//emdnr = prompt("h... 1,2,3,4?");
		emdnr = emdzeichen.substring(5);
		for(var xa=1;xa<emdnr;xa++)emdstart+="#";
		emdend="\n";
	}else if((emdzeichen=="%nrlist" || emdzeichen=="%list" || emdzeichen=="%quote") &&
						textarea.selectionStart ===textarea.selectionEnd){
							var insz = "";
							if(emdzeichen==="%nrlist"){
								emdstart="1. ";
								emdend="\n2. \n3. \n";
							}
							if(emdzeichen==="%list"){
								emdstart="- ";
								emdend="\n- \n- \n";
							}
							if(emdzeichen==="%quote"){
								emdstart="> ";
								emdend="\n";
							}

	}else if(emdzeichen=="%nrlist" || emdzeichen=="%list" || emdzeichen=="%quote"){
			var selectedtext = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
			//if(selectedtext.substring(1,2)=="\n")selectedtext = selectedtext.substring(1);
			//console.log("füge "+emdzeichen+" ein. markierter text"+selectedtext );
			var selectedlines = new Array();
			while(selectedtext.indexOf("\n")>-1){
				selectedlines.push(selectedtext.substring(0,selectedtext.indexOf("\n")));
				selectedtext=selectedtext.substring(selectedtext.indexOf("\n")+1);
			}
			selectedlines.push(selectedtext);
			selectedtext ="";
			for(var x=1;x<=selectedlines.length;x++){
				if(x==1 && selectedlines[x-1].length==0){
					selectedtext+="\n"; //wenn in der ersten zeile nix steht bedeutet das in der regel, dass bis zur zeile davor markiert wurde
					//console.log("zeile scheint leer zu sein:"+selectedlines[x-1]+"eol");
				}else{
					//alert("selectedline:"+selectedlines[x-1]+"endofline");
					if(emdzeichen=="%nrlist")selectedtext+=x+". "+selectedlines[x-1]+"\n";
					else if(emdzeichen=="%list")selectedtext+="* "+selectedlines[x-1]+"\n";
					else selectedtext+="> "+selectedlines[x-1]+"\n";
				}
			}
			textarea.value = textarea.value.substring (0, textarea.selectionStart)+
						selectedtext +
						textarea.value.substring (textarea.selectionEnd);
			multilineselection = true;

	}else if(emdzeichen=="%link"){
			var linkurl = prompt("url for the link or slide (e.g. #slide10)");
			emdstart="[";
			emdend="]("+linkurl+")";
	}else if(emdzeichen=="%image"){
		//if(slidenote.base64images!=null){
		//	var imgurl = slidenote.base64images.lastImage().name;
		//} else {
			var imgurl = prompt("hier kommt bald imageupload rein. solange: tippe hier url ein:");
		//}
			emdend="![]("+imgurl+")";
  }else if(emdzeichen.substring(0,4)==="%b64"){
		if(slidenote.base64images!=null){
			emdend="![]("+emdzeichen.substring(4)+")";
		}
	}else if(emdzeichen=="%table"){
		emdend="\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |";
	}else if(emdzeichen=="%codeblock"){
		emdstart="\n+++code\n";
		emdend="\n+++\n";
	}else if(emdzeichen=="%inlinecode"){
		var selectedtext = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
		if(selectedtext.indexOf("\n")>-1){
			//change per line
			let ill = selectedtext.indexOf("\n");
			while(ill>-1){
				selectedtext = selectedtext.substring(0,ill)+'`\n`'+selectedtext.substring(ill+1);
				ill=selectedtext.indexOf("\n",ill+3);
			}
			selectedtext='`'+selectedtext+'`';
			let sels = textarea.selectionStart;
			let sele = textarea.selectionEnd;
			textarea.value=textarea.value.substring(0,textarea.selectionStart)+selectedtext+textarea.value.substring(textarea.selectionEnd);
			textarea.selectionEnd = sels+selectedtext.length;
			textarea.selectionStart = sels;
			multilineselection=true;
		}else{
			emdstart="`";
			emdend="`";
		}
	}else if(emdzeichen=="%code"){
		var selectedtext = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
		if(selectedtext.indexOf("\n")>-1 ||
				(textarea.value.substring(textarea.selectionStart-1, textarea.selectionEnd)==="\n")){
			emdstart="\n+++code\n";
			emdend="\n+++\n";
		}else{
			emdstart="`";
			emdend="`";
		}
	}else if(emdzeichen.substring(0,3)=="```" || emdzeichen.substring(0,3)==="+++"){
		emdstart="\n"+emdzeichen+"\n";
		//emdend="\n"+emdzeichen.substring(0,emdzeichen.indexOf("||",2)+2) +"\n";
		emdend="\n"+emdzeichen.substring(0,3)+"\n";
	}else if(emdzeichen==="---"){
		emdstart = "\n"+emdzeichen+"\n";
		emdend = "";
	}else if(emdzeichen==="%comment"){
		emdstart = "\n//";
		endend = "\n";
	}else if(emdzeichen==="%footnote"){
		emdstart = "[^";
		emdend = "]";
		var pagenr = slidenote.parser.map.pageAtPosition();
		var pst = slidenote.parser.map.pagestart[pagenr].line;
		var pend = slidenote.parser.map.pageend[pagenr].line;
		var elines = slidenote.parser.map.insertedhtmlinline;
		var selend = slidenote.textarea.selectionEnd;
		var selstart = slidenote.textarea.selectionStart;
		var fnbefore = 0;
		var fnafter = 0;
		for(var i=pst;i<pend;i++){
			for(var ii=0;ii<elines[i].length;ii++){
		        var act = elines[i][ii];
				if(act.label==="footnoteanchor" && act.typ==="start"){
				    if(act.posinall < selstart)fnbefore++;
		        if(act.posinall > selend)fnafter++;
				}
			}
		}
		if(selstart===selend){
				var fzeichen = "*";
		    for(var fz=0;fz<=fnbefore+fnafter;fz++)emdstart+=fzeichen;
		}else emdstart+= slidenote.textarea.value.substring(selstart,selend);
		var insline = pend-fnafter;
		var inspos = slidenote.parser.map.lineend[insline];
		var txt = slidenote.textarea.value;
		txt = txt.substring(0,selstart)+emdstart+emdend+
		      txt.substring(selend,inspos)+
		      "\n"+emdstart+emdend+":"+
		      txt.substring(inspos);
		var inslength = (emdstart.length+emdend.length)*2+2; //"[^*]\n[^*]:".length
		slidenote.textarea.value = txt;
		slidenote.textarea.selectionStart = inspos+inslength;
		slidenote.textarea.selectionEnd = inspos+inslength;
		slidenote.parseneu();
		slidenote.textarea.blur();
		slidenote.textarea.focus();
		return;
	}else{ //einfache zeichen:
		//emdnr = startemdl.positionOf(emdzeichen); //sollte im array vorkommen. da ich den befehl grad nicht weiß:
		for(var x=0;x<startemdl.length;x++)if(startemdl[x]==emdzeichen)emdnr=x;
		emdstart=startemdl[emdnr];
		emdend=endemdl[emdnr];
		//alert('insert-sign:'+emdstart+':'+emdend);
	}
  if("```%nrlist%list%quote".indexOf(emdzeichen)>-1){
		if(textarea.value.substring(textarea.selectionStart-1,textarea.selectionStart)!="\n"){
			emdstart = "\n"+emdstart;
		}
		if(textarea.value.substring(textarea.selectionEnd,textarea.selectionEnd+1)==="\n"){
			emdend = emdend.substring(0,emdend.length-1);
		}
	}
	var scrolltop = textarea.scrollTop; //merk dir scroll-position um ruckeln zu vermeiden
	var selectionend = selend || textarea.selectionEnd; //does not work correctly?
	console.warn('selstart/selend:',selend,textarea.selectionEnd, selstart, textarea.selectionStart);
	if(!multilineselection){
	var newText = textarea.value.substring (0, textarea.selectionStart) +
                        emdstart + textarea.value.substring  (textarea.selectionStart, textarea.selectionEnd) + emdend +
                        textarea.value.substring (textarea.selectionEnd);
    textarea.value = newText;
	}
	//textarea.focus();
	//var textarbody = textarea.value;
	//textarea.value = textarbody.substring(0,selectionend);
	textarea.selectionEnd = selend+emdstart.length; //cursor vor emdendsymbol stellen
	textarea.selectionStart = selstart + emdstart.length;
	textarea.blur();
	textarea.focus();
	//textarea.value = textarbody;
	//textarea.scrollTop = scrolltop; //scrolle an richtige stelle
	//testparsenachzeilen(document.getElementById("quelltext").value); //zeichen einparsen
	console.log("parse nach input");
	this.parseneu();


};

slidenotes.prototype.changeListType = function(newtype){
	var el = slidenote.parser.CarretOnElement();
	var latinnumbers = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
	var liste = el.parentelement;
	var start = 1;
	var insert = newtype;
	//console.log("listinsert:"+insert);
	if(liste.olstart){
		start = liste.olstart.split('"')[1];
		var ostart=start;
		//console.log("listinsert:olstart="+start);
		if(!(start*1>=0)){
			//console.log("listinsert:start="+start);
			start=" abcdefghijklmnopqrstuvwxyz".indexOf(start);
			if(start===-1){
				for(var lnb=1;lnb<latinnumbers;lnb++)
								if(latinnumbers[lnb]===ostart)start=lnb;
			}
			if(start===-1)start=1;
		}
	}
	var frontspaces = "";
	if(el.mdcode.charAt(0)===" "){
		for(var x=0;x<el.mdcode.length;x++){
			if(el.mdcode.charAt(x)===" ")frontspaces+=" ";
			else break;
		}
	}
	start = start*1;
	//console.log("listinsert:start="+start);
	var isnumber = (insert.substring(0,1)>0);
	var newlisttype = insert.substring(0,1);
	if(newlisttype==="*"||newlisttype==="-" || newlisttype==="+")newlisttype="ul";else newlisttype="ol";
	var newmarker = insert.substring(1);
	var resulttext = slidenote.textarea.value;
	var selend = slidenote.textarea.selectionEnd;
	var differenceInLength=0;
	for(var x=liste.listchilds.length-1;x>=0;x--){
		var actchild = liste.listchilds[x];
		var newtext;
		if(newlisttype==="ul")newtext=insert;
		if(newlisttype==="ol"){
			newtext = start + x;
			//console.log("listinsert:newtext start+x="+start+"+"+x);
			if(!isnumber){
				//console.log("listinsert is:"+insert+"<<<");
				if(insert==="I) "){
					if(newtext>10)newtext=newtext-(Math.floor(newtext/10)*10);
					newtext = latinnumbers[newtext];
					if(start+x>10)newtext = "X"+newtext;
				}else{
					if(newtext>26)newtext=1;
					newtext = " abcdefghijklmnopqrstuvwxyz".substring(newtext,newtext+1);
				}
			}
			newtext+=newmarker;
		}
		let actdifference = newtext.length - actchild.mdcode.length
		if(actchild.posinall<selend)differenceInLength += actdifference;
		resulttext = resulttext.substring(0,actchild.posinall)+
								frontspaces +
								newtext+
								resulttext.substring(actchild.posinall+actchild.mdcode.length);
	}
	//console.log(resulttext);
	//correcting new selend:
	selend+=differenceInLength;
	//console.warn('difference ol listchange:',differenceInLength);
	slidenote.textarea.value = resulttext;
	slidenote.textarea.selectionEnd = selend;
	slidenote.textarea.focus();
	slidenote.parseneu();

}

/* scrollToPosition
* scrolls to the position of text, so that the position of text is on top of the page
@param position: null or int of position inside textarea.value
*/
slidenotes.prototype.scrollToPosition = function(position){
	var pos = position;
	if(!pos)pos=this.textarea.selectionStart;
	if(this.texteditorerroractivated){
		//solution with texteditorerrorlayer which should work better/easier:
		var linenr = this.parser.lineAtPosition(pos);
		var bglines = document.getElementsByClassName("backgroundline");
		if(bglines[linenr])this.textarea.scrollTop = bglines[linenr].offsetTop;
	}else{
		//solution with scrollHeight - which only works if there is enough to scroll
		let ta = document.getElementById('helperTextarea');
		console.warn(pos);
		//scroll to end of line before
		if(slidenote.textarea.value.charAt(pos)=='\n')pos--;
		pos = slidenote.textarea.value.lastIndexOf('\n',pos);
		if(pos<0)pos=0;
		console.warn(pos);
		ta.style.width = this.textarea.style.width;
		ta.value = this.textarea.value.substring(0,pos);
		console.warn('scroll from to', this.textarea.scrollTop, ta.scrollHeight)
		this.textarea.scrollTop = ta.scrollHeight;
	}
}

/* scroll
* syncs the textarea with the rendered background
*/
slidenotes.prototype.scroll = function(editor){
	this.texteditorrahmensetzen();
	if(editor==this.textarea && this.texteditorerroractivated){
		this.texteditorerrorlayer.scrollTop = editor.scrollTop;
		var sidebartop = 0-editor.scrollTop;
		var sidebardiv = document.getElementById("sidebar");
		if(sidebardiv)sidebardiv.style.top = sidebartop+"px";
		var nssym = document.getElementById("nicesidebarsymbol");
		if(nssym && nssym.style.display!="none"){// && document.getElementsByClassName("carretline")[0]){
			this.parser.setDropDownMenu();
			//nssym.style.top = (sidebartop + document.getElementsByClassName("carretline")[0].offsetTop) + "px";
			document.getElementById("insertarea").style.top = nssym.style.top;
			//console.log("scroll dropdown?" +nssym.style.top )
		}else {
			//console.log("scroll");
			//console.log(nssym);
		}
		//console.log("scroll");

	}
};

slidenotes.prototype.initpresentation = function(){
	if(presentation == null)
	this.presentation = new pagegenerator(this.parser, this.presentationdiv);
	else presentation.init(this.parser, this.presentationdiv);
};

/* shows Sourcecode on another Div with detailed error-description
*/
slidenotes.prototype.showErrorDetails = function(){
	this.parser.parseerrorsourcehtml();
	this.htmlerrorpage.innerHTML = this.parser.errorsourcecode;
	var rahmen = this.htmlerrorpage.parentNode;
	rahmen.classList.add("active");
	rahmen.scrollTop = this.texteditorerrorlayer.scrollTop;
};

/* Theme-Controll:
*/
slidenotes.prototype.addTheme = function(theme){
	this.extensions.addTheme(theme);
	//hier könnte auch noch unterschieden werden nach theme-art, also bspw. n plugin,
	//welches auch den parser beeinflusst o.ä.
}

/*Helper Function to load js/css-files:*/
slidenotes.prototype.appendFile = function(type, path){
	var basepath = this.basepath+"themes/";
	//if(basepath.length>0)basepath+"themes/";
	if(this.basepath===undefined)basepath="themes/"; //basepath should be real basepath, not themes...
	console.log("append File:"+basepath+path);
	if(type==="script"){
		var jsfile = document.createElement('script');
		jsfile.setAttribute("type","text/javascript");
		jsfile.setAttribute("src", basepath+path);
		document.getElementsByTagName("head")[0].appendChild(jsfile);
		return jsfile;
	}else if(type==="css"){
		var cssfile = document.createElement("link");
		cssfile.setAttribute("rel", "stylesheet");
		cssfile.setAttribute("type", "text/css");
		cssfile.setAttribute("href", basepath+path);
		document.getElementsByTagName("head")[0].appendChild(cssfile);
		return cssfile;
	}
}

slidenotes.prototype.goFullScreen = function(targetId, preview){
	target = document.body;
	if(targetId && targetId!='editor')target = document.getElementById(targetId);
	if(!preview){
		//lets go the editor into full screen mode
		if(document.fullscreenElement){
			document.exitFullscreen().then(function(result){
				document.body.classList.remove('editor-fullscreen');
			});
		}else{

			document.body.requestFullscreen({navigationUI:"hide"}).then(function(result){
				document.body.classList.add('editor-fullscreen');
			}).catch((e)=>{
				console.error(e);
			});
		}
	}else{
		if(!document.fullscreenElement && target){
			//target.onfullscreenchange = function(e){
				//hide presentation on exiting fullscreen
			//	console.warn(e);
			//	if(!document.fullscreenElement)slidenote.presentation.showpresentation(false, true);
			//}
			//only go fullscreen if not fullscreen allready
			target.requestFullscreen({navigationUI:"hide"}).then(function(result){
				console.log('entered fullscreen presentation');
			}).catch(function(e){
				console.error(e);
			});
		}else if(document.fullscreenElement==target && !document.body.classList.contains('fullscreen-editor')){
			//close fullscreen
			//delete target.onfullscreenchange;
			document.exitFullscreen();
		}
	}
}

//helper-function to always use same date:
function localeDateString(timestamp){
	let date = new Date(timestamp);
	let datestring = date.toLocaleDateString(navigator.language);
	let hours = date.getHours();
	if(hours<10)hours ="0"+hours;
	let mins = date.getMinutes();
	if(mins<10)mins = '0'+mins;
	return datestring + ' - '+hours+':'+mins;
}

//helper-function to convert files to base64:
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});


//webkit-hacks:
var webkit = false;
function getKeyOfKeyCode(keycode){
  var keycodes = new Array();
  keycodes[16]="Shift";
	keycodes[17]="Control";
	keycodes[18]="Alt";
  keycodes[35]="End";
  keycodes[36]="Home";
  keycodes[37]="ArrowLeft";
  keycodes[38]="ArrowUp";
  keycodes[39]="ArrowRight";
  keycodes[40]="ArrowDown";
	keycodes[91]="Meta"; //"mac-cmd-left";
	keycodes[93]="Meta";//"mac-cmd-right";
	//if(keycode>64 && keycode<90)return String.fromCharCode(keycode);
  if(keycodes[keycode]==null)return "webkitbug"+keycode;
  return keycodes[keycode];
}

slidenotes.prototype.showLicensesDialog = function(){
	let doptions = {
		type: 'alert',
		title:'3rd Party Licenses',
		closebutton:true,
		content:document.getElementById('templateLicenseDialog'),
	}
	dialoger.buildDialog(doptions,function(){
		let template = document.getElementById('templateLicenseDialog');
		let parent = document.getElementById('templateArea');
		parent.appendChild(template);
	})
}

//testfunctions:
function renderMinimizedSwitchOfInnerHtml(oldnode, newnode){
    var oldchilds = new Array();
    var newchilds = new Array();

    for(var x=0;x<oldnode.children.length;x++)oldchilds.push(oldnode.children[x]);
    for(var x=0;x<newnode.children.length;x++)newchilds.push(newnode.children[x]);
		var replacedchilds = 0;
		var addedchilds = 0;
		var whichwerereplaced = new Array();
    for(var x=0;x<newchilds.length;x++){
        if(x>=oldchilds.length){
            oldnode.appendChild(newchilds[x]);
						addedchilds++;
        }else if(oldchilds[x].innerHTML != newchilds[x].innerHTML &&
						oldchilds[x].innerHTML != '--- &nbsp;&nbsp;&nbsp;&nbsp;<span class="pagenr">↑options↑ ↓data↓</span>' &&
					  oldchilds[x].innerHTML != '---&nbsp;&nbsp;&nbsp;&nbsp;<span class="pagenr">↑options↑ ↓code↓</span>'){
            oldnode.replaceChild(newchilds[x],oldchilds[x]);
						replacedchilds++;
						whichwerereplaced.push(oldchilds[x].innerHTML +" -> "+newchilds[x].innerHTML + " ||x: "+x);
        }
    }
		var removedchilds = 0;
		var whichwereremoved = new Array();
		if(oldchilds.length>newchilds.length){
			for(var x=newchilds.length;x<oldchilds.length;x++){
				oldnode.removeChild(oldchilds[x]);
				whichwereremoved.push(oldchilds[x]);
				removedchilds++;
			}
		}
		console.log("Timecheck: renderedMinimized: replacedchilds:"+replacedchilds+"addedchilds:"+addedchilds + "removedchilds:"+removedchilds);

		//console.log("which were replaced:");console.log(whichwerereplaced);
		//console.log("which were removed:");console.log(whichwereremoved);
}

emdparser.prototype.insertChangedLines = function(oldnode,newerrorlines,olderrorlines){

    var oldlines = olderrorlines.slice(0,olderrorlines.length);
		//for(var x=oldlines.length-1;x>=0;x--){
		//	if(oldlines[x].length===0)oldlines.splice(x,1);

		//}
    var newlines = newerrorlines;

		var compareResult = this.comparePages();
		//compareResult has start, end, oldend,
		var oldchildren = oldnode.getElementsByClassName("backgroundline");
		var deletedlinecount = 0;
		if(compareResult.endline){
			var diff = compareResult.endline - compareResult.oldendline;
			if(diff>0){
				for(var x=0;x<diff;x++){
					oldlines.splice(compareResult.oldendline,0,"some replacetext");
					var filldiv = document.createElement("span");
					filldiv.classList.add("backgroundline");
					var fillbr = document.createElement("br");
					var fillenter = document.createTextNode("\n");
					var refnode = oldchildren[compareResult.oldendline].nextSibling;
					refnode.parentElement.insertBefore(fillbr,refnode);
					refnode.parentElement.insertBefore(fillenter, refnode);
					refnode.parentElement.insertBefore(filldiv,refnode);
				}
			}else if(diff<0){
				diff=diff*-1;
				var removepoint = compareResult.oldendline-diff;
				oldlines.splice(compareResult.oldendline-diff,diff)
				while(diff>0){
					var deletebgline = oldchildren[removepoint];
					var deletebgbr = deletebgline.nextSibling;
					if(deletebgbr.nextSibling.nodeName==="#text"){
						deletebgbr.parentElement.removeChild(deletebgbr.nextSibling);
					}
					deletebgbr.parentElement.removeChild(deletebgbr);
					deletebgline.parentElement.removeChild(deletebgline);
					deletedlinecount++;
					diff--;
				}
			}
			if(diff>0 || deletedlinecount>0){
				for(var x=compareResult.startline;x<=compareResult.endline;x++){
					oldlines[x]="some replacetext";
				}
			}
		}

		//if(newlines[newlines.length-1].length===0)newlines.pop();
    var changedlines = new Array();
    var addedlines = new Array();
    for(var x=0;x<newlines.length;x++){
        if(x>=oldlines.length || oldlines[x]!=newlines[x]){
						var hasgt = (oldlines.indexOf("&gt;")>-1);
            changedlines.push({
                line:x, hasgt:hasgt,
								oldline:oldlines[x], newline:newlines[x],

								//oldlinelength:oldlines[x].length,
								//newlinelength:newlines[x].length
            });
        }
    }
    if(changedlines.length===0){
			//no changes, dont need to rerender:
			return;
		}
    var replacedchilds = 0; var addedchilds = 0; var whichwerereplaced = new Array();
    for(var x=0;x<changedlines.length;x++){
        var actline = changedlines[x].line;
        var tmpdiv = document.createElement("div");
        tmpdiv.innerHTML = newlines[actline];
        if(actline<oldchildren.length){
            whichwerereplaced.push("replace in line"+actline+":"+tmpdiv.children[1].innerHTML + "<--" + oldchildren[actline].innerHTML);
            oldnode.replaceChild(tmpdiv.children[0],oldchildren[actline]);
            replacedchilds++;
        }else{
            while(tmpdiv.children.length>0){
                oldnode.appendChild(tmpdiv.children[0]);
                addedchilds++;
            }
						oldnode.appendChild(document.createTextNode("\n"));
        }
    }
    var removedchilds = 0; var whichwereremoved = new Array();
    if(newlines.length<oldchildren.length){
        //delete old outstanding lines:
        var startchildren = newlines.length*2;
        for(var x=oldnode.children.length-1;x>=startchildren;x--){
            whichwereremoved.push("line"+x+":"+oldnode.children[x].innerHTML);
            oldnode.removeChild(oldnode.children[x]);
            removedchilds++;
        }
    }


    console.log("Timecheck: insertChangedLines: \n replacedchilds:"+replacedchilds+" added:"+addedchilds + " removed:"+removedchilds + "deleted:"+deletedlinecount);
		//console.log(changedlines);//console.log(whichwerereplaced); //console.log(whichwereremoved);
		return changedlines;
}
//testinit();

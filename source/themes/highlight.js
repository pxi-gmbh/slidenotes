var newtheme = new Theme("highlight", 1);
//Style-Auswahl implementieren
var styles = new Array(
"agate","androidstudio","arduino-light","arta","ascetic","atelier-cave-dark",
"atelier-cave-light","atelier-dune-dark","atelier-dune-light","atelier-estuary-dark",
"atelier-estuary-light","atelier-forest-dark","atelier-forest-light","atelier-heath-dark",
"atelier-heath-light","atelier-lakeside-dark","atelier-lakeside-light",
"atelier-plateau-dark","atelier-plateau-light","atelier-savanna-dark",
"atelier-savanna-light","atelier-seaside-dark","atelier-seaside-light",
"atelier-sulphurpool-dark","atelier-sulphurpool-light","atom-one-dark",
"atom-one-light","brown-paper","codepen-embed","color-brewer","darcula",
"dark","darkula","default","docco","dracula","far","foundation","github",
"github-gist","googlecode","grayscale","gruvbox-dark","gruvbox-light",
"hopscotch","hybrid","idea","ir-black","kimbie.dark","kimbie.light","magula",
"mono-blue","monokai","monokai-sublime","obsidian","ocean","paraiso-dark",
"paraiso-light","pojoaque","purebasic","qtcreator_dark","qtcreator_light",
"railscasts","rainbow","routeros","school-book","solarized-dark","solarized-light",
"sunburst","tomorrow","tomorrow-night-blue","tomorrow-night-bright","tomorrow-night",
"tomorrow-night-eighties","vs2015","vs","xcode","xt256","zenburn");
newtheme.cssarray = styles;

newtheme.addDesignOption("select", "theme of hljs:", styles, styles, 0);

newtheme.init = function(){
	let activetheme = slidenote.extensions.activeCssTheme;
	if(activetheme===undefined){
		let cssthemes = slidenote.extensions.CssThemes();
		for(var x=0;x<cssthemes.length;x++){
			if(cssthemes[x].active){
				activetheme=cssthemes[x];
				break;
			}
		}
	}
	if(activetheme && activetheme.highlightTheme!=undefined){
		this.changeDesignOption(0,activetheme.highlightTheme);
	}
}
newtheme.changeDesignOption = function(optionnr, value){
	if(optionnr===0){
		if(this.highlightstylecssfile!=undefined){
			document.head.removeChild(this.highlightstylecssfile);
		}
		this.highlightstylecssfile = slidenote.appendFile("css","highlight/styles/"+value+".css");
		//console.log("changedesignoption:"+optionnr+":"+value);
		var seldesign = 0;
		for(var selx=0;selx<this.designoptions[0].values.length;selx++){
			if(this.designoptions[0].values[selx] === value)seldesign = selx;
		}
		this.designoptions[optionnr].selected = seldesign;
		this.seldesign = seldesign;
		//console.log("designoption changed hljs"+optionnr+"->"+value);
	}else if(optionnr===1){
		this.showLineNumbers = value;
	}
}


newtheme.saveConfigString = function(){
	return this.seldesign+"###"+this.highlightintexteditor;
}
newtheme.loadConfigString = function(data){
	var dataar = data.split("###");
	//dont save css-selection as long as user cant select himself
	//this.changeDesignOption(0,this.cssarray[dataar[0]]);
	if(dataar[1]==="true")this.highlightintexteditor=true;else this.highlightintexteditor=false;
	this.changeGlobalOption(0,this.highlightintexteditor);
}

/*dateien nachladen:
var jsfile = document.createElement('script');
jsfile.setAttribute("type","text/javascript");
jsfile.setAttribute("src", "themes/highlight/highlight.pack.js");
var cssfile = document.createElement("link");
cssfile.setAttribute("rel", "stylesheet");
cssfile.setAttribute("type", "text/css");
cssfile.setAttribute("href", "themes/highlight/styles/default.css");
document.getElementsByTagName("head")[0].appendChild(jsfile);
document.getElementsByTagName("head")[0].appendChild(cssfile);
*/
newtheme.loadingFiles = new Array();
newtheme.loadingFiles.push(slidenote.appendFile("script","highlight/highlight.pack.js"));
//slidenote.appendFile("css","highlight/styles/default.css");
newtheme.highlightstylecssfile = slidenote.appendFile("css","highlight/styles/monokai-sublime.css");
//slidenote.appendFile("script", "highlight/highlightjs-line-numbers.js");

newtheme.description = "automagically highlighting codes in codeblock using hljs. for more information "+
												"see http://highlightjs.org";
newtheme.styleThemeSpecials = function(){
	var codeblocks = document.getElementsByClassName("codeblock");
	var codeheads = new Array();
	for(var x=0;x<slidenote.parser.map.codeblocks.length;x++)codeheads.push(slidenote.parser.map.codeblocks[x].head);

	for(var x=0;x<codeblocks.length;x++){
		var block = codeblocks[x];
		//console.log("highlightlines:"+block.innerHTML);
		if(block.innerHTML.substring(0,1)==="\n")block.innerHTML=block.innerHTML.substring(1);
		//hljs.lineNumbersBlock(block);
		var options;
		if(codeheads[x] && codeheads[x].indexOf(this.metablockSymbol)>-1){
			options = this.parseStyledBlockOptions(block);
		}else {
			options = new slidenotecodeblockoptions();
			if(codeheads[x] && codeheads[x].indexOf(':')>1){
				let rawlanguage = codeheads[x].substring(codeheads[x].indexOf(':')+1);
				if(rawlanguage.length>1)options.language = HighlightGetLanguageClass(rawlanguage);
			}else if(codeheads[x] && codeheads[x].substring(0,3)==='```' && codeheads[x].length>4){
				options.language = HighlightGetLanguageClass(codeheads[x].substring(3));
			}
		}
		//console.log(options);
		this.options = options;
		this.findHighlightLines(block); //remember lines to highlight before changing code
		if(this.options.language && this.options.language.length>0){
			try{
				block.classList.add(this.options.language);
			}catch(err){
				console.warn('highlight.js: language builds not a valid css-class',language)
			}
		}
		if(this.options.language!="none"){
			hljs.highlightBlock(block);
			this.highlightLines(block);

		}
		var buildlines = (this.options.linehighlight!=null) || (this.options.linenumbering==="on" || this.options.linenumbering==="true");
		//if(buildlines){
			//this.buildLines(block);
		//}
		this.buildLines(block); //we dont check it here its either ul or ol
		//if(this.options.linenumbering === "on" ||
		//		this.options.linenumbering === "true")this.buildLines(block);
	}
}
newtheme.active = true;
slidenote.datatypes.elementOfType("code").theme = newtheme;

/*
use highlight.js to add syntax-highlightning to
editor
*/
newtheme.highlighteditor = function(){
	var codes = document.getElementsByClassName("code");
	var bglines = document.getElementsByClassName("backgroundline");
	//only highlight real code, not options and use
	//input of language-option if available as class:
	var codeblocks = slidenote.parser.map.codeblocks;
	for (var x=0;x<codeblocks.length;x++){
		bglines[codeblocks[x].line].classList.add('meta');
		bglines[codeblocks[x].endline].classList.add('meta');
		if(codeblocks[x].head.indexOf(':options')>-1){
			let start = codeblocks[x].line+1;
			let end= codeblocks[x].endline;
			let language=null;
			let meta=true;
			for(var y=start;y<end;y++){
				let line = slidenote.parser.map.origLines[y];
				if(meta){
					bglines[y].classList.add('meta');
					if(line==="---"){
						meta=false;
						continue;
					}
					if(line.indexOf('language')==0){
						let divider = line.indexOf(':');
						let eq = line.indexOf('=');
						if(eq>0 && (eq<divider || divider==-1))divider=eq;
						if(divider!=-1)language=HighlightGetLanguageClass(line.substring(divider+1));
					}
				}else{
					bglines[y].className='backgroundline code';
					if(language!=null && language!=''){
						try{
							bglines[y].classList.add(language);
						}catch(err){
							console.warn('language is not a valid classname:',language)
						}
					}
				}
			}
		}
	}
	for(var cx=0;cx<codes.length;cx++){
		if(codes[cx].classList.contains("backgroundline") &&
		codes[cx].classList.contains('meta')==false &&
		codes[cx].innerHTML.length>5){
			hljs.highlightBlock(codes[cx]);
			codes[cx].classList.remove("hljs");
		}
	}
}


var HighlightGetLanguageClass = function(languagecode){
	let lang = languagecode.toLowerCase().replace(' ','');
	let aliases = 	 ['c++', 'c#', 		'html', 'markup', 'objective-c', 'phptemplate', 'text',				'plain','.properties','pythonrepl','shellsession',];
	let aliascontent=['cpp', 'csharp', 'xml', 'markdown', 'objectivec', 'php-template','plaintext','plaintext','properties','python-repl','shell',];
	if(aliases.indexOf(lang)>-1)lang=aliascontent[aliases.indexOf(lang)];
	return lang;
}

newtheme.findHighlightLines = function(block){
	this.findHighlightInline(block);
	var text = block.innerHTML;
	//console.log("find highlightlines in:\n"+text+
	//						"\n linemarker:"+this.options.speciallinemarker + "eol");
	var lines = text.split("\n");
	var foundlines = new Array();
	for(var x=0;x<lines.length;x++){
		//console.log("linestart:"+lines[x].substring(0,this.options.speciallinemarker.length));
		if(lines[x].substring(0,this.options.speciallinemarker.length) === this.options.speciallinemarker){
				foundlines.push(x+1);
				lines[x]=lines[x].substring(this.options.speciallinemarker.length);
		}
	}
	if(this.options.linehighlight===null)this.options.linehighlight = foundlines.toString();
	else this.options.linehighlight += ","+foundlines.toString();
	//console.log("found highlightlines:"+foundlines.toString());
	block.innerHTML = lines.join("\n");
}

newtheme.findHighlightInline = function(block){
	var text = block.innerHTML;
	//console.log("find highlighted Inline");
	var lines = text.split("\n");
	var foundlines = new Array();
	var stm = this.options.specialstartmarker;
	var endm = this.options.specialendmarker;
	var startreplace = "o͈˒˔˒˔˒";
	var endreplace = "o͈˓˔˓˔˓";
	var lengthdiff = startreplace.length + endreplace.length - stm.length - endm.length;
	for(var x=0;x<lines.length;x++){
		var actl = lines[x];
		var spos = actl.indexOf(stm);
		var epos = actl.indexOf(endm);
		var foundparts = undefined;
		while(spos>-1 && epos>-1 && spos<epos){
			//foundparts.push({start:spos,end:epos});
			foundparts = {startreplace:startreplace,endreplace:endreplace};
			actl = actl.substring(0,spos)+
								startreplace +
								actl.substring(spos+stm.length,epos)+
								endreplace+
								actl.substring(epos+endm.length);
			spos = actl.indexOf(stm,epos+1+lengthdiff);
			epos = actl.indexOf(endm,epos+1+lengthdiff);
		}
		lines[x]=actl;
		foundlines[x]=foundparts;
	}
	this.options.inlineHighlights = foundlines;
	block.innerHTML = lines.join("\n");
}

newtheme.highlightLines = function(block){
	var text = block.innerHTML;
	//console.log("start highlightlines with:"+text);
	if(this.options === undefined)this.options = new slidenotecodeblockoptions();
	//var linemarker = "\n"+this.options.speciallinemarker;
	//this.speciallinemarker = linemarker;
	block.classList.remove("specialline");
	/*while(text.indexOf(linemarker)>-1 && confirm("linemarker: |"+linemarker+"|\n"+text)){
		var pos = text.indexOf(linemarker);
		posend = text.indexOf("\n", pos+2);
		text = text.substring(0,pos)+'\n<span class="specialline">' +
					 text.substring(pos+linemarker.length,posend)+
					 '</span>'+text.substring(posend);
		block.classList.add("specialline");
	}*/
	var textarr = text.split("\n");
	var lastel = textarr.pop();
	if(lastel.length>0)textarr.push(lastel);
	var markerlnr = this.options.linesToHighlight();
	var specialLinesFound = false;
	for(var x=0;x<textarr.length;x++){
		if(markerlnr.includes(x+1)){
			specialLinesFound = true;
			textarr[x]='<span class="specialline">'+textarr[x]+"</span>";
		}else{
			if(this.options.inlineHighlights[x]!=undefined){
				specialLinesFound = true;
				var actlinechanges = this.options.inlineHighlights[x];
				while(textarr[x].indexOf(actlinechanges.startreplace)>-1)
					textarr[x] = textarr[x].replace(actlinechanges.startreplace, '</span><span class="specialinline">');
				while(textarr[x].indexOf(actlinechanges.endreplace)>-1)
					textarr[x] = textarr[x].replace(actlinechanges.endreplace, '</span><span class="codeline">');
			}
			textarr[x]='<span class="codeline">'+textarr[x]+"</span>";
		}
	}
	text = textarr.join("\n");
	block.innerHTML = text;
	if(specialLinesFound)block.classList.add("specialline");
	//console.log("end with:"+text);
	return text;
}

function slidenotecodeblockoptions(){
	/*defines codeblock options defaults*/
	this.linehighlight = null; //string with kind-of-array "1,3-5,7"
	this.linenumbering = "on"; //could be on, true, off, false
	this.linenumberingstart = 1;
	this.language = "";	 //programming language - default is let hljs choose
	this.speciallinemarker = "§§";
	this.specialstartmarker = "§(";
	this.specialendmarker = ")§";

	this.showLineNumbers = function(){
		return (this.linenumbering === "on"|| this.linenumbering ==="true");
	}

	this.linesToHighlight = function(){
		var linearr = new Array();
		if(this.linehighlight===null)return linearr;
		var tmparr = this.linehighlight.split(",");
		for(var x=0;x<tmparr.length;x++){
			if(tmparr[x].indexOf("-")>-1){
				var tmp = tmparr[x].split("-");
				var start = 1*tmp[0];
				var end = 1*tmp[1];
				if(start>0&&end>0){
					for(start;start<=end;start++){
						linearr.push(start);
					}
				}
			}else{
				var linenr = tmparr[x] * 1;
				if(linenr>0)linearr.push(linenr);
			}
		}
		return linearr;
	}
}
newtheme.options = new slidenotecodeblockoptions();
newtheme.metablockSymbol = "options";//"styled";
newtheme.hasInsertMenu = true;

newtheme.insertMenuArea = function(dataobject){
	var result = document.createElement("div");
	result.classList.add("codeinsertmenu");
	//console.log("start codeinsertmenü");
	//console.log(this.options);
	for(var key in this.options)if(this.options.hasOwnProperty(key) && typeof this.options[key] !="function"){
		//console.log("key:"+key);
		var button = document.createElement("button");
		button.innerText = key;
		button.addEventListener("click", function(e){
			var theme = slidenote.extensions.getThemeByName("highlight");
			var key = this.innerText;
			var keyvalue = theme.options[key];
			//console.log("codeinsertmenu key "+key + ":"+keyvalue);
			var celement = slidenote.parser.CarretOnElement();
			if(celement.tag==="codeende")celement = slidenote.parser.CarretOnElement(slidenote.parser.map.linestart[celement.line-1]);
			var codeblockstart = slidenote.parser.map.linestart[celement.line+1];
			var codeblockend = slidenote.parser.map.linestart[celement.endline];
			var metablockend = slidenote.textarea.value.indexOf("\n---\n",codeblockstart);
			if(metablockend<0 || metablockend>codeblockend)	metablockend = false;
			var metablockhead = (celement.mdcode.indexOf(theme.metablockSymbol)>-1);
			if(key==="linehighlight")keyvalue="1,2-3,4";
			var insertText = key + "="+keyvalue+"\n";
			var insertPos = codeblockstart;
			var foundkey = slidenote.textarea.value.indexOf("\n"+key,codeblockstart-1);
			console.log("codeinsertmenu all parsed:"+
									"\nfoundkey:"+foundkey+
									"\nmetablockend:"+metablockend+
									"\nmetablockhead:"+metablockhead+
									"\ncodeblockstart:"+codeblockstart
									);
			if(metablockend && metablockhead &&
				 foundkey >= codeblockstart-1 && foundkey < metablockend){
				//element is already there. move there to edit:
				foundkey++;
				var eol = slidenote.textarea.value.indexOf("\n",foundkey);
				var sym = slidenote.textarea.value.indexOf("=", foundkey)+1;
				if(sym>eol)sym=eol;
				slidenote.textarea.selectionEnd=sym;
				slidenote.textarea.selectionStart=sym;
				slidenote.textarea.focus();
				//console.log("element found, edit on it");
				return;
			}
			if(metablockhead && metablockend){
				//element was not found but metablockend has:
				insertPos = metablockend+1; //+1 because of \n so its after the \n and before the ---
			}else{
				insertText+="---\n";
			}
			var tx = slidenote.textarea;
			tx.value = tx.value.substring(0,insertPos)+insertText+tx.value.substring(insertPos);
			var cursorpos = insertPos + key.length+1;
			if(!metablockhead){
				var newhead = "code:"+theme.metablockSymbol+"\n";
				//magic number 3 is the length of either "+++" or "´´´" so we dont delete it but keep it as it is to not mix up
				tx.value = tx.value.substring(0,celement.posinall+3)+newhead+tx.value.substring(codeblockstart);
				cursorpos+= newhead.length - (codeblockstart-(celement.posinall+3));
			}
			slidenote.textarea.selectionEnd = cursorpos;
			slidenote.textarea.selectionStart = cursorpos;
			slidenote.textarea.focus();
			slidenote.parseneu();
		});
		result.appendChild(button);
	}
	//console.log("codeinsertmenü");
	//console.log(result);
	return result;
}

newtheme.parseStyledBlockOptions = function(block){
	var text = block.innerHTML;
	if(text.indexOf("\n---\n")===-1)return new slidenotecodeblockoptions();
	text = text.substring(0,text.indexOf("\n---\n"));
	var optionlines = text.split("\n");
	var options = new slidenotecodeblockoptions();
	for(var x=0;x<optionlines.length;x++){
		//console.log(optionlines[x]);
		/*var oline = optionlines[x].split("=");
		if(oline.length>2){
			var tmp = oline.shift();
			var tmp2 = oline.join("=");
			oline[0]=tmp;
			oline[1]=tmp2;
		}
		console.log(oline);
		if(oline.length<2)continue;
		*/
		var oline = new Array();
		var sign = "=";
		var poseq = optionlines[x].indexOf("=");
		var signpos = poseq;
		var pospoint = optionlines[x].indexOf(":");
		if(poseq + pospoint <0)continue; //no valid pos found
		if(pospoint>0 &&
			(pospoint<poseq || poseq===-1)){
				sign=":";
				signpos = pospoint;
			}
		oline[0]=optionlines[x].substring(0,signpos);
		oline[1]=optionlines[x].substring(signpos+1);
		var optionname = oline[0].replace(/\s/g,"").toLowerCase();
		var optiondata = oline[1].replace(" ","");
		//console.log(optionname+":"+optiondata);
		//check if default exist: if so, overwrite it. else do nothing
		//if(options[optionname]===undefined)continue;
		options[optionname]=optiondata;
		if(optionname=='language')options[optionname]=HighlightGetLanguageClass(optiondata);

	}
	block.innerHTML = block.innerHTML.substring(text.length+5);
	return options;
}
/*
highlightLinesInEditor: is called every cycle to check for
lines with the attribute "highlight" in the options-area
 and sets them to be underlined to show visual feedback in editor of which lines
of the code should be more visible then others
it runs independently if highlightning of code via highlight.js
is activated or not as its part of slidenote
*/
newtheme.highlightLinesInEditor = function(changedlinesobjects){
	var map = slidenote.parser.map;
	var codes = slidenote.texteditorerrorlayer.getElementsByClassName("code");
	var changedlines = new Array();
	var lineswithcode = new Array();
	for(var x=0;x<map.codeblocks.length;x++){
		for(var y=map.codeblocks[x].line;y<=map.codeblocks[x].endline;y++){
			lineswithcode[y] = map.codeblocks[x];
		}
	}
	if(changedlinesobjects)for(var x=0;x<changedlinesobjects.length;x++){
		if(lineswithcode[changedlinesobjects[x].line]){
			var startcline = lineswithcode[changedlinesobjects[x].line].line;
			var endcline = lineswithcode[changedlinesobjects[x].line].endline;
			for(var y=startcline;y<endcline;y++){
				changedlines.push(y);
			}
		}
		changedlines.push(changedlinesobjects[x].line);

	}
	var standardlinemarker = "§§";
	var startmarker = "§a";
	var endmarker = "§e";
	var highlightedlines;
	var linemarker = standardlinemarker;
	var metablockendline;
	var firstCodelineInX = 0;
	//var linestomark = this.options.linesToHighlight();
	for(var x=0;x<codes.length;x++){
		var actline = map.codeblocklines[x].line;
		if(changedlines.indexOf(map.codeblocklines[x].line)===-1)continue;
		if(map.codeblocklines[x].line === map.codeblocklines[x].codeblock.line){
			if(map.codeblocklines[x].codeblock.head.indexOf(this.metablockSymbol)>-1){
				map.codeblocklines[x].codeblock.hasmetablock = true;
			}
			linemarker = standardlinemarker;
			codes[x].classList.add("codehead");
			firstCodelineInX = x;
		}
		if(map.codeblocklines[x].codeblock.hasmetablock){
			if(map.codeblocklines[x].origtext === "---"){
				map.codeblocklines[x].codeblock.metablockendline = x;
				firstCodelineInX = x;
				if(codes[x].innerHTML.indexOf("options")===-1)
				codes[x].innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;<span class="pagenr">&uarr;options&uarr; &darr;code&darr;</span>'
				codes[x].classList.add("metadataseparator");
			}
			if(map.codeblocklines[x].codeblock.metablockendline ===undefined){
				codes[x].classList.add("metadata");
			}
			if(map.codeblocklines[x].codeblock.metablockendline ===undefined &&
				map.codeblocklines[x].origtext.indexOf("linemarker")>-1){
					var eqpos = map.codeblocklines[x].origtext.indexOf("=");
					var popos = map.codeblocklines[x].origtext.indexOf(":");
					if(popos>0&&popos<eqpos)eqpos=popos;
					if(eqpos>0){
						linemarker = map.codeblocklines[x].origtext.substring(eqpos+1).replace(" ","");
						map.codeblocklines[x].codeblock.linemarker = linemarker;
					}
			}
			if(map.codeblocklines[x].codeblock.metablockendline === undefined &&
				map.codeblocklines[x].origtext.indexOf("startmarker")>-1){
					var eqpos = map.codeblocklines[x].origtext.indexOf("=");
					var popos = map.codeblocklines[x].origtext.indexOf(":");
					if(popos>0&&popos<eqpos)eqpos=popos;
					if(eqpos>0){
						startmarker = map.codeblocklines[x].origtext.substring(eqpos+1).replace(" ","");
						map.codeblocklines[x].codeblock.startmarker = startmarker;
					}
			}
			if(map.codeblocklines[x].codeblock.metablockendline === undefined &&
				map.codeblocklines[x].origtext.indexOf("endmarker")>-1){
					var eqpos = map.codeblocklines[x].origtext.indexOf("=");
					var popos = map.codeblocklines[x].origtext.indexOf(":");
					if(popos>0&&popos<eqpos)eqpos=popos;
					if(eqpos>0){
						endmarker = map.codeblocklines[x].origtext.substring(eqpos+1).replace(" ","");
						map.codeblocklines[x].codeblock.endmarker = endmarker;
					}
			}
			if(map.codeblocklines[x].codeblock.metablockendline === undefined &&
				map.codeblocklines[x].origtext.indexOf("highlight")>-1){
					var eqpos = map.codeblocklines[x].origtext.indexOf("=");
					var popos = map.codeblocklines[x].origtext.indexOf(":");
					if(popos>0&&popos<eqpos)eqpos=popos;
					if(eqpos>0){
						var rawhltext = map.codeblocklines[x].origtext.substring(eqpos+1).replace(" ","");
						var rawarr = rawhltext.split(",");
						highlightedlines = new Array();
						for(var rhl=0;rhl<rawarr.length;rhl++){
							if(rawarr[rhl]*0===0){
								highlightedlines.push(rawarr[rhl]*1);
							}else if(rawarr[rhl].indexOf("-")>-1){
								var lstartstop = rawarr[rhl].split("-");
								if(lstartstop.length===2 && lstartstop[0]*0===0 && lstartstop[1]*0===0){
									for(var lss=lstartstop[0]*1;lss<=lstartstop[1]*1;lss++){
										highlightedlines.push(lss);
									}
								}
							}
						}
						map.codeblocklines[x].codeblock.endmarker = endmarker;
					}
			}
			if(map.codeblocklines[x].codeblock.metablockendline!=undefined &&
				highlightedlines && highlightedlines.length >0 &&
				highlightedlines.indexOf(x-firstCodelineInX)>-1){
					//codes[x].innerHTML = '<span class="specialline">'+codes[x].innerHTML+"</span>";
					codes[x].classList.add("specialline");
			}
		}
		//console.log("highlight line: "+codes[x].innerHTML);
		if(map.codeblocklines[x].origtext.substring(0,linemarker.length)===linemarker){
			//var ct = codes[x].innerHTML;
			//ct = '<span class="specialline">'+ct+"</span>";
			//codes[x].innerHTML = ct;
			codes[x].classList.add("specialline");
			//console.log("highlighting line: yes"+ct);
		}else if(map.codeblocklines[x].origtext.indexOf(startmarker)>-1 &&
						map.codeblocklines[x].origtext.indexOf(endmarker)>-1 &&
					(map.codeblocklines[x].codeblock.metablockendline===undefined||
					map.codeblocklines[x].codeblock.metablockendline<x)){
						var oldtxt = codes[x].innerHTML;
						var stmpos = oldtxt.indexOf(startmarker);
						var endmpos = oldtxt.indexOf(endmarker,stmpos+startmarker.length);
						var stinput = '<span class="specialinline">';
						var endinput = '</span>';
						var diff = stinput.length + endinput.length;
						while(stmpos<endmpos && stmpos>-1){
							oldtxt = oldtxt.substring(0,stmpos)+
											stinput+
											oldtxt.substring(stmpos,endmpos+endmarker.length)+
											endinput+
											oldtxt.substring(endmpos+endmarker.length);
							stmpos = oldtxt.indexOf(startmarker,endmpos+diff+endmarker.length);
							endmpos = oldtxt.indexOf(stmpos+startmarker.length);
						}
						codes[x].innerHTML = oldtxt;
					}//else console.log("highlight line: not.")
		//look out for inline-marker:

	}
}

newtheme.styleThemeMDCodeEditor = function(changes){
	this.highlightLinesInEditor(changes);
}

newtheme.buildLines = function(block){
	var text = block.innerHTML;
	//dont print empty last line therefore delete last \n if on last pos:
	if(text.charAt(text.length-1)=="\n")text=text.substring(0,text.length-1); //appears if hljs is not passed then last char is an \n
	var markedlines = this.options.linesToHighlight();
	if(markedlines.length>0)block.classList.add("specialline");
//console.log(text);
	//text = text.replace('\n', '<ol start="'+this.options.linenumberingstart+'"><li>');
	var firstli = "<li>";
	if(markedlines.includes(1))firstli='<li class="specialline">';
	if(this.options.linenumbering === "on"|| this.options.linenumbering==="true"){
		text = '<ol start="'+this.options.linenumberingstart+'" style="counter-reset:code-line-counter '+(this.options.linenumberingstart-1)+';">'+firstli+text;
	}else{
		text = '<ul>'+firstli+text;
	}

	//console.log(text);
	var linenr = 1;
	while(text.indexOf("\n")>-1){
		linenr++;
		let litag = "<li>";
		if(markedlines.includes(linenr))litag = '<li class="specialline">'
		text = text.replace(/\n/, "</li>"+litag);
	}
	//text = text.replace(/\n/g, "</li><li>");
	//console.log(text);
	text+="</li></ol>";
	//text = text.replace(/\n/g,"");
	block.innerHTML = text;
	return text;
}

slidenote.afterCodeEditorrender = null; //newtheme.highlighteditor;

newtheme.highlightintexteditor = false;
newtheme.addGlobalOption("checkbox", "highlighting of codeblocks in texteditor (experimental)", "hltexteditor",true);
//newtheme.addGlobalOption("checkbox", "show line numbers", "show line numbers",true, true)	;
newtheme.showLineNumbers = true;
newtheme.changeGlobalOption = function(optionnr, value){
		if(optionnr===0)this.highlightintexteditor = value;
		if(optionnr===1)this.showLineNumbers = value;
		this.globaloptions[optionnr].values=value;
		if(this.highlightintexteditor){
			slidenote.afterCodeEditorrender = this.highlighteditor;
		} else{
			slidenote.afterCodeEditorrender = null;
		}
}

slidenote.addTheme(newtheme);

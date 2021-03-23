var newtheme = new Theme("klatex");
newtheme.description = "Latex-Support with Katex";
/*
//loading js-library:
var jsfile = document.createElement('script');
jsfile.setAttribute("type","text/javascript");
jsfile.setAttribute("src", "themes/katex/katex.min.js");
document.getElementsByTagName("head")[0].appendChild(jsfile);
//loading aditional css-file:
var cssfile = document.createElement("link");
cssfile.setAttribute("rel", "stylesheet");
cssfile.setAttribute("type", "text/css");
cssfile.setAttribute("href", "themes/katex/katex.min.css");
document.getElementsByTagName("head")[0].appendChild(cssfile);
*/
newtheme.loadingFiles = new Array();
newtheme.loadingFiles.push(slidenote.appendFile("script","katex/katex.js"));
slidenote.appendFile("css","katex/katex.min.css");
newtheme.addEditorbutton('<img src="'+slidenote.imagespath+'buttons/latexblock.svg" title="LaTeX-block"><span class="buttonmdcode">+++latex+++</span><span class="buttonmdtext"></span> <span class="buttonmdcode"></span>',"+++latex","+++"); //TODO: add function to body?
newtheme.addEditorbutton('<img src="'+slidenote.imagespath+'buttons/latex.svg" title="inline-LaTeX"><span class="buttonmdcode">\\(</span><span class="buttonmdtext">inline-latex</span> <span class="buttonmdcode">\\)</span>',"\\(","\\)");
slidenote.datatypes.push({type:"latex",mdcode:false,theme:newtheme});
slidenote.inlinedatatypes.push({
  type:"latex",mdcode:false, theme:newtheme,
  start:"\\(", end:"\\)",
  htmlstart:"<latex>",htmlend:"</latex>",
});


newtheme.styleThemeSpecials = function(){
  var datadivs = slidenote.presentationdiv.getElementsByTagName("section");
  for(var datax=0;datax<slidenote.parser.dataobjects.length;datax++){
    var dataobject = slidenote.parser.dataobjects[datax];
    if(dataobject.type==="latex"){
      //var latexspan = new Element("span");
      var rawdata = dataobject.raw.join("\n");
      var datadiv = datadivs[datax];
      datadiv.innerHTML="";
      datadiv.classList.add("klatex");
      var newdiv = document.createElement("div");
      console.log("katex:"+rawdata+"<<eol");
      console.log(rawdata);
      console.log(datadivs[datax]);
      katex.render(rawdata, newdiv, {throwOnError:false});
      //katex.render(rawdata,newdiv);
      datadiv.appendChild(newdiv);
    }
  }
  var inlines = slidenote.presentationdiv.getElementsByTagName("latex");
  for (var x=0;x<inlines.length;x++){
    var rawdata = inlines[x].innerHTML;
    var target = inlines[x];
    target.innerHTML = "";
    target.classList.add("klatex");
    var newdiv=document.createElement("span");
    katex.render(rawdata,newdiv,{throwOnError:false});
    target.appendChild(newdiv);
  }
}

slidenote.addTheme(newtheme);

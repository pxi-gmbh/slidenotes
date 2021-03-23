var newtheme = new Theme("table");
newtheme.description = "Tables: a simple table-Extension. Accepts different formats to transform Data-Block into an html-table";

newtheme.helpText = function(head){
  var result = "Each row makes a new row in the table, each separator in a row makes a new cell/column<br>"+
                "Accepted Separators are:<br>"+
                "&quot;,&quot; &quot;, &quot; &quot;;&quot; &quot;|&quot; and TAB<br>"+
                "First row is used for Labels";

  return result;
}

newtheme.addEditorbutton('<img src="'+slidenote.imagespath+'buttons/table.svg" title="Table">'+
  '<span class="buttonmdcode">+++table+++</span>'+
  '<span class="buttonmdtext"></span>'+
  '<span class="buttonmdcode"></span>'
,"+++table","+++");
slidenote.datatypes.push({type:"table",mdcode:false,theme:newtheme});

newtheme.hasInsertMenu = true;
newtheme.insertMenuArea = function(dataobject){
  var result = document.createElement("div");
  result.classList.add("chartistinsertmenu")
  var insertcsvbutton = document.createElement("button");
  insertcsvbutton.classList.add("menuitem");
  insertcsvbutton.innerText = "import csv";
  insertcsvbutton.title = "import data from a local .csv file";
  var insertcsvinput = document.createElement("input");
  insertcsvinput.type = "file";
  insertcsvinput.accept = ".csv,.txt";
  insertcsvinput.classList.add("screenreader-only");
  insertcsvinput.id = "importcsvinput";
  insertcsvinput.tabIndex = "-1";
  insertcsvinput.onchange = function(e){
    let file = this.files[0];
    let name = file.name;
    if(name.substring(name.length-3)!="csv" && name.substring(name.length-3)!="txt")return;
    var reader = new FileReader();
    reader.onload = function(e){
      let selstart = slidenote.textarea.selectionStart;
      let selend = slidenote.textarea.selectionEnd;
      let txt = slidenote.textarea.value;
      let instext = reader.result;
      txt = txt.substring(0,selstart)+instext+txt.substring(selend);
      slidenote.textarea.value=txt;
      slidenote.textarea.selectionEnd = selstart + instext.length;
      slidenote.parseneu();
      slidenote.textarea.blur();
      slidenote.textarea.focus();
    }
    reader.readAsText(file);
  }
  insertcsvbutton.onclick = function(){
    document.getElementById("importcsvinput").click();
  }
  result.appendChild(insertcsvbutton);
  result.appendChild(insertcsvinput);
  return result;
}

newtheme.styleThemeSpecials = function(){
  var datadivs = slidenote.presentationdiv.getElementsByTagName("section");
  for(var datax=0;datax<slidenote.parser.dataobjects.length;datax++){
  if(slidenote.parser.dataobjects[datax].type=="table"){
    console.log("table gefunden");
    var dataobject = slidenote.parser.dataobjects[datax];
    var actdiv = datadivs[datax];
    var headdata = new Array();
    var zeilen = new Array();
    var trennzeichen;
    //trennzeichen bestimmen/herausfinden:
    var erlaubtetrennzeichen = ["," , ", " , ";" , "|" , "\t"];
    for(var etz=0;etz<erlaubtetrennzeichen.length;etz++){
      if(dataobject.raw[0].indexOf(erlaubtetrennzeichen[etz])>=0)trennzeichen=erlaubtetrennzeichen[etz];
    }
    console.log("Trennzeichen:"+trennzeichen);
    //daten einlesen:
    for(var x=0;x<dataobject.raw.length;x++){
      var rawact=dataobject.raw[x];
      console.log("rawact:"+rawact);
      if(headdata.length==0){
        //header einlesen:
        console.log("header einlesen");
        var headpos=0;
        var headpostmp;
        while(rawact.indexOf(trennzeichen, headpos)>=0){
          headdata.push(rawact.substring(headpos,rawact.indexOf(trennzeichen,headpos)));
          headpos=rawact.indexOf(trennzeichen,headpos)+1;
        }
        headdata.push(rawact.substring(headpos));
      }else{
        //header sind eingelesen: zellen einlesen
        console.log("zellen einlesen");
        var neuezeile = new Array();
        var zeilpos=0;
        while(rawact.indexOf(trennzeichen,zeilpos)>=0){
          neuezeile.push(rawact.substring(zeilpos,rawact.indexOf(trennzeichen,zeilpos)));
          zeilpos=rawact.indexOf(trennzeichen,zeilpos)+1;
          console.log("zeilpos:"+ zeilpos+", neuezeile[last]:"+neuezeile[neuezeile.length-1]);
        }
        neuezeile.push(rawact.substring(zeilpos));
        //wenn neuezeile mehr als eine zelle hat:
        if(neuezeile.length>1)zeilen.push(neuezeile);
        //sonst ist die neuezeile sehr warscheinlich leer
        //tabelle mit einer zelle macht keinen sinn
      }
    }
    //daten sind eingelesen
    //md-code-zeilencheck:
    if(trennzeichen=="|"&&zeilen.length>0&&zeilen[0].length>0&&
            zeilen[0][0].indexOf("----")>=0){
      console.log("---- gefunden, zeilenshift");
      zeilen.shift();
    }
    console.log("daten sind eingelesen");
    console.log(headdata);
    console.log(zeilen);
    var tablehtml = "<table><thead><tr>";
    for(var headx=0;headx<headdata.length;headx++)tablehtml+="<td>"+headdata[headx]+"</td>";
    tablehtml+="</tr></thead><tbody>";
    for(var zeilx=0;zeilx<zeilen.length;zeilx++){
      tablehtml+="<tr>";
      for(var zeilxx=0;zeilxx<zeilen[zeilx].length;zeilxx++)tablehtml+="<td>"+zeilen[zeilx][zeilxx]+"</td>";
      tablehtml+="</tr>";
    }
    tablehtml+="</tbody></table>";
    console.log("innerhtml tauschen:");
    console.log(actdiv);
    actdiv.innerHTML=tablehtml;


  }
  }
  console.log("alle tables durchlaufen");
}
slidenote.addTheme(newtheme);

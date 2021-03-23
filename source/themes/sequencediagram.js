var newtheme = new Theme("sequencediagram");
newtheme.description = "Generates UML sequence diagrams from simple text \n https://bramp.github.io/js-sequence-diagrams/ \n by Andrew Brampton 2012-2017";
//loading js-libraries:
slidenote.appendFile("script", "sequencediagram/snap.svg-min.js").onload = function(){
  slidenote.appendFile("script", "sequencediagram/underscore-min.js");
  slidenote.appendFile("script","sequencediagram/webfontloader.js");
  slidenote.appendFile("script","sequencediagram/sequence-diagram.js");
  };
//loading aditional css-file:
slidenote.appendFile("css", "sequencediagram/sequence-diagram-min.css");

newtheme.addEditorbutton('Flowdiagram',"```flow","```");
slidenote.datatypes.push({type:"flow",mdcode:false,theme:newtheme});

newtheme.styleThemeSpecials = function(){
  var datadivs = slidenote.presentationdiv.getElementsByTagName("section");
  for(var datax=0;datax<slidenote.parser.dataobjects.length;datax++){
    var dataobject = slidenote.parser.dataobjects[datax];
    if(dataobject.type==="flow"){
      var rawdata = dataobject.raw.join("\n");
      var datadiv = datadivs[datax];
      var svgdiv = document.createElement("div");
      svgdiv.id = "sequencediagram"+datax;
      svgdiv.classList.add("sequencediagram");
      datadiv.innerHTML = "";
      datadiv.appendChild(svgdiv);
      var screenreadertxt = document.createElement("div");
      screenreadertxt.innerHTML =  dataobject.raw.join("<br>");
      screenreadertxt.classList.add("screenreader-only");
      datadiv.appendChild(screenreadertxt);
      console.log("sequencediagram:");
      console.log(rawdata);
      console.log(datadivs[datax]);
      var d = Diagram.parse(rawdata);
      var options = {theme: 'hand'};
      this.standardtextbox = { cx: 18.921875,
cy: -6,
h: 18,
height: 18,
path: [
["M", -1, -15],
["l", 39.84375, 0],
["l", 0, 18],
["l", -39.84375, 0],
["z"],
],
length: 5,
r0: 21.86049184066143,
r1: 9,
r2: 19.921875,
vb: "-1 -15 39.84375 18",
w: 39.84375,
width: 39.84375,
x: -1,
x2: 38.84375,
y: -15,
y2: 3 }
      console.log("diagram:");
      console.log(d);
      if(confirm("draw diagram"))
      d.drawSVG(svgdiv, options);
      var height = d.height;
      var width = d.width;
      console.log("height:"+height+" width:"+width);
    }
  }
}

newtheme.setViewBox = function(drawing){
  console.log(drawing);
  var svgnode = drawing.paper_.node;
  console.log(svgnode);
  var width = svgnode.width.baseVal.value;
  var height = svgnode.height.baseVal.value;
  console.log(width+"wh"+height);
  svgnode.setAttribute("viewBox", "0 0 "+width+" "+height);
  //svgnode.onload = "slidenote.extensions.getThemeByName('sequencediagram').setViewBox2(this)";
}
newtheme.setViewBox2 = function(svg){
  console.log("svg loaded:");
  console.log(svg);

}

slidenote.addTheme(newtheme);

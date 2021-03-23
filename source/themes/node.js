var nodetheme = new Theme('node');
nodetheme.description = "creates different kind of node-based views (sequence diagram, tree...)";
nodetheme.active = true;
nodetheme.newFeature = true;
var buttonhtml = '<img src="images/buttons/node.svg" alt="node" title="node"><span class="buttonmdcode">+++node+++</span>';
nodetheme.addEditorbutton(buttonhtml,'+++node');

//internal vars:
nodetheme.nodetypes = ['simpleflow','tree','sequence','flow'];
nodetheme.mdcode = true;
nodetheme.syntax = {
  //"md"-prefix: mdcode-allowed, so deformed html:
  headseparator:"---",
  arrows: ['-->','->>','->','--', '-', '=>'],
  arrowtypes: ['dashed', 'open','normal','noarrowdashed','noarrow', 'broad'],
  mdarrows: ['--&gt;', '-&gt;&gt;','-&gt;','--','-','=&gt;'],
  wrapper:['()','[]','<>','{}'],
  wrappertitle:['circle','block','diamond','cloud'],
  wrapperlist:[['(',')'],['[',']'],['<','>'],['{','}']],
  mdwrapperlist:[['(',')'],['[',']'],['&lt;','&gt;'],['{','}']],
};

slidenote.datatypes.push({type:'node',mdcode:this.mdcode, theme:nodetheme});
//insert-menu:
nodetheme.hasInsertMenu = true;
nodetheme.insertMenuArea = function(dataobject){
  var result = document.createElement('div');
  var type='sequence'; //sequence is standard-type
  for(var x=0;x<this.nodetypes.length;x++){
    if(dataobject.head.indexOf(this.nodetypes[x])>-1)type=this.nodetypes[x];
  }
  result.classList.add('nodeinsertmenu');
  var standardbuttonlist = this.standardInsertMenu();
  result.appendChild(standardbuttonlist);
  var buttonlist=this.builder[type].insertMenu();
  if(buttonlist)result.appendChild(buttonlist);
  return result;
};

nodetheme.switchNodetype = function(type){
  let selend = slidenote.textarea.selectionEnd;
  let selstart = slidenote.textarea.selectionStart;
  let nodeheaderstart = slidenote.textarea.value.lastIndexOf('+++node',selend);
  let nodeheaderend = slidenote.textarea.value.indexOf('\n',nodeheaderstart);
  let txt = slidenote.textarea.value;
  txt = txt.substring(0,nodeheaderstart)+
        '+++node:'+type+
        txt.substring(nodeheaderend);
  slidenote.textarea.value=txt;
  slidenote.textarea.selectionStart = selstart;
  slidenote.textarea.selectionEnd = selend;
  slidenote.textarea.focus();
  slidenote.parseneu();
}

nodetheme.standardInsertMenu = function(){
  let header = slidenote.parser.CarretOnElement().dataobject.head;
  let nodetype = 'simpleflow';
  for(var x=0;x<this.nodetypes.length;x++){
    if(header.indexOf(this.nodetypes[x])>-1){
      nodetype = this.nodetypes[x];
      break;
    }
  }

  let result = document.createElement('div');
  let nodetypeselect = document.createElement('select');
  nodetypeselect.classList.add('menuitem');
  for(var x=0;x<this.nodetypes.length;x++){
      let option = document.createElement('option');
      option.innerText=this.nodetypes[x];
      option.value=this.nodetypes[x];
      if(this.nodetypes[x]==nodetype)option.selected = true;
      nodetypeselect.appendChild(option);
  }
  nodetypeselect.onchange = function(){
    nodetheme.switchNodetype(this.value);
  }
  result.appendChild(nodetypeselect);
  //we have note left, right, over and all arrows
  let notes = [
    'a:alice',
    'a->b',
    'a-->b',
    'a->>b',
    'a=>b',
    'a-b',
    'note left of ',
    'note right of ',
    'note over ',
  ];
  for(var x=0;x<notes.length;x++){
    //let li=document.createElement('li');
    let bt = document.createElement('button');
    bt.clasName='menuitem';
    bt.title='insert '+notes[x]+'to code';
    bt.name=notes[x];
    bt.innerText=notes[x];
    bt.onclick=function(){
      let inspos = slidenote.textarea.value.indexOf('\n',slidenote.textarea.selectionEnd);
      let txt=slidenote.textarea.value;
      let inserttext='\n'+this.name;
      if(this.name.indexOf(":")==-1)inserttext+=":";
      txt=txt.substring(0,inspos)+inserttext+txt.substring(inspos);
      slidenote.textarea.value=txt;
      slidenote.textarea.selectionEnd=inspos+inserttext.length-1;
      slidenote.parseneu();
      slidenote.textarea.focus();
    };
    //li.appendChild(bt);
    //result.appendChild(li);
    result.appendChild(bt);
  }
  return result;
}

nodetheme.styleThemeSpecials = function(){
  var datadivs = slidenote.presentationdiv.getElementsByTagName("section");
  for(var dx=0;dx<slidenote.parser.dataobjects.length;dx++){
  if(slidenote.parser.dataobjects[dx].type==='node'){
    let nodeobj = slidenote.parser.dataobjects[dx];
    let targetdiv = datadivs[dx];
    let renhtml = targetdiv.innerHTML.substring(1);//get rid of first \n
    //clean out some tags:
    renhtml = renhtml.replace(/<p>/g,'');
    renhtml = renhtml.replace(/<\/p>/g,'');
    renhtml = renhtml.replace(/<br>/g,'');
    let renlines=renhtml.split('\n');
    renlines.pop(); //get rid of last empty line
    //get rid of comments:
    for(var c=0;c<renlines.length;c++){
      if(nodeobj.raw[c].indexOf('//')>-1){
        renlines[c] = renlines[c].substring(0,renlines[c].indexOf('//'));
        nodeobj.raw[c]=nodeobj.raw[c].substring(0,nodeobj.raw[c].indexOf('//'));
      }
    }
    nodeobj.renderedLines=renlines;
    var nodediv = document.createElement('div');
    let nodetype;
    for(var x=0;x<this.nodetypes.length;x++){
      if(nodeobj.head.indexOf(this.nodetypes[x])>-1){
        nodetype=this.nodetypes[x];
        break;
      }
    }
    if(!nodetype)nodetype=this.nodetypes[0]; //no nodetype declared
    let nodeparseobj = this.builder.parse(nodeobj);
    var nodegraph = this.builder[nodetype].build(nodeparseobj);
    targetdiv.classList.add('node');
    nodegraph.classList.add(nodetype);
    console.log(targetdiv.innerHTML);
    targetdiv.innerHTML='';
    targetdiv.appendChild(nodegraph);
  }
  }
}

nodetheme.builder = {
  parsedlines:[],
  //general parsing:
  parseLine: function(line){
      if(line==undefined || line.length<1)return false; //nothing to do on empty line
      let posofpoint = line.indexOf(":");
      let posofdoublepoint = line.indexOf("::");
      if(posofdoublepoint>-1 && posofdoublepoint<=posofpoint){
        //we found a double-point declaration:
        let alias = line.substring(0,posofdoublepoint);
        //return that we have found a double-point-alias
        return {multilinedeclaration:true, alias:alias};
      }
      var content;
      if(posofpoint==-1){
        posofpoint=line.length;
        content="";
      }else{
        content= line.substring(posofpoint+1);
      }
      let meta=line.substring(0,posofpoint);
      var result = {sourcecode:line};
      if(meta.indexOf('note ')==0){
          result.type='note';
          meta = meta.substring('note '.length);
          if(meta.indexOf('left of ')==0){
              result.notetype='left';
              meta = meta.substring('left of '.length);
              result.actor=meta;
          }else if(meta.indexOf('right of ')==0){
              result.notetype='right';
              meta = meta.substring('right of '.length);
              result.actor=meta;
          }else if(meta.indexOf('over ')==0){
              result.notetype='over';
              meta = meta.substring('over '.length);
              let commapos=meta.indexOf(',');
              if(commapos>-1){
                  result.multiactor=true;
                  result.act1=meta.substring(0,commapos);
                  result.act2=meta.substring(commapos+1);
                  result.actors=[result.act1,result.act2];
              }else{
                result.multiactor=false;
                result.actor=meta;
              }
          }else{
           return false; //syntax for note is wrong
          }
          result.content=content;
          return result;
      }else{
          result.type='arrow';
          let actions = nodetheme.syntax.arrows;
          if(nodetheme.mdcode)actions = nodetheme.syntax.mdarrows;
          var action; var arrowtype;
          for(var x=0;x<actions.length;x++){
            if(meta.indexOf(actions[x])!=-1){
              action=actions[x];
              arrowtype=nodetheme.syntax.arrowtypes[x];
              break;
            }
          }

          if(!action){
            //no action means we have a definition of new alias/actor:
            //check if there is allready an actor by this alias
            let actorpos = this.actors.indexOf(meta);
            //if not put it to end of actors:
            if(actorpos==-1)actorpos=this.actors.length;
            this.actors[actorpos]=content;
            if(content==""){
              this.actors[actorpos]=meta;
            }
            this.aliases[actorpos]=meta;
            return false; //nothing to do later on with this line
          }
          result.arrowtype=arrowtype;
          result.msg=content;
          let actors = meta.split(action);
          //clean actors:
          let actfrom=actors[0];
          if(actfrom.charAt(0)==" ")actfrom=actfrom.substring(1);
          if(actfrom.charAt(actfrom.length-1)==" ")actfrom=actfrom.substring(0,actfrom.length-1);
          let actto=actors[1];
          if(actto.charAt(0)==" ")actto=actto.substring(1);
          if(actto.charAt(actto.length-1)==" ")actto=actto.substring(0,actto.length-1);
          result.actfrom = actfrom;
          result.actto = actto;
          result.actors = [actfrom,actto];
          return result;
      }
  },
  parse: function(nodeobj){
    let lines = [];
    let metalines = [];
    this.actors = [];
    this.aliases = [];
    let metadata=false;
    let source = nodeobj.raw;
    if(nodetheme.mdcode){
      source=nodeobj.renderedLines;
      //get rid of empty span
      for (var x=0;x<source.length;x++){
          if(source[x].substring(0,'<span '.length)=='<span '){
            source[x] = source[x].substring(source[x].indexOf('>')+1, source[x].lastIndexOf('</span>'));
          }
      }
    }
    for(var x=nodeobj.raw.length-1;x>=0;x--){
      if(nodeobj.raw[x]=="---"){
        metadata=true; continue;
      }
      if(metadata)metalines.unshift(source[x]);
      else lines.unshift(source[x]);
    }
    //parse metadata:
    this.options = this.parseMetadata(metalines);
    //parse lines:
    let parsedlines = [];
    let skiplines = [];
    for(var x=0;x<lines.length;x++){
      if(skiplines.indexOf(x)>-1){
        parsedlines[x]=false;
        continue;
      }
      parsedlines[x]=this.parseLine(lines[x]);
      if(parsedlines[x]==false)continue;
      if(parsedlines[x].multilinedeclaration){
        let alias = parsedlines[x].alias;
        let multicontent = "";
        for(var ml=x+1;ml<lines.length;ml++){
          skiplines.push(ml);
          if(lines[ml]=="::"+alias){
            break;
          }
          if(ml>x+1)multicontent+="<br>";
          multicontent+=lines[ml];
        }
        let actorpos = this.actors.indexOf(alias);
        if(actorpos==-1)actorpos=this.actors.length;
        this.actors[actorpos]=multicontent;
        this.aliases[actorpos]=alias;
        parsedlines[x]=false;
      }
      if(parsedlines[x].actors)this.pushActor(parsedlines[x].actors);
      else if(parsedlines[x].actor)this.pushActor(parsedlines[x].actor);
    }
    //forming to html:
    for(var x=0;x<parsedlines.length;x++){
      if(parsedlines[x]){
        let text=parsedlines[x].msg;
        if(text===undefined)text=parsedlines[x].content;
        parsedlines[x].html = this.formHTML(text);
      }
    }
    var actorhtml = [];
    for(var x=0;x<this.actors.length;x++){
      actorhtml[x]=this.formHTML(this.actors[x]);
    }

    let parseobj = {
      actors:this.actors,
      aliases:this.aliases,
      actorhtml:actorhtml,
      options:this.options,
      parsedlines:parsedlines,
      mdcode:nodetheme.mdcode
    }
    console.log('parsed nodeobject:',parseobj, nodeobj);
    return parseobj;
  },
  formHTML:function(text){
    let result = document.createElement('div');
    let returntext = text;
    let wrapperlist = nodetheme.syntax.wrapperlist;
    if(nodetheme.mdcode)wrapperlist=nodetheme.syntax.mdwrapperlist;
    let wtitle = nodetheme.syntax.wrappertitle;
    var wn=null;
    for(var x=0;x<wrapperlist.length;x++){
    let wrapper=wrapperlist[x];
    if(text.substring(0,wrapper[0].length)==wrapper[0] &&
      text.substring(text.length-wrapper[1].length)==wrapper[1]){
        wn=x;
        returntext = text.substring(wrapper[0].length,text.length-wrapper[1].length);
        result.classList.add(wtitle[x]);
        let wdiv = document.createElement('div');
        if(nodetheme.mdcode)wdiv.innerHTML=returntext;
        else wdiv.innerText = returntext;
        result.appendChild(wdiv);
        break;
      }
    }
    if(wn==null){
      if(nodetheme.mdcode)result.innerHTML=returntext;
      else result.innerText = returntext;
    }
    return result;
  },
  pushActor: function(actor){
    let actors = actor;
    if(typeof actor == "string")actors=[actor];
    for(var x=0;x<actors.length;x++){
      let act=actors[x];
      if(this.actors.indexOf(act)==-1 &&
        this.aliases.indexOf(act)==-1){
        this.actors.push(act);
      };
    }
  },
  parseMetadata:function(metalines){
    /*metadata can be
    alias:nodecontent
    alias=nodecontent
    alias->variable:value
    alias::\n
    nodecontent
    ::alias
    */
    var separators = ['->','=','::',':'];
    if(nodetheme.mdcode)separators=['-&gt;','=','::',':'];
    for(var x=0;x<metalines.length;x++){
      var line = metalines[x];
      let separator;
      let seppos=line.length;
      for(var s=0;s<separators.length;s++){
        let pos=line.indexOf(separators[s]);
        if(pos>-1&&pos<seppos){
          separator=separators[s];
          seppos=pos;
        }
      }
      if(separator=='='||separator==':'){
        let alias=line.substring(0,seppos);
        let actor = line.substring(seppos+separator.length);
        let actorIndex = this.actors.indexOf(actor);
        if(actorIndex==-1){
          actorIndex=this.actors.length;
          this.actors.push(actor);
        }
        this.aliases[actorIndex]=alias;
      }
      if(separator=='::' && seppos>0){
        let alias = line.substring(0,seppos);
        let endline;
        let content="";
        for(var el=x+1;el<metalines.length;el++){
          content+=metalines[el]+"\n";
          if(metalines[el].substring(0,alias.length+2)=='::'+alias){
            endline=el;break;
          }
          metalines[el]='';
        }
        this.actors.push(content);
        this.aliases[this.actors.length-1]=alias;
      }
    }
    return {hasMetadata:true};
  },//end of parseMetadata
  //sequence-diagram:
  sequence:{
    build: function(parseobj){
      this.actors = parseobj.actors || [];
      this.aliases = parseobj.aliases || [];
      this.actorhtml = parseobj.actorhtml || [];
      this.mdcode = parseobj.mdcode;
      let lines = parseobj.parsedlines;
      result = document.createElement('div');

      //create lines:
      for(var x=0;x<lines.length;x++){
        if(lines[x]==false)continue;
        let newline = this.buildLine(lines[x]);
        if(newline==false)continue;
        newline.style.gridRow = x+2; //start in second grid row
        result.appendChild(newline);
      }
      for(var x=0;x<this.actors.length;x++){
        let acttop = this.buildActor(this.actors.length-(1+x),true);
        let actbottom = this.buildActor(x,false);
        result.insertBefore(acttop,result.firstChild);
        result.appendChild(actbottom);
        //add a line for each actor:
        let stroke = document.createElement('div');
        stroke.className = 'stroke';
        let strcol=(this.actors.length-(x+1))*4+3;
        stroke.style.gridColumn=strcol+"/"+strcol;
        result.insertBefore(stroke,acttop);
      }
      result.style.gridTemplateColumns='repeat('+this.actors.length+', 1fr 1fr 1fr 1fr)';
      result.style.gridTemplateRows='repeat('+(lines.length+2)+',auto)';
      return result;

    },
    buildActor: function(actorsnr, top){
      let actor=this.actors[actorsnr];
      //let div = document.createElement('div');
      let div = document.createElement('div');
      div.appendChild(this.actorhtml[actorsnr].cloneNode(true));
      div.className = this.actorhtml[actorsnr].className;
      div.classList.add('actor');

      div.firstChild.classList.add('node');
      if(top){
        div.classList.add('top');
        div.style.gridRow="1/1";
      }else {
        div.classList.add('bottom');
        div.style.gridRow="-1/-1";
      }
      div.style.gridColumnStart = (actorsnr*4)+2;
      div.style.gridColumnEnd=(actorsnr*4)+4;
      //if(this.mdcode)div.innerHTML = actor;
      //  else div.innerText=actor;
      //div.appendChild(this.actorhtml[actorsnr])
      return div;
    },
    buildLine: function(parsedline){
      /*
      parsedline is object with:
      type: note
      notetype:left/right/over
      actor: actors-html/actors-text/actors alias
      multiactor: true on over multiple accounts
      act1, act2, actors
      */

      let result = document.createElement('div');
      if(parsedline.type=='note'){
        result = parsedline.html;
        result.classList.add('note');
        result.classList.add(parsedline.notetype);
        //if(this.mdcode)result.innerHTML = parsedline.content;
        //  else result.innerText = parsedline.content;
        //result.appendChild(parsedline.html);
        if(parsedline.notetype=='left'){
          result.style.gridColumnStart = this.getGridPosOfActor(parsedline.actor)-1;
          result.style.gridColumnEnd = this.getGridPosOfActor(parsedline.actor)+1;
        }else if(parsedline.notetype=='right'){
          result.style.gridColumnStart = this.getGridPosOfActor(parsedline.actor)+1;
          result.style.gridColumnEnd = this.getGridPosOfActor(parsedline.actor)+3;
        }else if(parsedline.notetype=='over' && parsedline.multiactor){
          result.style.gridColumnStart = this.getGridPosOfActor(parsedline.act1);
          result.style.gridColumnEnd = this.getGridPosOfActor(parsedline.act2)+2;
        }else if(parsedline.notetype=='over'){
          result.style.gridColumnStart = this.getGridPosOfActor(parsedline.actor);
          result.style.gridColumnEnd = this.getGridPosOfActor(parsedline.actor)+2;
        }
      }else if(parsedline.type=='arrow'){
        result.classList.add('arrow');
        result.classList.add(parsedline.arrowtype);
        let msg = parsedline.html;//document.createElement('div');
        //if(this.mdcode)msg.innerHTML = parsedline.msg;
        //else msg.innerText = parsedline.msg;
        //msg.appendChild(parsedline.html);
        let arrow = document.createElement('div');//new Image();
        arrow.className='arrowimg';
        result.appendChild(msg);
        result.appendChild(arrow);
        let gridFrom = this.getGridPosOfActor(parsedline.actfrom)+1;
        let gridTo = this.getGridPosOfActor(parsedline.actto)+1;
        if(gridFrom<gridTo){
            //left to right
            result.style.gridColumnStart = gridFrom;
            result.style.gridColumnEnd = gridTo;
            result.classList.add('toright');
        }else{
            //right to left
            result.style.gridColumnStart = gridTo;
            result.style.gridColumnEnd = gridFrom;
            result.classList.add('toleft');
        }
        return result;

      }else{
        return false;
      }
      return result;
    },
    getGridPosOfActor: function(actor){
        if(actor==undefined || actor.length<1)return false;
        let pos = this.aliases.indexOf(actor);
        if(pos==-1)pos = this.actors.indexOf(actor);
        if(pos==-1){
            //new actor found:
            this.actors.push(actor);
            pos=this.actors.length-1;
        }
        let gridpos = pos*4+2;
        return gridpos;
    },
    insertMenu: function(){

    },

  },
  //tree-diagram:
  tree:{
    build: function(parseobj){
      this.actors = [];
      for(var x=0;x<parseobj.actors.length;x++){
        this.actors.push({
          html:parseobj.actorhtml[x],
          actor:parseobj.actors[x],
          alias:parseobj.aliases[x],
          used:false,
          children:[],
          parent:null,
          weight:0,
          gridStart:1,
          arrows:[],
        });
      }
      for(var x=0;x<parseobj.parsedlines.length;x++){
        if(parseobj.parsedlines[x]==false)continue;
        let pline = parseobj.parsedlines[x];
        if(pline.type=="arrow"){
          let parent = parseobj.actors.indexOf(pline.actfrom);
          if(parent==-1)parent = parseobj.aliases.indexOf(pline.actfrom);
          let child = parseobj.actors.indexOf(pline.actto);
          if(child==-1)child = parseobj.aliases.indexOf(pline.actto);
          if(this.actors[child].parent!=null){
            //we should not reuse nodes so do nothing
            console.log('syntax error in line '+x+": in trees a node can only have one parent", pline.sourcecode);
            continue;
          }
          if(this.hasParentInTree(this.actors[parent],this.actors[child])){
            //building a circle - so only add up arrow to child
            if(this.actors[child].children.indexOf(this.actors[parent])==-1){
              //invalid connection -
              //in tree its impossible to show arrows up for more then one level
              console.log('syntax error in line '+x+': in trees you cant write arrows over more then one line',pline.sourcecode);
            continue;
            }else{
              //parent of is in next line above so push arrows
              pline.direction='up';
              this.actors[parent].arrows.push(pline);
            }
          }else{
            pline.direction="down";
            //no circle so add childs to parent and vice versa:
            this.actors[parent].children.push(this.actors[child]);
            this.actors[child].parent=this.actors[parent];
            this.actors[child].arrows.push(pline);
          }

        }
      }
      var treelines = [];
      treelines[0]=[];
      for(var x=0;x<this.actors.length;x++){
        if(this.actors[x].parent==null)treelines[0].push(this.actors[x]);
      }
      var lnr = 0;
      var maxnodesperline=1;
      while(treelines[lnr] &&
                treelines[lnr].length>0 &&
                lnr<this.actors.length){
        let line = treelines[lnr];
        if(line.length>maxnodesperline)maxnodesperline=line.length;
        lnr++;
        treelines[lnr]=[];
        for(var x=0;x<line.length;x++){
          let children = line[x].children;
          for(var y=0;y<children.length;y++){
            let child=children[y];
            if(child.used==false){
              child.used=true;
              treelines[lnr].push(child);
            }
          }
        }
      }
      //treelines contains now all lines of the tree in order
      //add levels to them:
      for(var x=0;x<treelines.length;x++){
        for(var y=0;y<treelines[x].length;y++){
          treelines[x][y].level = x;
        }
      }
      var leafs = [];
      for(var x=0;x<this.actors.length;x++){
        if(this.actors[x].children.length==0)leafs.push(this.actors[x]);
      }

      for(var x=0;x<leafs.length;x++){
        this.addWeight(leafs[x],1);
      }
      var totalweight = 0;
      for(var x=0;x<treelines[0].length;x++){
        if(x>0)this.increaseTreeGridPos(treelines[0][x],totalweight);
        totalweight+=treelines[0][x].weight;
      }
      console.log('total weight:' + totalweight, treelines);
      var result = document.createElement('div');
      result.classList.add('tree');
      for(var x=0;x<treelines.length;x++){
        var gridstartinline=1;
        if(treelines[x][0] && treelines[x][0].gridStart>1)gridstartinline=treelines[x][0].gridStart;
        for(var y=0;y<treelines[x].length;y++){
          let actor = treelines[x][y];
          let node = document.createElement('div');
          node.classList.add('node');
          node.style.gridColumnStart=gridstartinline;
          node.style.gridColumnEnd=gridstartinline+actor.weight;
          gridstartinline+=actor.weight;
          node.style.gridRow=(x+1)+"/"+(x+1);

          let arrows = document.createElement('div');
          arrows.classList.add('arrowspace');
          for(var ar=0;ar<actor.arrows.length;ar++){
            let arrow = document.createElement('div');
            let arrowimg = document.createElement('div');
            arrowimg.classList.add('arrowimg');
            arrow.classList.add(actor.arrows[ar].direction);
            arrowimg.classList.add(actor.arrows[ar].direction);
            arrow.appendChild(arrowimg);
            arrow.appendChild(actor.arrows[ar].html);
            arrows.appendChild(arrow);
          }
          node.appendChild(arrows);
          let nodecontent = document.createElement('div');
          nodecontent.classList.add('content');
          nodecontent.appendChild(actor.html);
          node.appendChild(nodecontent);

          result.appendChild(node);
        }
      }
      result.style.gridTemplateRows = 'repeat('+treelines.length+',auto)';
      result.style.gridTemplateColumns= 'repeat('+totalweight+', auto)';
      return result;
    },
    addWeight: function(node){
      node.weight+=1;//weight; its recursive - only add 1 and let the recursion do the rest
      if(node.parent!=null)this.addWeight(node.parent,node.weight);
    },
    increaseTreeGridPos:function(node,addedWeight){
      node.gridStart+=addedWeight;
      for(var x=0;x<node.children.length;x++){
        this.increaseTreeGridPos(node.children[x],addedWeight);
      }
    },
    hasChildInTree: function(parent, node){
      if(parent.children.indexOf(node)>-1)return true;
      if(parent.children.length==0 && parent != node)return false;
      let result = false;
      for(var x=0;x<parent.children.length;x++){
        result = result || this.hasChildInTree(parent.children[x],node);
      }
      return result;
    },
    hasParentInTree: function(nodeInTree,possibleParent){
      if(nodeInTree.parent==possibleParent)return true;
      if(nodeInTree.parent==null)return false;
      return this.hasParentInTree(nodeInTree.parent,possibleParent);
    },
    insertMenu: function(){

    },
  },
  //simple-flow from start to end node with arrows
  simpleflow:{
    build:function(parseobj){
      let lines = parseobj.parsedlines;
      let nodes = parseobj.actors;
      let aliases = parseobj.aliases;
      let options = parseobj.options;
      this.mdcode = parseobj.mdcode;
      var result = document.createElement('div');
      result.classList.add('simpleflow');
      let nodedivs = [];
      for(var x=0;x<nodes.length;x++){
        let node = parseobj.actorhtml[x];// document.createElement('div');
        node.classList.add('node');
        node.id = 'simpleflow-node-'+x;
        //if(this.mdcode)node.innerHTML=nodes[x];
        //else node.innerText=nodes[x];
        //node.appendChild(parseobj.actorhtml[x]);
        result.appendChild(node);
        nodedivs.push(node);
        //position node in grid:
        //TODO: horizontal and vertical, for now just horizontal:
        node.style.gridColumnStart = 2+(4*x);
        node.style.gridColumnEnd = 4+(4*x);
      }
      let simplearrowdivs = [];
      let multiarrows = [];
      //add arrows and notes to nodes:
      for(var x=0;x<lines.length;x++){
        if(lines[x]==false)continue;
        if(lines[x].type==="arrow"){
          let indexfrom = nodes.indexOf(lines[x].actfrom);
          if(indexfrom==-1)indexfrom=aliases.indexOf(lines[x].actfrom);
          let indexto = nodes.indexOf(lines[x].actto);
          if(indexto==-1)indexto=aliases.indexOf(lines[x].actto);
          if(indexfrom<0||indexto<0)continue;
          let arrow = document.createElement('div');
          arrow.classList.add('arrow');
          arrow.classList.add(lines[x].arrowtype);
          let msg = lines[x].html;//document.createElement('div');
          //if(this.mdcode)msg.innerHTML = lines[x].msg;
          //else msg.innerText=lines[x].msg;
          //msg.appendChild(lines[x].html);
          msg.className='msg';
          let arrimg = document.createElement('div');
          arrimg.classList.add('arrowimg');
          let arrimgsquare = document.createElement('div');
          arrimgsquare.classList.add('triangle');
          arrimg.appendChild(arrimgsquare);
          arrow.appendChild(msg);
          arrow.appendChild(arrimg);
          //position arrow in grid
          let start = (indexfrom*4)+4;
          let end = (indexto*4)+2;
          let target = indexto;
          if(indexto<indexfrom){
            start=(indexto*4)+4;
            end=(indexfrom*4)+2;
            target=indexfrom;
            arrow.classList.add('toleft');
          }
          let arrowpos;
          //is it multi-arrow?
          let multiarrow = (indexfrom-indexto!=1&&indexfrom-indexto!=-1);
          if(!multiarrow){
            if(!simplearrowdivs[start]){
              simplearrowdivs[start]=document.createElement('div');
              simplearrowdivs[start].classList.add('arrowspace');
              simplearrowdivs[start].style.gridColumn = start+"/"+end;
              result.insertBefore(simplearrowdivs[start],nodedivs[target]);
            }
            simplearrowdivs[start].appendChild(arrow);

             //arrowpos = simplearrowdivs[start];
          }else{
            start--; //multiarrows go till middle of nodes
            end++;
            let max=1; //grid starts at 1, not 0
            for(var me=start;me<=end;me++){
              if(multiarrows[me]>max)max=multiarrows[me];
            }
            max++; //we have to start in next line;
            for(var me=start;me<=end;me++)multiarrows[me]=max;
            arrow.style.gridColumnStart=start;
            arrow.style.gridColumnEnd = end;
            arrow.style.gridRow = '-'+max+'/-'+(max+1);
            arrow.classList.add('multi');
            result.insertBefore(arrow,nodedivs[target]);
          }
          //TODO: add vertical option
        }
        if(lines[x].type==="note"){
          let note = lines[x].html;//document.createElement('div');
          note.classList.add('note');
          note.classList.add(lines[x].notetype);
          let gc;
          let index = aliases.indexOf(lines[x].actor);
          if(index==-1)index=nodes.indexOf(lines[x].actor);
          if(lines[x].notetype=='left'){
            gc=(index*4+1)+'/'+(index*4+2);
          }else if(lines[x].notetype=='right'){
            gc=(index*4+4)+'/'+(index*4+5);
          }else if(lines[x].notetype=='over' && lines[x].actor){
            gc=(index*4+2)+'/'+(index*4+4);
          }else if(lines[x].notetype=='over'){
            let i1=aliases.indexOf(lines[x].act1);
            if(i1==-1)i1=nodes.indexOf(lines[x].act1);
            let i2=aliases.indexOf(lines[x].act2);
            if(i1==-1)i2=nodes.indexOf(lines[x].act2);
            if(i1<i2){
              gc=(i1*4+2)+'/'+(i2*4+3);
              index=i1;
            }else{
              gc=(i2*4+2)+'/'+(i1*4+3);
              index=i2;
            }
          }
          note.style.gridColumn = gc;
          note.style.gridRow = "1/1";
          //if(this.mdcode)note.innerHTML = lines[x].content;
          //else note.innerText = lines[x].content;
          //note.appendChild(lines[x].html);
          if(index<nodes.length-1)result.insertBefore(note, nodedivs[index+1]);
          else result.appendChild(note);
        }
      }
      //build grid-template:
      let maxmarrows=0;
      for(var x=0;x<multiarrows.length;x++)if(multiarrows[x]>maxmarrows)maxmarrows=multiarrows[x];
      let gridrows = 2+maxmarrows;
      let gridcols = nodes.length;
      result.style.gridTemplateColumns='repeat('+gridcols+',1fr 1fr 1fr 1fr)';
      result.style.gridTemplateRows = 'auto repeat('+gridrows+',auto)';

      return result;
    },
    insertMenu: function(){

    },
  },
  //other diagrams/nodetypes
  //flow:
  flow: {
    initObjects: function(parseobject){
      this.nodes = [];
      this.parseobject = parseobject;
      this.circuits = [];
      this.caminos = []; //not needed anymore
      this.pathBlocks = []; //holds path-arrays per starting-node
      for (var x=0;x<parseobject.actors.length;x++){
        this.nodes.push({
          actor:parseobject.actors[x],
          nr:x,
          childarrows:[],
          rawchildren:[],
          children:[],
          hasParents:false,
          touched:false,
        });
      }
      for (var x=0;x<parseobject.parsedlines.length;x++){
        let pl = parseobject.parsedlines[x];
        if(pl==false)continue;
        if(pl.type=="arrow"){
          let from = parseobject.aliases.indexOf(pl.actfrom);
          if(from==-1)from=parseobject.actors.indexOf(pl.actfrom);
          let target = parseobject.aliases.indexOf(pl.actto);
          if(target==-1)target=parseobject.actors.indexOf(pl.actto);
          if(from==-1 || target==-1)continue; //something wrong
          if(target==0)continue; //first node is always start and has no parent
          this.nodes[from].childarrows.push(pl);
          this.nodes[from].rawchildren.push(this.nodes[target]);
          if(this.nodes[target].hasParents)this.nodes[target].hasMultipleParents=true;
          this.nodes[target].hasParents=true;
        }
      }
    },
    buildPaths: function(){
      //find root-elements
      var roots = [];
      for (var x=0;x<this.nodes.length;x++){
        if(this.nodes[x].hasParents===false)roots.push(this.nodes[x]);
      }
      //root-elements are now stored in roots
      //build ways:
      for(var rootx=0;rootx<roots.length;rootx++){
        let root = roots[rootx];
        var validchilds = [];
        var paths = [];
        for (var x=0;x<root.rawchildren.length;x++){
          let child = root.rawchildren[x];
          let camino = this.buildPath(child, [root]);
          for(var cam=0;cam<camino.caminos.length;cam++){
            paths.push(camino.caminos[cam]);
          }
          for(var cir=0;cir<camino.circuits.length;cir++){
            this.circuits.push(camino.circuits[cir]);
          }
        }
        paths = this.sortPaths(paths)
        this.caminos = this.caminos.concat(paths);
        this.pathBlocks.push(paths);
        root.children = root.rawchildren;
      }
    },
    sortPaths: function(paths){
      if(paths.length<=2)return paths; //nothing to sort...
      let result = []; //array with paths inside
      let pathobjects = []; //array with temporary pathobjects to facilitate sorting
      for (var x=1;x<paths.length;x++){ //first element is root, so dont put it into sorting
        pathobjects.push({
          path:paths[x],
          rejoinedRootAt:-1, //we use that to sort later
          exitRootPathAt:-1, //we use that to sort later
        });
      }
      let root = paths[0]; //always compare against root - root never changes position
      for (var x=0;x<pathobjects.length;x++){
        let hasLeft = false;
        let actpath = pathobjects[x].path;
        for(var i=0;i<actpath.length;i++){
          if(!hasLeft){
            if(root.indexOf(actpath[i])==-1){
              hasLeft=true;
              pathobjects[x].exitRootPathAt=i-1;
            }
          }else{
            if(root.indexOf(actpath[i])>-1){
              pathobjects[x].rejoinedRootAt=root.indexOf(actpath[i]);
              break;
            }
          }
        }
      }
      console.log('flow pathobjects',pathobjects);
      //pathobjects contains now paths with rejoinedRootAt-values. sort it by that:
      pathobjects.sort(function(a,b){
        if(a.exitRootPathAt<b.exitRootPathAt)return 1;
        if(a.exitRootPathAt>b.exitRootPathAt)return -1;
        if(a.rejoinedRootAt==-1 && b.rejoinedRootAt!=-1)return 1;
        if(a.rejoinedRootAt<b.rejoinedRootAt)return -1;
        if(a.rejoinedRootAt>b.rejoinedRootAt)return 1;
        return 0;
      });
      //put together resulting array including root:
      result.push(root);
      for (var x=0;x<pathobjects.length;x++){
        result.push(pathobjects[x].path);
      }
      return result;
    },
    sortChildren: function(){
      for(var pb=0;pb<this.pathBlocks.length;pb++){
        let paths = this.pathBlocks[pb];
        for (var pathx=0;pathx<paths.length;pathx++){
          let path = paths[pathx];
          for (var x=0;x<path.length;x++){
            if(path[x].childPath==undefined){
              path[x].childPath = pathx + pb*100;
            }
          }
        }
      }
      for (var x=0;x<this.nodes.length;x++){
        let node = this.nodes[x];
        if(node.children.length>1){
          node.children.sort(function(a,b){
            if(a.childPath==undefined && b.childPath!=undefined)return 1;
            if(b.childPath==undefined)return 0;
            return a.childPath - b.childPath;
          });
        }
      }
    },
    buildPath: function(node, pathToHere){
      if(pathToHere.indexOf(node)>-1){
        //circuit found
        return {
          caminos:[],
          circuits:{path:pathToHere,conflictNode:node}
        };
      }
      var validchilds = [];
      var circuits = [];
      var paths = [];
      var pathWithThis = [];
      for (var x=0;x<pathToHere.length;x++)pathWithThis[x]=pathToHere[x];
      pathWithThis.push(node);

      if(node.rawchildren.length==0){
        return {
          caminos:[pathWithThis],
          circuits:circuits
        }
      }
      for (var x=0;x<node.rawchildren.length;x++){
        let child = node.rawchildren[x];
        let camino = this.buildPath(child,pathWithThis);
        for(let cam=0;cam<camino.caminos.length;cam++){
          paths.push(camino.caminos[cam]);
        }
        for(let circ=0;circ<camino.circuits.length;circ++){
          circuits.push(camino.circuits[circ]);
        }
        if(camino.caminos.length>0)validchilds.push(child);
      }
      for (var x=0;x<validchilds.length;x++){
        node.children[x]=validchilds[x];
      }
      return {
        caminos:paths,
        circuits:circuits
      }
    },
    buildPositionsOfNodes: function(){
      var startx = 1;
      if(this.pathBlocks[0]==undefined){
        for (var x=0;x<this.nodes.length;x++){
          this.nodes[x].posx=x;
          this.nodes[x].posx=1;
        }
        return;
      }
      for(var pb=0;pb<this.pathBlocks.length;pb++){
        var paths = this.pathBlocks[pb];
        if(paths.length==0)continue;
        var maxx=1;
        if(paths[0][0].touched==false){
          paths[0][0].touched=true;
          paths[0][0].posx=startx;
          paths[0][0].posy=1;
        }
        for(var y=0;y<paths.length;y++){
          var path = paths[y];
          for (var x=1;x<path.length;x++){
            let parent = path[x-1];
            let node = path[x];
            let posinparent = parent.children.indexOf(node);
            let newposx;
            let newposy;
            if(posinparent==0){
              //go one position deeper
              newposx=parent.posx;
              newposy=parent.posy+1;
            }else if(posinparent==parent.children.length-1 && !parent.hasMultipleParents){
              //go one or more positions to the right
              newposx=parent.posx+parent.children.length-1;
              newposy=parent.posy;
              if(newposx<=maxx)newposx=maxx+1;
            }else{
              //go one or more positions to the right
              //and one deeper:
              newposy=parent.posy+1;
              newposx=parent.posx+posinparent;
              if(newposx<=maxx)newposx=maxx+1;
            }
            if(node.touched){
              if(newposy>node.posy){
                node.posy=newposy;
              }
            }else{
              if(newposx>maxx)maxx=newposx;
              node.posx=newposx;
              node.posy=newposy;
              node.touched=true;
            }
          }//end of path-loop
        }//end of paths-loop
        startx+=maxx;
      }//end of block-loop
      this.translateNodesToGrid();
    },
    translateNodesToGrid: function(){
      for (var x=0;x<this.nodes.length;x++){
        let node = this.nodes[x];
        if(node.posx){
          node.gridColumnStart=(node.posx-1)*3 + 1;
          node.gridColumnEnd = node.gridColumnStart+2;
        }
        if(node.posy){
          node.gridRowStart=(node.posy-1)*3 + 1;//node.posy;
          node.gridRowEnd = node.gridRowStart+2;
        }
      }
    },
    buildArrows:function(){
      let arrows = [];
      for (var x=0;x<this.parseobject.parsedlines.length;x++){
        let line = this.parseobject.parsedlines[x];
        if(line.type=="arrow"){
          let from = this.parseobject.aliases.indexOf(line.actfrom);
          if(from==-1)from=this.parseobject.actors.indexOf(line.actfrom);
          let target = this.parseobject.aliases.indexOf(line.actto);
          if(target==-1)target=this.parseobject.actors.indexOf(line.actto);
          let parent = this.nodes[from];
          let child = this.nodes[target];
          let direction = "";
          if(parent.posx<child.posx)direction+="right";
          if(parent.posy<child.posy)direction+="down";
          if(parent.posx>child.posx)direction+="left";
          if(parent.posy>child.posy)direction+="up";
          if(parent.posy<child.posy && parent.children[0]!=child)direction+="multi";
          let startx; let starty; let endx; let endy;
          if(direction==="right"){
            startx = parent.gridColumnEnd;
            endx = child.gridColumnStart;
            starty = parent.gridRowStart;
            endy = starty+1;
          }else if(direction==="rightdown" || direction==="rightdownmulti"){
            startx = parent.gridColumnEnd;
            endx = child.gridColumnStart+1;
            starty = parent.gridRowStart+1;
            endy = starty+2;
          }else if(direction==="down"){
            startx = parent.gridColumnStart;
            endx = child.gridColumnStart+1;
            starty = parent.gridRowEnd;
            endy = child.gridRowStart;
          }else if(direction==="downleft"){
            startx = child.gridColumnEnd;
            endx = parent.gridColumnStart+1;
            starty = parent.gridRowEnd;
            endy = child.gridRowStart+1;
          }else if(direction==="downleftmulti"){
            startx = child.gridColumnEnd;
            endx = parent.gridColumnEnd+1;
            starty = parent.gridRowEnd-1;
            endy = child.gridRowStart+1;
          }else if(direction==="downmulti"){
            startx = child.gridColumnEnd;
            endx = parent.gridColumnEnd+1;
            starty = parent.gridRowEnd-1;
            endy = child.gridRowStart+1;
          }else if(direction==="left"){
            startx = child.gridColumnEnd;
            endx = parent.gridColumnStart;
            starty = parent.gridRowStart+1;
            endy = starty+1;
          }else if(direction==="up"){
            startx = parent.gridColumnStart+1;
            endx = child.gridColumnStart+2;
            starty = child.gridRowEnd;
            endy = parent.gridRowStart;
          }else if(direction==="rightup"){
            startx = parent.gridColumnEnd;
            endx = child.gridColumnStart+1;
            starty = child.gridRowEnd;
            endy = parent.gridRowStart+1;
          }
          arrows.push({
            from:parent,
            to:child,
            direction:direction,
            message:line.msg,
            arrowtype:line.arrowtype,
            gridColumnStart:startx,
            gridColumnEnd:endx,
            gridRowStart:starty,
            gridRowEnd:endy,
          })
        }
      }
      this.arrows=arrows;
    },
    buildHTML: function(){
      var container = document.createElement('div');
      container.classList.add('flow');
      //add nodes:
      let maxx=1;
      let maxy=1;
      for (var x=0;x<this.nodes.length;x++){
        let node = this.nodes[x];
        let nodediv = this.parseobject.actorhtml[node.nr];
        nodediv.classList.add('node');
        nodediv.style.gridColumn=node.gridColumnStart+"/"+node.gridColumnEnd;
        nodediv.style.gridRow=node.gridRowStart+"/"+node.gridRowEnd;
        if(node.posx>maxx)maxx=node.posx;
        if(node.posy>maxy)maxy=node.posy;
        container.appendChild(nodediv);
      }
      for (var x=0;x<this.arrows.length;x++){
        let arrow = this.arrows[x];
        let arrowdiv = document.createElement('div');
        arrowdiv.classList.add("arrow");
        arrowdiv.classList.add(arrow.arrowtype);
        arrowdiv.classList.add(arrow.direction);
        arrowdiv.style.gridColumn = arrow.gridColumnStart+"/"+arrow.gridColumnEnd;
        arrowdiv.style.gridRow = arrow.gridRowStart+"/"+arrow.gridRowEnd;
        let msg = document.createElement('div');
        msg.classList.add('msg');
        msg.innerHTML = arrow.message;
        arrowdiv.appendChild(msg);
        container.appendChild(arrowdiv);
      }
      //container.style.gridTemplateColumns = '1fr 1fr repeat('+(maxx-1)+',auto 1fr 1fr)';
      //container.style.gridTemplateRows = '1fr 1fr repeat('+(maxy-1)+',auto 1fr 1fr)';
      container.style.gridTemplateColumns = 'repeat('+maxx+',5ch 5ch 1fr)';
      container.style.gridTemplateRows = 'repeat('+maxy+',2em 2em 1fr)';

      container.style.display = 'grid';
      return container;
    },
    build: function(parseobject){
      this.initObjects(parseobject);
      this.buildPaths();
      this.sortChildren();
      this.buildPositionsOfNodes();
      this.buildArrows();
      console.log("caminos:",this.caminos);
      console.log(this);
      var result = this.buildHTML();

      return result;
    },
    insertMenu: function(){

    },
  },
  /*every new diagram/nodetype needs the folowing:
    build: a function which takes a parseobject (list with parsed lines)
          and returns the finished html inside a node
    insertMenu: a function which returns the html
        buttons for this nodetype in a ul

  */
};
slidenote.addTheme(nodetheme);

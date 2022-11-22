/*aui auch im editor nutzen:

wenn aui aktiviert wird (shift+enter?) wird ein neuer aui-tree aufgebaut vom momentanen slidenote-parser-zustand

beispiel:

content: 'slide 1', type:'container', firstline:0, lastline:1
    content:'#welcome', pretext:'title', line:0
    content:'to slidenotes', line:1
content: 'slide 2', type:'container', line:2, firstline:2, lastline:
    content: '##this is a test', pretext:'slide title', line:3
    content: 'paragraph', type:'container', line:4, firstline:4, lastline:7
        content:'blablub', line:4
        content:'...', line:5
    content:'list', type:'container', line:8, firstline:8, lastline:
        content: '- a', line:8
        content: '- b', line:9
        content: '- c', line:10
*/
// var aui = {};
// import {default as aui} from '/themes/aui.js';

aui.prefixes={
  h1:'main title',
  h2:'slide title',
  h3:'title',
  pagebreak:'new slide',
  separator:'separator metadata before:metadata after:content or data',
  metadata:'option line',
  codedata:'code line',
  chartdata:'chart data',
  dataline:'data line',
  header:'header',
  footnote:'footnote',
}
aui.parser={
  parentElementOfLine:[],
  'sublist€€€€€': function(a,b,c,d){return false;},
  list:function(line, sourcelines, taglist, parser){
    let result = this.containerBlock(line, sourcelines, taglist, parser, 'list')
    if(!result)return result;
    //verschachtelung:
    let newsubs = [];
    for(let i=0;i<result.subelements.length;i++){
      let act = result.subelements[i];
      if(parser.lineswithhtml[act.line]=='list')newsubs.push(act);
      else if(newsubs[newsubs.length-1]){
        if(!newsubs[newsubs.length-1].subelements){
          newsubs[newsubs.length-1].subelements=[];
        }
        newsubs[newsubs.length-1].subelements.push(act);
      }
    }
    result.subelements = newsubs;
    return result;
  },
  code:function(line, sourcelines, taglist, parser){
    let result = this.containerBlock(line, sourcelines, taglist, parser, 'code');
    if(!result)return result; //pass false or none if returned so
    let newsubs = [];
    let header = result.subelements[0];
    header.pretext=aui.prefixes.header;
    newsubs.push(header);
    for (let x=1;x<result.subelements.length-1;x++){ //we dont want first nor last line
      let newline = result.subelements[x];
      if(newline.content=='---'){
        newline.pretext=aui.prefixes.separator;
        for(let y=1;y<newsubs.length;y++)newsubs[y].pretext=aui.prefixes.metadata;

      }
      if(!newline.pretext)newline.pretext=aui.prefixes.codedata;
      newsubs.push(newline);
    }
    result.subelements=newsubs;
    result.datatype='code';
    return result;
  },
  getDataElement: function(line, parser){
    let alldatas=parser.dataobjects;
    for(let i=0;i<alldatas.length;i++){
        if(alldatas[i].startline==line)return alldatas[i]; //we only want to parse element once
    }
  },
/*endline: 154
head: "```chart:pie"
posinall: 3069
raw: (3) ["option a:10", "option b:20", "option c: 30"]
startline: 150
type: "chart"
__proto__: Object*/
  data: function(line, sourcelines, taglist, parser){
    let element = this.getDataElement(line,parser);
    if(!element)return false; //we are on a dataelement but not on first line so return false to ignore this line
    let node = {
        content:element.type,
        type:'editor',
        datatype:element.type,
        dataobject:element,
        firstline:element.startline,
        lastline:element.endline,
        subelements:[]};
    node.subelements.push({content:element.head, pretext:aui.prefixes.header, type:'editor', line:element.startline});
    //TODO: separating options-data areas
    let separatorfound=-1;
    for(let i=0;i<element.raw.length;i++){
        if(element.raw[i]==='---'){
          for (let x=0;x<node.subelements.length;x++){
            node.subelements[x].pretext = aui.prefixes.metadata;
          }
          separatorfound=node.subelements.length;
        }
        let lineobject = {content:element.raw[i], type:'editor', line:element.startline+i+1}
        if(separatorfound==node.subelements.length)lineobject.pretext=aui.prefixes.separator;
        else if(separatorfound>-1)lineobject.pretext=aui.prefixes.dataline;
        node.subelements.push(lineobject);

    }
    return node;
  },
  node: function(line, sourcelines, taglist, parser){
    //just lazy to find reason why node is not a data...
    return this.data(line, sourcelines, taglist, parser);
  },
  layout: function(line, sourcelines, taglist, parser){
    //layout has first and last line only in lineswithhtml, inbetween is content-tags
    let elem = this.getDataElement(line, parser);
    if(elem && elem.startline==line){
      let lay = {
        layout:true, //we use that to tell caller that he has to put following into container
        content: 'layout block',
        type: 'editor',
        subelements:[],
        firstline: elem.startline,
        lastline: elem.endline
      }
      let addon = elem.head.substring(3);
      if(addon.indexOf(':')>-1)addon=addon.substring(addon.indexOf(':')+1);
      if(addon.length>0)lay.content+=' '+addon;
      lay.subelements.push({content:elem.head, type:'editor', pretext:aui.prefixes.header, line:elem.startline})
      return lay;
    }else return false;
  },
  containerBlock: function(line, sourcelines, taglist, parser, tag){
    let allElementsInLine = parser.map.insertedhtmlinline[line];
    let liststart=null;
    for(let i=0;i<allElementsInLine.length;i++){
      if(allElementsInLine[i].tag==tag+'start'){
        liststart=allElementsInLine[i];
        break;
      }
    }
    if(!liststart)return false;
    //found a list-object, so form aui-list-object from it:
    let listobject = {
      content:tag+' block',
      type:'editor',
      firstline:liststart.line,
      lastline:liststart.lastline || liststart.endline,
      subelements:[],
    }
    for(let l=listobject.firstline;l<=listobject.lastline;l++){
      listobject.subelements.push({
        content: sourcelines[l],
        line:l,
        type:'editor',
      });
    }
    return listobject;
  },
  continuosBlock:function(line, sourcelines, taglist, parser, tag){
    if(taglist[line-1]==tag)return false; //only do on first line of block
    let lastline = line;
    while(lastline<taglist.length-1 && taglist[lastline+1]==tag)lastline++;
    if(lastline==line){
      let obj={content:sourcelines[line], pretext:tag, line:line};
      this.parentElementOfLine[line]=obj;
      return obj;
    }
    let obj={
      content:tag+' block',
      type:'editor',
      firstline:line,
      lastline:lastline,
      subelements:[],
    }
    for(let i=line;i<=lastline;i++){
      let sube={content:sourcelines[i], pretext:tag+' line '+(i-line+1), type:'editor', line:i}
      obj.subelements.push(sube);
      this.parentElementOfLine[i]=sube;
    }
    return obj;
  },
  quote:function(line,sourcelines,taglist,parser){
    return this.continuosBlock(line,sourcelines,taglist,parser,'quote');
  },
  paragraph:function(line,sourcelines,taglist,parser){
    let p =  this.continuosBlock(line,sourcelines,taglist,parser,'paragraph');
    if(p)p.checkStickyTitle=true;
    return p;
  },
  backgroundimage:function(line,sourcelines,taglist,parser){
    let image=parser.map.insertedhtmlinline[line][0];
    if(!image)return; //no valid backgroundimage, tread as normal line
    return {pretext:'backgroundimage',type:'editor', content:image.alt+', image gallery tag '+image.src, line:line};
  },
  h1:function(line,sourcelines,taglist,parser){
    return {pretext:aui.prefixes.h1, type:'editor',content:sourcelines[line],line:line}
  },
  h2:function(line,sourcelines,taglist,parser){
    return {pretext:aui.prefixes.h2, type:'editor',content:sourcelines[line],line:line}
  },
  h3:function(line,sourcelines,taglist,parser){
    return {pretext:aui.prefixes.h3, type:'editor',content:sourcelines[line],line:line}
  },
  footnote:function(line, sourcelines, taglist, parser){
    let fn = this.continuosBlock(line,sourcelines,taglist,parser,'footnote');
    if(!fn)return false;
    if(!fn.subelements)return fn;
    for(let i=0;i<fn.subelements.length;i++)fn.subelements[i].pretext=aui.prefixes.footnote;
    fn.content = 'footnotes';
    return fn;
    // return {pretext:aui.prefixes.footnote, type:'editor',content:sourcelines[line],line:line}
  },
  hidden:function(line,sourcelines,taglist,parser){
    let elem = this.getDataElement(line, parser);
    if(elem && elem.startline==line){
      let hidden = {
        layout:true, //we use that to tell caller that he has to put following into container
        content: 'hidden content',
        type: 'editor',
        subelements:[],
        firstline: elem.startline,
        lastline: elem.endline,
        role:'hidden',
        datatype:'hidden',
        ppagenr:parser.map.pageAtPosition(elem.posinall),
      }
      // let addon = elem.head.substring(3);
      // if(addon.indexOf(':')>-1)addon=addon.substring(addon.indexOf(':')+1);
      // if(addon.length>0)lay.content+=' '+addon;
      // lay.subelements.push({content:elem.head, type:'editor', pretext:aui.prefixes.header, line:elem.startline})
      return hidden;
    }else return false;
  },
}

aui.parseInlineElements = function(line, parser){
    builder={
        link: function(e){
            let c={content:'link',type:'editor', cursorpos:e.posinall,
            subelements:[
            {content:e.linktext.substring(1),pretext:'text', type:'editor', cursorpos:e.posinall+1},
            {content:e.linkurl, pretext:'url',type:'editor',posinall:e.posinall+1+e.linktext.length+2}
            ]};
            return c;
        },
        image: function(e){
            let c={content:'image',type:'editor', cursorpos:e.posinall,
            subelements:[
                {content:e.alt, type:'editor', pretext:'description', cursorpos:e.posinall+2},
                {content:e.src, type:'editor', pretext:'image name', cursorpos:e.posinall+2+e.alt.length+2},
            ]};
            return c;
        },
        footnote: function(e){
          let fn= {content:parser.sourcecode.substring(e.posinall+2,e.brotherelement.posinall),
             pretext:'footnote anchor', cursorpos: e.posinall, type:'editor'};
          return fn;
        },
        simpleelement: function(e){
            let pre={'*':'italic',
                     '**':'bold',
                     '_':'italic',
                     '__':'bold',
                    '~':'mark',
                    '~~':'stroke',}
            let res = pre[e.mdcode];
            res+=' '+e.typ;
            return {content:res,type:'editor',cursorpos:e.posinall, inner:parser.sourcecode.substring(e.posinall+e.mdcode.length, e.brotherelement.posinall)};
        },
    }
    let elements = parser.map.insertedhtmlinline[line].sort(function(a,b){return a.posinall-b.posinall});
    let nodes = [];
    for(let x=0;x<elements.length;x++){
        let e = elements[x];
        if(!e)continue;

        if(e.tag=='linkstart')nodes.push(builder.link(e));
        if(e.tag=="footnote-anchor" && e.typ =="start")nodes.push(builder.footnote(e));
        if(e.typ=='image'){
            if(nodes[nodes.length-1] &&
               nodes[nodes.length-1].content=='link' &&
               e.posinall > elements[x-1].posinall &&
               e.posinall < elements[x-1].posinall + 1 +  elements[x-1].linkurl.length + 2 + elements[x-1].linktext.length + 1){
                nodes[nodes.length-1].subelements[0]=builder.image(e);
            }else {
                nodes.push(builder.image(e));
            }
        }
        if(e.tag=='simpleelement')nodes.push(builder.simpleelement(e));
        //e.typ=='start'
        //e.tag=='title'
    }
    if(nodes.length>0)return nodes;//return {content:'inline elements',type:'editor', cursorpos:parser.map.linestart[line], subelements: nodes};
}

aui.addInlineElements = function(audibleElement, parser){
  let oldlength = 0;
  if(audibleElement.subelements)oldlength = audibleElement.subelements.length;
  if(audibleElement.line){
    let inlineelements = this.parseInlineElements(audibleElement.line, parser);
    if(inlineelements && audibleElement.subelements)audibleElement.subelements = audibleElement.subelements.concat(inlineelements);
    else if(inlineelements)audibleElement.subelements = inlineelements;
  }
  for (let x=0;x<oldlength;x++){
    this.addInlineElements(audibleElement.subelements[x], parser);
  }
}

aui.add_paragraphs_array = function(lineswithhtml, sourcelines){
    let newarr = lineswithhtml.concat([]);
    let pstart=-1; let pend=-1; //paragraph-start and end-lines
    for(let x=0;x<sourcelines.length;x++){
        if(newarr[x]==undefined && sourcelines[x].length>0)newarr[x]='paragraph';
        /*
        if(newarr[x]==undefined && sourcelines[x].length>0){
            if(pend>=pstart)pstart=x;
        }else if(pend<=pstart && pstart>=0){
            pend=x;
            if(pend>=pstart)for(let l=pstart;l<=pend;l++){
                newarr[l]='paragraph';
            }
        }*/
    }
    return newarr;
}
aui.add_background_imagelines = function(linetags, sourcelines, parser, slides){
  let newarr = linetags.concat([]);
  for(let x=0;x<slides.length;x++){
    let firstline = slides[x].firstline;
    if(parser.map.insertedhtmlinline[firstline][0] && parser.map.insertedhtmlinline[firstline][0].typ=='image'){
      newarr[firstline]='backgroundimage';
    }
  }
  return newarr;
},
aui.parse_source = function(parser){
    let sourcelines = parser.sourcecode.split('\n');
    let linetags = parser.lineswithhtml;
    let root = {
      content:'editor',
      id:'editor',
      description:'the editor. you can enter editor-mode with enter to go to actual position or with escape to enter to last carret position',
    };

    //adding slides:
    let slistart = parser.map.pagestart;
    let sliend = parser.map.pageend;
    let slides = [];
    for(let i=0;i<slistart.length;i++){
        slides.push({
        content:'slide '+(i+1),
        type:'editor',
        firstline:slistart[i].line,
        lastline: sliend[i].line,
        subelements:[],
        role:'slide',
        slidenr:i+1,
        ppagenr:i,
        })
    };
    linetags = this.add_background_imagelines(linetags, sourcelines, parser, slides);
    linetags = this.add_paragraphs_array(linetags, sourcelines);
    let containerendline=-1;
    let lastcontainer=null;
    for(let i=0;i<slides.length;i++){
        //check for backgroundimage:
        for(let x=slides[i].firstline;x<=slides[i].lastline;x++){
            //do the actual parsing:
            let tag = linetags[x];
            let line=x;
            let lineelement=null;
            if(this.parser[tag])lineelement=this.parser[tag](line, sourcelines, linetags, parser);
            if(lineelement){
              lineelement.type='editor';
              //hack for sticky titles:
              if(lineelement.checkStickyTitle &&
                 (linetags[line-1]=="h1" ||
                  linetags[line-1]=="h2" ||
                  linetags[line-1]=="h3")){
                let con = lineelement.pretext || lineelement.content;
                let sticky = {
                  content:con+' with title',
                  type:'editor',
                  stickytitle:true,
                  firstline:lineelement.line || lineelement.firstline,
                  lastline:lineelement.lastline || lineelement.line,
                  subelements:[],
                }
                if(lineelement.subelements && lineelement.subelements.length>0)sticky.subelements = lineelement.subelements;
                else sticky.subelements = [lineelement];
                sticky.firstline--;

                if(lastcontainer && x <=containerendline){
                  let preve= lastcontainer.subelements.pop();
                  sticky.subelements.unshift(preve);
                  lastcontainer.subelements.push(sticky);
                }else{
                  let preve= slides[i].subelements.pop();
                  sticky.subelements.unshift(preve);
                  slides[i].subelements.push(sticky);
                }
              }else if(x>containerendline)slides[i].subelements.push(lineelement);
              else if(lastcontainer)lastcontainer.subelements.push(lineelement);
              if(lineelement.layout){
                containerendline=lineelement.lastline;
                lastcontainer=lineelement;
              }
              continue;
            }
            if(lineelement===false)continue; //do nothing if we return false explicitly
            if(!sourcelines[line] || sourcelines[line].length==0)continue; //dont add empty lines?
            //does the following ever happen?
            console.warn('unidentified line added to aui',line, sourcelines[line]);
            let obj={content:sourcelines[line], type:'editor',line:line};
            this.parser.parentElementOfLine[line]=obj;
            slides[i].subelements.push(obj);
        }
    }
    root.subelements = slides;
    this.addInlineElements(root, parser);
    let lastElement = {content:'end of editor', type:'editor', line:parser.lines.length};
    root.subelements.push(lastElement);
    return root;
}

aui.dateString = function(date){
  let loc = navigator.languages[0] || navigator.language || 'en';
  // return date.toLocaleDateString(loc)+', '+date.toLocaleTime
  return date.toLocaleString(loc);
}

aui.buildNavigationJsonTree = function(){
  let slidenotetitle=slidenoteguardian.notetitle;
  let currentSlidenote = {content:`current slidenote: ${slidenotetitle}`};
  let newSlidenote = {content:'create new slidenote', type:'button', queryString:'#newnote'};
  let saveSlidenote = {content:'save slidenote', type:'button', queryString:'#cloud'};
  let deleteSlidenote = {content:'delete this slidenote '+slidenotetitle, type:'button', queryString:'#deletebutton'};
  let renameSlidenote = {content:'rename this slidenote', type:'button', queryString:'#renamebutton'};
  let changePassword = {content:'change password of this slidenote', type:'button', queryString:'#changepasswordbutton'};
  let loadSlidenotes = {content:'load a slidenote', type:'container', subelements:[]};
  let nid=slidenoteguardian.restObject.nid;
  let notelist=slidenoteguardian.loadedSlidenotes;
  for (let x=0;x<notelist.length;x++){
    if(nid==notelist[x].nid)continue;
    //lastUpdated, title, isEmpty, nid:
    let href='/?id='+notelist[x].nid;
    let date=new Date(notelist[x].lastUpdated);
    let datestring=aui.dateString(date);
    let desc='slidenote with title '+notelist[x]+', last changed on '+datestring;
    let link={content:notelist[x].title, type:'link', pretext:'open slidenote ', description:desc, href:href};
    loadSlidenotes.subelements.push(link);
  }
  //file-menu:
  let importbutton = {content:'import text from file', type:'button', queryString:'#importbutton'};
  let expslidenote= {content:'download slidenote as dot slidenote file', type:'button', queryString:'#exportasslidenotebutton'};
  let expmd= {content:'download slidenote as text file', type:'button', queryString:'#exportasmdfilebutton'};
  let exppresenc={content:'download presentation as encrypted html file', type:'button', queryString:'#exportasenchtmlbutton'};
  let exppresunenc={content:'download presentation as unencrypted html file', type:'button', queryString:'#exportasunenchtmlbutton'};
  //publish-menu:
  let publishbutton = {content:'publish presentation', type:'dialogbutton', queryString:'#publishtocms'};
  let plist = slidenoteguardian.loadedPresentations;
  let presentations = {content:'your published presentations', type:'container', subelements:[]}
  for (let x=0;x<plist.length;x++){
    //creationDate, enccomments, lastUpdated, nid, title, url
    //unterelemente: delete, copy link
    let desc='created on '+aui.dateString(new Date(plist[x].creationDate));
    if(!plist[x].enccomments || plist[x].enccomments.length==0)desc+=', no comments so far';
    else desc+=', '+plist[x].enccomments.length+' comments';
    let href='/?presentation='+plist[x].url;
    let obj={content:plist[x].title, type:'container', description:desc, subelements:[
      {content:'open presentation '+plist[x].title, type:'link', href:href},
      {content:'copy link of presentation', type:'button', queryString:'#publishedlist li:nth-child('+(x+1)+') .copylink'},
      {content:'delete presentation '+plist[x].title, type:'button', queryString:'#publishedlist li:nth-child('+(x+1)+') .circle'},
    ] };
    presentations.subelements.push(obj);
  }
  //options-menu:
  let account = {content:'account', type:'container', subelements:[
    {content:'open account configuration', type:'link', href:'/user/account.html'},
    {content:'log out', type:'button', queryString:'#logoutbutton'},
  ]};
  let editorchoice = {content:'view mode', type:'select', queryString:'#editorchoice', subelements:[
    {content:'audio mode', type:'option', value:'audio-mode'},
    {content:'context-mode (default)', type:'option', value:'md-texteditor'},
    {content:'focus mode', type:'option', value:'focus'},
    {content:'raw text mode', type:'option', value:'raw-text'},
    {content:'big mode', type:'option', value:'big-mode'},
    {content:'basic mode', type:'option', value:'basic-mode'},
  ]}
  //advanced-menu:
  // let advanced = {content:'advanced options', type:'button', queryString:'#showAdvancedMenu' };
  let advanced = this.buildGlobaloptionsJSONTree({content:'advanced options'});
  //slidenotes.io-services
  let licenses = {content:'licenses', type:'container', subelements:[
    {content:'slidenotes.io makes use of third-party-librarys under the hood. We want to thank all contributors and specialy the mantainers of the following projects which helped building slidenotes.io'},
    {content:'third party librarys:', type: 'container', subelements:[
      {content:'chartist', type:'container', subelements:[
        {content:'project link', type:'link', href:'https://github.com/gionkunz/chartist-js/'},
        {content:'Copyright 2017 Gion Kunz'},
        {content:'License: MIT'},
      ]},
      {content:'file saver js', type:'container', subelements:[
        {content:'project link', type:'link', href:'https://github.com/eligrey/FileSaver.js'},
        {content:'Copyright 2016 Eli Grey'},
        {content:'License: MIT'},
      ]},
      {content:'highlight js', type:'container', subelements:[
        {content:'project link', type:'link', href:'https://highlightjs.org/'},
        {content:'Copyright 2006, Ivan Sagalaev'},
        {content:'License: BSD'},
      ]},
      {content:'katex', type:'container', subelements:[
        {content:'project link', type:'link', href:'https://katex.org/'},
        {content:'Copyright 2013-2020 Khan Academy and other contributors'},
        {content:'License: MIT'},
      ]},
    ]},
    {content:'licenses', type:'container', subelements:[
      {content:'The MIT License', type:'container', subelements:[
        {content:'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:'},
        {content:'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.'},
        {content:'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'},
      ]},
      {content:'The BSD License', type:'container', subelements:[
        {content:'Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:'},
        {content:'Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.'},
        {content:'Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.'},
        {content:'Neither the name of highlight.js nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.'},
        {content:'THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS AS IS AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.'},
      ]}
    ]}
  ]};
  let services = {content:'slidenotes dot io services', type:'container', subelements:[
    {content:'open tutorial editor', type:'link', href:'/?tutorial=welcome'},
    {content:'give feedback', type:'button', queryString:'#feedbackbutton'},
    {content:'privacy notice', type:'link', href:'https://slidenotes.io/privacy-notice.html'},
    {content:'terms of service', type:'link', href:'https://slidenotes.io/terms-of-service.html'},
    licenses,
  ]};
  currentSlidenote.subelements = [
    saveSlidenote,
    deleteSlidenote,
    renameSlidenote,
    changePassword
  ];
  let editor = this.parse_source(slidenote.parser);

  let slidenotemenu = {
    content:'slidenote menu',
    type:'container',
    subelements:[
      editor,
      currentSlidenote,
      newSlidenote,
      loadSlidenotes,
      importbutton,
      expslidenote,
      expmd,
    ]
  }
  let presentationmenu = {
    content:'presentation menu',
    type:'container',
    subelements:[
      publishbutton,
      exppresenc,
      exppresunenc,
      presentations,
    ]
  }
  let optionsmenu = {
    content:'options',
    type:'container',
    subelements:[
      editorchoice,
      advanced,
    ]
  }
  let mainTree={
    content:'slidenotes editor root',
    type:'container',
    subelements:[
      slidenotemenu,
      presentationmenu,
      account,
      optionsmenu,
      services,
    ]
  };
  return mainTree;
}

aui.selectPreconfiguredDialog = function(dialogname){
    let preconfiguredDialogs = {
        publishtocms:{
            content:'publish presentation to slidenotes.io form',
            type:'container',
            subelements:[
                {
                    pretext:'filename for export',
                    type:'textfield',
                    queryString:'#username',
                },
                {
                    pretext:'password',
                    type:'textfield',
                    queryString:'#password',
                },
                {
                    pretext:'re-type password',
                    type:'textfield',
                    queryString:'#pwcheckfield',
                },
                {
                    pretext:'enable comments',
                    type:'toggle',
                    queryString:'#slidenoteGuardianPasswordPromptCommentEnable',
                },
                {
                    pretext:'make presentation notes readable in controlwindow',
                    type:'toggle',
                    queryString:'#slidenoteGuardianPasswordPromptInternalCommentEnable',
                },
                {
                    pretext:'generate a password for me',
                    type:'button',
                    queryString:'#passwordgen',
                },
                {
                    pretext:'read about forgotten passwords',
                    type:'container',
                    subelements:[
                      {content:'as a matter of principle: everything you write is encrypted before we even store it on our server.'},
                      {content:'this level of security means that we ourselves have no access to your passwords of encrypted slidenotes, encrypted presentations or encrypted export files.'},
                      {content:'in short: apart from your login password, passwords can not be restored. we recommend using a password manager.'}],
                },
                {
                    pretext:'encrypt and publish',
                    type:'button',
                    queryString:'#slidenoteGuardianPasswordPromptEncrypt',
                },

            ],
        }, //end of publishPresentation
    }//end of preconfiguredDialogs
    return preconfiguredDialogs[dialogname];
}

aui.openSlidenoteDialog = function(ae){
  let dialogname = ae.queryString || '';
  dialogname = dialogname.substring(1);
  let b = document.querySelector(ae.queryString);
  let dialog = this.selectPreconfiguredDialog(dialogname);
  if(b)b.click();
  if(dialog)this.waitingDialog=dialog;
  this.readElement({content:'opening dialog'})
}

aui.elementInEditorLine = function(line, ae){
  if(ae.line != undefined && ae.line==line)return ae;
  let container;
  if(ae.firstline && ae.firstline<=line && ae.lastline && ae.lastline>=line)container = ae;
  if(ae.subElements && ae.subElements.length>0){
    let result;
    for(let i=0;i<ae.subElements.length;i++){
      result = this.elementInEditorLine(line, ae.subElements[i]);
      if(result)break;
    }
    if(result)return result;
  }
  return container;
}


aui.openAuiFromEditor = function(){
  if(aui.disabled)return;//shadowing aui 
  aui.active=true;
  let r = aui.buildNavigationJsonTree();
  aui.loadMain(r);
  //get active element of position
  let line = slidenote.parser.lineAtPosition();
  let editorroot = this.idelements.editor;
  let elementinline = this.elementInEditorLine(line,editorroot);
  if(elementinline)aui.selectElement(elementinline);
  else aui.selectElement(editorroot);
  aui.readElement();
  // aui.drawTree(r);
  // aui.drawTree(r);
}

//adding jump-to-editor-line functionality
aui.addPlugin({
  extraKeys:['line', 'firstline', 'lastline', 'cursorpos'],
  hookOnSelectElement: function(audibleElement, options){
    //attach class to editor-lines
    let old = document.getElementsByClassName('aui-editor-focus');
    while(old && old.length>0)old[0].classList.remove('aui-editor-focus');
    let bglines = document.getElementsByClassName('backgroundline');
    if(!bglines || bglines.length==0 || audibleElement.type!='editor')return;
    if(audibleElement.line>=0 && bglines[audibleElement.line])bglines[audibleElement.line].classList.add('aui-editor-focus');
    if(audibleElement.firstline && audibleElement.lastline && bglines.length>audibleElement.lastline){
      for(let line=audibleElement.firstline;line<=audibleElement.lastline;line++){
        bglines[line].classList.add('aui-editor-focus');
      }
    }
  },
  type:'editor',
  // activateOnType:'editor',
  activateElement: function(audibleElement){
    let jumppos = 0;
    let line = audibleElement.line;
    let linestarts = slidenote.parser.map.linestart;
    if(line!=undefined && line<linestarts.length)jumppos = linestarts[line];
    if(line>=linestarts.length)jumppos=slidenote.parser.map.lineend[linestarts.length-1];
    if(line==undefined && audibleElement.firstline!=undefined && audibleElement.firstline<linestarts.length)jumppos=linestarts[audibleElement.firstline]
    if(line==undefined && audibleElement.cursorpos!=undefined)jumppos=audibleElement.cursorpos;
    slidenote.textarea.selectionEnd=jumppos;
    slidenote.textarea.selectionStart=jumppos;
    slidenote.textarea.focus();
    slidenote.parseneu();
  },
});

//add option-menu
aui.buildGlobaloptionsJSONTree = function(preroot){
  let themes = slidenote.extensions.themes;
  let root = preroot || {content:options, subelements:[]};
  if(!root.subelements)root.subelements=[];
  for(var x=0;x<themes.length;x++){
		var acttheme = themes[x];
    if(acttheme.globaloptions!=null && acttheme.active){
			for(var glop=0;glop<acttheme.globaloptions.length;glop++){
				var actopt = acttheme.globaloptions[glop];
				if(actopt.type==="checkbox"){
					var actinp = {
            content:actopt.description,
            type:'slidenote-optiontoggle',
            optionnr:glop,
            optiontype:'globaloptions',
            theme:acttheme.classname,
          };
					root.subelements.push(actinp);
				}
			}
		}
  }
  return root;
}

aui.buildKeyboardJSONTree = function(){
  //can i group the shortcuts somehow?
  /*
  globals-
      meta key
      start presentation
      save note to cloud directly
  #

  editor-
      open audio user interface
      open toolbar
      open contextmenu
      open search menu
      open imagegallery
      undo last change
      redo last undone change
      move line up or down //(maybe better as global option?)
  #
  speaker-
      meta key to use for speaker
      read current line
      read current page
      read current element
  #

  menu shortcuts-  //(should open aui on id if aui is active)
      open cloud menu
      open noteload menu
      open file menu
      open publish menu
      open options
      open slide design menu
  #
  */
}

aui.addPlugin({
  type:'slidenote-optiontoggle',
  extraKeys:['optionnr','optiontype', 'theme'],
  activateElement: function(audibleElement){
      let theme = slidenote.extensions.getThemeByName(audibleElement.theme);
      let option=theme[audibleElement.optiontype][audibleElement.optionnr];
      let newval = !option.values;
      theme.changeGlobalOption(audibleElement.optionnr,newval);
      if(slidenoteguardian)slidenoteguardian.saveConfig("local");
      console.log("parseneu forced by config-change");
      slidenote.parseneu();
      let readstring = 'changed status of option '+audibleElement.content+' to ';
      if(newval)readstring+='active'; else readstring+='disabled';
      aui.readElement({content:readstring});
  },
  alterElementString: function(audibleElement){
    let t = audibleElement.content;
    let theme = slidenote.extensions.getThemeByName(audibleElement.theme);
    let option=theme[audibleElement.optiontype][audibleElement.optionnr];
    t += ', current state ';
    if(option.values)t+='active'; else t+='disabled';
    return t;
  }
})

aui.addPlugin({
  type:'dialogbutton',
  activateElement: function(audibleElement){
    aui.openSlidenoteDialog(audibleElement);
  },
});

//add tree-drawing-gui representation of aui:
aui.buildParentPath = function(element){
  let res = [element];
  if(element.parentElement)return res.concat(this.buildParentPath(element.parentElement));
  return res;
}
aui.getRootOfElement = function(element){
  if(element.parentElement)return this.getRootOfElement(element.parentElement);
  return element;
}

aui.buildTree = function(root){
  let res = document.createElement('div');
  res.classList.add('aui-tree-wrapper');
  let content = document.createElement('span');
  content.classList.add('content');
  content.innerText = root.content;
  res.appendChild(content);
  if(root.subElements){
    res.classList.add('container');
    for(let i=0;i<root.subElements.length;i++){
      res.appendChild(this.buildTree(root.subElements[i]));
    }
  }
  root.auiTreeObject=res;
  root.auiTreeContent=content;
  return res;
}

aui.drawTree = function(root){
  let r=root || this.main;
  if(!r){
    r=aui.buildNavigationJsonTree();
    aui.loadMain(r);
  }
  let target = document.getElementById('aui-tree');
  target.innerHTML = '';
  let tree = this.buildTree(r);
  target.appendChild(tree);
  this.activatePathToObject();
}

aui.activatePathToObject = function(element){
  let e=element || aui.activeElement;
  let oldelements = document.getElementsByClassName('aui--in-path');
  while(oldelements.length>0)oldelements[0].classList.remove('aui--in-path');
  if(!e)return;
  let newelements = this.buildParentPath(e);
  for(let i=0;i<newelements.length;i++){
    newelements[i].auiTreeObject.classList.add('aui--in-path');
  }
  if(e.auiTreeContent)e.auiTreeContent.classList.add('aui--in-path');
}

//adding draw-tree on each select active element:
aui.addPlugin({
  hookOnSelectElement: function(audibleElement, options){
    // aui.activatePathToObject(audibleElement);
    let root = aui.getRootOfElement(audibleElement);
    aui.drawTree(root);
  }
})
aui.init2 = function(){
  //do some slidenote-related init-stuff:
  // aui.outputPolite.innerText="Welcome to Slidenote.io. Press Enter to activate AUI";
  let activateFunction = function(e){
    if(e.key==="Enter"){
      setTimeout(()=>{aui.drawTree(); aui.outputPolite.focus()},1000);
      this.removeEventListener('keyup',activateFunction);
      aui.active=true;
    }
  }
  aui.outputPolite.addEventListener('keyup',activateFunction);
  aui.keyboardstyle='menu';
  //overwrite aui-standard-output with speaker say
  aui.outputText= function(outputstring, options) {
    //outputstring: text to say
    //options:
    //gui: use gui-language or user-selected-language for output (api only)
    //wait: be polite or aggressive (api only)
    //html: should it output html or innerText - use later with caution!
    //audibleElement: audibleElement which formed the string
    if(!options){
      slidenoteSpeaker.say(outputstring);
      return;
    }
    let html = options.html || (options.audibleElement && options.audibleElement.role=='mathml');
    slidenoteSpeaker.say(outputstring, options.gui, options.wait, html);
  };
  //overwrite reactOnKeystroke to put more keys to it:
  aui.reactOnKeystroke= function(key, metaobj){
    if(this.keyboardstyle=='menu'){
      this.reactOnKeystrokeMenuStyle(key,metaobj);
    }else{
      this.reactOnKeystrokeDocumentStyle(key,metaobj);
    }
    switch (key) {
      case 'Escape':
        slidenote.textarea.focus();
        break;
    }
  };
  aui.reactOnKeystrokeDocumentStyle = function(key, metaobj) {
    //key is the js-char-representation of the key - like 'k' or 'K' when shift/capslock is pressed
    let pressedCtrl = metaobj.ctrlKey;
    if(this.isMac)pressedCtrl=metaobj.metaKey;
    switch (key) {
      case 'ArrowDown':
        if (pressedCtrl) this.selectNextSibling();
        else this.selectNextElement();
        this.readElement(this.activeElement);
        console.log('down to', this.activeElement);
        break;
      case 'ArrowUp':
        if (pressedCtrl) this.selectPreviousSibling();
        else this.selectPreviousElement();
        this.readElement(this.activeElement);
        console.log('up to', this.activeElement);
        break;
      // case 'ArrowLeft':
      //   if (pressedCtrl) this.readElementByWord(null, true);
      //   else this.readElementByChar(null, true);
      //   break;
      // case 'ArrowRight':
      //   if (pressedCtrl) this.readElementByWord();
      //   else this.readElementByChar();
      //   break;
      case '.':
        // if(pressedCtrl)this.readElementByWord();
        // else
        this.readElementByPhrase();
        break;
      case 'l':
        // if(pressedCtrl)this.readElementByWord();
        // else
        this.readElementByLine();
        break;
      case 'Enter':
        // if(pressedCtrl)this.activateElement();
        let activatemsg = this.activateElement();
        // this.readElement(this.activeElement, 'activated');
        if (activatemsg) this.readElement({
          content: activatemsg
        });
        console.log('activated', this.activeElement);
        break;
      case 'r':
        if (pressedCtrl) this.readWholeElement();
        else this.readElement();
        break;
      case 'd':
        this.readDescription();
        break;
      case 'w':
        if (pressedCtrl) this.whereAmI(true);
        else this.whereAmI();
        break;
      case 'h':
        this.readHelpOfElement();
        break;
      case 'H':
        this.readGlobalHelp();
        break;
    }
  };
}

//presentation:

aui.presentationtmp={};
aui.hashchange = function(e){
  console.log('auihashchange',e)
  if(!aui.active || location.hash.substring(0,'#slide'.length)!='#slide')return;
  let slidenr = location.hash.substring('#slide'.length);
  if(slidenr*1!=slidenr || slidenr<1)return; //not a number
  if(aui.presentation.slides[slidenr-1]!=aui.activeElement)aui.presentation.gotoSlide(slidenr);
  document.getElementById('aui-output-polite').focus();
}
aui.startPresentation = function(forExport){
  if(aui.active){
    let waitForRender = document.getElementsByClassName('presentation')[0].clientHeight;
    if(forExport && this.waitingDialog){
      this.openDialog(this.waitingDialog);
      this.readElement();
      this.waitingDialog=null;
      this.DialogWaitingForClosingPresentation=true;
      return;
    }
    window.addEventListener('hashchange',aui.hashchange)
    this.initPresentation();
  }
  aui.presentationIsActive=true;
}

aui.endPresentation = function(){
  if(this.DialogWaitingForClosingPresentation){
    this.DialogWaitingForClosingPresentation=false;
    return;
  }
  if(aui.active)this.openAuiFromEditor();
  window.removeEventListener('hashchange',aui.hashchange)
  aui.keyboardstyle=aui.editorkeyboardstyle;
  aui.presentationIsActive=false;
}

aui.initPresentation = function(){
  slidenote.parseneu();
  aui.editorkeyboardstyle=aui.keyboardstyle;
  aui.keyboardstyle='document';
  let source = this.parse_source(slidenote.parser);
  source.content="slidenote presentation";
  aui.presentationtmp={
    slides:[],
    hiddenelements:[],
    source:source,
  }; //clean old stuff
  this.cleanupPresentation(source, slidenote.parser);
  this.addSlidePerHidden();
  this.deleteMarkedNodes(source);
  this.cleanedPresentation = source;
  // this.selectElement(source);
  this.loadMain(source);
  this.afterPresentationParsing();
  this.readElement();
  return source;
}

aui.cleanupPresentation = function(audibleElement, parser){
  let line = audibleElement.line;
  let lookdeeper = true;
  if(audibleElement.role=='slide'){
    aui.presentationtmp.slides.push(audibleElement);
  }
  audibleElement.type='presentation';
  // if(audibleElement.stickytitle){
  //   let title = audibleElement.subelements.unshift();
  //   audibleElement.content +=' '+title.content;
  //   oldlength--;
  // }
  switch (audibleElement.datatype) {
    case 'code':
        // if(audibleElement.subelements[0].content.length==0)audibleElement.subelements.unshift();
        let header = audibleElement.subelements.shift();
        if(header.content.indexOf(':options')>-1){
          let divider=-1;
          for(let l=0;l<audibleElement.subelements.length;l++){
            if(audibleElement.subelements[l].content.substring(0,3)=='---'){
              divider=l;
              break;
            }
          }
          let block=document.createElement('div');
          for(l=0;l<audibleElement.subelements.length;l++){
            block.innerHTML+=audibleElement.subelements[l].content+'\n';
          }
          let codeoptions = slidenote.extensions.getThemeByName('highlight').parseStyledBlockOptions(block);
          if(divider>-1){
            audibleElement.subelements.splice(0,divider+1); //+1 includes the divider
            if(codeoptions.linenumbering!='off' && codeoptions.linenumbering!='false'){
              let lstart = 1;
              if(codeoptions.linenumberingstart*1==codeoptions.linenumberingstart)lstart=codeoptions.linenumberingstart*1;
              for(l=0;l<audibleElement.subelements.length;l++){
                audibleElement.subelements[l].pretext = 'code line '+(lstart+l);
              }
            }
            if(codeoptions.linehighlight){
              let hls = codeoptions.linesToHighlight();
              for(l=0;l<hls.length;l++)audibleElement.subelements[hls[l]-1].pretext = 'highlighted '+audibleElement.subelements[hls[l]-1].pretext;
            }
            if(codeoptions.language && codeoptions.language.length>0)audibleElement.subelements.unshift({pretext:'language', type:'presentation', content:codeoptions.language});

          }
        }else if(header.content.indexOf(':')>-1){
          let lan = header.content.substring('+++code:'.length)
          if(lan.length>0)audibleElement.subelements.unshift({pretext:'language', type:'presentation', content:lan});
        }
      break;
    case 'chart':
      let chartist = slidenote.extensions.getThemeByName('chartist');
      let chartdata = chartist.parseData(audibleElement.dataobject.raw);
      let chartmeta = chartist.parseMetadata(audibleElement.dataobject.raw);
      console.log('chart',chartdata,chartmeta);
      let chartaudio = audibleElement;
      chartaudio.subelements=[]; //{content:'chart', subelements:[]};
      if(chartmeta.summary)chartaudio.subelements.push({content:chartmeta.summary,pretext:'summary'});
      if(chartmeta.xaxis)chartaudio.subelements.push({content:chartmeta.xaxis,pretext:'x axis label'});
      if(chartmeta.yaxis)chartaudio.subelements.push({content:chartmeta.yaxis,pretext:'y axis label'});
      let values = {content:'values',subelements:[]};
      let valuearray = [];
      for(let x=0;x<chartdata.series.length;x++){
          valuearray[x]=[];
          for(let y=0;y<chartdata.labels.length;y++){
              valuearray[x].push({pretext:chartdata.labels[y], content:chartdata.series[x][y]});
          }
      }
      if(valuearray.length>1){
          for(x=0;x<valuearray.length;x++){
              values.subelements.push({content:chartmeta.datasetlabel[x]||'data set '+x, subelements:valuearray[x]});
          }
      }else if(valuearray.length==1){
          values.subelements=valuearray[0];
      }
      chartaudio.subelements.push(values);
      // audibleElement = chartaudio;
      lookdeeper=false;
      break;
    case 'node':
      let nodejs = slidenote.extensions.getThemeByName('node');
      let dataobj = audibleElement.dataobject;
      //remove md-code from raw-lines:
      for (let x=0;x<dataobj.raw.length;x++){
        let line = dataobj.startline+1+x; //first line is header
        let cleanedText = dataobj.raw[x];
        inshtml = slidenote.parser.map.insertedhtmlinline[line];
        for(let y=inshtml.length-1;y>=0;y--){
          cleanedText=cleanedText.substring(0,inshtml[y].pos)+cleanedText.substring(inshtml[y].pos+inshtml[y].mdcode.length);
        }
        dataobj.raw[x]=cleanedText;
      }

      let parsedNode = nodejs.builder.parse(dataobj,true);
      console.log(parsedNode);
      audibleElement.content = 'a '+parsedNode.nodetype+' diagram';
      let actorswrapper = {type:'presentation', content:'of '+parsedNode.actors.length+' elements',subelements:[]};
      for (x=0;x<parsedNode.actors.length;x++){
        let parsedActor = nodejs.builder.parseActorType(parsedNode.actors[x]);
        if(parsedActor && parsedActor.text){
          if(!parsedNode.aliases[x])parsedNode.aliases[x]=parsedNode.actors[x];
          parsedNode.actors[x]=parsedActor.text;
        }
        let actortype = parsedActor.type || 'circle';
        let actortext = 'a '+actortype + ' labeled ';
        actortext+=parsedNode.actors[x];
        actorswrapper.subelements.push({type:'presentation', content:actortext});
      }
      let actionlist = [];
      for(x=0;x<parsedNode.parsedlines.length;x++){
        if(parsedNode.parsedlines[x]==false)continue;
        let action = parsedNode.parsedlines[x];
        let actiontext='';
        let actionpretext = action.type;
        if(action.type=="arrow"){
          let actfrom = action.actfrom; let actto = action.actto;
          let afaliasnr = parsedNode.aliases.indexOf(actfrom);
          let ataliasnr = parsedNode.aliases.indexOf(actto);
          if(afaliasnr>-1)actfrom=parsedNode.actors[afaliasnr];
          if(ataliasnr>-1)actto=parsedNode.actors[ataliasnr];
          actiontext += ' from '+actfrom+' to '+actto;
          if(action.msg)actiontext+=' labeled '+action.msg;
        }
        if(action.type=='note'){
          actionpretext+=' '+action.notetype+' ';
          if(action.notetype!='over')actionpretext+='of ';
          let actionactor = action.actor;
          let acnr=parsedNode.aliases.indexOf(actionactor);
          if(acnr>-1)actionactor=parsedNode.actors[acnr];
          actionpretext+=actionactor;
          actiontext=action.content;
        }
        actionlist.push({
          type:'presentation',
          pretext:actionpretext,
          content: actiontext,
        })
      }
      audibleElement.subelements=[];
      audibleElement.subelements.push(actorswrapper);
      for (x=0;x<actionlist.length;x++){
        audibleElement.subelements.push(actionlist[x]);
      }

      lookdeeper=false;
      break;
    case 'table':
      //we build table a-new to avoid later clashes with table-updates (special tables)
      let raw = audibleElement.dataobject.raw;
      let tableplugin = slidenote.extensions.getThemeByName('table');
      let divider = tableplugin.guessDivider(raw[0]);
      if(!divider)break;
      audibleElement.subelements = [];
      for (let x=0;x<raw.length;x++){
        let row = raw[x].split(divider);
        let rowaudio = {content:"row "+(x+1), type:'presentation',subelements:[]}
        for(let y=0;y<row.length;y++){
          rowaudio.subelements.push({pretext:'column '+(y+1),content:row[y], type:'presentation'})
        }
        audibleElement.subelements.push(rowaudio);
      }
      break;
    case 'hidden':
      console.log('hidden element:',audibleElement);
      aui.presentationtmp.hiddenelements.push(audibleElement);
      break;
    case 'latex':
      let rawmath = audibleElement.dataobject.raw.join('\n');
      //katex does not work as intended, (no only-mathml-output) so:
      // let mathml = katex.renderToString(rawmath,{throwOnError:false,output:'mathml'});
      let latexdiv = document.createElement('div');
      katex.render(rawmath,latexdiv,{throwOnError:false});
      let mathdiv = latexdiv.querySelector('.katex-mathml');
      mathml=mathdiv.innerHTML;
      audibleElement.subelements = [
        {pretext:'math m l', type:'mathml',role:'mathml',content:mathml}
      ];
      break;
  }
  if(audibleElement.line!=undefined){
    let changes = parser.map.insertedhtmlinline[line];
    let text = audibleElement.content;
    let linecontainsimages=false;
    if(changes && changes.length>0){
      changes = changes.sort(function(a,b){return b.pos-a.pos});
      for (let i=0;i<changes.length;i++){
        if(changes[i].typ=="image"){
          linecontainsimages=true;
        }
          text=text.substring(0,changes[i].pos)+text.substring(changes[i].pos+changes[i].mdcode.length);
      }
      let substituteAudibleElement=false;
      if(linecontainsimages && text.length==0){
        //add some text as it should not be empty to avoid being deleted further on
        text="line with only images";
        substituteAudibleElement=(changes.length==1);
      }
      if(substituteAudibleElement){
        audibleElement.content= audibleElement.subelements[0].content;
        audibleElement.subelements = audibleElement.subelements[0].subelements;
      }else{
        audibleElement.content = text;
      }

    }
  }
  let max=0;
  if(lookdeeper && audibleElement.subelements)max = audibleElement.subelements.length;
  for (let x=0;x<max;x++){
    this.cleanupPresentation(audibleElement.subelements[x], parser);
  }
  if(lookdeeper && audibleElement.subelements){
    for (let d=audibleElement.subelements.length-1;d>=0;d--){
      if(audibleElement.subelements[d].content.length==0)audibleElement.subelements.splice(d,1);
    }
  }
}

aui.addSlidePerHidden = function(){
  if(!aui.presentationtmp.hiddenelements.length || aui.presentationtmp.hiddenelements.length<=0)return;
  for(let x=aui.presentationtmp.hiddenelements.length-1;x>=0;x--){
    let orig=aui.presentationtmp.hiddenelements[x];
    orig.content='poped up content';
    let origpage = aui.presentationtmp.slides[orig.ppagenr];
    let copy = JSON.parse(JSON.stringify(orig));
    let copypage = JSON.parse(JSON.stringify(origpage));
    aui.presentationtmp.source.subelements.splice(origpage.ppagenr+1,0,copypage);
    aui.presentationtmp.slides.splice(origpage.ppagenr+1,0,copypage);
    orig.content='';
    orig.delete=true;
    orig.subelements=[];
    //maybe insert into copy that a once hidden object is inserted
    let popup={
      content:'a new content poped up in the slide',
      type:'presentation',
      subelements:copy.subelements,
    };
    let oldpage={content:'whole page', type:'presentation',subelements:copypage.subelements};
    copypage.subelements=[popup,oldpage];
  }
  for(x=0;x<aui.presentationtmp.slides.length;x++){
    let slide = aui.presentationtmp.slides[x];
    slide.content='slide '+(x+1);
    slide.id='slide '+(x+1);
    slide.ppagenr=x;
    slide.slidenr=x+1;
  }
}
aui.afterPresentationParsing = function(){
  aui.presentation={
    root:this.main,
    slides:this.main.subElements,
    gotoSlide:function(slidenr){
      let slide = aui.presentation.slides[slidenr-1];
      if(slide){
        aui.selectElement(slide);
        // aui.readElement();
        aui.readWholeElement();
      }
    }
  };
  if(location.hash.substring(0,'#slide'.length)=='#slide'){
    let slidenr=location.hash.substring('#slide'.length);
    aui.presentation.gotoSlide(slidenr);
  }
  //change "end of editor"-node:
  let eop = aui.presentation.root.subElements.pop();
  eop.content = "end of presentation";
  aui.presentation.root.subElements.push(eop);
  aui.drawTree();
}

aui.deleteMarkedNodes = function(audibleElement){
  if(!audibleElement.subelements || audibleElement.subelements.length==0)return;
  for (let x=audibleElement.subelements.length-1;x>=0;x--){
    if(audibleElement.subelements[x].delete)audibleElement.subelements.splice(x,1);
    else this.deleteMarkedNodes(audibleElement.subelements[x]);
  }
}

aui.activateAui = function(){
  if(aui.disabled)return;//shadowing aui
  aui.active = !aui.active;
  let auiwrapper = document.querySelector('.aui-wrapper');
  //set width via js:
  auiwrapper.style.width=document.getElementById('sidebarcontainer').offsetLeft+"px";
  auiwrapper.classList.toggle('active',aui.active);
  if(!aui.active)return;
  let waitForRender = auiwrapper.clientHeight;
  // setTimeout(()=>{aui.drawTree(); aui.outputPolite.focus()},1000);
  if(fullscreen){
    aui.startPresentation();
    setTimeout("aui.readWholeElement()",100)
  }else{
    aui.drawTree();
    setTimeout("aui.readElement();",100);
  }
  aui.outputPolite.focus();
}


aui.addPlugin({
  extraKeys:['role','ppagenr','slidenr'],
  hookOnSelectElement:function(audibleElement, options){
    //we only want to use it in presentations
    if(!aui.presentationIsActive)return;
    if(audibleElement.role!='slide' || audibleElement.ppagenr==undefined)return;
    if(window.slidenoteplayer)slidenoteplayer.gotoPage(audibleElement.ppagenr);
    else presentation.showPage(audibleElement.ppagenr);
  },
})


//alert('aui loaded')
// aui.loadMain(aui.buildNavigationJsonTree());
aui.init({reactOnOutputFocus:true, keyboardstyle:'menu'});
aui.init2();
// aui.active=true;
aui.disabled=true;

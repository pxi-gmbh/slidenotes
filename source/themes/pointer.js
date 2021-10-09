/*pointer*/
var pointerklick = function(event){
    function validNode(node){
      if(node.classList.contains('ppage'))return node;
      let chain = [];
      let actnode = node;
      while(actnode.parentNode!=document.body &&
        actnode.classList.contains('ppage')==false){ //we dont want to go higher up then ppage
        chain.unshift(actnode);
        actnode=actnode.parentNode;
      }
      let lastValid=0;
      for (var x=0;x<chain.length;x++){
        if(chain[x].offsetParent==undefined)break;
        if(chain[x].clientWidth==0)break;
        lastValid=x;
      }
      console.log('chain:',chain,lastValid);
      return chain[lastValid];
    }
    function buildPath(root, node){
        if(root==node)return [];
        if(!node||!node.parentNode)console.warn('somethings not right in click...node,root:',node,root);
        let returnpath =  buildPath(root, node.parentNode);
        let index = 0;
        for(let x=1;x<node.parentNode.children.length;x++)if(node.parentNode.children[x]==node){
            index=x;
            break;
        }
        //index = Array.from(node.parentNode.children).indexOf(node);
        returnpath.push(index);
        return returnpath;
    }
    //check if selection exists - if so dont point
    if(window.getSelection){
      if(window.getSelection().isCollapsed===false)return;
    }
    let target = validNode(event.target);
    let root = document.getElementById('slidenotepresentation');
    if(root==null)root = document.getElementById('praesentation');
    let path = buildPath(root,target);
    let targetobj = pointer.getPosition(target);
    targetobj.endx = targetobj.x + target.clientWidth;
    targetobj.endy = targetobj.y + target.clientHeight;
    targetobj.width = target.clientWidth;
    targetobj.height = target.clientHeight;
    targetobj.node = target;
    let percX = targetobj.width/100;
    let percY = targetobj.height/100;
    let clickX = event.clientX;
    let clickY = event.clientY;

    let distX = clickX-targetobj.x;
    let distY = clickY-targetobj.y;
    let relativeX = Math.floor(distX/percX);
    let relativeY = Math.floor(distY/percY);

    let klick = {
        path:path,
        //target:targetobj,
        relativeDistanceX:relativeX,
        relativeDistanceY:relativeY
    }
    console.log('pointer makes klick',klick);
    if(window.ws && window.ws.server){
      ws.sendPointer(klick);
    }
    klicks.push(klick);
    pointer.showPointer(klick);
}
var klicks = [];
var pointer = {
  init:function(){
    this.presentation = document.getElementById('slidenotepresentation');
    if(this.presentation==null)this.presentation = document.getElementById('praesentation');
    this.presentation.addEventListener("click",pointerklick);
    this.pointernode = document.getElementById('laserpointer');
    if(!this.pointernode){
      this.pointernode = document.createElement('div');
      this.pointernode.id='laserpointer';
      document.body.appendChild(this.pointernode);
    }
    this.pointernode.onclick = function(){
      //repeat old click
      pointer.showPointer(pointer.lastklick);
    }
    this.isActive=true;

  },
  deactivate:function(){
    this.presentation.removeEventListener('click',pointerklick);
    if(this.pointernode)this.pointernode.parentElement.removeChild(this.pointernode);
    this.isActive=false;
  },
  // helper function to get an element's exact position
  getPosition: function(el) {
    var xPosition = 0;
    var yPosition = 0;

    while (el) {
      if (el.tagName == "BODY") {
        // deal with browser quirks with body/window/document and page scroll
        var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
        var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

        xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
        yPosition += (el.offsetTop - yScrollPos + el.clientTop);
      } else {
        xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
      }

      el = el.offsetParent;
    }
    return {
      x: xPosition,
      y: yPosition
    };
  },
  showPointer: function(klick){
    if(!this.presentation)this.init();
    this.lastklick = klick;
    let target = this.getElementByPath(klick.path);
    let twidth = target.clientWidth;
    let theight = target.clientHeight;
    let tpercX = twidth/100;
    let tpercY = theight/100;
    let tpos = this.getPosition(target);

    let distX = Math.floor(klick.relativeDistanceX*tpercX);
    let distY = Math.floor(klick.relativeDistanceY*tpercY);
    let posX = tpos.x+distX;
    let posY=tpos.y+distY;
    this.pointernode.style.left = posX+"px";
    this.pointernode.style.top = posY+"px";
    this.pointernode.classList.toggle('active',true);
    console.log('pointer moved to',posX,posY);
    if(this.timeout)clearTimeout(this.timeout);
    this.timeout = setTimeout("pointer.pointernode.classList.toggle('active',false)",3000);
  },
  getElementByPath: function(path){
    let node = this.presentation;
    for(var x=0;x<path.length;x++){
      node = node.children[path[x]];
    }
    return node;
  },

}

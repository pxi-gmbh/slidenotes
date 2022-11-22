//audio-user-interface

function audibleElement(elementOptions) {
  let o = elementOptions;
  if (o.parentElement) this.parentElement = o.parentElement;
  if (o.subElements) {
    this.subElements = o.subElements;
    this.activeElement = null;
  }
  if (o.id) {
    this.id = o.id;
  }
  this.content = o.content;
  this.pretext = o.pretext;
  this.description = o.description;
  this.type = o.type;
  this.queryString = o.queryString || false; //its always usefull
  //plugins by type:
  if(o.type && aui.pluginsByType[o.type]){
    let plugin = aui.pluginsByType[o.type];
    if(typeof plugin.additionalKeys=='function')plugin.additionalKeys(this,o);
  }
  switch (o.type) {
    case "toggle":
      // this.value=o.value || false;
      //better store value somewhere else where it is yet stored
      //but optional for future features could be interesting:
      // if(o.value!=undefined)this.value=o.value;
      // this.queryString = o.queryString || false;
      break;
    case "button":
      // this.queryString = o.queryString || false;
      this.activateMessage = o.activateMessage || false;
      break;
    case "textfield":
      // this.queryString = o.queryString || false;
      break;
    case "textarea":
      // this.queryString = o.queryString || false;
      break;
    case "link":
      this.href = o.href || false;
      break;
    case "select":
      // this.queryString = o.queryString || false;
      // this.options = o.options || false; not needed, better use nested object in subElements
      break;
    case "option":
      this.value = o.value;
      break;
  }

}


audio_user_interface = {
  autoRead: {
    hints: true,
  },
  globalHelpCount: 0,
  elements: [{

  }],
  idelements: {

  },
  phraseDividers: ['.', '!', '?'],
  currentReadPos: 0,
  main: null,
  activeElement: null,
  activeDialogues: {},
  // addElement: function(audibleElement){},
  lastEnterObject:{},
  //plugin-system:
  plugins:[],
  pluginsByType:{},
  activateOnType:{},
  extraKeys:[],
  hooksOnSelectElement:[],
  addPlugin: function(plugin){
    this.plugins.push(plugin);
    if(plugin.type){
      this.pluginsByType[plugin.type]=plugin;
    }
    if(plugin.activateOnType && typeof plugin.activateElement == 'function'){
      if(this.activateOnType[plugin.activateOnType]==undefined)this.activateOnType[plugin.activateOnType]=[];
      this.activateOnType[plugin.activateOnType].push(plugin.activateElement);
    }
    if(plugin.extraKeys)this.extraKeys=this.extraKeys.concat(plugin.extraKeys);
    if(plugin.hooksOnSelectElement)this.hooksOnSelectElement = this.hooksOnSelectElement.concat(plugin.hooksOnSelectElement);
    if(plugin.hookOnSelectElement && typeof plugin.hookOnSelectElement == 'function')this.hooksOnSelectElement.push(plugin.hookOnSelectElement);
  },
  alterTypeString: function(content, audibleElement){
    let type = audibleElement.type;
    let plugin = this.pluginsByType[type];
    if(!plugin || !plugin.alterElementString)return content;
    return plugin.alterElementString(audibleElement);
  },
  formElementCountingString: function(audibleElement, elementsNames, containNames) {
    let en = elementsNames || {
      singular: 'element',
      plural: 'elements'
    };
    let cn = containNames || {
      singular: 'contains',
      plural: 'containing'
    };
    if (typeof en == 'string') en = {
      singular: elementsNames,
      plural: elementsNames
    };
    if (typeof cn == 'string') cn = {
      singular: containNames,
      plural: containNames
    };
    if (!audibleElement.subElements) return '';
    if (audibleElement.subElements.length > 1) return ', ' + cn.plural + ' ' + audibleElement.subElements.length + ' ' + en.plural;
    return cn.singular + ' 1 ' + en.singular;
  },
  formIdString: function(audibleElement) {
    if (!audibleElement.id) return '';
    return ', with id ' + audibleElement.id;
  },
  formHintString: function(audibleElement, forceFeedback) {
    let ae = audibleElement;
    let t = '. ';
    if (ae.description) t += 'press d for description. ';
    switch (ae.type) {
      case 'textfield':
        t += 'press Enter to enter edit-modus, again Enter to return to audio user interface. ';
        break;
      case 'button':
        t += 'press Enter to activate. ';
        break;
    }
    if (this.globalHelpCount < 2) {
      t += 'press shift and h for global Help. ';
      this.globalHelpCount++;
    }
    if (forceFeedback && t == '. ') {
      t += 'no specific help for this element defined. ';
      t += 'press r to read element, press control and r to read element with all of its subelements';
      t += 'press shift and h for global Help. ';
    }
    return t;
  },
  formGlobalHelpString: function() {
    //do we still need this or can it be deleted?
  },
  formStringOfElement: function(audibleElement, options) {
    let ae = audibleElement;
    let o = options || {};
    let t = this.alterTypeString(ae.content, audibleElement);
    if(o.onlyContent)return t;
    if (ae.pretext) t = ae.pretext + ", " + t;
    if(o.onlyPrefix)return t;
    if (ae.postext) t += ', ' + ae.postext;
    if(o.onlyPrefixAndPost)return t;
    switch (ae.type) {
      case "container":
        if (!o.dontShowId) t += ', ' + this.formIdString(ae);
        t = 'container, ' + t;
      case "list":
        if (!o.dontcount) t += ', ' + this.formElementCountingString(ae);
        break;
      case 'textfield':
        tf = document.querySelector(ae.queryString);
        if (tf) {
          if (tf.value.lenth > 0) t = 'textfield ' + t + ', with value, ' + tf.value;
          else t = 'empty textfield ' + t;
        }
        break;
      case 'button':
        t = 'button ' + t;
        break;
      case 'toggle':
        tf = document.querySelector(ae.queryString);
        if (tf) {
          let value;
          if (tf.type == 'checkbox') value = tf.checked;
          t = 'toggle ' + t + ', state ' + value;
          // if(tf.value || tf.value=='true')t+=', '
          // else t='empty textfield '+t;
        }
        break;
      case 'select':
        t = 'multiple choice, ' + t + this.formElementCountingString(ae, 'options', 'with');
        tf = document.querySelector(ae.queryString);
        if (tf && tf.value) {
          for (let si = 0; si < ae.subElements.length; si++) {
            if (tf.value == ae.subElements[si].value) {
              t += ', selected option: ' + ae.subElements[si].content;
              break;
            }
          }
        }
        break;
      default:
        if (!o.dontcount && o.subElements && o.subElements.length>0) t += ', ' + this.formElementCountingString(ae);

    }

    return t;
  },
  formStringOfWholeElement: function(audibleElement, options) {
    let o = options ||{onlyContent:true};
    let t = this.formStringOfElement(audibleElement,o);
    if (!audibleElement.subElements) return t;
    for (let i = 0; i < audibleElement.subElements.length; i++) {
      t += '\n , ';
      t += this.formStringOfWholeElement(audibleElement.subElements[i],o);
    }
    return t;
  },
  activateElement: function(audibleElement) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return null;
    let ret = null;
    let pluginret='';
    if(this.activateOnType[ae.type]){
      let tmp='';
      for(let i=0;i<this.activateOnType[ae.type].length;i++){
        let resp = this.activateOnType[ae.type][i].activateElement(ae);
        if(resp!=null)tmp+=', '+resp;
      }
      if(tmp.length>0)pluginret=tmp;
    }
    if(this.pluginsByType[ae.type] && typeof this.pluginsByType[ae.type].activateElement == 'function'){
      let resp = this.pluginsByType[ae.type].activateElement(ae);
      if(resp)pluginret+=', '+resp;
    }
    switch (ae.type) {
      case 'button':
        if (ae.queryString) {
          let b = document.querySelector(ae.queryString);
          if (b) b.click();
          else console.warn('query selector wrong, no such button found', ae);
          ret = 'activated button ' + ae.content;
          if (ae.activateMessage) ret += '. ' + ae.activateMessage;
        }
        break;
      case 'textfield':
        if (ae.queryString) {
          let tf = document.querySelector(ae.queryString);
          if (document.activeElement == tf) {
            //leave textarea
            this.outputPolite.focus();
            ret = 'left textfield ' + ae.content + ' with value , ' + tf.value;
          } else {
            //enter textarea
            ret = 'entered textfield ' + ae.content + '. current value ' + tf.value;
            if (tf.value.length == 0) ret = 'entered empty textfield ' + ae.content;
            //add event listener if not there allready: - onkeyup is rude but effective:
            tf.auicontent=ae.content;
            tf.onkeyup = function(e){
              if(e.key=='Enter'){
                aui.outputPolite.focus();
                aui.readElement({content:'left textfield ' + this.auicontent + ' with value , ' + this.value});
              }
            };
            tf.focus();
          }
        }
        break;
      case 'link':
        if (ae.href) {
          ret = 'following link to ' + ae.href
          //maybe we can delay this to give feedback to user? how?
          //we dont know how long it takes the screenreader to read out
          setTimeout(function() {
            document.location = ae.href;
          }, 5000);
        }
        break;
      case 'toggle':
        if (ae.queryString) {
          let tf = document.querySelector(ae.queryString);
          if (tf.type == 'checkbox') {
            let newval = !tf.checked;
            tf.checked = newval;
            ret = 'set toggle state to ' + newval;
          }
        }
        break;
      case 'option':
        if (ae.parentElement.type == 'select') {
          let select = document.querySelector(ae.parentElement.queryString);
          if (!select) return ret;
          if (select.tagName.toLowerCase() == 'select') {
            select.value = ae.value;
            select.dispatchEvent(new Event('change'));
            let ind = this.getIndexInParent(ae) + 1;
            ret = 'chose option ' + ind + ' of ' + ae.parentElement.content + ', ' + ae.content;
          }
          if (select.tagName.toLowerCase() == 'radio') {
            select.checked = true;
            ret = 'chose option ' + ae.content;
          }
          this.selectElement(ae.parentElement);
          setTimeout(function() {
            audio_user_interface.readElement();
          }, 500)
        }
        break;
    }
    if(pluginret && !ret)ret=pluginret;
    else if(pluginret)ret+=', '+pluginret;
    return ret;
  },
  selectElement: function(audibleElement, options) {
    this.activeElement = audibleElement;
    let oldNode = document.getElementsByClassName('aui-pseudo-focused');
    while (oldNode.length > 0) oldNode[0].classList.remove('aui-pseudo-focused');
    if (audibleElement.queryString) {
      let el = document.querySelector(audibleElement.queryString);
      if (el) el.classList.add('aui-pseudo-focused');
    }
    this.currentReadPos = 0; //reset current Reading Pos as we read Element from anew
    if (options && options.readPos) this.currentReadPos = options.readPos; //to set it manualy if needed
    //plugin-hooks:
    for(let i=0;i<this.hooksOnSelectElement.length;i++)this.hooksOnSelectElement[i](audibleElement, options);
  },
  selectElementById: function(id) {
    if (this.idelements[id]) this.selectElement(this.idelements[id]);
  },
  selectNextElement: function() {
    if (this.activeElement == null) return false;
    let ne = this.getNextElement(this.activeElement);
    if (ne) this.selectElement(ne);
  },
  selectNextSibling: function(dontgoup) {
    if (this.activeElement == null) return false;
    if (!this.activeElement.parentElement) return false;
    let ne = this.getNextSibling(this.activeElement, dontgoup);
    if (ne) this.selectElement(ne);
  },
  selectPreviousElement: function() {
    if (this.activeElement == null) return false;
    let pe = this.getPreviousElement(this.activeElement);
    if (pe) this.selectElement(pe);
  },
  selectPreviousSibling: function(dontgoup) {
    if (this.activeElement == null) return false;
    let pe = this.getPreviousSibling(this.activeElement, dontgoup);
    if (pe) this.selectElement(pe);
  },
  getNextElement: function(audibleElement, noSubElement) {
    if (audibleElement.subElements && audibleElement.subElements.length > 0 && noSubElement != true) return audibleElement.subElements[0];
    //get next Element:
    let founde = null;
    let acte = audibleElement;
    while (founde == null) {
      let parent = acte.parentElement;
      if (parent === undefined) return false;
      let index = null;
      for (let i = 0; i < parent.subElements.length; i++) {
        if (parent.subElements[i] == acte) {
          index = i + 1;
          break;
        }
      }
      if (index != null && index < parent.subElements.length) {
        founde = parent.subElements[index];
        break;
      }
      acte = parent;
    }
    return founde;
  },
  getPreviousElement: function(audibleElement) {
    let previousSibling = this.getPreviousSibling(audibleElement);
    if (previousSibling == audibleElement.parentElement) return previousSibling; //without siblings the parent is the next previous element
    let acte = previousSibling;
    while (acte.subElements && acte.subElements.length > 0) {
      acte = acte.subElements[acte.subElements.length - 1];
    }
    return acte;
  },
  getNextSibling: function(audibleElement, dontgoup) {
    let parent = audibleElement.parentElement;
    if(!parent)return false;
    let index = -1;
    for (let i = 0; i < parent.subElements.length; i++) {
      if (parent.subElements[i] == audibleElement) {
        index = i + 1;
        break;
      }
    }
    if (index >= 0 && index < parent.subElements.length) return parent.subElements[index];
    //return false;
    //try next Element, but without subelements
    if(!dontgoup)return this.getNextElement(parent.subElements[parent.subElements.length - 1], true)
  },
  getPreviousSibling: function(audibleElement, dontgoup) {
    //get previous Element in tree (either sibling or parent):
    let parent = audibleElement.parentElement;
    if (!parent) return false;
    let index = -1;
    for (let i = 0; i < parent.subElements.length; i++) {
      if (parent.subElements[i] == audibleElement) {
        index = i - 1;
        break;
      }
    }
    if (index >= 0) return parent.subElements[index];
    if(!dontgoup)return parent;
  },
  getIndexInParent: function(audibleElement) {
    let parent = audibleElement.parentElement;
    if (!parent) return -1;
    let index = -1;
    for (let i = 0; i < parent.subElements.length; i++) {
      if (parent.subElements[i] == audibleElement) {
        index = i;
        break;
      }
    }
    return index;
  },
  getElementArray: function(audibleElement, compareobj) {
    if (!compareobj && !audibleElement.subElements) return [audibleElement];
    let keys = Object.keys(compareobj);
    let found = true;
    for (let x = 0; x < keys.length; x++) {
      if (compareobj[keys[x]] != audibleElement[keys[x]]) found = false;
    }
    if (!audibleElement.subElements) {
      if (found) return [audibleElement];
      return [];
    }
    let ret = [];
    if (found) ret.push(audibleElement);
    for (x = 0; x < audibleElement.subElements.length; x++) {
      ret = ret.concat(this.getElementArray(audibleElement.subElements[x]));
    }
    return ret;
  },
  parseJsonTree: function(jsonobj, parent, opt) {
    let node = new audibleElement({
      content: jsonobj.content,
      type: jsonobj.type,
      parentElement: parent,
      pretext: jsonobj.pretext,
      id: jsonobj.id,
      queryString: jsonobj.queryString,
      activateMessage: jsonobj.activateMessage,
      description: jsonobj.description,
      value: jsonobj.value,
      href:jsonobj.href,
    });
    for(let i=0;i<this.extraKeys.length;i++){
      let k=this.extraKeys[i];
      if(jsonobj[k]!=undefined)node[k]=jsonobj[k];
    }
    if (jsonobj.id) this.idelements[jsonobj.id] = node;
    // if(jsonobj.type=="select")node.options=jsonobj.options;
    if (jsonobj.subelements) {
      node.subElements = [];
      for (let x = 0; x < jsonobj.subelements.length; x++) {
        node.subElements.push(this.parseJsonTree(jsonobj.subelements[x], node));
      }
    } else if(jsonobj.type=='select' && jsonobj.queryString){
      //lazy select (no subelements on select): parse childs from html:
      let sel = document.querySelector(jsonobj.queryString);
      let options = [];
      for(let o=0;o<sel.options.length;o++){
        let tmp = {content: sel.options[o].innerText, type:'option', value:sel.options[o].value, parentElement:node};
        if(sel.options[o].title)tmp.description=sel.options[o].title;
        options.push(tmp);
      }
      if(sel.title && !node.description)node.description=sel.title;
      node.subElements=options;
    }
    return node;
  },
  loadMain: function(jsonobj) {
    this.main = this.parseJsonTree(jsonobj);
    // this.activeElement = this.main;
    this.selectElement(this.main);
    if (!this.outputPolite) this.outputPolite = document.getElementById('aui-output-polite');
    this.outputPolite.focus();
    this.readElement();
  },
  openDialog: async function(jsonobj) {
    let dialog = this.parseJsonTree(jsonobj, false, {
      dontLinkIds: true
    });
    dialog.returnToElement = this.activeElement;
    let id = jsonobj.id;
    if (!jsonobj.id) {
      id = 'dialog' + this.activeDialogues.length;
      let did = this.activeDialogues.length;
      while (this.activeDialogues[id]) {
        did++;
        id = 'dialog' + did;
      }
    }
    this.activeDialogues[id] = dialog;
    let flattened = this.getElementArray({
      type: 'button'
    });
    let closefunction = function() {
      audio_user_interface.closeDialog(this.auid);
      this.removeEventListener(closefunction);
    }
    for (let i = 0; i < flattened.length; i++) {
      let button = document.querySelector(flattened[i].queryString);
      if (!button) continue;
      button.auid = id;
      button.addEventListener('click', closefunction);
    }
    this.selectElement(dialog);
    return id;
  },
  closeDialog: function(id) {
    let dialog = this.activeDialogues[id];
    if (!dialog) {
      //we dont know where to go - return to main
      this.selectElement(this.main);
      this.readElement(this.activeElement, 'closed dialog, returned to main content');
      return false;
    }
    this.selectElement(dialog.returnToElement);
    this.activeDialogues[id]=undefined; //delete active dialog
    this.readElement(this.activeElement, 'closed dialog, returned to ');
  },
  readElement: function(audibleElement, before, after) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    let outputstring = this.formStringOfElement(ae);
    if (before) outputstring = before + ', ' + outputstring;
    if (after) outputstring += ', ' + after;
    if (this.autoRead.hints) {
      outputstring += '. ' + this.formHintString(ae);
    }
    this.outputText(outputstring,{audibleElement:audibleElement});
    console.log('reading', outputstring);
  },
  readWholeElement: function(audibleElement, options) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    let outputstring = this.formStringOfWholeElement(ae, options);
    this.outputText(outputstring);
    console.log('reading whole element', outputstring);
  },
  readDescription: function(audibleElement) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    let outputstring = ae.description;
    if(outputstring)this.outputText(outputstring);
    console.log('reading description', outputstring);
  },
  readHelpOfElement: function(audibleElement) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    let outputstring = '. ' + this.formHintString(ae, true);
    this.outputText(outputstring);
  },
  readGlobalHelp: function() {
    //let outputstring = this.formGlobalHelpString();
    //this.outputText(outputstring);
    console.log('starting global help')
    this.openDialog(this.helpDialog);
    this.readWholeElement(this.activeElement, {dontcount:true});
  },
  readElementByLine: function(audibleElement) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    let end = ae.content.indexOf('\n', this.currentReadPos);
    if (end == -1) end = ae.content.length;
    let t = ae.content.substring(0, end);
    if (t.length > 0) this.outputText(t);
    this.currentReadPos = end;
  },
  readElementByPhrase: function(audibleElement) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    if (this.currentReadPos == undefined) this.currentReadPos = 0;
    let dividers = this.phraseDividers;
    let end = ae.content.length;
    for (let x = 0; x < dividers.length; x++) {
      let pos = ae.content.indexOf(dividers[x], this.currentReadPos);
      if (pos < end && pos > -1) end = pos + 1;
    }
    // if(end==-1)end=ae.content.length;
    let t = ae.content.substring(this.currentReadPos, end);
    if (t.length > 0) this.outputText(t);
    this.currentReadPos = end;
  },
  readElementByWord: function(audibleElement, backwards) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    if (this.currentReadPos >= ae.content.length && !backwards) return false;
    if (backwards && this.currentReadPos <= 0) return false;
    let end = this.currentReadPos;
    if (backwards) end = ae.content.lastIndexOf(' ', this.currentReadPos - 1);
    else end = ae.content.indexOf(' ', this.currentReadPos + 1);
    if (end == -1) {
      if (backwards) end = 0;
      else end = ae.content.length;
    }
    console.log('read word from to:', this.currentReadPos, end);
    let t = ae.content.substring(this.currentReadPos, end);
    this.outputText(t);
    this.currentReadPos = end;
  },
  readElementByChar: function(audibleElement, backwards) {
    let ae = audibleElement || this.activeElement;
    if (!ae) return false;
    if (this.currentReadPos >= ae.content.length && !backwards) return false;
    if (backwards) {
      if (this.currentReadPos <= 0) return false;
      this.currentReadPos -= 2; //we want to get to the last char
      if (this.currentReadPos < 0) this.currentReadPos = 0;
    }
    let t = ae.content[this.currentReadPos];
    this.currentReadPos++;
    this.outputText(t);
  },
  whereAmI: function() {
    let ae = this.activeElement;
    if (!ae) return 'you are out of reach';
    let index = this.getIndexInParent(ae);
    let ret = '';
    if (index != -1) ret = 'you are on element number ' + (index + 1) + ' of parent ' + this.formStringOfElement(ae.parentElement, {
      dontcount: true,
      dontShowId: true
    }) + ': ';
    // ret+='. parent element would be '+this.formStringOfElement(ae.parentElement);
    ret += this.formStringOfElement(ae);
    // return ret;
    this.outputText(ret);
  },
  outputText: function(outputstring) {
    if (!this.outputPolite) this.outputPolite = document.getElementById('aui-output-polite');
    this.outputPolite.innerHTML = outputstring;
  },
  reactOnKeystroke: function(key, metaobj){
    if(this.keyboardstyle=='menu'){
      this.reactOnKeystrokeMenuStyle(key,metaobj);
    }else{
      this.reactOnKeystrokeDocumentStyle(key,metaobj);
    }
  },
  reactOnKeystrokeMenuStyle: function(key, metaobj) {
    //key is the js-char-representation of the key - like 'k' or 'K' when shift/capslock is pressed
    let pressedCtrl = metaobj.ctrlKey;
    if(this.isMac)pressedCtrl=metaobj.metaKey;
    switch (key) {
      case 'ArrowDown':
        this.selectNextSibling(true);
        // else this.selectNextElement();
        this.readElement(this.activeElement);
        console.log('down to', this.activeElement);
        break;
      case 'ArrowUp':
        this.selectPreviousSibling(true);
        // else this.selectPreviousElement();
        this.readElement(this.activeElement);
        console.log('up to', this.activeElement);
        break;
      case 'ArrowLeft':
        // if (pressedCtrl) this.readElementByWord(null, true);
        // else this.readElementByChar(null, true);
        let parent = this.activeElement.parentElement;
        if(parent)this.selectElement(parent);
        this.readElement(this.activeElement);
        break;
      case 'ArrowRight':
        // if (pressedCtrl) this.readElementByWord();
        // else this.readElementByChar();
        if(this.activeElement.subElements && this.activeElement.subElements.length>0){
          this.selectElement(this.activeElement.subElements[0]);
          this.readElement(this.activeElement);
        }
        break;
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
        let activatemsg;
        /*if(this.activeElement.subElements && this.activeElement.subElements.length>0){
          this.selectElement(this.activeElement.subElements[0]);
          this.readElement(this.activeElement);
        }else{
          let date = Date.now();
          let mintime = 300;
          if(this.lastEnterObject.date &&
            date - this.lastEnterObject.date<mintime &&
            this.lastEnterObject.audioElement == this.activeElement)
             activatemsg = this.activateElement();
           this.lastEnterObject={date:date,audioElement:this.activeElement};
        }*/
        activatemsg = this.activateElement();
        // this.readElement(this.activeElement, 'activated');
        if (activatemsg) this.readElement({
          content: activatemsg
        });
        console.log('activated', this.activeElement);
        break;
      case 'Backspace':
        // let parent = this.activeElement.parentElement;
        // if(parent)this.selectElement(parent);
        // this.readElement(this.activeElement);
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
  },
  reactOnKeystrokeDocumentStyle: function(key, metaobj) {
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
      case 'ArrowLeft':
        if (pressedCtrl) this.readElementByWord(null, true);
        else this.readElementByChar(null, true);
        break;
      case 'ArrowRight':
        if (pressedCtrl) this.readElementByWord();
        else this.readElementByChar();
        break;
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
  },
  init: function(options) {
    this.isMac=(navigator.userAgent.indexOf('Mac OS X') != -1);
    if (options===true) {
      document.addEventListener('keyup', function(e) {
        // if (e.target.tagName.toLowerCase() == 'input' && e.key != 'Enter') return;
        if (e.target.tagName.toLowerCase() == 'input') return;
        // console.log(e);
        audio_user_interface.reactOnKeystroke(e.key, e);
      })
    }
    this.outputPolite = document.getElementById('aui-output-polite');
    if(options.reactOnOutputFocus)this.outputPolite.addEventListener('keyup',function(e){aui.reactOnKeystroke(e.key,e)});
    if(options.reactOnElement){
      options.reactOnElement.addEventListener('keyup', function(e){
        aui.reactOnKeystroke(e.key,e);
      });
    }
    if(options.keyboardstyle)this.keyboardstyle=options.keyboardstyle;
  },
  helpDialog: {
    content:'global help',
    id: 'global Help',
    type:'dialog',
    subelements:[
      {content:'keyboard shortcuts', type:'list', subelements:[
        {content:'General Shortcuts', type:'list', subelements:[
          {content:'r: read current element.'},
          {content:'control and r: read current element with all of its subelements .'},
          {content:'d: read description of current element. if no description is defined it will not read anything.'},
          {content:'w: read where am i, to get overview of where in the tree i am currently.'},
          {content:'control and w: read whole path to get to where i am now.'},
          // {content:'h: read help for elements such as special keystrokes.'},
          // {content:'n: enter navigation tree.'},
          // {content:'m: enter main content tree.'},
          {content:'l: enter line-reading mode: reads element content by line. press l to read next line in queue.'},
          {content:'dot: enter phrase-reading mode: reads element content divided by dot exclamation mark and question mark.'},
        ]},
        {content:'Menu Style', type:'list', subelements:[
          {content:'arrow down: move to next sibling of element. If there is none do nothing.'},
          {content:'arrow up: move to previous sibling of element. If there is none do nothing.'},
          {content:'Enter: if element has subelement, go to first subelement'},
          {content:'Backspace: go to parent of element'},
          {content:'Double Enter: activate current interactive element'},
        ]},
        {content:'Document Style', type:'list', subelements:[
          {content:'Arrow Down: Move to next element in tree. If element has subelements it enters subelements.'},
          {content:'control or command and arrow down: Move to next Sibling in tree, not entering subelements.'},
          {content:'Arrow Up: Move to previous element in tree. if previous sibling has subelements start with last and most profound subelement of tree.'},
          {content:'control or command and arrow up: move to previous sibling of element. if it is first subelement of its parent move to parent.'},
          {content:'Enter: activate current interactive element.'},
        ]},
      ]},
      {content:'exit help', type:'dialogclose', dialogId:'globalHelp'},
    ]
  },
}
// audio_user_interface.init(true);
var aui = audio_user_interface;

var plugin_dialog_closed = {
  type:'dialogclose',
  activateElement: function(audibleElement){
    let ae=audibleElement || aui.activeElement;
    if(!ae || !ae.dialogId)return;
    aui.closeDialog(ae.dialogId);
  },
  extraKeys:['dialogId'],
}
aui.addPlugin(plugin_dialog_closed);

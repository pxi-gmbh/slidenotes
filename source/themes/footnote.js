var newtheme = new Theme("footnote");

newtheme.renderFootnotesAmericanWay = function(){
    var presentation = slidenote.presentation.presentation.firstElementChild;
    var footsups = presentation.getElementsByTagName("sup");
    var footblocks = presentation.getElementsByTagName("footer");
    var foottexts = [];
    for(var x=0;x<footblocks.length;x++){
        var ft = footblocks[x].getElementsByTagName("p");
        foottexts = foottexts.concat(ft);
        footblocks[x].classList.add("hidden");
    }
    var footerpage = document.createElement("div");
    footerpage.classList.add("ppage");
    footerpage.id="footnoteslide";
    var footerlist = document.createElement("ol");
    for(var x=0;x<footsups.length;x++){
        var linktofpage = document.createElement("a");
        linktofpage.href="#footnoteslide";
        linktofpage.innerText = x;
        footsups.innerHTML = "";footsups.appendChild(linktofpage);
        var li = document.createElement("li");
        var backlink = document.createElement("a");
        backlink.href = foottexts[x].parentElement.parentElement.id;
        backlink.innerText = "("+backlink.href.substring(1)+")";
        li.innerHTML = foottexts[x];
        li.appendChild(backlink);
        footerlist.appendChild(li);
    }
    footerpage.appendChild(footerlist);
    presentation.appendChild(footerpage);
    
}

newtheme.renderFootnotesByPage = function(footnotemode){
    //mode can be "numeral", "alph" or "*" - undefined = numeral
    var mode = footnotemode || "numeral";
    var pages = document.getElementsByClassName("ppage");
    for(var p=0;p<pages.length;p++){
        var page = pages[p];
        var footsups = page.getElementsByTagName("sup");
        if(!footsups)continue;
        var foottexts = page.getElementsByTagName("footer");
        if(foottexts)foottexts = foottexts[0].getElementsByTagName("p");
        for(var s=0;s<footsups.length;s++){
            var oldfootsign = footsups[s].innerText;
            var newfootsign = s;
            if(mode==="alph")newfootsign="abcdefghijk".substring(s,s+1);
            if(mode==="*")newfootsign="***********".substring(0,s+1);
            footsups[s].innerText = newfootsign;
            foottexts[s].innerText = newfootsign + foottexts[s].innerText.substring(oldfootsign.length);
        }
    
    }
}

newtheme.buildFootnoteAnchorByPage = function(footnotemode, singlepage){
    var mode = footnotemode || "*";
    var allFootnotes = [];
    for(var x=0;x<slidenote.parser.map.insertedhtmlelements.length;x++){
        var el = slidenote.parser.map.insertedhtmlelements[x];
        if(el.typ==="start"&&el.tag==="footnote-anchor"){
            allFootnotes.push(el);
        }
    }
    allFootnotes.sort(function(a,b){return a.posinall - b.posinall;});
    var newSigns = [];
    var pagenr;
    var actcount = 1; //begins in 1, not in 0!
    var allFootnotesByPage=[];
    for(var x=0;x<allFootnotes.length;x++){
        var actpagenr = slidenote.parser.map.pageAtPosition(allFootnotes[x].posinall);
        if(actpagenr===pagenr){
            actcount++;
            allFootnotesByPage[allFootnotesByPage.length-1].push(allFootnotes[x]);
        }else{
            pagenr = actpagenr;
            actcount=1;
            allFootnotesByPage.push([allFootnotes[x]]);
        }
        if(mode==="*")newSigns[x]="**************".substring(0,actcount);
        if(mode==="numeral")newSigns[x]=actcount;
        if(mode==="alph")newSigns[x]="abcdefghijklmnopqrstuvwxyz".substring(actcount-1,actcount);
        allFootnotes[x].newSign = "[^"+newSigns[x]+"]";
        allFootnotes[x].pageNr = pagenr;
    }
    var text = slidenote.textarea.value;
    var selend = slidenote.textarea.selectionEnd;
    var seldiff = 0;    
    for(var x=allFootnotesByPage.length-1;x>=0;x--){
        if(singlepage && allFootnotesByPage[x][0].pageNr!=singlepage)continue; //in singlepage mode only on singlepagenr
            //first the footers, then in second loop the anchors
        for(var y=allFootnotesByPage[x].length-1;y>=0;y--){
            //change footer:
            var foot = allFootnotesByPage[x][y].footer;
            var el = allFootnotesByPage[x][y];
            text = text.substring(0,foot.posinall)+el.newSign+":"+
                    text.substring(foot.posinall+foot.mdcode.length);
            if(foot.posinall<selend)seldiff+= el.newSign.length+1 - foot.mdcode.length;
        }
        for(var y=allFootnotesByPage[x].length-1;y>=0;y--){
            //change anchor:
            var el = allFootnotesByPage[x][y];
            text = text.substring(0,el.posinall)+el.newSign+text.substring(el.brotherelement.posinall+1);
            if(el.posinall<selend)seldiff+=el.newSign.length - (el.brotherelement.posinall + 1 - el.posinall);
        }
    }
    //text is now ready to be put inside textarea:
    slidenote.textarea.value = text;
    slidenote.textarea.selectionEnd = selend+seldiff;
    slidenote.textarea.selectionStart = selend+seldiff;
    slidenote.textarea.blur();
    slidenote.textarea.focus();
    slidenote.parseneu();

}

slidenote.addTheme(newtheme);

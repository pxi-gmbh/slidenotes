var slidechange = function(e){
	var pages = document.getElementsByClassName("ppage");
	var actslidenr = window.location.hash.substring(6);
	actslidenr = actslidenr * 1;
	if(e.key ==="ArrowRight" || e.key===" "){
		//goto next page
		if(actslidenr < pages.length)actslidenr++;
	}else if(e.key==="ArrowLeft"){
		//goto last page
		if(actslidenr>1)actslidenr--;
	}
	console.log("goto page:"+actslidenr);
	window.location.hash = "#slide"+actslidenr;
	document.getElementById("slidenotediv").focus();
}

document.getElementById("slidenotediv").tabIndex=1;
document.getElementById("slidenotediv").addEventListener("keyup", slidechange);
document.getElementById("slidenotediv").focus();

window.addEventListener('hashchange', function(){
	document.getElementById("slidenotediv").focus();
});

var slidenoteplayer = {};
slidenoteplayer.init = function(){
	window.location.hash = "#slide0";
}

$(window).on("load", function(){
	/* 
	 .hide() without any arguments doesn't use the effects queue (and won't have to wait for .delay()). 
	 We ensure it has to wait by using hide(0)
	*/
	$('#main-overlay').delay(300).hide(0);
	
}); // End of $(window).on("load", ...);

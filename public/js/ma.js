// jQuery for page scrolling feature
$("body a[href^='#']").on('click', function(e) {
    // if($(window).width() < 992) {
    //     return; // Only scroll with md and large devices i.e. do not scroll in tablets or mobile phones.
    // }

    e.preventDefault();

    // store hash
    var hash = this.hash;
    if(!hash) {
        return;
    }

    // animate
    $('html, body').animate({
       scrollTop: $(this.hash).offset().top
     }, 1500, function(){

       // when done, add hash to url
       // (default click behaviour)
       window.location.hash = hash;
     });
});


$(document).ready(function() {

    $('.team-link').mouseover(function(){
        $(this).find('.team-overlay.text').show();
        $(this).find('.team-overlay-circle').show();
        $(this).addClass('active');
    });

    $('.team-link').mouseout(function(){
        $(this).find('.team-overlay.text').hide();
        $(this).find('.team-overlay-circle').hide();
        $(this).removeClass('active');
    });

});
// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top',
    offset: 300
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').not('.dropdown-toggle').click(function() {
    $('.navbar-toggle:visible').click();
});

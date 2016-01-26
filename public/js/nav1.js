$(document).ready(function(){
  $("#nav-profile").popover({
      placement: 'bottom',
      // trigger: 'hover',
      // offset: 10,
      trigger: 'manual',
      html: true,
      style: 'margin-top:0;',
      template: '<div class="popover" style="margin-top:0px;" onmouseover="clearTimeout(timeoutObj);$(this).mouseleave(function() {$(this).hide();});"><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  }).mouseenter(function(e) {
      $(this).popover('show');
  }).mouseleave(function(e) {
      var ref = $(this);
      timeoutObj = setTimeout(function(){
          ref.popover('hide');
      }, 200);
  });
}); // End of $(document).ready()
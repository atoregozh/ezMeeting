

$(document).ready(function(){
  alignMeetingCards();
  

  $(window).resize(function() {
    alignMeetingCards();
  });

});

function alignMeetingCards() {
  $('.meeting-card-inviz').each(function(index){
    $(this).remove();
  });
  var mContainerWidth = $('#my-meetings').width();
  var mCardWidth = $('.meeting-card').outerWidth();
  var numCols = Math.floor(mContainerWidth / mCardWidth);
  var numCards = $('.meeting-card').length;
  var remainder = numCards % numCols;
  var numAdditionalCards = 0;
  if(remainder != 0) {
    numAdditionalCards = numCols - remainder;
  }
  for(var i = 0; i < numAdditionalCards; i++) {
    $('.meeting-cards-div').first().append(
      '<div class="meeting-card-inviz"></div>'
    );
  }
}
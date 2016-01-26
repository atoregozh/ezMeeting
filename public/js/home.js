
var TIME_FORMAT = 'hh:mma';
var DATE_FORMAT = 'ddd, MMM DD, YYYY';
var latestTimeStamp;
var SCHEDULED_YOUR_MEETING = 'scheduledYourMeeting';
var INVITE_TO_MEETING = 'inviteToMeeting';
var CANCEL_MEETING = 'cancelMeeting';

var iconMap = {};
iconMap[SCHEDULED_YOUR_MEETING] = '<i class="fa fa-calendar-check-o calendar-schedule"></i>';
iconMap[INVITE_TO_MEETING] = '<i class="fa fa-calendar-plus-o calendar-invite"></i>';
iconMap[CANCEL_MEETING] = '<i class="fa fa-calendar-times-o calendar-cancel"></i>';

$(document).ready(function(){
    formatMeetingTimes();
    alignMeetingCards();
    removeExtraParticipants();
  
    $(window).resize(function() {
        alignMeetingCards();
    });

    // Load notifications

    $.ajax({
        url: '/notifications',
        type: "GET",
        data: {},
        success: function(data) {
            for(var i = 0; i < data.length; i++){
                var record = data[i];
                var type = record.type;
                var displayName = record.userDisplayName;
                var meetingName = record.meetingName;
                var meetingId = record.meetingId;
                var startTime = moment(record.startTime);
                var timeStamp = moment(record.timeStamp);

                if(!latestTimeStamp || timeStamp > latestTimeStamp){
                    latestTimeStamp = moment(timeStamp);
                }

                var notificationDiv = 
                '<div class="notification-div">'+
                    '<div class="notification-timestamp">' +
                        timeStamp.fromNow() +
                    '</div>' +
                    '<div class="notification-icon">' + 
                        iconMap[type] +
                    '</div>' +
                    '<div class="notification-text">' +
                        getNotificationMessage(type, displayName, meetingName, meetingId, startTime) +
                    '</div>' +
                '</div>';

                $('#notifications-panel').append(notificationDiv);

            }
        },
        error: function(xhr, status, error) {
            console.log("Error: " + error);
        }
    });

});


function removeExtraParticipants() {
    $('.participant-number').each(function(){
        var count = $(this).html();
        if(count == "+0"){
            $(this).remove();
        }
    });

    // $('.meeting-location-div').each(function(){
    //     if(!$(this).children('.location-text2').first().html()){
    //         $(this).children('.location-icon').css({
    //             'visibility':'hidden'
    //         });
    //     }
    // });
}

function getNotificationMessage(type, displayName, meetingName, meetingId, meetingTime){
    if(type === CANCEL_MEETING) {
        return displayName + ' cancelled <a href="/meetings/' + meetingId + '">' + meetingName + '</a>';
    }
    else if(type === SCHEDULED_YOUR_MEETING) {
        return '<a href="/meetings/' + meetingId + '">' + meetingName + '</a> is scheduled for ' + meetingTime.format(DATE_FORMAT);
    }
    else if(type === INVITE_TO_MEETING) {
        return displayName + ' has invited you to <a href="/meetings/' + meetingId + '">' + meetingName + '</a>';
    }else {
        console.log('unidentified meeting type: ' + type);
    }
}

function formatMeetingTimes() {
    $('.start-time').each(function(){
        var startTime = moment($(this).html());
        $(this).html(startTime.format(TIME_FORMAT));
        $(this).parent().parent().children('.meeting-date').html(startTime.format(DATE_FORMAT));
    });

    $('.end-time').each(function(){
        $(this).html(
            moment($(this).html()).format(TIME_FORMAT)
        );
    });
}

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
  if(remainder !== 0) {
    numAdditionalCards = numCols - remainder;
  }
  for(var i = 0; i < numAdditionalCards; i++) {
    $('.meeting-cards-div').first().append(
      '<div class="meeting-card-inviz"></div>'
    );
  }
}
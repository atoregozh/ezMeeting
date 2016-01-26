var TAB1_ID = 'tab1';
var TAB2_ID = 'tab2';
var TAB3_ID = 'tab3';

var ALERT_TIMEOUT = 5000;
var ALERT_FADEOUT = 2000;
var SELECTED_CELL_CLASS = 'selected'; // CSS class add edto a selected grid while dragging.
var DEFAULT_TIME = "00:00";
var TIME_FORMAT = 'hh:mma';
// CSS attribute added to each selected grid. The value would be = the key of the cell 
// that contains the close button for this cell.
var CLOSE_BTN_ATTR_KEY = 'close-btn';
var CLOSE_BTN_CSS_CLASS = 'close-btn';
var CURRENT_COLOR_ATTR_KEY = 'current-color';
var USER_COLOR_ATTR_KEY = 'color';
// var DEFAULT_PERSON_BLUE = '#81D4FA';
var DEFAULT_PERSON_BLUE = '#BBC7DA';
var SIDE_BTN_SCROLL_SPEED = 500;
var SIDE_BTN_ADDITIONAL_DAYS = 3;

var WHITE_COLOR = 'rgba(255, 255, 255, 0)';
var ANIMATION_CLASS_NAME = 'animate';
// Incremented when each new alert is displayed. Used to ensure unique ID for all alerts.
var alertCount = 0;
var gridStartDate; // A moment js day beginning obtained using .startOf('day')
var gridEndDate; // A moment js day beginning obtained using .endOf('day')
var firstSelectedDay; // String of format 'yyyy-mm-dd'
var isdragging = false;

var currentTab; // Stores the ID of the current tab to one of TAB1_ID, TAB2_ID or TAB3_ID
var user_count = 0;

// Contains the list of IDs of all the users currently displayed on the screen. This array may be 
// empty but it should never be null or undefined.
var userIdList = []; 
// Used to set the colors of the bubbles. This is used instead of the length of userIdList because if you use 
// the length of userIdList and then add 2 users, remove the 1st one and then add someone else, the final 2 users 
// on the panel would have the same color.
var numOfAddedUsers = 0;

var CALENDER_ENDPOINT = '/calendars';
var CALENDER_ENDPOINT = '/calendars';

// ~~~~~~~~~~~~~ Algolia ~~~~~~~~~~~~~ 
	var client;
	var index;
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/* 
cellKeyToUserSet simulates a list of HashSets. Each field corresponds to a given cell (i.e. 30min slot) while 
the value is an object with fields names that are the ID of each user that is busy in that time slot.

	{
		cellKey1 : {
			userId1: true,
			userId2: true
		},
		cellKey2: {
			userId1: true,
			userId4: true
		}, ...
	}
For further details, see: http://stackoverflow.com/questions/3042886/set-data-structure-of-java-in-javascript-jquery
*/ 
var cellKeyToUserSet = {}; // maps each cell Key to a set of user IDs for users that have a meeting in that timeslot.
/*
Color source: https://www.google.com/design/spec/style/color.html#color-color-palette
#FF8F00: Amber 800
#EA80FC: Purple A100
#2E7D32: Green 800
#C2185B: Pink 700
#64B5F6: Blue 300
#FDD835: Yellow 600
#6A1B9A: Purple 800
#00E676: Green A400
#A1887F: Brown 300
*/
var colorPalette = ['#FF8F00', '#EA80FC', '#2E7D32', '#C2185B', '#64B5F6', '#FDD835', '#6A1B9A', '#00E676', '#A1887F'];


$(document).ready(function(){

	$('.tab-btn').click(function(e){
		$('.tab-btn').removeClass('active');
		$(this).addClass('active');
		var tabId = $(this).attr('tab-id');
		if(tabId == TAB1_ID){
			switchToTab1();
		}else if(tabId == TAB2_ID){
			switchToTab2();
		}else{
			switchToTab3();
		}
	});

	// ~~~~~ Start initializing datepicker ~~~~~
	/*
		Do not try to initialize all date picker objects with common code e.g.
			$('.class-name').datepicker({	autoclose: true });
		The reason is because you can initialize the objects only once and there are 
		custom things we need to do (during initialization) that are specific to 
		individual datepickers below.
	*/

	/*
		startDate: '+1d', '+1w', '+1m', '0d', or '-1d'
			Note that the '+' must be included for +ve days
	*/

	var dp1 = $('#dp1').datepicker({
		format: 'mm/dd/yyyy',
		autoclose: true,
		// startDate: '0d',
		todayHighlight: true,
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {
		// console.log('clicked dp1');
		// console.log($('#dp1').val());
	}).data('datepicker');

	
	var dp2 = $('#dp2').datepicker({
		format: 'mm/dd/yyyy',
		autoclose: true,
		// startDate: '0d',
		todayHighlight: true,
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {

	}).data('datepicker');


	var dp3 = $('#m-date').datepicker({
		format: 'D, M d, yyyy',
		autoclose: true,
		// startDate: '0d',
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {

	}).data('datepicker');
	// ~~~~~ Finished initializing datepicker ~~~~~

	$('#tr').on('scroll', function (e) {
		e.stopPropagation();
	    e.preventDefault();
	    // If scrolled horizontally, simply scroll the bottom right panel and allow 
	    // the bottom right's handler to perform all the fancy stuff.
	    $('#br').scrollLeft($(this).scrollLeft());
	});

	$('#bl').on('scroll', function (e) {
		e.stopPropagation();
	    e.preventDefault();
	    // If scrolled vertically, simply scroll the bottom right panel and allow 
	    // the bottom right's handler to perform all the fancy stuff.
	    $('#br').scrollTop($(this).scrollTop());
	});

	$('#br').on('scroll', function (e) {
		e.stopPropagation();
	    e.preventDefault();

	    // Vertical scrolling
	    $('#bl').scrollTop($(this).scrollTop());

	    // Horizontal scrolling
	    // If the event originated in this item, the top right panel will be scrolled to the same location.
	    $('#tr').scrollLeft($(this).scrollLeft());
	    
	    activateCalendarSideBtns();
	});

	$('.grid-side-btn.left').click(function() {
		$('#br').animate({
			scrollLeft: $('#br').scrollLeft() - 202 // 101 corresponds to the width of each column
		}, SIDE_BTN_SCROLL_SPEED);
		if($(this).hasClass('active')) {
			downloadEarlierDays();
		}
	});

	$('.grid-side-btn.right').click(function() {
		$('#br').animate({
			scrollLeft: $('#br').scrollLeft() + 202 // 101 corresponds to the width of each column
		}, SIDE_BTN_SCROLL_SPEED);
		if($(this).hasClass('active')) {
			downloadLaterDays();
		}
	});

	$('.container').on('click', '#alert-panel .close', function() {
		$(this).parent().parent().remove();
	});

	$("#m-guest-search").focus(function(){
		$("#m-guest-search-btn").hide();
	});

	$("#m-guest-search").focusout(function(){
		if(!$("#m-guest-search").val().trim()){
			$("#m-guest-search-btn").show();
		}
	});

	$("#save-btn").click(function(){
		saveMeeting();
	});

	$("#cancel-btn").click(function(){
		cancelMeetingNotYetCreated();
	});

	$("#m-title").keyup(function(e) {
	    if (e.keyCode == 13) { // Enter key
	    	$("#m-location").focus();
		}
	});

	$("#m-location").keyup(function(e) {
	    if (e.keyCode == 13) { // Enter key
	    	$("#m-desc").focus();
		}
	});

	$('#guests-content').on('click', ' .name-list-close', function(){
		var userId = $(this).attr('data-user-id');
		removeUserFromPicsPanel(userId);
		removeUserFromNameList(userId);
		var cellKeyList = removeUserFromCellKeyToUserSetMapping(userId);
		removeUserEventsFromGrid(userId, cellKeyList);
	});


	// Not sure why click is not working here, hence we're using mousedown and touchstart (for mobile devices)
	$('#br').on('mousedown touchstart', ' .c-row .' + CLOSE_BTN_CSS_CLASS, function(e){
		e.stopPropagation(); // Ensures that the div containing the button also gets deleted.
		var key = $(this).parent().attr('key');
		clearSelectedDivsWithCloseBtn(key);
	});


	$(window).on('mouseup', function(){
		if(isdragging){
			mouseUpAfterMouseDown();
		}
	});

	// ~~~~~~~~~~~~~ Algolia ~~~~~~~~~~~~~ 
	client = algoliasearch('SE79GLOIEP', '2de5e4f53a32c9e9db7dbde79a203965');
	index = client.initIndex('ezmeeting_users_test');
	
	autocomplete('#m-guest-search', { hint: true }, [
	    {
	      source: autocomplete.sources.hits(index, { hitsPerPage: 5 }),
	      displayKey: 'displayName', // The text that gets displayed in the input field
	      templates: {
	        suggestion: function(suggestion) {
	          // return suggestion._highlightResult.name.value; // The html that gets shown in the search dropdown
	          return  '<div>' +
	                    '<span class="search-left">' +
	                        '<img src="' + suggestion.pic + '" alt="pic">' +
	                    '</span>' +
	                    '<span class="search-right">' +
	                        suggestion._highlightResult.displayName.value +
	                    '</span>' +
	                  '</div>';
	        }
	      }
	    }
	  ]).on('autocomplete:selected', function(event, suggestion, dataset) {
	    var pic = suggestion.pic;
	    var displayName = suggestion.displayName;
	    var userId = suggestion.objectID;
	    console.log(displayName);
	    console.log(userId);
	    console.log(pic);
	    addNewParticipant(userId, displayName, pic);
	    $("#m-guest-search").val("");
	  });

	  $("#m-guest-search").focusout(function() {
	  	setTimeout(function(){
	  		// To clear the search box when the user tabs out of the box. For some reason, focusout() alone doesn't clear it,
	  		// hence the timeout.
	  		$("#m-guest-search").val("");
	  	}, 5);
  	});

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 



	$('#grid-refresh').click(function(){
		if(!isSpecifiedDateRangeValid()) {
			showError("The start date should be earlier than the end date");
			return;
		}
		if(userIdList.length < 1){
			showWarning("Add participants to the meeting");
			return;
		}
		startAllUserPicAnimation();
		var startDate = moment($('#dp1').data('datepicker').getDate()).startOf('day');
		var endDate = moment($('#dp2').data('datepicker').getDate()).endOf('day');

		$.ajax({
			url: CALENDER_ENDPOINT + "?users=" +  userIdList.join(',') + "&from=" + startDate.format() + "&to=" + endDate.format(),
			type: "GET",
			data: {},
			success: function(data) {

				var userIdListBackup = userIdList.slice(0);

				// Remove all users' previous events
				for(var i = 0; i < userIdList.length; i++){
					var uid = userIdList[i];
					var cellKeyList = removeUserFromCellKeyToUserSetMapping(uid);
					removeUserEventsFromGrid(uid, cellKeyList);	
				}

				var selectedCells = getKeyListOfSelectedCells(); // Get list of selected cells

			 	// Redraw the grids to ensure we're displaying the new range of days. This process also wipes out the selected cells.
			 	clearAllGridDisplayedDays();
				drawGridDays(startDate, endDate);
				userIdList = userIdListBackup;

				// Clear the meeting time if the user refreshes the grid to a period outside the previously 
				// selected meeting time.
				var mt = getSelectedMeetingTime();
				if(mt.startTime && mt.endTime){
					if(mt.startTime < gridStartDate || mt.endTime > gridEndDate){
						$('#m-start').text(DEFAULT_TIME);	
						$('#m-end').text(DEFAULT_TIME);
						$('.m-panel2').hide(); // Hide date & time
						$('.m-panel2c').slideDown(); // Show the instructions
					}
				}

				// Restore selected cells.
				if(selectedCells.length > 0){
					$.each(selectedCells, function(index, value){
						getCellWithKey(value).addClass(SELECTED_CELL_CLASS);
					});
					setDeleteButtonsForDay(getDayStringFromKey(selectedCells[0]), true);
				}	

				for(var i = 0; i < data.length; i++){
				 	var record = data[i];
				 	var userId = record.userId;
				 	var eventList = record.events;

					// Add the user's events
				 	for(var a = 0; a < eventList.length; a++){
				 		var e = eventList[a];
				 		addUserEventToGrid(userId, moment(e.startTime), moment(e.endTime));
				 	}
				 	stopUserPicAnimation(userId);
				 }
				 stopAllUserPicAnimation(); // In case there're users without any returned event.
			},
			error: function(xhr, status, error) {
				console.log("Error: " + error);
				showError("Unable to refresh grid now. Please try again later");
				// $("#dp1").datepicker("update", gridStartDate.toDate());
				// $("#dp2").datepicker("update", gridEndDate.toDate());
				stopAllUserPicAnimation();
			}
		});

	}); // End of grid refresh event handler.


	// ***************************************************************************
	// Beginning of the grid layout
	// ***************************************************************************

	switchToTab1();

	if(!S_MEETING_ID){ // This variable gets set by the server
		console.log('Creating empty grid');
		createEmptyGridForNewMeeting();
	}
	else {
		// Ajax call to retrieve meeting details.
		console.log('Showing previously-created meeting');
		$.ajax({
	        url: '/meetings/data/' + S_MEETING_ID,
	        type: "GET",
	        data: {},
	        success: function(data) {
	            console.log(data);
	            var startTime = moment(data.startTime);
	            var endTime = moment(data.endTime);
	            var description = data.description;
	            var location = data.location;
	            var organizer = data.organizer;
	            var participantsList = data.participants;
				
				$('#m-title').val(data.name);
				$("#m-title").prop('disabled', true);
				$('#m-date').datepicker("update", moment(startTime).startOf('day').toDate());
				$("#m-date").prop('disabled', true);
				$('#m-start').html(startTime.format(TIME_FORMAT));
				$("#m-start").prop('disabled', true);
				$('#m-end').html(endTime.format(TIME_FORMAT));
				$("#m-end").prop('disabled', true);
				$('.m-panel2c').hide(); // Hide the instructions
				$('.m-panel2').slideDown(); // Reveal the date and time.
				$("#m-location").val(location);
				$(".m-top-label").show();
				$("#m-location").prop('disabled', true);
				$("#m-desc").val(description);
				$("#m-desc").prop('disabled', true);
				$(".guests-header").hide();
				$("#m-details-btns").css({'visibility':'hidden'});


				for(var d = moment(startTime).subtract(2, 'd'); d <= moment(startTime).add(3, 'd'); d.add(1, 'd')){
					addDayToGrid(d);
				}

				for(var i = 0; i < participantsList.length; i++){
					var user = participantsList[i];
					addNewParticipant(user.id, user.name, user.pic);
				}
				$(".name-list-close").hide();

	        },
	        error: function(xhr, status, error) {
	            console.log("Error: " + error);
	            showError('Did not find any meeting with ID: ' + S_MEETING_ID);
	            createEmptyGridForNewMeeting();
	        }
	    });
	}

	// ***************************************************************************
	// End of the grid layout
	// ***************************************************************************

	
}); // End of $(document).ready()


function createEmptyGridForNewMeeting() {
	addTimesToGrid();
	addNext7DaysToGrid();
	scrollCalendarToNineAm();
	$("#m-date").prop('disabled', true);
	addNewParticipant(S_USER_ID, S_DISPLAY_NAME, S_PIC_URL);
}

function searchCallback(err, content) {
  if (err) {
    return err;
  }

  console.log('number of hits: ' + content.hits.length);
  console.log('-----------------');
  console.log(content.hits);
  console.log('=================');
  /*
  content.hits.forEach(function(hit) {
    console.log(hit);
  });
*/
}

function clearAllGridDisplayedDays() {
	// Removes all the cells from the grid (including their headings). Leaves only the time cells. This can be 
	// reversed (excluding the cell content) by calling drawGridDays() with the right start and end dates.
	$('.h-col:not(.time)').remove();
	$('.c-col:not(.time)').remove();
	gridStartDate = null;
	gridEndDate = null;
}

function drawGridDays(startDate, endDate) {
	// Redraws all the cells within the range gridStartDate - gridEndDate (including their headings). This is a  
	// reversal of clearAllGridDisplayedDays();
	// If startDate and endDate are specified, the grid is redraw with to
	if(startDate && endDate && (endDate >= startDate)) {
		gridStartDate = null;
		gridEndDate = null;
	}else {
		console.log('cannot redraw grid because of invalid startDate and endDate');
		return;
	}
	for(var day = moment(startDate); day <= moment(endDate); day.add(1, 'days')){
		addDayToGrid(day);
	}
}


function isSpecifiedDateRangeValid() {
	var startDate = moment($('#dp1').data('datepicker').getDate()).startOf('day');
	var endDate = moment($('#dp2').data('datepicker').getDate()).endOf('day');
	return (endDate >= startDate);
}


function getAndDisplayUserEvents(userIdList, startDate, endDate) {
	// Retrieves the calendars from the server and adds them to the calendar. This method expects the calendar grid
	// to already contain the dates between the specified startDate and endDate.
	if(!userIdList || userIdList.length < 1) {
		return;
	}
	userIds = userIdList.join(',');
	for(var i = 0; i < userIdList.length; i++){
		startUserPicAnimation(userIdList[i]);
	}
	$.ajax({
		url: CALENDER_ENDPOINT + "?users=" +  userIds + "&from=" + startDate.format() + "&to=" + endDate.format(),
		type: "GET",
		data: {},
		success: function(data) {
			for(var i = 0; i < data.length; i++){
				var record = data[i];
				var userId = record.userId;
				var eventList = record.events;
				for(var a = 0; a < eventList.length; a++){
					var e = eventList[a];
					addUserEventToGrid(userId, moment(e.startTime), moment(e.endTime));
				}
				stopUserPicAnimation(userId);
			}
			for(var i = 0; i < userIdList.length; i++){
				// Stops the animation for users that may not have any returned event.
				stopUserPicAnimation(userIdList[i]); 
			}
		},
		error: function(xhr, status, error) {
			console.log("Error: " + error);
			showError("Unable to refresh grid now. Please try again later");
			for(var i = 0; i < userIdList.length; i++){
				// Stops the animation for users that may not have any returned event.
				stopUserPicAnimation(userIdList[i]); 
			}
		}
	});
}

function addNewParticipant(userId, displayName, picUrl) {
	if($.inArray(userId, userIdList) > -1) {
		console.log(userId + ' already added');
		return; // It mea
	}
	userIdList.push(userId);
    addUserToNameList(userId, displayName);
    addUserToPicsPanel(userId, displayName, picUrl);
    getAndDisplayUserEvents([userId], gridStartDate, gridEndDate);
}

function addUserEventToGrid(userId, startTime, endTime) {
	var st = roundDownTimeTo30Minutes(startTime);
	var et = roundUpTimeTo30Minutes(endTime);
	
	// Ignore events that are out of the boundaries we care about.
	if(et < gridStartDate || st > gridEndDate){
		return;
	}

	if(et > gridEndDate){
		et = moment(gridEndDate); // For events that ends later that the gridEndDate
	}
	for(var cellTime = moment(st); cellTime < et; cellTime = moment(cellTime).add(30, 'minutes')) {
		var cellKey = getCellKey(cellTime);
		var cell = getCellWithKey(cellKey);

		// Check if the user had a previous appointment at this time slot. Only proceed with this addition if the user did 
		// not have any previous appointment in this time slot.
		if(!cellKeyToUserSet[cellKey][userId]) {
			// Add this to the field that keeps track of the mappings.
			cellKeyToUserSet[cellKey][userId] = true;
			// Add user circle to the relevant grid cells for tab 1.
			cell.prepend('<span class="grid-cell-circle" data-user-id="' + userId + '"></span>');
			// Color the added circle appropriately
			cell.children('span[data-user-id="' + userId + '"]').first().css({'background-color': getUserColor(userId)});
			var numOfMeetings = 0;
			for(var uId in cellKeyToUserSet[cellKey]) {
				if(cellKeyToUserSet[cellKey][uId]){
					numOfMeetings++;
				}
			}
			cell.children('.busy-count').first().html(numOfMeetings);
			// Mark that row as busy in tabs 2 and 3.
			cell.children('.busy-row').addClass('active');
			cell.children('.busy-count').addClass('active');
		}
	}

	// Add user Id to userIdList if missing.
	var index = -1;
	for(var i = 0; i < userIdList.length; i++){
		if(userIdList[i] == userId){
			index = i;
			break;
		}
	}
	if(index === -1) {
		userIdList.push(userId);
	}
}

// Removes all the user's bubbles from tab 1. In tab 2 and tab 3, it also disables the gray colors and updates the cell 
// counts appropriately. Note that cellKeyToUserSet ( a field) should be updated before calling this function.
function removeUserEventsFromGrid(userId, cellKeyList) {
	$('span.grid-cell-circle[data-user-id="' + userId + '"]').remove();
	for(var i = 0; i < cellKeyList.length; i++){
		var cellKey = cellKeyList[i];
		var numOfMeetings = 0;
		for(var uId in cellKeyToUserSet[cellKey]) {
			if(cellKeyToUserSet[cellKey][uId]){
				numOfMeetings++;
			}
		}
		var cell = getCellWithKey(cellKey);
		if(numOfMeetings){
			cell.children('.busy-count').first().html(numOfMeetings);
		} else {
			cell.children('.busy-row').removeClass('active');
			cell.children('.busy-count').removeClass('active');
		}
	}
}

// Removes all the user's entries from the map and returns the keys of all the cells in which the user had an event.
// Also removes the user Id from the userIdList
function removeUserFromCellKeyToUserSetMapping(userId) {
	var cellKeysOfUserEvents = [];
	for(var cellKey in cellKeyToUserSet) {
		if(cellKeyToUserSet[cellKey][userId]){
			cellKeysOfUserEvents.push(cellKey);
			cellKeyToUserSet[cellKey][userId] = false;
		}
	}

	var index = -1;
	for(var i = 0; i < userIdList.length; i++){
		// Don't use === because the ID could be a number or string.
		if(userIdList[i] == userId){
			index = i;
			break;
		}
	}
	if(index != -1) {
		userIdList.splice(index, 1);
	}

	return cellKeysOfUserEvents;
}

function getUserColor(userId) {
	// Returns the color from the user's .grid-person attribute
	return getGridPersonFromGridPanel(userId).attr('color');
}

function getCellKey(cellTime) {
	// Expects a moment time object
	return cellTime.format('_YYYY-MM-DD_HH-mm');
}


function roundDownTimeTo30Minutes(time) {
	// Truncates the time to the most recent 30 minute in the past
	var duration = 30 * 60 * 1000;
	return moment(Math.floor((+time) / duration) * duration);
}

function roundUpTimeTo30Minutes(time) {
	// Rounds up the time to the most recent 30 minute in the future
	var duration = 30 * 60 * 1000;
	return moment(Math.ceil((+time) / duration) * duration);
}

function mouseEnterCell(key) {
	if(isdragging && (getDayStringFromKey(key) === firstSelectedDay)) {
		getCellWithKey(key).addClass(SELECTED_CELL_CLASS);
	}
	var objectOfUserIDs = cellKeyToUserSet[key];
	$('.person-img-overlay').removeClass('inviz');
	for (var userId in objectOfUserIDs) {
		if(objectOfUserIDs[userId]){
			var frame = getUserFrameFromGridPanel(userId);
			frame.css({'background-color': frame.parent().attr(CURRENT_COLOR_ATTR_KEY)});
			var gridPerson = getGridPersonFromGridPanel(userId);
			gridPerson.children('.person-img-overlay').addClass('inviz');
		}
	}
}

function getKeyListOfSelectedCells() {
	var selectedKeys = [];
	$('.c-row.selected').each(function(){
		selectedKeys.push($(this).attr('key'));
	});
	return selectedKeys;
}

function mouseLeaveCell(key) {
	var objectOfUserIDs = cellKeyToUserSet[key];
	for (var userId in objectOfUserIDs) {
		if(objectOfUserIDs.hasOwnProperty(userId)){
			var frame = getUserFrameFromGridPanel(userId);
			frame.css({'background-color': WHITE_COLOR});
		}
	}
	$('.person-img-overlay').addClass('inviz');
}

function clearSelectedDivsWithCloseBtn(key) {
	$( 'div[' + CLOSE_BTN_ATTR_KEY + '="' + key + '"]').each(function(){
		clearThisSelectedCell($(this));
	});
}

function clearAllSelectedCells(doNotUpdateUI) {
	 $('.c-row.' + SELECTED_CELL_CLASS).each(function(){
	 	clearThisSelectedCell($(this), doNotUpdateUI);
	 });
}

// Expects a jQuery object
function clearThisSelectedCell(cell, doNotUpdateUI) {
	var cellKey = cell.attr('key');
	cell.removeClass(SELECTED_CELL_CLASS);
	cell.removeAttr(CLOSE_BTN_ATTR_KEY);
	cell.find('.' + CLOSE_BTN_CSS_CLASS).remove();
	// The next line ensures that the time input fields get set to the right values.
	setDeleteButtonsForDay(getDayStringFromKey(cellKey), doNotUpdateUI);
}

function mouseDownOnCell(key) {
	if(firstSelectedDay && (firstSelectedDay != getDayStringFromKey(key))) {
		// Clear the grid if slots from a different day were already highlighted.
		clearAllSelectedCells(true);

	}
	isdragging = true;
	firstSelectedDay = getDayStringFromKey(key);
	$("#m-date").datepicker("update", moment(firstSelectedDay).toDate());
	mouseEnterCell(key);
}

function mouseUpAfterMouseDown() {
	isdragging = false;
	setDeleteButtonsForDay(firstSelectedDay);
}

// dayString should be a string of format 'yyyy_mm_dd'
// doNotUpdateUI is a boolean value whose aim is to make it possible to prevent the meeting time from temporarily 
// flashing 00:00 in the UI when this is not desired e.g. when making another selection in a different date.
function setDeleteButtonsForDay(dayString, doNotUpdateUI) {
	var startTime = DEFAULT_TIME;
	var endTime = DEFAULT_TIME;

	$('.c-col._' + dayString + ' .' + CLOSE_BTN_CSS_CLASS).remove(); // Remove all previous delete buttons for that day's row.
	var dayTimes = getDayTimes();
	var isEarlierCellSelected = false;
	var keyOfSelectedCell;
	for(var i = 0; i < dayTimes.length; i++) {
		var cellKey = '_' + dayString + '_' + dayTimes[i];
		var cell = getCellWithKey(cellKey);
		if(cell.hasClass(SELECTED_CELL_CLASS)){
			if(!isEarlierCellSelected){
				isEarlierCellSelected = true;
				keyOfSelectedCell = cellKey;
				addDeleteButton(cell);
				startTime = keyToDateObject(cellKey).format('hh:mma');
				endTime = keyToDateObject(cellKey).add(30, 'minutes').format('hh:mma');
			}
			cell.attr(CLOSE_BTN_ATTR_KEY, keyOfSelectedCell);
			endTime = keyToDateObject(cellKey).add(30, 'minutes').format('hh:mma');
		} else {
			isEarlierCellSelected = false;
		}
	}
	if(doNotUpdateUI) {
		return;
	} else {
		$('#m-start').text(startTime);
		$('#m-end').text(endTime);
		if(startTime === DEFAULT_TIME && endTime === DEFAULT_TIME) {
			$("#m-date").val('');
			$('.m-panel2').hide(); // Hide date & time
			$('.m-panel2c').slideDown(); // Show the instructions
		} else {
			$('.m-panel2c').hide(); // Hide the instructions
			$('.m-panel2').slideDown(); // Reveal the date and time.
		}
	}
}

function addDeleteButton(cell) {
	// Cell should be a jquery object.
	cell.append(
		'<div class="fa fa-close ' + CLOSE_BTN_CSS_CLASS + '"></div>'
	);
}

function getDayStringFromKey(key){
	return key.split('_')[1];
}

// Expects key in the form "HH-mm" and returns string in the form: 12:30am , 11:30pm, etc
function getTimeStringFromKey(key){
	var tokens = key.split('_')[2].split('-'); // Time in the form 11:00, 23:30, etc.
	return get12HourString(Number(tokens[0]), Number(tokens[1]));
}

function keyToDateObject(key){
	var tokens = key.split('_');
	return moment(tokens[1] + " " + tokens[2].replace("-", ":"));
}

// Returns jQuery object
function getCellWithKey(key) {
	return $( 'div[key="' + key + '"]').first();
}

function addNext7DaysToGrid() {
	var startOfToday = moment().startOf('day');
	var endOfLastDay;
	for(var day = moment(startOfToday); day < moment(startOfToday).add(7, 'day'); day.add(1, 'day')) {
		endOfLastDay = moment(day).endOf('day');
		addDayToGrid(day);
	}
}

// Expects a moment day object. Note that this function simply updates the grid and the relevant fields. 
// It does not check whether the added date is going to create gaps in the grid dates.
function addDayToGrid(day) {
	var dayKey = day.format('_YYYY-MM-DD');
	var tableHeading = day.format ('ddd M/D');
	var eod = moment(day).endOf('day');
	var sod = moment(day).startOf('day');
	if(!gridEndDate || (eod > gridEndDate)) {
		$('#tr').append(
			'<div class="h-col">' + tableHeading + '</div>'
		);
		$('#br').append(
			'<div class="c-col ' + dayKey + '">'
		);
		addRowsToDayCol($('.' + dayKey).first(), dayKey);
		gridEndDate = eod;
		// Using startOf() because the datepicker will not highlight a date unless it is at time 00:00
		// Figured this out through random debugging.
		$("#dp2").datepicker("update", moment(gridEndDate).startOf('days').toDate()); 
		if(!gridStartDate){
			// This loop will execute if both gridStartDate and gridEndDate were undefined.
			gridStartDate = sod; 
			$("#dp1").datepicker("update", gridStartDate.toDate());
		}
	}
	else if(!gridStartDate || (sod < gridStartDate)) {
		$('#tr').prepend(
			'<div class="h-col">' + tableHeading + '</div>'
		);
		$('#br').prepend(
			'<div class="c-col ' + dayKey + '">'
		);
		addRowsToDayCol($('.' + dayKey).first(), dayKey);
		gridStartDate = sod;
		$("#dp1").datepicker("update", gridStartDate.toDate());
	}
	activateCalendarSideBtns();
}

function addRowsToDayCol(dayCol, dayKey){
	var listOfTimeStrings = getDayTimes();
	for(var i = 0; i < listOfTimeStrings.length; i++) {
		var classNames = 'c-row';
		var timeString = listOfTimeStrings[i];
		if(timeString.indexOf('30') > -1) {
			classNames += ' thirty';
		}
		var cellKey = dayKey + '_' + timeString;
		// .busy-row refers to the shaded rows in tabs 2 and 3, while .busy-count refers to the cell counts in tab 3.
		dayCol.append(
			'<div class="' + classNames + '" key="' + cellKey + '">' +
				'<div class="busy-row"></div>' +
				'<p class="busy-count"></p>' + 
			'</div>'
		);
		dayCol.append();

		// Create an object to keep track of all the IDs of users that are busy in this time slot.
		// See cellKeyToUserSet declaration for details.
		cellKeyToUserSet[cellKey] = {};
	}
}

// Returns list of 00-00 to 23-30
function getDayTimes() {
	var result = [];
	for(var hr = 0; hr < 24; hr++) {
		result.push(addLeadingZero(hr) + '-00');
		result.push(addLeadingZero(hr) + '-30');
	}
	return result;
}

function addAlertPanelIfMissing() {
	if(!$('#alert-panel').length) {
		$('.container').first().prepend('<div id="alert-panel"></div>');
	}
}

function addTimesToGrid() {
	var col = $('.c-col.time');
	for(var hr = 0; hr < 24; hr++) {
		col.append('<div class="c-row">' + getHourWithMeridian(hr) + '</div>');
		col.append('<div class="c-row thirty"></div>');
	}

	// Remove all previous .c-row event listeners and re-attach new ones to ensure that
	// the recently-added .c-row also have the event listeners.
	$("#br").off('mouseenter', ' .c-row');
	$("#br").on('mouseenter', ' .c-row', function(){
		mouseEnterCell($(this).attr('key'));	
	});

	$("#br").off('mouseleave', ' .c-row');
	$("#br").on('mouseleave', ' .c-row', function(){
		mouseLeaveCell($(this).attr('key'));	
	});

	$("#br").off('mousedown', ' .c-row');
	$("#br").on('mousedown', ' .c-row', function(){
		mouseDownOnCell($(this).attr('key'));
	});	
}

function userIdToGridPicId(userId) {
	return 'grid-pic-' + userId;
}

function addUserToPicsPanel(userId, name, picUrl) {
	// The user's ID should be part of userIdList before calling this function.
	var id = userIdToGridPicId(userId);
	var color = colorPalette[ numOfAddedUsers++ % colorPalette.length];
	var currentColor = color;
	if(currentTab != TAB1_ID) {
		currentColor = DEFAULT_PERSON_BLUE;
	}
	$('#pics-panel').prepend(
		// color is the border color on tab1 while current-color would be either the tab1, tab2, or tab3
		// color depending on the current tab.
		'<div class="grid-person" id="' + id + '" ' + USER_COLOR_ATTR_KEY + '="' + color + '" ' + CURRENT_COLOR_ATTR_KEY + '="' + currentColor + '">' +
            '<p class="grid-name">' + name + '</p>' +
            '<div class="person-frame"></div>' +
            '<img src="' + picUrl + '" alt="' + name + '">' +
            '<div class="person-img-overlay inviz"></div>' +
        '</div>'
	);
	$('#' + id + ' img').first().css({'border-color': currentColor});

	var frame = getUserFrameFromGridPanel(userId);
	frame.css({'border-color': currentColor});

	// startUserPicAnimation(userId);
}

function removeUserFromPicsPanel(userId) {
	var id = userIdToGridPicId(userId);
	$("#" + id).remove();
}

function userIdToListId(userId) {
	return 'user-list-' + userId;
}

function addUserToNameList(userId, name) {
	var id = userIdToListId(userId);
	$('#guests-content').prepend(
		'<div class="guests-row inviz" id="' + id + '">' +
            '<i class="fa fa-close name-list-close" data-user-id="' + userId + '"></i>' +
            '<p class="name">' + name + '</p>' +
        '</div>'
	);
	$('#'+id).slideDown(function(){
		$(this).removeClass('inviz');
	});
	$('#guests-count').html($('.guests-row').length);
}

function removeUserFromNameList(userId) {
	var id = userIdToListId(userId);
	$('#'+id).slideUp(function(){
		$(this).remove();
		$('#guests-count').html($('.guests-row').length);
	});
}


function getUserFrameFromGridPanel(userId){
	// Returns the .person-frame jQuery object of the user with the specified ID
	return $('#' + userIdToGridPicId(userId) + ' .person-frame').first();
}

function getGridPersonFromGridPanel(userId){
	// Returns the .grid-person jQuery object of the user with the specified ID
	return $('#' + userIdToGridPicId(userId));
}

function startUserPicAnimation(userId) {
	var frame = getUserFrameFromGridPanel(userId);
	frame.css({'border-color': WHITE_COLOR});
	frame.css({'border-top-color': frame.parent().attr(CURRENT_COLOR_ATTR_KEY)});
	frame.addClass(ANIMATION_CLASS_NAME);
}

function startAllUserPicAnimation() {
	for(var i = 0; i < userIdList.length; i++) {
		startUserPicAnimation(userIdList[i]);
	}
}

function stopUserPicAnimation(userId) {
	var frame = getUserFrameFromGridPanel(userId);
	frame.removeClass(ANIMATION_CLASS_NAME);
	frame.css({'border-color': frame.parent().attr(CURRENT_COLOR_ATTR_KEY)});
}

function stopAllUserPicAnimation() {
	for(var i = 0; i < userIdList.length; i++){
		stopUserPicAnimation(userIdList[i]);
	}
}

function switchToTab1() {
	if(currentTab == TAB1_ID){
		return;
	}
	$('.grid-person').each(function(){
		switchUserBorderColor($(this), $(this).attr(USER_COLOR_ATTR_KEY));
	});
	currentTab = TAB1_ID;
	$('.tab-content').first().removeClass(TAB2_ID);
	$('.tab-content').first().removeClass(TAB3_ID);
	$('.tab-content').first().addClass(TAB1_ID);
}

// Expects a jquery object that contains class name grid-person.
function switchUserBorderColor(user, newColor) {
	user.attr(CURRENT_COLOR_ATTR_KEY, newColor);
	user.find('img').first().css({'border-color': newColor});
	frameObject = user.find('.person-frame').first();
	if(frameObject.hasClass(ANIMATION_CLASS_NAME)){
		frameObject.css({'border-top-color': newColor});
	} else {
		frameObject.css({'border-color': newColor});
	}
}

function switchToTab2() {
	if(currentTab == TAB2_ID){
		return;
	}
	if(currentTab == TAB1_ID){
		// Only set colors for tab1 because the colors should remain the same between tab2 and tab3
		switchAllUsersBorderColor(DEFAULT_PERSON_BLUE);
	}
	currentTab = TAB2_ID;
	$('.tab-content').first().removeClass(TAB1_ID);
	$('.tab-content').first().removeClass(TAB3_ID);
	$('.tab-content').first().addClass(TAB2_ID);
}

function switchToTab3() {
	if(currentTab == TAB3_ID){
		return;
	}
	if(currentTab == TAB1_ID){
		// Only set colors for tab1 because the colors should remain the same between tab2 and tab3
		switchAllUsersBorderColor(DEFAULT_PERSON_BLUE);
	}
	currentTab = TAB3_ID;
	$('.tab-content').first().removeClass(TAB1_ID);
	$('.tab-content').first().removeClass(TAB2_ID);
	$('.tab-content').first().addClass(TAB3_ID);
}

function switchAllUsersBorderColor(newColor) {
	$('.grid-person').each(function(){
		switchUserBorderColor($(this), newColor);
	});
}

/*
 Takes in a value between 0-24 and returns a value like 12am, 2am,..., 23pm
*/
function getHourWithMeridian(hr) {
	if(hr === 0 || hr === 24){
		return '12am';
	}
	var suffix = 'am';
	if( hr > 11 && hr < 24){
		suffix = 'pm';
	}
	if(hr <= 12){
		return hr + suffix;
	}
	else {
		return (hr - 12) + suffix;
	}
}

/*
	Takes in hr values between 0-24 and min values. Returns strings like 12:01am, 09:24am, 11:59pm, etc.
*/
function get12HourString(hr, min) {
	hr = Number(hr);
	min = Number(min);
	var suffix = 'am';
	var hr2 = addLeadingZero(hr);
	if(hr === 24 || hr === 0) {
		hr2 = '12';
	}
	else if (hr > 12){
		hr2 = addLeadingZero(hr - 12);
		suffix = 'pm';
	}
	else if(hr === 12){
		suffix = 'pm';
	}
	return hr2 + ':' + addLeadingZero(min) + suffix;
}

function parse12HrTime(timeString){
	// Expects a 6-digit string of the form: 02:05AM
	var hour = Number(timeString.substring(0, 2));
	var min = Number(timeString.substring(3, 5));
	var meridian = timeString.substring(5);
	if(meridian.toUpperCase().startsWith('P')) {
		if(hour != 12) {
			hour += 12;
		}
	}
	else if (hour === 12){
		hour = 0;
	}
	return {hour: hour, min:min};
}

function showInfo(mssg) {
	addAlertPanelIfMissing();
	var id = 'info-' + alertCount++;
	$('#alert-panel').append(
		'<div>' +
			'<div class="alert info" id="' + id + '">' + mssg + '<span class="close">X</span></div>' +
		'</div>'
	);
	setTimeout(function() { 
		$("#" + id).parent().fadeOut(ALERT_FADEOUT, function(){
			$("#" + id).parent().remove();
		});
	}, ALERT_TIMEOUT);
}

function showWarning(mssg) {
	addAlertPanelIfMissing();
	var id = 'warning-' + alertCount++;
	$('#alert-panel').append(
		'<div>' +
			'<div class="alert warning" id="' + id + '">' + mssg + '<span class="close">X</span></div>' +
		'</div>'
	);
	setTimeout(function() { 
		$("#" + id).parent().fadeOut(ALERT_FADEOUT, function(){
			$("#" + id).parent().remove();
		});
	}, ALERT_TIMEOUT);
}

function hideLoadingSpinner() {
	$('.alert.loading').remove();
}

function showLoading(mssg) {
	// It's up to the caller to hide the spinner by calling hideLoadingSpinner()
	// Source of loading PNG: http://www.chimply.com/Generator#classic-spinner,loopingCircle
	addAlertPanelIfMissing();
	var id = 'loading-' + alertCount++;
	$('#alert-panel').append(
		'<div>' +
			'<div class="alert loading" id="' + id + '">' + mssg + '<img src="/img/rolling.gif" alt="loading" class="loading-pic">' +
		'</div>'
	);
}

function showError(mssg) {
	addAlertPanelIfMissing();
	var id = 'info-' + alertCount++;
	$('#alert-panel').append(
		'<div>' +
			'<div class="alert error" id="' + id + '">' + mssg + '<span class="close">X</span></div>' +
		'</div>'
	);
	setTimeout(function() { 
		$("#" + id).parent().fadeOut(ALERT_FADEOUT, function(){
			$("#" + id).parent().remove();
		});
	}, ALERT_TIMEOUT);
}

function scrollCalendarToNineAm() {
	var gridRowHeight = $($('.c-row')[0]).outerHeight();
	$('#bl').scrollTop(gridRowHeight * 18); // Scroll to 9am
}

function activateCalendarSideBtns() {
	var left = $('#br').scrollLeft();
	var threshold = 50; // Activate the left or right btn if the distance from the scroll bar to the edge is less than this threshold.

	var leftBtn = '.grid-side-btn.left';
	if(left < threshold) {
    	// Enable left download
		if(!$(leftBtn).hasClass('active')) {
			$(leftBtn).addClass('active');
		}
    } 
    else {
    	$(leftBtn).removeClass('active');
    }

    var rightBtn = '.grid-side-btn.right';
    if((left + $('#br').innerWidth()) >= ($('#br')[0].scrollWidth - threshold)) {
    	// Enable right download
	    if(!$(rightBtn).hasClass('active')) {
	    	$(rightBtn).addClass('active');
	    }
    }
    else {
		$(rightBtn).removeClass('active');
	}
}

function addLeadingZero(int) {
	if(int < 10) {
		return '0' + int;
	} else {
		return '' + int;
	}
}

function downloadEarlierDays() {
	var endDate = moment(gridStartDate).subtract(1 , 'day').endOf('day');
	var startDate = moment(endDate).subtract((SIDE_BTN_ADDITIONAL_DAYS - 1), 'day').startOf('day');
	console.log('downloading earlier events');
	console.log('start: ' + startDate.format());
	console.log('end: ' + endDate.format());
	// Note: This has to be done in reverse order. Otherwise, we'll end up with gaps in the grid dates and this would lead to an error.
	for(var day = moment(endDate); day >= startDate; day.subtract(1, 'days')){
		addDayToGrid(day);
	}
	getAndDisplayUserEvents(userIdList, startDate, endDate);
}

function downloadLaterDays() {
	var startDate = moment(gridEndDate).add(1, 'day').startOf('day');
	var endDate = moment(startDate).add((SIDE_BTN_ADDITIONAL_DAYS - 1) , 'day').endOf('day');
	console.log('downloading later events');
	console.log('start: ' + startDate.format());
	console.log('end: ' + endDate.format());
	for(var day = moment(startDate); day <= endDate; day.add(1, 'days')){
		addDayToGrid(day);
	}
	getAndDisplayUserEvents(userIdList, startDate, endDate);
}

function saveMeeting() {
	console.log(">>> Todo: implement save");
	var title = $("#m-title").val().trim();
	if(!title){
		showError("Please enter a meeting title");
		return;
	}
	var location = $("#m-location").val().trim();
	var description = $("#m-desc").val().trim();
	console.log(title);
	console.log(location);
	console.log(description);

	var st = $('#m-start').html();
	var et = $('#m-end').html();
	if(st === DEFAULT_TIME && et === DEFAULT_TIME){
		showError('Select meeting time by clicking or dragging on the grid');
		return;
	}
	var date = moment($('#m-date').data('datepicker').getDate());
	console.log(date.format());
	var pst = parse12HrTime(st);
	var startTime = moment(date).hour(pst.hour).minute(pst.min);
	console.log(startTime.format());

	var pet = parse12HrTime(et);
	var endTime = moment(date).hour(pet.hour).minute(pet.min);
	console.log(endTime.format());

	if(startTime < moment()){
		showError("Meeting time should be in the future");
		return;
	}

	if(userIdList.length < 1){
		showError("Add at least one participant");
		return;
	}
	
	listOfParticipants = [];
	$.each(userIdList, function(index, userId){
		var gridPerson = getGridPersonFromGridPanel(userId);
		var displayName = gridPerson.children('.grid-name').first().html();
		listOfParticipants.push({
			id: userId,
			name: displayName
		});
	});
	showLoading("Saving your meeting");
	$.ajax({
		url: "/meetings",
		type: "POST",
		data: {
			name: title,
			startTime: startTime.format(),
			endTime: endTime.format(),
			description: description,
			location: location,
			organizer: {
				id: S_USER_ID,
				name: S_DISPLAY_NAME
			},
			participants: listOfParticipants
		},

		success: function(data) {
			hideLoadingSpinner();
			window.localStorage.setItem('mssg', 'Invitation sent to all participants');
			window.localStorage.setItem('time', moment().format());
			goToUrl("/home");
		},
		error: function(xhr, status, error) {
			hideLoadingSpinner();
			showError("An error occurred while saving your meeting. Please retry.");
		}
	});

}

function getSelectedMeetingTime() {
	// It's up to the caller to ensure that the user has actually selected a time.
	var st = $('#m-start').html();
	var et = $('#m-end').html();
	if(st === DEFAULT_TIME && et === DEFAULT_TIME){
		return {startTime: null, endTime: null};
	}
	var date = moment($('#m-date').data('datepicker').getDate());

	var pst = parse12HrTime(st);
	var startTime = moment(date).hour(pst.hour).minute(pst.min);

	var pet = parse12HrTime(et);
	var endTime = moment(date).hour(pet.hour).minute(pet.min);
	return {startTime: startTime, endTime: endTime};
}

function goToUrl(url){
	window.location.href = url;
}

function cancelMeetingNotYetCreated(){
	goToUrl("/home");
}

function algoliaSearch(query) {
	// Callback example
	index.search(query, function searchDone(err, content) {
	  // err is either `null` or an `Error` object, with a `message` property
	  // content is either the result of the command or `undefined`

	  if (err) {
	    console.error(err);
	    return;
	  }

	  console.log(content);
	});
}


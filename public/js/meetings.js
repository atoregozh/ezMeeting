var TAB1_ID = 'tab1';
var TAB2_ID = 'tab2';
var TAB3_ID = 'tab3';

var ALERT_TIMEOUT = 5000;
var ALERT_FADEOUT = 2000;
var SELECTED_CLASS = 'selected'; // CSS class add edto a selected grid while dragging.
var DEFAULT_TIME = "00:00";
// CSS attribute added to each selected grid. The value would be = the key of the cell 
// that contains the close button for this cell.
var CLOSE_BTN_ATTR_KEY = 'close-btn';
var CLOSE_BTN_CSS_CLASS = 'close-btn';
var CURRENT_COLOR_ATTR_KEY = 'current-color';
var USER_COLOR_ATTR_KEY = 'color';
// var DEFAULT_PERSON_BLUE = '#81D4FA';
var DEFAULT_PERSON_BLUE = '#BBC7DA';

var WHITE_COLOR = 'rgba(255, 255, 255, 0)';
var ANIMATION_CLASS_NAME = 'animate';
// Incremented when each new alert is displayed. Used to ensure unique ID for all alerts.
var alertCount = 0;
var gridStartDate; // A moment js day beginning obtained using .startOf('day')
var gridEndDate; // A moment js day beginning obtained using .startOf('day')
var firstSelectedDay; // String of format 'yyyy-mm-dd'
var isdragging = false;

var currentTab; // Stores the ID of the current tab to one of TAB1_ID, TAB2_ID or TAB3_ID
var user_count = 0;

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
#FDD835: Yellow 600
#6A1B9A: Purple 800
#00E676: Green A400
#A1887F: Brown 300
*/
var colorPalette = ['#FF8F00', '#EA80FC', '#2E7D32', '#C2185B', '#FDD835', '#6A1B9A', '#00E676', '#A1887F'];

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
		startDate: '0d',
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {
		// console.log('clicked dp1');
		// console.log($('#dp1').val());
	}).data('datepicker');

	
	var dp2 = $('#dp2').datepicker({
		format: 'mm/dd/yyyy',
		autoclose: true,
		startDate: '0d',
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {

	}).data('datepicker');


	var dp3 = $('#m-date').datepicker({
		format: 'D, M d, yyyy',
		autoclose: true,
		startDate: '0d',
		orientation: 'left bottom'
	}).on('changeDate', function(ev) {

	}).data('datepicker');
	// ~~~~~ Finished initializing datepicker ~~~~~

	// // ~~~~~ Start initializing timepicker ~~~~~

	// $('#m-start').timepicker({
	// 	minuteStep: 5,
	// 	template: 'modal',
	// 	appendWidgetTo: 'body',
	// 	showSeconds: false,
	// 	showMeridian: true, // true ==> 12hr mode, false ==> 24hr mode
	// 	defaultTime: '09:00', // could be 'current', 'false' or a value like '11:45AM'
	// });

	// $('#m-start').timepicker().on('changeTime.timepicker', function(e) {
	// 	// console.log('The start hour is ' + e.time.hours);
	// 	// console.log('The start minute is ' + e.time.minutes);
	// });

	// $('#m-end').timepicker({
	// 	minuteStep: 5,
	// 	template: 'modal',
	// 	appendWidgetTo: 'body',
	// 	showSeconds: false,
	// 	showMeridian: true, // true ==> 12hr mode, false ==> 24hr mode
	// 	defaultTime: '09:00', // could be 'current', 'false' or a value like '11:45AM'
	// });

	// $('#m-end').timepicker().on('changeTime.timepicker', function(e) {
	// });

	// // ~~~~~ Finished initializing timepicker ~~~~~


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
		$('#br').scrollLeft($('#br').scrollLeft() - 101); // 101 corresponds to the width of each column
		if($(this).hasClass('active')) {
			downloadEarlierDays();
		}
	});

	$('.grid-side-btn.right').click(function() {
		$('#br').scrollLeft($('#br').scrollLeft() + 101); // 101 corresponds to the width of each column
		if($(this).hasClass('active')) {
			downloadLaterDays();
		}
	});

	$('#alert-panel').on('click', '.close', function() {
		$(this).parent().parent().remove();
	});


	// ~~~~~ Start of test div ~~~~~

	$('#b1').click(function() {
		showInfo('Yay! New info :)');
	});

	$('#b2').click(function() {
		showError('Uh oh! New Error :(');
	});

	$('#b3').click(function() {
		showWarning('Be careful! This is a warning.');
	});

	$('#b4').click(function() {
		counter = user_count++; 
		userId = counter;
		name = 'Will Smith ' + counter;
		addUserToPicsPanel(userId, name, '/img/default-user-pic.jpg');
		addUserToNameList(userId, name);
	});

	// ~~~~~ End of test div ~~~~~

	$("#m-guest-search").focus(function(){
		$("#m-guest-search-btn").hide();
	});

	$("#m-guest-search").focusout(function(){
		if(!$("#m-guest-search").val().trim()){
			$("#m-guest-search-btn").show();
		}
	});

	$("#m-guest-search").keyup(function(e) {
	    if (e.keyCode == 13) { // Enter key
	        var input = $("#m-guest-search").val().trim();
	        $("#m-guest-search").val("");
	        if(!input) {
	        	return;
	        }

	        // Todo: delete this test code that creates a fake
	        // ~~~~~~~~~~~~~~~~~~~~~
	        if(typeof testUserId === 'undefined') {
	        	testUserId = 0;
	        }
	        user = {
	        	id: testUserId++,
	        	name: input,
	        	pic: '/img/default-user-pic.jpg',
	        };
	        // ~~~~~~~~~~~~~~~~~~~~~

	        addUserToNameList(user.id, user.name);
	        addUserToPicsPanel(user.id, user.name, user.pic);
	        getUserCalendar([user.id]);

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
	$('#br').on({
		'mousedown': function(e){
			e.stopPropagation(); // Ensures that the div containing the button also gets deleted.
			var key = $(this).parent().attr('key');
			clearSelectedDivsWithCloseBtn(key);
		},
		'touchstart': function(e){
			e.stopPropagation(); // Ensures that the div containing the button also gets deleted.
			var key = $(this).parent().attr('key');
			clearSelectedDivsWithCloseBtn(key);
		}
	}, ' .c-row .' + CLOSE_BTN_CSS_CLASS);


	$(window).on('mouseup', function(){
		if(isdragging){
			mouseUpAfterMouseDown();
		}
	});

	switchToTab1();
	addTimesToGrid();
	add7DaysToGrid();
	scrollCalendarToNineAm();

	// $('#m-start').timepicker('setTime', DEFAULT_TIME);
	// $('#m-end').timepicker('setTime', DEFAULT_TIME);

	$("#m-date").prop('disabled', true);
	// $("#m-start").prop('disabled', true);
	// $("#m-end").prop('disabled', true);
	
}); // End of $(document).ready()

function getUserCalendar(userIdList) {
	// Retrieves the calendars from the server.
	userIds = userIdList.join(',');
	for(var i = 0; i < userIdList.length; i++){
		animateUserPic(userIdList[i]);
	}
	$.ajax({
		url: "/calendars?users=" +  userIds + "&from=" + gridStartDate.format() + "&to=" + gridEndDate.format(),
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
		  console.log(data);
		},
		error: function(xhr, status, error) {
		  console.log("Error: " + error);
		}
	});
}

function addUserEventToGrid(userId, startTime, endTime) {
	var st = roundDownTimeTo30Minutes(startTime);
	var et = roundUpTimeTo30Minutes(endTime);
	for(var cellTime = moment(st); cellTime < et; cellTime = cellTime.add(30, 'minutes')) {
		var cellKey = getCellKey(cellTime);
		var cell = getCellWithKey(cellKey);
		// Add user circle to the relevant grid cells for tab 1.
		cell.prepend('<span class="grid-cell-circle" data-user-id="' + userId + '"></span>');
		// Color the added circle appropriately
		cell.children('span[data-user-id="' + userId + '"]').first().css({'background-color': getUserColor(userId)});

		// Check if the user had a previous appointment at this time slot.
		if(!cellKeyToUserSet[cellKey][uId]) {
			// Add this to the field that keeps track of the mappings.
			cellKeyToUserSet[cellKey][userId] = true;
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
function removeUserFromCellKeyToUserSetMapping(userId) {
	var cellKeysOfUserEvents = [];
	for(var cellKey in cellKeyToUserSet) {
		if(cellKeyToUserSet[cellKey][userId]){
			cellKeysOfUserEvents.push(cellKey);
			cellKeyToUserSet[cellKey][userId] = false;
		}
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
		getCellWithKey(key).addClass(SELECTED_CLASS);
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
	 $('.c-row.' + SELECTED_CLASS).each(function(){
	 	clearThisSelectedCell($(this), doNotUpdateUI);
	 });
}

// Expects a jQuery object
function clearThisSelectedCell(cell, doNotUpdateUI) {
	var cellKey = cell.attr('key');
	cell.removeClass(SELECTED_CLASS);
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
		if(cell.hasClass(SELECTED_CLASS)){
			if(!isEarlierCellSelected){
				isEarlierCellSelected = true;
				keyOfSelectedCell = cellKey;
				addDeleteButton(cell);
				startTime = keyToDateObject(cellKey).format('h:mmA');
				endTime = keyToDateObject(cellKey).add(30, 'minutes').format('h:mmA');
			}
			cell.attr(CLOSE_BTN_ATTR_KEY, keyOfSelectedCell);
			endTime = keyToDateObject(cellKey).add(30, 'minutes').format('h:mmA');
		} else {
			isEarlierCellSelected = false;
		}
	}
	if(doNotUpdateUI) {
		return;
	} else {
		$('#m-start').html(startTime);
		$('#m-end').html(endTime);
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

function add7DaysToGrid() {
	var today = moment();
	for(var i = 0; i < 7; i++) {
		var day = moment(today).add(i, 'day');
		addDayToGrid(day);
	}
}

// Expects a moment day object.
function addDayToGrid(day) {
	var dayKey = day.format('_YYYY-MM-DD');
	var tableHeading = day.format ('ddd M/D');
	dayStart = day.startOf('day');
	if(!gridStartDate || (dayStart < gridStartDate)) {
		gridStartDate = dayStart;
		$("#dp1").datepicker("update", gridStartDate.toDate());
		if(!gridEndDate) {
			gridEndDate = dayStart;
			$("#dp2").datepicker("update", gridEndDate.toDate());
		}
		$('#tr').prepend(
			'<div class="h-col">' + tableHeading + '</div>'
		);
		$('#br').prepend(
			'<div class="c-col ' + dayKey + '">'
		);
		addRowsToDayCol($('.' + dayKey).first(), dayKey);
	}
	else if(!gridEndDate || (dayStart > gridEndDate)) {
		gridEndDate = dayStart;
		$("#dp2").datepicker("update", gridEndDate.toDate());
		$('#tr').append(
			'<div class="h-col">' + tableHeading + '</div>'
		);
		$('#br').append(
			'<div class="c-col ' + dayKey + '">'
		);
		addRowsToDayCol($('.' + dayKey).first(), dayKey);
	}
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
	var id = userIdToGridPicId(userId);
	var color = colorPalette[ userId % colorPalette.length];
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

	// animateUserPic(userId);
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
}

function removeUserFromNameList(userId) {
	var id = userIdToListId(userId);
	$('#'+id).slideUp(function(){
		$(this).remove();
	});
}

function animateUserPic(userId) {
	var frame = getUserFrameFromGridPanel(userId);
	frame.css({'border-color': WHITE_COLOR});
	frame.css({'border-top-color': frame.parent().attr(CURRENT_COLOR_ATTR_KEY)});
	frame.addClass(ANIMATION_CLASS_NAME);
}


function getUserFrameFromGridPanel(userId){
	// Returns the .person-frame jQuery object of the user with the specified ID
	return $('#' + userIdToGridPicId(userId) + ' .person-frame').first();
}

function getGridPersonFromGridPanel(userId){
	// Returns the .grid-person jQuery object of the user with the specified ID
	return $('#' + userIdToGridPicId(userId));
}

function stopUserPicAnimation(userId) {
	var frame = getUserFrameFromGridPanel(userId);
	frame.removeClass(ANIMATION_CLASS_NAME);
	frame.css({'border-color': frame.parent().attr(CURRENT_COLOR_ATTR_KEY)});
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
	console.log('>>> TODO: implement downloadEarlierDays()');
}

function downloadLaterDays() {
	console.log('>>> TODO: implement downloadLaterDays()');
}
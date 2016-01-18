var ALERT_TIMEOUT = 5000;
var ALERT_FADEOUT = 2000;
// Incremented when each new alert is displayed. Used to ensure unique ID for all alerts.
var alertCount = 0;

$(document).ready(function(){

	$('.tab-btn').click(function(e){
		$('.tab-btn').removeClass('active');
		$(this).addClass('active');
		console.log($(this).html());
		var tabContentId = $(this).attr('href');
		$('.tab-pane').removeClass('active');
		$(tabContentId).addClass('active');
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
		startDate: '0d'
	}).on('changeDate', function(ev) {
		console.log('clicked dp1');
		console.log($('#dp1').val());
	}).data('datepicker');

	var dtest = Date();
	var dtest2 = Date('2015-1-20')
	var dp2 = $('#dp2').datepicker({
		format: 'mm/dd/yyyy',
		startDate: '0d',
		autoclose: true
	}).on('changeDate', function(ev) {
		console.log('clicked dp2');
	}).data('datepicker');


	var dp3 = $('#m-date').datepicker({
		format: 'D, M d, yyyy',
		startDate: '0d',
		autoclose: true
	}).on('changeDate', function(ev) {
		console.log('clicked dp3');
	}).data('datepicker');
	// ~~~~~ Finished initializing datepicker ~~~~~

	// ~~~~~ Start initializing timepicker ~~~~~
	$('#tp-test').timepicker({
		minuteStep: 5,
		template: 'modal',
		appendWidgetTo: 'body',
		showSeconds: false,
		showMeridian: false, // true ==> 12hr mode, false ==> 24hr mode
		defaultTime: 'current', // could be 'current', 'false' or a value like '11:45AM'
	});

	// $('#tp-test').timepicker('setTime', '7:45 PM'); // Set the time manually

	$('#tp-test').timepicker().on('changeTime.timepicker', function(e) {
		console.log('The time is ' + e.time.value);
		console.log('The hour is ' + e.time.hours);
		console.log('The minute is ' + e.time.minutes);
		console.log('The meridian is ' + e.time.meridian);
	});

	$('#m-start').timepicker({
		minuteStep: 5,
		template: 'modal',
		appendWidgetTo: 'body',
		showSeconds: false,
		showMeridian: false, // true ==> 12hr mode, false ==> 24hr mode
		defaultTime: 'current', // could be 'current', 'false' or a value like '11:45AM'
	});

	$('#m-start').timepicker().on('changeTime.timepicker', function(e) {
		console.log('The start hour is ' + e.time.hours);
		console.log('The start minute is ' + e.time.minutes);
	});

	$('#m-end').timepicker({
		minuteStep: 5,
		template: 'modal',
		appendWidgetTo: 'body',
		showSeconds: false,
		showMeridian: false, // true ==> 12hr mode, false ==> 24hr mode
		defaultTime: 'current', // could be 'current', 'false' or a value like '11:45AM'
	});

	$('#m-end').timepicker().on('changeTime.timepicker', function(e) {
		console.log('The end hour is ' + e.time.hours);
		console.log('The end minute is ' + e.time.minutes);
	});

	// ~~~~~ Finished initializing timepicker ~~~~~


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

	$('#b1').click(function() {
		showInfo('Yay! New info :)');
	});

	$('#b2').click(function() {
		showError('Uh oh! New Error :(');
	});

	$('#b3').click(function() {
		showWarning('Be careful! This is a warning.');
	});


	addTimesToGrid();
	scrollCalendarToNineAm();
	

	// ~~~~~ End initialize .date-input ~~~~~
});

function addAlertPanelIfMissing() {
	if(!$('#alert-panel').length) {
		$('.container').first().prepend('<div id="alert-panel"></div>');
		console.log("a");
	} else{
		console.log("b");
	}
}

function addTimesToGrid() {
	var col = $('.c-col.time');
	for(var i = 0; i < 24; i++) {
		col.append('<div class="c-row">' + addLeadingZero(i) + ':00</div>');
		col.append('<div class="c-row thirty"></div>');
	}
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
	var gridRowHeight = $($('.c-row')[0]).outerHeight()
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
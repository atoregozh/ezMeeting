$(document).ready(function(){

	$('.tab-btn').click(function(e){
		$('.tab-btn').removeClass('active');
		$(this).addClass('active');
		console.log($(this).html());
		var tabContentId = $(this).attr('href');
		$('.tab-pane').removeClass('active');
		$(tabContentId).addClass('active');
	});

	// ~~~~~ Start initialize .date-input ~~~~~
	$('.dp').datepicker({
		format: 'mm/dd/yyyy',
		startDate: '0d'
	});

	var dp1 = $('#dp1').datepicker({
	}).on('changeDate', function(ev) {
		dp1.hide();
		console.log('clicked dp1');
		console.log($('#dp1').val());
	}).data('datepicker');

	var dp2 = $('#dp2').datepicker({
	}).on('changeDate', function(ev) {
		dp2.hide();
		console.log('clicked dp2');
	}).data('datepicker');


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
	    var left = $(this).scrollLeft();
	    $('#tr').scrollLeft(left);
	    
		var threshold = 50;
	    if((left + $(this).innerWidth()) >= ($(this)[0].scrollWidth - threshold)) {
	    	// Enable right download
            var rightBtn = '.grid-side-btn.right';
		    if(!$(rightBtn).hasClass('active')) {
		    	$(rightBtn).addClass('active');
		    }
        }
        else if(left < threshold) {
        	// Enable left download
        	var leftBtn = '.grid-side-btn.left';
			if(!$(leftBtn).hasClass('active')) {
				$(leftBtn).addClass('active');
			}
        }else {
        	// Disable both left and right download
        	$('.grid-side-btn').removeClass('active');
        }
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

	// ~~~~~ End initialize .date-input ~~~~~
});

function downloadEarlierDays() {
	console.log('>>> TODO: implement downloadEarlierDays()');
}

function downloadLaterDays() {
	console.log('>>> TODO: implement downloadLaterDays()');
}
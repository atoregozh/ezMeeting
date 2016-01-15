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

	$('#br').on('scroll', function (e) {
	    $('#tr').scrollLeft($(this).scrollLeft());
	    e.stopPropagation();
	    e.preventDefault();
	});

	$('#tr').on('scroll', function (e) {
	    $('#br').scrollLeft($(this).scrollLeft());
	    e.stopPropagation();
	    e.preventDefault();
	});

	$('#bl').on('scroll', function (e) {
	    $('#br').scrollTop($(this).scrollTop());
	    e.stopPropagation();
	    e.preventDefault();
	});

	$('#br').on('scroll', function (e) {
	    $('#bl').scrollTop($(this).scrollTop());
	    e.stopPropagation();
	    e.preventDefault();
	});

	// ~~~~~ End initialize .date-input ~~~~~
});
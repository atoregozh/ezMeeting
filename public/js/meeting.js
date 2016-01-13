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

	// ~~~~~ End initialize .date-input ~~~~~
});
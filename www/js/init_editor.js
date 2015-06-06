function initTexEditor (serviceURL)
{
	var $source = $('.editor-text'),
		text,
		preview = document.getElementById('editor-preview'),
		timeout,
		old_url;

	function timer ()
	{
		var
			text = $.trim($source.val()),
			format = document.getElementById('svg_radio').checked ? 'svg' : 'png',
			url = text ? serviceURL + format + '/' + encodeURIComponent($.trim(text)) : '';

		if (url === old_url)
			return;

		old_url = url;

		document.forms['editor'].result.value = url;
		preview.src = url;
	}

	$(document.forms['editor'].elements['format']).on('change', timer);

	function setupTimer()
	{
		var value = $.trim($source.val());
		if (value === text)
			return;

		text = value;

		if (timeout)
			clearTimeout(timeout);

		timeout = setTimeout(timer, 300);
	}

	$source.on('propertychange keyup input paste', setupTimer);

	$('.editor-result').on('focus', function () {
		var that = this;
		setTimeout(function ()
		{
			that.select();
		}, 10);
	});

	autosize($source);

	$('#editor-preview').error(function () {
		if (text !== '')
			setTimeout(function () { $source.removeClass('load-error').addClass('load-error'); }, 0);
	}).load(function () {
		$source.removeClass('load-error');
	});

	$('.add-formula').click(function ()
	{
		var cur = $source.val();
		if (cur)
			cur += "\n";
		$source.val(cur + $(this).parent().children('.sample-source').text()).trigger('autosize.resize');
		setupTimer();
		scrollPage($('#editor'));
	});

	setupTimer();

	function scrollPage ($target)
	{
		$('html,body').animate({
		  scrollTop: $target.offset().top - 45
		}, 300);
	}

	$('a.inside').click(function()
	{
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname)
		{
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) +']');

			if (target.length)
			{
				scrollPage(target);
				return false;
			}
		}
	});
}

function initTexSite ()
{
	$('.sticky').Stickyfill();
	new Image().src = "//counter.yadro.ru/hit?r"+escape(document.referrer)+((typeof(screen)=="undefined")?"":";s"+screen.width+"*"+screen.height+"*"+(screen.colorDepth?screen.colorDepth:screen.pixelDepth))+";u"+escape(document.URL)+";h"+escape(document.title.substring(0,80))+";"+Math.random();
}

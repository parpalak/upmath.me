$(function() {
	$('._download-source').on('click', function () {
		var blob = new Blob([$('.source').val()], {type: 'text/markdown;charset=utf-8'});
		saveAs(blob, 'source.md');
	});

	$('._download-result').on('click', function () {
		var source = $('.source').val(),
			result = defaults._view === 'habr' ? mdHabr.render(source) : mdSrc.render(source);

		var blob = new Blob([result], {type: 'text/markdown;charset=utf-8'});
		saveAs(blob, defaults._view + '.html');
	});

	$('._upload-source').on('click', function () {
		document.getElementById('fileElem').click();
	});

	$('#fileElem').change(function () {
		if (!this.files || !FileReader) {
			return;
		}

		var reader = new FileReader(),
			fileInput = this;

		reader.onload = function() {
			$('.source').val(this.result);
			fileInput.value = fileInput.defaultValue;
			updateResult();
		};
		reader.readAsText(this.files[0]);
	});
});

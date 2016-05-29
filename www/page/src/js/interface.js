'use strict';

documentReady(function () {
	document.querySelector('._download-source').addEventListener('click', function () {
		var blob = new Blob([getSource()], {type: 'text/markdown;charset=utf-8'});
		saveAs(blob, 'source.md');
	});

	document.querySelector('._download-result').addEventListener('click', function () {
		var source = getSource(),
			result = defaults._view === 'habr' ? mdHabr.render(source) : mdSrc.render(source);

		var blob = new Blob([result], {type: 'text/markdown;charset=utf-8'});
		saveAs(blob, defaults._view + '.html');
	});

	document.querySelector('._upload-source').addEventListener('click', function () {
		var eNode = document.getElementById('fileElem');
		(eNode.onclick || eNode.click || function () {}).call(eNode);
	});

	document.getElementById('fileElem').addEventListener('change', function () {
		if (!this.files || !FileReader) {
			return;
		}

		var reader = new FileReader(),
			fileInput = this;

		reader.onload = function () {
			setSource(this.result);
			fileInput.value = fileInput.defaultValue;
			updateResult();
		};
		reader.readAsText(this.files[0]);
	});
});

// noinspection ES6ConvertVarToLetConst

function TextHistoryManager(quota, localStoragePrefix, threshold) {
	this.quota = quota;
	this.localStoragePrefix = localStoragePrefix + '_';
	this.threshold = threshold || 300;
	this.memory = {};
	this.localStorage = window.localStorage;
}

TextHistoryManager.prototype.isDifferenceSignificant = function (oldText, newText) {
	var prefixLength = 0,
		suffixLength = 0,
		oldLength = oldText.length,
		newLength = newText.length;

	if (Math.abs(oldLength - newLength) > this.threshold) {
		return true;
	}

	while (prefixLength < newLength && prefixLength < oldLength && oldText[prefixLength] === newText[prefixLength]) {
		prefixLength++;
	}

	while (
		oldLength - 1 - suffixLength > prefixLength
		&& newLength - 1 - suffixLength > prefixLength
		&& oldText[oldLength - 1 - suffixLength] === newText[newLength - 1 - suffixLength]
		) {
		suffixLength++;
	}

	// Check if significant difference exists
	var diffLength = Math.max(oldLength, newLength) - prefixLength - suffixLength;

	return diffLength > this.threshold;
};

TextHistoryManager.prototype.storeText = function (id, newText, required) {
	var curText = this.memory[id];
	if (typeof curText === 'undefined') {
		this.memory[id] = newText;
		return;
	}

	if (curText === newText) {
		return;
	}

	if (required || this.isDifferenceSignificant(curText, newText)) {
		var timestamp = Date.now(),
			newKey = this.localStoragePrefix + timestamp,
			localStorageUsage = [],
			totalLength = 0;

		while (this.localStorage.getItem(newKey)) {
			timestamp++;
			newKey = this.localStoragePrefix + timestamp;
		}

		for (var i = this.localStorage.length; i--;) {
			var storedKey = this.localStorage.key(i);
			if (storedKey.startsWith(this.localStoragePrefix)) {
				var storedSize = storedKey.length + this.localStorage.getItem(storedKey).length;

				totalLength += storedSize;
				localStorageUsage.push({key: storedKey, size: storedSize});
			}
		}

		totalLength += newKey.length + newText.length;
		localStorageUsage.push({key: newKey, size: newKey.length + newText.length});

		if (totalLength * 2 > this.quota) { // 2 bytes per character
			// Sort by timestamp
			var prefixLength = this.localStoragePrefix.length;
			localStorageUsage.sort(function (a, b) {
				var timestampA = parseInt(a.key.substring(prefixLength));
				var timestampB = parseInt(b.key.substring(prefixLength));
				return timestampA - timestampB;
			});

			// Remove oldest items until quota is met
			while (totalLength * 2 > this.quota) {
				var oldestItem = localStorageUsage.shift();
				this.localStorage.removeItem(oldestItem.key);
				totalLength -= oldestItem.size;
			}
		}

		this.localStorage.setItem(newKey, newText);
		this.memory[id] = newText;
	}
};

TextHistoryManager.prototype.getAllVersions = function () {
	var versions = [];
	for (var i = 0; i < this.localStorage.length; i++) {
		var key = this.localStorage.key(i);
		if (key.startsWith(this.localStoragePrefix)) {
			versions.push({
				timestamp: parseInt(key.substring(this.localStoragePrefix.length)),
				text: this.localStorage.getItem(key)
			});
		}
	}

	versions.sort(function (a, b) {
		return b.timestamp - a.timestamp;
	});

	return versions;
};

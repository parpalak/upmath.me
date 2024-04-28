// noinspection ES6ConvertVarToLetConst

/**
 * DocumentStorage constructor function that initializes a new instance for document storage.
 *
 * @param {number} maxSize - The maximum size in chars, not bytes, allowed for the storage.
 * @param {string} keyPrefix - The prefix to use for keys in the storage.
 * @param saveCallback
 */
function DocumentStorage(maxSize, keyPrefix, saveCallback) {
	'use strict';

	this.quota = maxSize;
	this.documentListKey = keyPrefix + '_documentsList';
	this.nextIdKey = keyPrefix + '_nextId';
	this.keyPrefix = keyPrefix;
	this.saveCallback = saveCallback || function () {};

	this.createNewDocument = function (content) {
		this._checkStorageSize(content.length);
		var documentsList = this._getDocumentsList(),
			documentId = this._getNextId();

		documentsList.push(documentId);

		try {
			localStorage.setItem(this._getDocumentKey(documentId), content);
			this.saveCallback(documentId, content);
			localStorage.setItem(this.documentListKey, JSON.stringify(documentsList));
			localStorage.setItem(this.nextIdKey, documentId + 1);
			return documentId;
		} catch (error) {
			console.error('Error writing to localStorage:', error);
			return null;
		}
	};

	this.writeDocument = function (documentId, content) {
		var oldContent = localStorage.getItem(this._getDocumentKey(documentId)),
			oldContentSize = oldContent ? oldContent.length : 0,
			newContentSize = content ? content.length : 0;

		this._checkStorageSize(newContentSize - oldContentSize);

		// Move most recent document to the end
		var documentsList = this._getDocumentsList();
		var lastIndex = documentsList.length - 1;
		if (documentsList[lastIndex] !== documentId) {
			var index = documentsList.indexOf(documentId);
			if (index !== -1) {
				documentsList.splice(index, 1);
				documentsList.push(documentId);
				localStorage.setItem(this.documentListKey, JSON.stringify(documentsList));
			}
		}

		try {
			localStorage.setItem(this._getDocumentKey(documentId), content);
			this.saveCallback(documentId, content);
			return true;
		} catch (error) {
			console.error('Error writing to localStorage:', error);
			return false;
		}
	};

	this.readDocument = function (documentId) {
		return localStorage.getItem(this._getDocumentKey(documentId));
	};

	// Удаление документа
	this.deleteDocument = function (documentId) {
		var documentsList = this._getDocumentsList(),
			index = documentsList.indexOf(documentId);

		if (index !== -1) {
			documentsList.splice(index, 1);

			try {
				localStorage.removeItem(this._getDocumentKey(documentId));
				localStorage.setItem(this.documentListKey, JSON.stringify(documentsList));
				return true;
			} catch (error) {
				console.error('Error deleting from localStorage:', error);
				return false;
			}
		} else {
			console.error('Document not found:', documentId);
			return false;
		}
	};

	this.getAllDocumentIds = function () {
		return this._getDocumentsList();
	};

	this._getDocumentsList = function () {
		var documentsList = localStorage.getItem(this.documentListKey);
		return documentsList ? JSON.parse(documentsList) : [];
	};

	this._getNextId = function () {
		var nextId = localStorage.getItem(this.nextIdKey);
		return nextId ? parseInt(nextId) : 1;
	};

	this._getDocumentKey = function (documentId) {
		return this.keyPrefix + '_document_' + documentId;
	};

	this._checkStorageSize = function (extraSize) {
		var totalSize = extraSize,
			keyPrefixLen = this.keyPrefix.length;

		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			if (key.substring(0, keyPrefixLen) === this.keyPrefix) {
				totalSize += localStorage.getItem(key).length;
			}
		}

		if (totalSize * 2 >= this.quota) { // 2 bytes per char in UTF-16
			throw new Error('QuotaExceededError: DocumentStorage quota exceeded');
		}
	};
}

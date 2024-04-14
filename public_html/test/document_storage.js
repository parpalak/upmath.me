QUnit.test('DocumentStorage Functions Test', function (assert) {
	const maxSize = 1024 * 1024; // 0.5MB for UTF-16
	const keyPrefix = 'test_documents';

	for (const key in localStorage) {
		if (key.startsWith(keyPrefix)) {
			localStorage.removeItem(key);
		}
	}

	const documentStorage = new DocumentStorage(maxSize, keyPrefix);

	const documentId1 = documentStorage.createNewDocument('Test content 1');
	assert.ok(documentId1 !== null, 'Document 1 created successfully');

	const documentId2 = documentStorage.createNewDocument('Test content 2');
	assert.ok(documentId2 !== null, 'Document 2 created successfully');

	const allDocumentIds = documentStorage.getAllDocumentIds();
	assert.deepEqual(allDocumentIds.sort(), [documentId1, documentId2].sort(), 'All document IDs retrieved successfully');

	const content1 = documentStorage.readDocument(documentId1);
	assert.equal(content1, 'Test content 1', 'Document 1 content matches');

	const updatedContent2 = 'Updated test content 2';
	const writeResult2 = documentStorage.writeDocument(documentId2, updatedContent2);
	assert.ok(writeResult2, 'Document 2 updated successfully');

	const updatedContentCheck2 = documentStorage.readDocument(documentId2);
	assert.equal(updatedContentCheck2, updatedContent2, 'Document 2 content updated successfully');

	const deleteResult1 = documentStorage.deleteDocument(documentId1);
	assert.ok(deleteResult1, 'Document 1 deleted successfully');

	const deletedContent1 = documentStorage.readDocument(documentId1);
	assert.equal(deletedContent1, null, 'Document 1 deleted successfully');

	const allDocumentIdsAfterDelete = documentStorage.getAllDocumentIds();
	assert.deepEqual(allDocumentIdsAfterDelete, [documentId2], 'All document IDs retrieved successfully after deletion');
});

QUnit.test('DocumentStorage DocumentStorage Create Quota Test', function (assert) {
	const lowQuota = 1;
	const keyPrefix = 'test_documents';
	for (const key in localStorage) {
		if (key.startsWith(keyPrefix)) {
			localStorage.removeItem(key);
		}
	}

	const documentStorage = new DocumentStorage(lowQuota, keyPrefix);

	assert.throws(
		function () {
			documentStorage.createNewDocument('Test content');
		},
		function (error) {
			return error.toString().indexOf('QuotaExceededError') !== -1;
		},
		'QuotaExceededError thrown for low quota'
	);
});

QUnit.test('DocumentStorage Write Quota Test', function (assert) {
	const lowQuota = 220000; // 220 kb
	const keyPrefix = 'test_documents';
	for (const key in localStorage) {
		if (key.startsWith(keyPrefix)) {
			localStorage.removeItem(key);
		}
	}

	const documentStorage = new DocumentStorage(lowQuota, keyPrefix);

	const documentId = documentStorage.createNewDocument('a'.repeat(100000));
	assert.ok(documentId !== null, 'Document created successfully');

	documentStorage.writeDocument(documentId, 'b'.repeat(105000));

	assert.throws(
		function () {
			documentStorage.writeDocument(documentId, 'b'.repeat(200000));
		},
		function (error) {
			return error.toString().indexOf('QuotaExceededError') !== -1;
		},
		'QuotaExceededError thrown for write operation with long content'
	);

	const documentId2 = documentStorage.createNewDocument('');
	assert.ok(documentId2 !== null, 'Document created successfully');
	assert.throws(
		function () {
			documentStorage.writeDocument(documentId2, 'd'.repeat(100000));
		},
		function (error) {
			return error.toString().indexOf('QuotaExceededError') !== -1;
		},
		'QuotaExceededError thrown for write operation with long content'
	);
});

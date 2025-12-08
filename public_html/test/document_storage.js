function clearStorage(keyPrefix) {
	for (var i = localStorage.length - 1; i >= 0; i--) {
		var key = localStorage.key(i);
		if (key.indexOf(keyPrefix) === 0) {
			localStorage.removeItem(key);
		}
	}
}

QUnit.test('DocumentStorage Functions Test', function (assert) {
	const maxSize = 1024 * 1024; // 0.5MB for UTF-16
	const keyPrefix = 'test_documents';

	clearStorage(keyPrefix);

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

	clearStorage(keyPrefix);

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

	clearStorage(keyPrefix);

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

QUnit.test('DocumentStorage reorders list on write', function (assert) {
	const maxSize = 1024 * 1024;
	const keyPrefix = 'test_documents_order';

	clearStorage(keyPrefix);

	const documentStorage = new DocumentStorage(maxSize, keyPrefix);
	const firstId = documentStorage.createNewDocument('first');
	const secondId = documentStorage.createNewDocument('second');

	documentStorage.writeDocument(firstId, 'first updated');

	assert.deepEqual(
		documentStorage.getAllDocumentIds(),
		[secondId, firstId],
		'Most recent document moves to the end of the list'
	);
});

QUnit.test('DocumentStorage restores list when missing or corrupted', function (assert) {
	const maxSize = 1024 * 1024;
	const keyPrefixMissing = 'test_documents_restore_missing';
	const keyPrefixCorrupted = 'test_documents_restore_corrupted';

	clearStorage(keyPrefixMissing);
	clearStorage(keyPrefixCorrupted);

	// Missing documentsList: scan keys and sort IDs
	localStorage.setItem(keyPrefixMissing + '_document_5', 'doc5');
	localStorage.setItem(keyPrefixMissing + '_document_2', 'doc2');

	const storageMissing = new DocumentStorage(maxSize, keyPrefixMissing);
	assert.deepEqual(
		storageMissing.getAllDocumentIds(),
		[2, 5],
		'IDs restored and sorted when documentsList is absent'
	);
	assert.equal(
		localStorage.getItem(keyPrefixMissing + '_documentsList'),
		JSON.stringify([2, 5]),
		'Rebuilt documentsList is persisted'
	);

	// Corrupted documentsList: ignore bad JSON and rebuild from keys
	localStorage.setItem(keyPrefixCorrupted + '_document_4', 'doc4');
	localStorage.setItem(keyPrefixCorrupted + '_document_8', 'doc8');
	localStorage.setItem(keyPrefixCorrupted + '_documentsList', 'broken [4,8');

	const storageCorrupted = new DocumentStorage(maxSize, keyPrefixCorrupted);
	assert.deepEqual(
		storageCorrupted.getAllDocumentIds(),
		[4, 8],
		'IDs restored and sorted when documentsList is corrupted'
	);
	assert.equal(
		localStorage.getItem(keyPrefixCorrupted + '_documentsList'),
		JSON.stringify([4, 8]),
		'Corrupted documentsList is replaced with rebuilt data'
	);
});

QUnit.test('DocumentStorage corrects stale or invalid nextId', function (assert) {
	const maxSize = 1024 * 1024;
	const keyPrefix = 'test_documents_nextid';

	clearStorage(keyPrefix);

	// Seed existing documents with a stale nextId
	localStorage.setItem(keyPrefix + '_document_5', 'doc5');
	localStorage.setItem(keyPrefix + '_document_6', 'doc6');
	localStorage.setItem(keyPrefix + '_documentsList', JSON.stringify([5, 6]));
	localStorage.setItem(keyPrefix + '_nextId', '3'); // behind maxId

	const storage = new DocumentStorage(maxSize, keyPrefix);
	const newId = storage.createNewDocument('doc7');

	assert.equal(newId, 7, 'New ID advances beyond the highest existing ID when nextId is stale');
	assert.deepEqual(storage.getAllDocumentIds(), [5, 6, 7], 'Document list includes the new ID');
	assert.equal(localStorage.getItem(keyPrefix + '_nextId'), '8', 'nextId is updated after creation');

	// Force invalid nextId to be corrected
	localStorage.setItem(keyPrefix + '_nextId', 'not-a-number');
	const nextIdAfterInvalid = storage.createNewDocument('doc8');
	assert.equal(nextIdAfterInvalid, 8, 'Invalid nextId falls back to maxId + 1');
});

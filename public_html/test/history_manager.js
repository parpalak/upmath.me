QUnit.test("TextHistoryManager.storeText() should store significant text changes in localStorage", function(assert) {
	for (const key in localStorage) {
		if (key.startsWith('test_history')) {
			localStorage.removeItem(key);
		}
	}
    var manager = new TextHistoryManager(1024, 'test_history', 28);
    manager.storeText(1, "Initial text");
    manager.storeText(1, "Updated text");

	var versions = manager.getAllVersions();
	assert.equal(versions.length, 0, "No significant changes were made");

    manager.storeText(1, "A lot more updated text");

    versions = manager.getAllVersions();
	assert.equal(versions.length, 0);

	manager.storeText(1, "Initial text. And a lot more updated text");

	versions = manager.getAllVersions();
    assert.equal(versions.length, 1);
    assert.equal(versions[0].text, "Initial text. And a lot more updated text", "Latest significant change should be stored");

	manager.storeText(2, "Lorem ipsum dolor sit amet, consectetur adipiscing elit.");

	versions = manager.getAllVersions();
	assert.equal(versions.length, 1, 'Text 2 added');

	manager.storeText(2, "Lorem ipsum dolor  elit.");

	versions = manager.getAllVersions();
	assert.equal(versions.length, 2);
	assert.equal(versions[0].text, "Lorem ipsum dolor  elit.");
	assert.equal(versions[1].text, "Initial text. And a lot more updated text");
});

QUnit.test("TextHistoryManager.storeText() should handle localStorage quota", function(assert) {
	for (const key in localStorage) {
		if (key.startsWith('test_history')) {
			localStorage.removeItem(key);
		}
	}
    var manager = new TextHistoryManager(250, 'test_history', 10); // Very small quota for testing

    // Fill up quota
    manager.storeText(1, "");
    manager.storeText(1, "Lorem ipsum dolor sit amet");
    manager.storeText(2, "");
    manager.storeText(2, "Consectetur adipiscing elit");

	var versions = manager.getAllVersions();
	assert.equal(versions.length, 2, 'Stored short items');
	assert.equal(versions[0].text, "Consectetur adipiscing elit");
	assert.equal(versions[1].text, "Lorem ipsum dolor sit amet");

	// Quota exceeded
    manager.storeText(2, "Sed do eiusmod tempor incididunt");

    versions = manager.getAllVersions();
    assert.equal(versions.length, 2, "Excess versions should be removed to fit quota");
	assert.equal(versions[0].text, "Sed do eiusmod tempor incididunt");
	assert.equal(versions[1].text, "Consectetur adipiscing elit");

	manager.storeText(2, "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua");

	versions = manager.getAllVersions();
	assert.equal(versions.length, 1, "Excess versions should be removed to fit quota");
	assert.equal(versions[0].text, "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua");
});

QUnit.test("TextHistoryManager should correctly determine significant differences", function(assert) {
	for (const key in localStorage) {
		if (key.startsWith('test_history')) {
			localStorage.removeItem(key);
		}
	}
    var manager = new TextHistoryManager(1024, 'test_history', 20);
    var oldText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    var newText1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
    var newText2 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed incididunt ut labore et dolore magna aliqua.";
    var newText3 = "orem ipsum dolor sit amet, consectetur adipiscing elit. Sed incididunt ut labore et dolore magna aliqua.";

	assert.ok(manager.isDifferenceSignificant('', oldText));
	assert.ok(manager.isDifferenceSignificant(oldText, newText1));
    assert.notOk(manager.isDifferenceSignificant(newText1, newText2));
	assert.notOk(manager.isDifferenceSignificant(newText2, newText3));
	assert.ok(manager.isDifferenceSignificant(newText1, newText3));
});

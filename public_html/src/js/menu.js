// noinspection ES6ConvertVarToLetConst

/**
 * Markdown and LaTeX Editor
 *
 * (c) Roman Parpalak, 2024
 */

function MainMenu(menuConfig, menuContainer) {

	var escapeMenuListener = function (event) {
		if (event.key === 'Escape') {
			hideMenu();
		}
	};
	var globalClickListener = function (e) {
		if (menuContainer.contains(e.target)) {
			return;
		}
		hideMenu();
	};

	menuContainer.addEventListener('click', function (e) {
		if (e.target === this) {
			toggleMenu();
		}
	});

	menuContainer.addEventListener('keydown', function (e) {
		// Проверяем, была ли нажата клавиша Enter
		if (e.target === this && (e.code === 'Space' || e.code === 'Enter')) {
			toggleMenu();
		}

		var eItem;
		if (e.code === 'ArrowDown') {
			if (menuContainer.contains(document.activeElement.parentNode)) {
				eItem = document.activeElement.parentNode;
				while (eItem.nextSibling) {
					eItem = eItem.nextSibling;
					if (eItem.firstChild && eItem.firstChild.nodeName === 'A') {
						eItem.firstChild.focus();
						break;
					}
				}
			} else {
				menu.firstChild.firstChild.focus();
			}
		}

		if (e.code === 'ArrowUp') {
			if (menuContainer.contains(document.activeElement.parentNode)) {
				eItem = document.activeElement.parentNode;
				while (eItem.previousSibling) {
					eItem = eItem.previousSibling
					if (eItem.firstChild && eItem.firstChild.nodeName === 'A') {
						eItem.firstChild.focus();
						break;
					}
				}
			} else {
				menu.lastChild.firstChild.focus();
			}
		}

		if (e.code === 'ArrowRight') {
			if (menuContainer.contains(document.activeElement.parentNode) && document.activeElement.nextSibling ) {
				document.activeElement.nextSibling.firstChild.firstChild.focus();
			}
		}
		if (e.code === 'ArrowLeft') {
			if (menuContainer.contains(document.activeElement.parentNode.parentNode.parentNode)) {
				document.activeElement.parentNode.parentNode.parentNode.firstChild.focus();
			}
		}
	});

	var currentSubMenu = null;
	var subMenuTimeout = null;

	function hideMenu() {
		if (menu.style.display === 'none') {
			return;
		}

		menu.style.display = 'none';
		clearTimeout(subMenuTimeout);
		if (null !== currentSubMenu) {
			currentSubMenu.style.display = 'none';
			currentSubMenu = null;
		}
		document.removeEventListener('keydown', escapeMenuListener);
		document.removeEventListener('click', globalClickListener);
		while (menu.firstChild) {
			menu.removeChild(menu.lastChild);
		}
	}

	function toggleMenu() {
		if (menu.style.display === 'block') {
			hideMenu();
		} else {
			buildMenu();
			menu.style.display = 'block';
			document.addEventListener('keydown', escapeMenuListener);
			setTimeout(function () {
				document.addEventListener('click', globalClickListener);
			}, 0);
		}
	}

	function showSubMenu(element) {
		clearTimeout(subMenuTimeout);
		if (element === currentSubMenu) {
			return;
		}
		var shift = element.parentNode.getBoundingClientRect().top;
		subMenuTimeout = setTimeout(function () {
			if (currentSubMenu !== null) {
				currentSubMenu.style.display = 'none';
			}
			element.style.display = 'block';
			element.style.maxHeight = 'calc(100vh - ' + shift + 'px)';
			currentSubMenu = element;
		}, 200);
	}

	function hideSubMenu(element) {
		clearTimeout(subMenuTimeout);
		// Note: There are some bugs when checking element === currentSubMenu. Do we need to check element?
		subMenuTimeout = setTimeout(function () {
			if (currentSubMenu !== null) {
				currentSubMenu.style.display = 'none';
				currentSubMenu = null;
			}
		}, 500);
	}

	var menu = document.createElement('ul');
	menu.className = 'menu';

	function makeLinkFromItem(label, action) {
		var a = document.createElement('a');
		a.className = 'menu-link';
		a.tabIndex = menuContainer.tabIndex;

		if (typeof action === 'function') {
			a.onclick = function () {
				action();
				hideMenu();
			};
			a.href = '#';
		} else {
			a.href = action || '#';
		}
		if (typeof label === 'function') {
			label = label();
		}
		if (label !== '') {
			a.innerHTML = label;
		} else {
			a.innerHTML = '&nbsp;';
		}

		return a;
	}

	function buildMenu() {
		menuConfig.forEach(function (item) {
			var li = document.createElement('li');

			if (typeof item.label === 'undefined') {
				li.className = 'hr';
			} else if (item.items) {
				li.className = 'menu-item';

				var submenu = document.createElement('ul');
				submenu.className = 'submenu-content';
				submenu.onmouseenter = function () {
					showSubMenu(submenu);
				};
				submenu.onmouseleave = function () {
					hideSubMenu(submenu);
				};

				var eA = makeLinkFromItem(item.label, '#');
				eA.onmouseenter = eA.onfocus = function () {
					showSubMenu(submenu);
				};
				eA.onmouseleave = eA.onblur = function () {
					hideSubMenu(submenu);
				};
				li.appendChild(eA);

				(typeof item.items === 'function' ? item.items() : item.items).forEach(function (item) {
					var li = document.createElement('li');

					if (typeof item.label === 'undefined') {
						li.className = 'hr';
					} else {
						li.className = 'menu-item';
						var eA = makeLinkFromItem(item.label, item.action);
						eA.onfocus = function () {
							showSubMenu(submenu);
						};
						eA.onblur = function () {
							hideSubMenu(submenu);
						};
						li.appendChild(eA);
					}

					submenu.appendChild(li);
				});

				li.appendChild(submenu);
			} else {
				li.className = 'menu-item';
				li.appendChild(makeLinkFromItem(item.label, item.action));
			}

			menu.appendChild(li);
		});
	}

	menuContainer.appendChild(menu);
}

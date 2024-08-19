/**
 * @copyright Federico Brigante (https://fregante.com)
 * @see https://github.com/fregante/indent-textarea
 * @licence https://opensource.org/license/MIT
 *
 * Modified by Roman Parpalak
 * Changes:
 * 1. Improved unindent algorithm (selection start was moving to the left on Shift+Tab
 * when there were no spaces to anti-indent and the first selected string has a space inside).
 * 2. Using 2 spaces instead of tab.
 */
(function (exports) {
    'use strict';

	const TAB = '  ';

    function withFocus(field, callback) {
        const document = field.ownerDocument;
        const initialFocus = document.activeElement;
        if (initialFocus === field) {
            return callback();
        }
        try {
            field.focus();
            return callback();
        }
        finally {
            field.blur();
            if (initialFocus instanceof HTMLElement) {
                initialFocus.focus();
            }
        }
    }
    function insertTextWhereverTheFocusIs(document, text) {
        if (text === '') {
            document.execCommand('delete');
        }
        else {
            document.execCommand('insertText', false, text);
        }
    }
    function insertTextIntoField(field, text) {
        withFocus(field, () => {
            insertTextWhereverTheFocusIs(field.ownerDocument, text);
        });
    }

    function indentSelection(element) {
        const { selectionStart, selectionEnd, value } = element;
        const selectedText = value.slice(selectionStart, selectionEnd);
        const lineBreakCount = /\n/g.exec(selectedText)?.length;
        if (lineBreakCount > 0) {
            const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
            const indentedText = newSelection.replaceAll(/^|\n/g,
            '$&' + TAB);
            const replacementsCount = indentedText.length - newSelection.length;
            element.setSelectionRange(firstLineStart, selectionEnd - 1);
            insertTextIntoField(element, indentedText);
            element.setSelectionRange(selectionStart + (firstLineStart < selectionStart ? TAB.length : 0), selectionEnd + replacementsCount);
        }
        else {
            insertTextIntoField(element, TAB);
        }
    }

    function unindentSelection(element) {
        const {selectionStart, selectionEnd, value} = element;
        const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const newSelection = element.value.slice(firstLineStart, selectionEnd); // Old text to be replaced
        const indentedText = newSelection.replaceAll(/(^|\n)(\t| {1,2})/g, '$1'); // New text
        const replacementsCount = newSelection.length - indentedText.length; // Number of characters that were deleted
        element.setSelectionRange(firstLineStart, selectionEnd); // Expand selection since we might have to replace the text before selected area
        insertTextIntoField(element, indentedText);
        const firstLineIndentation = /^(\t| {1,2})/.exec(newSelection);
        // Number of characters that were deleted in the first row
        const difference = firstLineIndentation
            ? firstLineIndentation[0].length
            : 0;

        // If characters were replaced before selection, we have to move the start to the left
        const newSelectionStart = Math.max(selectionStart - difference, firstLineStart);
        element.setSelectionRange(newSelectionStart, selectionEnd - replacementsCount);
    }

    function tabToIndentListener(event) {
        if (event.defaultPrevented
            || event.metaKey
            || event.altKey
            || event.ctrlKey) {
            return;
        }
        const textarea = event.target;
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                unindentSelection(textarea);
            }
            else {
                indentSelection(textarea);
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        else if (event.key === 'Escape'
            && !event.shiftKey) {
            textarea.blur();
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
    function enableTabToIndent(elements, signal) {
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        }
        else if (elements instanceof HTMLTextAreaElement) {
            elements = [elements];
        }
        for (const element of elements) {
            element.addEventListener('keydown', tabToIndentListener, { signal });
        }
    }
    const indent = indentSelection;
    const unindent = unindentSelection;
    const eventHandler = tabToIndentListener;
    const watch = enableTabToIndent;

    exports.enableTabToIndent = enableTabToIndent;
    exports.eventHandler = eventHandler;
    exports.indent = indent;
    exports.indentSelection = indentSelection;
    exports.tabToIndentListener = tabToIndentListener;
    exports.unindent = unindent;
    exports.unindentSelection = unindentSelection;
    exports.watch = watch;

})(this.window = this.window || {});

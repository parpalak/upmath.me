(function (exports) {
    'use strict';

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
            '$&\t');
            const replacementsCount = indentedText.length - newSelection.length;
            element.setSelectionRange(firstLineStart, selectionEnd - 1);
            insertTextIntoField(element, indentedText);
            element.setSelectionRange(selectionStart + 1, selectionEnd + replacementsCount);
        }
        else {
            insertTextIntoField(element, '\t');
        }
    }
    function findLineEnd(value, currentEnd) {
        const lastLineStart = value.lastIndexOf('\n', currentEnd - 1) + 1;
        if (value.charAt(lastLineStart) !== '\t') {
            return currentEnd;
        }
        return lastLineStart + 1;
    }
    function unindentSelection(element) {
        const { selectionStart, selectionEnd, value } = element;
        const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const minimumSelectionEnd = findLineEnd(value, selectionEnd);
        const newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
        const indentedText = newSelection.replaceAll(/(^|\n)(\t| {1,2})/g, '$1');
        const replacementsCount = newSelection.length - indentedText.length;
        element.setSelectionRange(firstLineStart, minimumSelectionEnd);
        insertTextIntoField(element, indentedText);
        const firstLineIndentation = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart));
        const difference = firstLineIndentation
            ? firstLineIndentation[0].length
            : 0;
        const newSelectionStart = selectionStart - difference;
        element.setSelectionRange(selectionStart - difference, Math.max(newSelectionStart, selectionEnd - replacementsCount));
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

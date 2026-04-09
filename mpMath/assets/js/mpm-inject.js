let editingContext = null;
let operationInProgress = false;
let batchRenderCallbacks = new Map();
let batchRenderCounter = 0;

// 匹配 $$...$$ (block) 优先于 $...$ (inline)
const FORMULA_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;

function hasFormulaMarkers(text) {
    FORMULA_PATTERN.lastIndex = 0;
    return FORMULA_PATTERN.test(text);
}

function parseMarkdownFormulas(text) {
    const segments = [];
    FORMULA_PATTERN.lastIndex = 0;
    let lastIndex = 0;
    let match;

    while ((match = FORMULA_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        if (match[1] !== undefined) {
            segments.push({ type: 'formula', tex: match[1].trim(), isBlock: true });
        } else {
            segments.push({ type: 'formula', tex: match[2].trim(), isBlock: false });
        }
        lastIndex = FORMULA_PATTERN.lastIndex;
    }

    if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return segments;
}

function renderFormulasViaPopup(formulaSegments) {
    return new Promise(function (resolve, reject) {
        const popup = getPopupFrame();
        if (!popup || !popup.contentWindow) {
            reject(new Error('Popup not available'));
            return;
        }

        const requestId = 'batch-' + (++batchRenderCounter);
        const formulas = formulaSegments.map(function (seg, idx) {
            return { id: idx, tex: seg.tex, isBlock: seg.isBlock };
        });

        const timer = setTimeout(function () {
            if (batchRenderCallbacks.has(requestId)) {
                batchRenderCallbacks.delete(requestId);
                reject(new Error('Batch render timeout'));
            }
        }, 30000);

        batchRenderCallbacks.set(requestId, function (results) {
            clearTimeout(timer);
            resolve(results);
        });

        popup.contentWindow.postMessage({
            type: 'BATCH_RENDER',
            requestId: requestId,
            formulas: formulas
        }, '*');
    });
}

function buildHtmlFromSegments(segments, results) {
    const resultMap = new Map(results.map(function (r) { return [r.id, r]; }));
    let formulaIndex = 0;
    let html = '';

    for (const segment of segments) {
        if (segment.type === 'text') {
            const escaped = segment.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n\n+/g, '<br><br>')
                .replace(/\n/g, '<br>');
            html += escaped;
        } else {
            const result = resultMap.get(formulaIndex);
            if (result && !result.error) {
                html += '\u00A0' + result.html + '\u00A0';
            } else {
                const marker = segment.isBlock
                    ? '$$' + segment.tex + '$$'
                    : '$' + segment.tex + '$';
                html += marker.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            formulaIndex++;
        }
    }

    return html;
}

async function handleMarkdownPaste(event) {
    const text = event.clipboardData && event.clipboardData.getData('text/plain');
    if (!text || !hasFormulaMarkers(text) || operationInProgress) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const segments = parseMarkdownFormulas(text);
    const formulaSegments = segments.filter(function (s) { return s.type === 'formula'; });

    try {
        let results = [];
        if (formulaSegments.length > 0) {
            results = await renderFormulasViaPopup(formulaSegments);
        }

        const html = buildHtmlFromSegments(segments, results);

        if (hasModernEditorApi()) {
            await invokeEditorApi('mp_editor_insert_html', { html: html, isSelect: false });
            return;
        }

        if (hasLegacyEditorApi()) {
            window.UE.getEditor('js_editor').execCommand('insertHTML', html);
            return;
        }
    } catch (error) {
        console.error('[mpMath] Markdown paste error:', error);
    }
}

function bindPasteHandlers() {
    if (!document.__mpmPasteBound) {
        document.addEventListener('paste', handleMarkdownPaste, true);
        document.__mpmPasteBound = true;
    }

    const legacyFrame = document.getElementById('ueditor_0');
    if (legacyFrame && legacyFrame.contentDocument && !legacyFrame.contentDocument.__mpmPasteBound) {
        legacyFrame.contentDocument.addEventListener('paste', handleMarkdownPaste, true);
        legacyFrame.contentDocument.__mpmPasteBound = true;
    }
}

function getPopupFrame() {
    return document.getElementById('popup');
}

function hidePopup() {
    const popup = getPopupFrame();
    if (popup) {
        popup.style.display = 'none';
    }
}

function focusEditorSurface() {
    const legacyFrame = document.getElementById('ueditor_0');
    if (legacyFrame && typeof legacyFrame.focus === 'function') {
        setTimeout(function () {
            legacyFrame.focus();
        }, 10);
        return;
    }

    const editor = document.querySelector('.ProseMirror, [contenteditable="true"]');
    if (editor && typeof editor.focus === 'function') {
        setTimeout(function () {
            editor.focus();
        }, 10);
    }
}

function hasModernEditorApi() {
    return Boolean(window.__MP_Editor_JSAPI__ && typeof window.__MP_Editor_JSAPI__.invoke === 'function');
}

function hasLegacyEditorApi() {
    return Boolean(window.UE && typeof window.UE.getEditor === 'function');
}

function invokeEditorApi(apiName, apiParam) {
    return new Promise(function (resolve, reject) {
        if (!hasModernEditorApi()) {
            reject(new Error('MP_Editor_JSAPI unavailable'));
            return;
        }

        try {
            window.__MP_Editor_JSAPI__.invoke({
                apiName: apiName,
                apiParam: apiParam || {},
                sucCb: function (result) {
                    resolve(result);
                },
                errCb: function (error) {
                    const message = error && (error.errMsg || error.msg);
                    reject(new Error(message || apiName + ' failed'));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

function parseFormulaHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = (html || '').trim();
    return template.content.firstElementChild;
}

function ensureFormulaId(formulaElement) {
    let formulaId = formulaElement.getAttribute('data-formula-id');
    if (!formulaId) {
        formulaId = 'mpm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        formulaElement.setAttribute('data-formula-id', formulaId);
    }
    return formulaId;
}

function getFormulaIndex(formulaElement) {
    const formulas = Array.from(formulaElement.ownerDocument.querySelectorAll('[data-formula]'));
    return formulas.indexOf(formulaElement);
}

function openPopupForFormula(formulaElement) {
    if (operationInProgress) {
        return;
    }

    const popup = getPopupFrame();
    if (!popup || !popup.contentWindow) {
        return;
    }

    editingContext = {
        id: ensureFormulaId(formulaElement),
        index: getFormulaIndex(formulaElement),
        text: formulaElement.getAttribute('data-formula') || '',
        display: formulaElement.getAttribute('data-formula-display') || 'inline',
        element: formulaElement
    };

    popup.style.display = 'block';
    popup.contentWindow.postMessage({
        type: 'CHANGE_INPUT',
        text: editingContext.text,
        isBlock: editingContext.display === 'block' ? 'true' : 'false'
    }, '*');

    setTimeout(function () {
        popup.focus();
    }, 10);
}

function findFormulaNode(container, context) {
    const formulas = Array.from(container.querySelectorAll('[data-formula]'));
    if (context && context.id) {
        const matchedById = formulas.find(function (formula) {
            return formula.getAttribute('data-formula-id') === context.id;
        });
        if (matchedById) {
            return matchedById;
        }
    }

    if (context && typeof context.index === 'number' && context.index >= 0 && context.index < formulas.length) {
        return formulas[context.index];
    }

    if (context && context.text) {
        return formulas.find(function (formula) {
            return formula.getAttribute('data-formula') === context.text;
        }) || null;
    }

    return null;
}

async function insertFormulaHtml(formulaHtml) {
    const paddedHtml = '\u00A0' + formulaHtml + '\u00A0';

    if (hasModernEditorApi()) {
        await invokeEditorApi('mp_editor_insert_html', {
            html: paddedHtml,
            isSelect: false
        });
        return;
    }

    if (hasLegacyEditorApi()) {
        window.UE.getEditor('js_editor').execCommand('insertHTML', paddedHtml);
        return;
    }

    throw new Error('No supported editor API found');
}

async function replaceEditedFormula(formulaHtml) {
    const replacement = parseFormulaHtml(formulaHtml);
    if (!replacement) {
        throw new Error('Invalid formula HTML');
    }

    if (editingContext && editingContext.id) {
        replacement.setAttribute('data-formula-id', editingContext.id);
    }

    if (hasModernEditorApi()) {
        const result = await invokeEditorApi('mp_editor_get_content');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = (result && result.content) || '';

        const target = findFormulaNode(wrapper, editingContext);
        if (target) {
            target.replaceWith(replacement);
            await invokeEditorApi('mp_editor_set_content', {
                content: wrapper.innerHTML
            });
            return;
        }
    }

    if (editingContext && editingContext.element && editingContext.element.isConnected) {
        editingContext.element.replaceWith(replacement);
        return;
    }

    throw new Error('Could not find formula to update');
}

function resetEditingContext() {
    editingContext = null;
    operationInProgress = false;
}

function isPopupMessage(event) {
    const popup = getPopupFrame();
    return Boolean(
        popup &&
        popup.contentWindow &&
        event.source === popup.contentWindow &&
        event.data &&
        event.data.type
    );
}

function bindFormulaClickHandlers() {
    if (!document.__mpmFormulaClickBound) {
        document.addEventListener('click', function (event) {
            const target = event.target && event.target.closest ? event.target.closest('[data-formula]') : null;
            if (!target) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            openPopupForFormula(target);
        }, true);
        document.__mpmFormulaClickBound = true;
    }

    const legacyFrame = document.getElementById('ueditor_0');
    if (!legacyFrame || !legacyFrame.contentDocument || legacyFrame.contentDocument.__mpmFormulaClickBound) {
        return;
    }

    legacyFrame.contentDocument.addEventListener('click', function (event) {
        const target = event.target && event.target.closest ? event.target.closest('[data-formula]') : null;
        if (!target) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        openPopupForFormula(target);
    }, true);
    legacyFrame.contentDocument.__mpmFormulaClickBound = true;
}

window.addEventListener('message', async function (event) {
    if (!isPopupMessage(event)) {
        return;
    }

    if (event.data.type === 'BATCH_RENDER_DONE') {
        const callback = batchRenderCallbacks.get(event.data.requestId);
        if (callback) {
            batchRenderCallbacks.delete(event.data.requestId);
            callback(event.data.results);
        }
        return;
    }

    if (event.data.type === 'CLOSE_FORMULA') {
        hidePopup();
        focusEditorSurface();
        resetEditingContext();
        return;
    }

    if (event.data.type === 'INSERT_FORMULA') {
        if (operationInProgress) {
            return;
        }
        operationInProgress = true;

        try {
            if (editingContext) {
                await replaceEditedFormula(event.data.text);
            } else {
                await insertFormulaHtml(event.data.text);
            }

            hidePopup();
            focusEditorSurface();
        } catch (error) {
            console.error('[mpMath] Editor bridge error:', error);
            alert('公式操作失败：' + (error && error.message ? error.message : '未知错误'));
        } finally {
            resetEditingContext();
        }
    }
});

function initFormulaEditingBridge() {
    bindFormulaClickHandlers();
    bindPasteHandlers();

    let observerTimer = null;
    const observer = new MutationObserver(function () {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(function () {
            bindFormulaClickHandlers();
            bindPasteHandlers();
        }, 200);
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormulaEditingBridge, { once: true });
} else {
    initFormulaEditingBridge();
}

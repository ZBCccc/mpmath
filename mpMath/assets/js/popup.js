let input;
let block;
let insert;
let output;
let renderToken = 0;
let convertTimer = null;

function setInsertEnabled(enabled) {
    insert.disabled = !enabled;
    $(insert).toggleClass('weui-desktop-btn_disabled', !enabled);
}

function showMessage(message) {
    output.innerHTML = '';
    output.appendChild(document.createElement('pre'))
          .appendChild(document.createTextNode(message));
}

function buildFormulaWrapper(svg, isBlock, tex) {
    const wrapper = document.createElement('span');
    const formulaId = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : 'mpm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

    wrapper.className = 'mpm-formula';
    wrapper.setAttribute('data-formula', tex !== undefined ? tex : input.value.trim());
    wrapper.setAttribute('data-formula-id', formulaId);
    wrapper.setAttribute('data-formula-display', isBlock ? 'block' : 'inline');
    wrapper.style.cssText = isBlock
        ? 'display:block; text-align:center; margin:15px 0; cursor:pointer;'
        : 'display:inline-block; vertical-align:middle; line-height:0; cursor:pointer;';

    const svgClone = svg.cloneNode(true);
    svgClone.style.cssText = isBlock
        ? 'display:block; margin:0 auto; max-width:100%; height:auto;'
        : 'display:inline-block; vertical-align:middle; max-width:100%; height:auto;';

    wrapper.appendChild(svgClone);
    return wrapper;
}

async function convert() {
    const tex = input.value.trim();
    const currentToken = ++renderToken;

    output.innerHTML = '';
    if (!tex) {
        setInsertEnabled(false);
        return;
    }

    setInsertEnabled(false);

    if (!window.MathJax || !window.MathJax.startup || !window.MathJax.tex2svgPromise) {
        showMessage('MathJax loading...');
        return;
    }

    try {
        await window.MathJax.startup.promise;
        if (currentToken !== renderToken) {
            return;
        }

        window.MathJax.texReset();
        const options = window.MathJax.getMetricsFor(output);
        options.display = block.checked;

        const node = await window.MathJax.tex2svgPromise(tex, options);
        if (currentToken !== renderToken) {
            return;
        }

        const svg = node.querySelector('svg');
        if (!svg) {
            showMessage('Render failed');
            return;
        }

        if (node.querySelector('[data-mml-node="merror"]')) {
            showMessage('LaTeX 语法错误，请检查输入');
            return;
        }

        output.innerHTML = '';
        output.appendChild(buildFormulaWrapper(svg, block.checked, input.value.trim()));
        setInsertEnabled(true);
    } catch (error) {
        if (currentToken !== renderToken) {
            return;
        }
        showMessage(error && error.message ? error.message : 'Render failed');
    }
}

function closeFrame() {
    parent.window.postMessage({ type: 'CLOSE_FORMULA' }, '*');
}

function insertFormula() {
    if (insert.disabled) {
        return;
    }

    const formula = output.querySelector('[data-formula]');
    if (!formula) {
        return;
    }

    parent.window.postMessage({ type: 'INSERT_FORMULA', text: formula.outerHTML }, '*');
}

$(function () {
    input = document.getElementById('input');
    block = document.getElementById('block');
    insert = document.getElementById('insert');
    output = document.getElementById('output');

    setInsertEnabled(false);

    function debouncedConvert() {
        clearTimeout(convertTimer);
        convertTimer = setTimeout(convert, 300);
    }

    input.addEventListener('input', debouncedConvert);
    block.addEventListener('change', convert);
    insert.addEventListener('click', insertFormula);
    document.getElementById('close').addEventListener('click', closeFrame);
    document.getElementById('cancel').addEventListener('click', closeFrame);

    window.addEventListener('message', function (event) {
        if (!event.data || event.data.type !== 'CHANGE_INPUT') {
            return;
        }

        input.value = event.data.text || '';
        block.checked = event.data.isBlock === 'true';
        input.focus();
        convert();
    });

    window.addEventListener('message', async function (event) {
        if (!event.data || event.data.type !== 'BATCH_RENDER') {
            return;
        }

        const { requestId, formulas } = event.data;
        const results = [];

        try {
            if (!window.MathJax || !window.MathJax.startup || !window.MathJax.tex2svgPromise) {
                throw new Error('MathJax not ready');
            }
            await window.MathJax.startup.promise;

            for (const formula of formulas) {
                try {
                    window.MathJax.texReset();
                    const options = window.MathJax.getMetricsFor(document.body);
                    options.display = formula.isBlock;
                    const node = await window.MathJax.tex2svgPromise(formula.tex, options);
                    const svg = node.querySelector('svg');

                    if (!svg || node.querySelector('[data-mml-node="merror"]')) {
                        results.push({ id: formula.id, error: true });
                    } else {
                        const wrapper = buildFormulaWrapper(svg, formula.isBlock, formula.tex);
                        results.push({ id: formula.id, html: wrapper.outerHTML, error: false });
                    }
                } catch (e) {
                    results.push({ id: formula.id, error: true });
                }
            }
        } catch (e) {
            for (const formula of formulas) {
                results.push({ id: formula.id, error: true });
            }
        }

        parent.window.postMessage({ type: 'BATCH_RENDER_DONE', requestId: requestId, results: results }, '*');
    });

    window.addEventListener('focusout', function (event) {
        if (event.relatedTarget) {
            return;
        }
        setTimeout(function () {
            input.focus();
        }, 10);
    });

    $(input).on('keydown', function (event) {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            insertFormula();
        }
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeFrame();
        }
    });
});

let input, block, insert, output;

function checkNull(str) {
    if (str.length == 0) {
        insert.disabled = true;
        $(insert).addClass('weui-desktop-btn_disabled');
    } else {
        insert.disabled = false;
        $(insert).removeClass('weui-desktop-btn_disabled');
    }
}

function convert() {
    let inputTex = input.value.trim();
    checkNull(inputTex);
    output.innerHTML = '';

    if (!window.MathJax || !MathJax.Hub) {
        output.appendChild(document.createElement('pre'))
              .appendChild(document.createTextNode('MathJax loading...'));
        return;
    }

    MathJax.Hub.Queue(function () {
        let container = document.createElement('div');
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        document.body.appendChild(container);

        let script = document.createElement('script');
        script.type = block.checked ? 'math/tex; mode=display' : 'math/tex';
        script.text = inputTex;
        container.appendChild(script);

        MathJax.Hub.Typeset(container, function () {
            let svg = container.querySelector('svg');
            if (svg) {
                let svgClone = svg.cloneNode(true);
                if (block.checked) {
                    svgClone.style.cssText = 'overflow-x:auto; outline:0; display:block; text-align:center; margin:15px 0px';
                }
                output.appendChild(svgClone);
            } else {
                output.appendChild(document.createElement('pre'))
                      .appendChild(document.createTextNode('Render failed'));
            }
            document.body.removeChild(container);
        });
    });
}

function closeFrame() {
    parent.window.postMessage({ type: 'CLOSE_FORMULA' }, '*');
}

function insertFormula() {
    if (insert.disabled == true) return;

    let first = output.querySelector('svg');
    if (!first) return;

    let sp = document.createElement('span');
    sp.setAttribute('data-formula', input.value.trim());
    sp.style.cssText = 'cursor:pointer;';
    sp.appendChild(first.cloneNode(true));
    sp.innerHTML = sp.innerHTML.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, '');

    parent.window.postMessage({ type: 'INSERT_FORMULA', text: sp.outerHTML }, '*');
    input.value = '';
    closeFrame();
}

$(function() {
    input = document.getElementById('input');
    block = document.getElementById('block');
    insert = document.getElementById('insert');
    output = document.getElementById('output');

    input.oninput = convert;
    block.onchange = convert;
    insert.onclick = insertFormula;
    document.getElementById('close').onclick = closeFrame;
    document.getElementById('cancel').onclick = closeFrame;

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type) {
            if (event.data.type == 'CHANGE_INPUT') {
                input.value = event.data.text;
                input.focus();
                if (event.data.isBlock == 'true') block.checked = true;
                else block.checked = false;
                convert();
            }
        }
    });

    $(window).focusout(function() {
        setTimeout(function() { input.focus(); }, 10);
    });

    input.keydown(function(event) {
        if (event.keyCode == 13 && event.shiftKey) {
            insertFormula();
        }
    });

    $(document).keydown(function(event) {
        if (event.keyCode == 27) {
            closeFrame();
        }
    });
});

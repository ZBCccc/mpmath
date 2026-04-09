const POPUP_ID = 'popup';
const LEGACY_MENU_ID = 'js_editor_insert_formula';
const FALLBACK_MENU_ID = 'mpm_formula_button';
const INJECT_SCRIPT_ID = 'mpmath-inject-script';

function getPopupFrame() {
    return document.getElementById(POPUP_ID);
}

function postPopupMessage(payload) {
    const popup = getPopupFrame();
    if (!popup || !popup.contentWindow) {
        return;
    }
    popup.contentWindow.postMessage(payload, '*');
}

function openFormulaPopup(initialText, isBlock) {
    const popup = getPopupFrame();
    if (!popup) {
        return;
    }

    popup.style.display = 'block';
    postPopupMessage({
        type: 'CHANGE_INPUT',
        text: initialText || '',
        isBlock: isBlock ? 'true' : 'false'
    });

    setTimeout(function () {
        popup.focus();
    }, 10);
}

function formulaClick(event) {
    openFormulaPopup('', false);
    hideFormulaMenus();
    if (event) {
        event.stopPropagation();
    }
}

function fixClick(event) {
    revise();
    hideFormulaMenus();
    if (event) {
        event.stopPropagation();
    }
}

function guideClick(event) {
    alert('指南还在施工!');
    hideFormulaMenus();
    if (event) {
        event.stopPropagation();
    }
}

function hideFormulaMenus() {
    document.querySelectorAll('.mpm-dropdown-menu').forEach(function (menu) {
        menu.style.display = 'none';
    });
}

function injectBridgeScript() {
    if (document.getElementById(INJECT_SCRIPT_ID)) {
        return;
    }

    const script = document.createElement('script');
    script.id = INJECT_SCRIPT_ID;
    script.src = chrome.runtime.getURL('assets/js/mpm-inject.js');
    (document.head || document.documentElement).appendChild(script);
}

function ensurePopupFrame() {
    if (getPopupFrame()) {
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('pages/popup.html');
    iframe.className = 'mpm-modal';
    iframe.frameBorder = '0';
    iframe.allowTransparency = true;
    iframe.id = POPUP_ID;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
}

function createDropdownMenu() {
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'tpl_dropdown_menu mpm-dropdown-menu';
    dropdownMenu.style.display = 'none';

    const insertItem = document.createElement('li');
    insertItem.className = 'tpl_dropdown_menu_item';
    insertItem.innerText = '插入公式 ⌘/';
    insertItem.addEventListener('click', formulaClick);
    dropdownMenu.appendChild(insertItem);

    const fixItem = document.createElement('li');
    fixItem.className = 'tpl_dropdown_menu_item';
    fixItem.innerText = '修复SVG';
    fixItem.addEventListener('click', fixClick);
    dropdownMenu.appendChild(fixItem);

    const guideItem = document.createElement('li');
    guideItem.className = 'tpl_dropdown_menu_item';
    guideItem.innerText = '指南';
    guideItem.addEventListener('click', guideClick);
    dropdownMenu.appendChild(guideItem);

    return dropdownMenu;
}

function createLegacyMenuButton() {
    const menu = document.createElement('li');
    menu.className = 'tpl_item tpl_item_dropdown jsInsertIcon formula';
    menu.id = LEGACY_MENU_ID;

    const title = document.createElement('span');
    title.innerText = '公式';
    menu.appendChild(title);

    const dropdown = createDropdownMenu();
    menu.appendChild(dropdown);

    menu.addEventListener('click', function (event) {
        event.stopPropagation();
        const nextDisplay = dropdown.style.display === 'block' ? 'none' : 'block';
        hideFormulaMenus();
        dropdown.style.display = nextDisplay;
    });

    return menu;
}

function createFallbackButton() {
    const button = document.createElement('button');
    button.id = FALLBACK_MENU_ID;
    button.type = 'button';
    button.className = 'mpm-toolbar-button';
    button.innerText = '公式';
    button.addEventListener('click', formulaClick);
    return button;
}

function ensureFormulaEntry() {
    if (document.getElementById(LEGACY_MENU_ID) || document.getElementById(FALLBACK_MENU_ID)) {
        return;
    }

    const legacyToolbar = document.getElementById('js_media_list');
    if (legacyToolbar) {
        legacyToolbar.appendChild(createLegacyMenuButton());
        return;
    }

    const modernToolbar = document.querySelector('.edui-toolbar.edui-toolbar-primary, .edui-toolbar-primary');
    if (modernToolbar) {
        modernToolbar.appendChild(createFallbackButton());
    }
}

function bindShortcut(targetDocument) {
    if (!targetDocument || targetDocument.__mpmShortcutBound) {
        return;
    }

    targetDocument.addEventListener('keydown', function (event) {
        const key = event.key || '';
        const isSlash = key === '/' || event.keyCode === 191;
        if ((event.ctrlKey || event.metaKey) && isSlash) {
            event.preventDefault();
            formulaClick();
        }
    });
    targetDocument.__mpmShortcutBound = true;
}

function bindKeyboardShortcuts() {
    bindShortcut(document);

    const legacyFrame = document.getElementById('ueditor_0');
    if (legacyFrame && legacyFrame.contentDocument) {
        bindShortcut(legacyFrame.contentDocument);
    }
}

function initializePageHooks() {
    injectBridgeScript();
    ensurePopupFrame();
    ensureFormulaEntry();
    bindKeyboardShortcuts();

    document.addEventListener('click', function (event) {
        const isFormulaTrigger = event.target.closest('#' + LEGACY_MENU_ID + ', #' + FALLBACK_MENU_ID);
        if (!isFormulaTrigger) {
            hideFormulaMenus();
        }
    });

    let observerTimer = null;
    const observer = new MutationObserver(function () {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(function () {
            ensurePopupFrame();
            ensureFormulaEntry();
            bindKeyboardShortcuts();
        }, 200);
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

function loadSVG(src) {
    return new Promise(function (resolve, reject) {
        const ajax = new XMLHttpRequest();
        ajax.open('GET', src, true);
        ajax.onload = function () {
            const div = document.createElement('div');
            div.innerHTML = ajax.responseText;
            resolve(div.querySelector('svg'));
        };
        ajax.onerror = function () {
            reject(new Error('Failed to fetch SVG'));
        };
        ajax.send();
    });
}

function getLegacyEditorView() {
    const legacyFrame = document.getElementById('ueditor_0');
    if (!legacyFrame || !legacyFrame.contentDocument) {
        return null;
    }
    return legacyFrame.contentDocument.querySelector('.view');
}

function revise() {
    const view = getLegacyEditorView();
    if (!view) {
        const isModernEditor = Boolean(
            document.querySelector('.ProseMirror, [contenteditable="true"]')
        );
        if (isModernEditor) {
            alert('当前为新版编辑器，公式已直接以内联 SVG 插入，无需修复。');
        } else {
            alert('未找到编辑器内容区域，请确认已打开图文编辑页面。');
        }
        return;
    }

    const embeds = view.querySelectorAll('embed');
    if (embeds.length === 0) {
        alert('未找到需要修复的 embed 公式。');
        return;
    }

    const tasks = Array.from(embeds).map(function (embed) {
        const parentNode = embed.parentNode;
        if (parentNode && parentNode.querySelector('svg')) {
            embed.remove();
            return Promise.resolve();
        }

        return loadSVG(embed.src).then(function (svg) {
            if (svg && parentNode) {
                parentNode.insertBefore(svg, embed);
            }
            embed.remove();
        }).catch(function (error) {
            console.error('[MP_SVG_REVISE] SVG load error:', error);
            embed.remove();
        });
    });

    Promise.all(tasks).then(function () {
        alert('修复了 ' + embeds.length + ' 个目标!');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageHooks, { once: true });
} else {
    initializePageHooks();
}

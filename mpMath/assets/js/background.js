chrome.runtime.onInstalled.addListener(function() {
    if (!chrome.declarativeContent || !chrome.declarativeContent.onPageChanged) {
        return;
    }

    const showAction = chrome.declarativeContent.ShowAction
        ? new chrome.declarativeContent.ShowAction()
        : new chrome.declarativeContent.ShowPageAction();

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'mp.weixin.qq.com'},
            })
            ],
                actions: [showAction]
        }]);
    });
});

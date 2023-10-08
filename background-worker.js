let tabStates = {};
let timers = {};

function getSoonestEndingTimer() {
    let soonestTimer = null;
    let leastTimeRemaining = Infinity;

    for (let timerId in timers) {
        let elapsed = Date.now() - timers[timerId].startTime;
        let remaining = timers[timerId].duration - elapsed;
        if (remaining < leastTimeRemaining) {
            leastTimeRemaining = remaining;
            soonestTimer = timers[timerId];
        }
    }

    return soonestTimer;
}

chrome.runtime.onInstalled.addListener(() => {
    // Set initial state
    chrome.storage.local.set({ isActive: false });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith("https://labs.staratlas.com/")) {
        // Reset state for the tab on refresh
        tabStates[tabId] = false;
        chrome.storage.local.set({ isActive: false });
        chrome.action.setBadgeText({ text: "", tabId: tabId });
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "activate") {
        chrome.storage.local.get(['isActive'], function (result) {
            if (!result.isActive) {
                chrome.storage.local.set({ isActive: true });
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    let tabId = tabs[0].id;
                    if (!tabStates[tabId]) {
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        }, () => {
                            tabStates[tabId] = true;
                            chrome.tabs.sendMessage(tabId, { action: "activate" });
                        });
                    } else {
                        chrome.tabs.sendMessage(tabId, { action: "activate" });
                    }
                    chrome.action.setBadgeText({ text: "ON", tabId: tabId });
                    chrome.action.setBadgeBackgroundColor({ color: "#0A74DA", tabId: tabId });
                });
                sendResponse({ status: "Active" });
            }
        });
    } else if (request.action == "deactivate") {
        chrome.storage.local.get(['isActive'], function (result) {
            if (result.isActive) {
                chrome.storage.local.set({ isActive: false });
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    let tabId = tabs[0].id;
                    chrome.action.setBadgeText({ text: "", tabId: tabId });
                    chrome.tabs.sendMessage(tabId, { action: "deactivate" });
                });
                sendResponse({ status: "Inactive" });
            }
        });
    } else if (request.action == "checkStatus") {
        chrome.storage.local.get(['isActive'], function (result) {
            sendResponse({ status: result.isActive ? "Active" : "Inactive" });
        });
    } else if (request.action == "startTimer") {
        let duration = request.duration * 1000;
        let timerId = Date.now();
        timers[timerId] = {
            startTime: Date.now(),
            duration: duration,
            name: request.name,
            intervalId: null
        };

        timers[timerId].intervalId = setInterval(() => {
            let elapsed = Date.now() - timers[timerId].startTime;
            let remaining = timers[timerId].duration - elapsed;
            if (remaining <= 0) {
                clearInterval(timers[timerId].intervalId);
                delete timers[timerId];
                chrome.runtime.sendMessage({ action: "updateTimer", time: "00:00", timerId: timerId });
            } else {
                let minutes = Math.floor(remaining / 60000);
                let seconds = ((remaining % 60000) / 1000).toFixed(0);
                let displayTime = minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
                chrome.runtime.sendMessage({ action: "updateTimer", time: displayTime, timerId: timerId, name: timers[timerId].name });
            }

            // Update the badge text with the time of the soonest ending timer
            let soonestTimer = getSoonestEndingTimer();
            if (soonestTimer) {
                let elapsedSoonest = Date.now() - soonestTimer.startTime;
                let remainingSoonest = soonestTimer.duration - elapsedSoonest;
                if (remainingSoonest <= 1000) {
                    chrome.action.setBadgeText({ text: "-" });
                } else {
                    let minutesSoonest = Math.floor(remainingSoonest / 60000);
                    let secondsSoonest = ((remainingSoonest % 60000) / 1000).toFixed(0);
                    let badgeDisplayTime = minutesSoonest + ":" + (secondsSoonest < 10 ? '0' : '') + secondsSoonest;
                    chrome.action.setBadgeText({ text: badgeDisplayTime });
                }
            }

        }, 1000);
    } else if (request.action == "getTimers") {
        let responseTimers = {};
        for (let timerId in timers) {
            let elapsed = Date.now() - timers[timerId].startTime;
            let remaining = timers[timerId].duration - elapsed;
            let minutes = Math.floor(remaining / 60000);
            let seconds = ((remaining % 60000) / 1000).toFixed(0);
            let displayTime = minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
            responseTimers[timerId] = { time: displayTime, name: timers[timerId].name };
        }
        sendResponse({ timers: responseTimers });
    }

    return true;
});

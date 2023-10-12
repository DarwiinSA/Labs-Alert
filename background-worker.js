let tabStates = {};

function startTimer(timerId, duration, callback) {
    const startTime = Date.now();

    function tick() {
        chrome.storage.local.get(['timers'], function(data) {
            const timers = data.timers;

            if (!timers || !timers[timerId]) {
                return;
            }

            const elapsed = Date.now() - startTime;
            const remaining = duration - elapsed;

            const minutes = Math.floor(remaining / 60000);
            const seconds = ((remaining % 60000) / 1000).toFixed(0);
            const displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            const timerName = timers[timerId].name;

            chrome.runtime.sendMessage({
                action: "updateTimer", 
                time: displayTime, 
                timerId: timerId,
                name: timerName
            });

            if (remaining <= 0) {
                callback();
            } else {
                setTimeout(tick, Math.min(1000, remaining));
            }
        });
    }

    tick();
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isActive: false, timers: {} });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith("https://labs.staratlas.com/")) {
        delete tabStates[tabId];
        chrome.storage.local.set({ isActive: false }, function() {
            chrome.action.setBadgeText({ text: "", tabId: tabId });
            chrome.storage.local.get(['timers'], function(data) {
                updateBadgeText(data.timers);
                startBadgeUpdater();
            });
        });
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case "activate":
            handleActivate(request, sendResponse);
            break;
        case "deactivate":
            handleDeactivate(request, sendResponse);
            break;
        case "checkStatus":
            chrome.storage.local.get(['isActive'], function(data) {
                sendResponse({status: data.isActive ? "Active" : "Inactive"});
            });
            break;
        case "startTimer":
            handleStartTimer(request, sendResponse);
            break;
        case "getTimers":
            handleGetTimers(request, sendResponse);
            break;
        default:
            sendResponse({ status: "unknown" });
            break;
        case "resetTimers":
            handleResetTimers(sendResponse);
            break;
    }

    return true; // Keep the message channel open for asynchronous responses
});

function handleActivate(request, sendResponse) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tabId = tabs[0].id;
        const tabUrl = tabs[0].url;

        if (!tabUrl.startsWith("https://labs.staratlas.com/")) {
            sendResponse({status: "Wrong Site"});
            return;
        }

        chrome.storage.local.set({ isActive: true });

        if (!tabStates[tabId]) {
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ['content.js']
            }, () => {
                tabStates[tabId] = true;
                chrome.tabs.sendMessage(tabId, { action: "activate" });
            });
        } else {
            chrome.tabs.sendMessage(tabId, { action: "activate" });
        }

        chrome.action.setBadgeText({text: "ON", tabId: tabId});
        chrome.action.setBadgeBackgroundColor({color: "#efad45", tabId: tabId});
        sendResponse({status: "Active"});
    });
}


function handleDeactivate(request, sendResponse) {
    chrome.storage.local.set({ isActive: false });
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tabId = tabs[0].id;
        chrome.action.setBadgeText({text: "", tabId: tabId});
        chrome.tabs.sendMessage(tabId, { action: "deactivate" });
    });
    sendResponse({status: "Inactive"});
}

function handleStartTimer(request, sendResponse) {
    const duration = request.duration * 1000;
    const timerId = Date.now();

    chrome.storage.local.get(['timers'], function(data) {
        let timers = data.timers || {};
        timers[timerId] = {
            startTime: Date.now(),
            duration: duration,
            name: request.name
        };

        chrome.storage.local.set({ timers: timers }, startBadgeUpdater);

        startTimer(timerId, duration, () => {
            chrome.storage.local.get(['timers'], function(data) {
                let updatedTimers = data.timers;
                if (updatedTimers && updatedTimers[timerId]) {
                    delete updatedTimers[timerId];
                    chrome.storage.local.set({ timers: updatedTimers }, function() {
                        chrome.storage.local.get(['timers'], function(data) {
                            updateBadgeText(data.timers);
                        });
                    });
                }
            });
            chrome.runtime.sendMessage({action: "updateTimer", time: "00:00", timerId: timerId});
        });
    });
}

function handleGetTimers(request, sendResponse) {
    chrome.storage.local.get(['timers'], function(data) {
        let timers = data.timers || {};
        const responseTimers = {};
        for (let timerId in timers) {
            const elapsed = Date.now() - timers[timerId].startTime;
            const remaining = timers[timerId].duration - elapsed;
            const minutes = Math.floor(remaining / 60000);
            const seconds = ((remaining % 60000) / 1000).toFixed(0);
            const displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            responseTimers[timerId] = {time: displayTime, name: timers[timerId].name};
        }
        sendResponse({timers: responseTimers});
    });
}

let badgeUpdaterInterval;

function startBadgeUpdater() {
    if (badgeUpdaterInterval) {
        clearInterval(badgeUpdaterInterval);
    }

    badgeUpdaterInterval = setInterval(() => {
        chrome.storage.local.get(['timers'], function(data) {
            updateBadgeText(data.timers);
        });
    }, 1000);
}

function updateBadgeText(timers) {
    const soonestTimer = getSoonestEndingTimer(timers);
    if (soonestTimer) {
        const elapsedSoonest = Date.now() - soonestTimer.startTime;
        const remainingSoonest = soonestTimer.duration - elapsedSoonest;
        if (remainingSoonest <= 1000) {
            chrome.action.setBadgeText({text: "-"});
        } else {
            const minutesSoonest = Math.floor(remainingSoonest / 60000);
            const secondsSoonest = ((remainingSoonest % 60000) / 1000).toFixed(0);
            const badgeDisplayTime = `${minutesSoonest}:${secondsSoonest < 10 ? '0' : ''}${secondsSoonest}`;
            chrome.action.setBadgeText({text: badgeDisplayTime});
        }
    } else {
        chrome.action.setBadgeText({text: "-"});
    }
}

function getSoonestEndingTimer(timers) {
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

function cleanupElapsedTimers() {
    chrome.storage.local.get(['timers'], function(data) {
        let timers = data.timers || {};
        const currentTime = Date.now();
        for (let timerId in timers) {
            const elapsed = currentTime - timers[timerId].startTime;
            if (elapsed >= timers[timerId].duration) {
                delete timers[timerId];
            }
        }
        chrome.storage.local.set({ timers: timers });
    });
}

function handleResetTimers(sendResponse) {
    chrome.storage.local.set({ timers: {} }, function() {
        if (chrome.runtime.lastError) {
            sendResponse({ status: "error", message: chrome.runtime.lastError.message });
        } else {
            // Update badge text
            chrome.action.setBadgeText({text: "-"});
            // Stop any ongoing badge updater
            if (badgeUpdaterInterval) {
                clearInterval(badgeUpdaterInterval);
            }
            // Send a message to the content script to clear the timeouts
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                const tabId = tabs[0].id;
                chrome.tabs.sendMessage(tabId, { action: "resetTimers" });
            });
            sendResponse({ status: "reset" });
        }
    });
}

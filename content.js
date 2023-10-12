(function() {
    if (window.hasInjectedScript) {
        return;
    }
    window.hasInjectedScript = true;

    let isActive = false;
    const timeoutIds = [];

    function handleClickEvent(e) {
        if (!isActive) return;

        const target = e.target || e.srcElement;
        const isButton = target.tagName.toLowerCase() === 'button';
        const isSpanInsideButton = target.tagName.toLowerCase() === 'span' && target.parentElement.tagName.toLowerCase() === 'button';
        
        if (isSpanInsideButton && target.innerHTML === 'Initiate Mining') {
            handleMiningEvent(target);
        } else {
            handleCraftingEvent(target, isButton, isSpanInsideButton);
        }
    }

    function handleMiningEvent(target) {
        const els = document.evaluate("//p[contains(., 'NAME / CALLSIGN')]", document, null, XPathResult.ANY_TYPE, null);
        const el = els.iterateNext();
        const fleetName = el.nextSibling.children[0].innerHTML;
        const time = target.parentElement.parentElement.previousSibling.innerHTML;
        const seconds = timeStringToSeconds(time);
        startTimer(seconds, fleetName);
    }

    function handleCraftingEvent(target, isButton, isSpanInsideButton) {
        const regex = /START \((\d+[smhd](?: \d+[smhd])*)\)/;
        const matchedTime = (isSpanInsideButton ? target.innerHTML : (isButton && target.children[0] ? target.children[0].innerHTML : "")).match(regex);
        if (!matchedTime) return;

        const els = document.evaluate("//h2[contains(., 'Tier ')]", document, null, XPathResult.ANY_TYPE, null);
        const el = els.iterateNext();
        const rssName = el.innerHTML;
        const seconds = timeStringToSeconds(matchedTime[1]);
        startTimer(seconds, rssName);
    }

    function startTimer(seconds, name) {
        if (isActive) {
            chrome.runtime.sendMessage({action: "startTimer", duration: seconds, name: name});
        }
        const timeoutId = setTimeout(function() { 
            const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
            audio.play();
            notifyMe(name + " done!");
            timeoutIds.splice(timeoutIds.indexOf(timeoutId), 1);
        }, (seconds + 3) * 1000);
        timeoutIds.push(timeoutId);
    }

    document.addEventListener('click', handleClickEvent);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
       if (message.action === "activate") {
           isActive = true;
           sendResponse({ status: "activated" });
       } else if (message.action === "deactivate") {
           isActive = false;
           timeoutIds.forEach(id => clearTimeout(id));
           timeoutIds.length = 0;
           sendResponse({ status: "deactivated" });
       } else if (message.action === "resetTimers") {
           timeoutIds.forEach(id => clearTimeout(id));
           timeoutIds.length = 0;
           sendResponse({ status: "timersReset" });
       } else {
           sendResponse({ status: "unknown" });
       }
   });

    function notifyMe(msg) {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            new Notification(msg);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(msg);
                }
            });
        }
    }

    function timeStringToSeconds(time) {
        const timeChunks = time.split(' ');
        let seconds = 0;
        timeChunks.forEach(el => {
            if (el.endsWith('s')) seconds += parseInt(el);
            else if (el.endsWith('m')) seconds += parseInt(el) * 60;
            else if (el.endsWith('h')) seconds += parseInt(el) * 60 * 60;
            else if (el.endsWith('d')) seconds += parseInt(el) * 60 * 60 * 24;
        });
        return seconds;
    }
})();

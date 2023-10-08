(function() {
    let isActive = false;
    let timeoutIds = [];

    function handleClickEvent(e) {
        if (!isActive) return;

        const target = e.target || e.srcElement;

        // Mining event detection
        if (target.tagName.toLowerCase() === 'span' && 
            target.parentElement.tagName.toLowerCase() === 'button' && 
            target.innerHTML == 'Initiate Mining') {
            
            const els = document.evaluate("//p[contains(., 'NAME / CALLSIGN')]", document, null, XPathResult.ANY_TYPE, null);
            const el = els.iterateNext();
            const fleetName = el.nextSibling.children[0].innerHTML;
            const time = target.parentElement.parentElement.previousSibling.innerHTML;
            const seconds = timeStringToSeconds(time);

            if (isActive) {
                chrome.runtime.sendMessage({action: "startTimer", duration: seconds, name: fleetName});
            }

            let timeoutId = setTimeout(function() { 
                const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
                audio.play();
                notifyMe("Mining done: " + fleetName);
                timeoutIds.splice(timeoutIds.indexOf(timeoutId), 1);
            }, (seconds + 3) * 1000);

            timeoutIds.push(timeoutId);
        }

        // Crafting event detection
        const regex = /START \((.*)\)/;
        const match = target.innerHTML.match(regex);

        if (target.tagName.toLowerCase() === 'span' && 
            target.parentElement.tagName.toLowerCase() === 'button' && 
            match) {
            
            const els = document.evaluate("//h2[contains(., 'Tier ')]", document, null, XPathResult.ANY_TYPE, null);
            const el = els.iterateNext();
            const rssName = el.innerHTML;
            const time = match[1];
            const seconds = timeStringToSeconds(time);

            if (isActive) {
            chrome.runtime.sendMessage({action: "startTimer", duration: seconds, name: rssName});
            }

            let timeoutId = setTimeout(function() { 
                const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
                audio.play();
                notifyMe("Crafting done: " + rssName);
                timeoutIds.splice(timeoutIds.indexOf(timeoutId), 1);
            }, (seconds + 3) * 1000);

            timeoutIds.push(timeoutId);
        }
    }

    // Delay the setup by a certain amount of time (e.g., 3 seconds)
    setTimeout(() => {
        document.addEventListener('click', handleClickEvent);
    }, 3000);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case "activate":
                isActive = true;
                sendResponse({ status: "activated" });
                break;
            case "deactivate":
                isActive = false;
                timeoutIds.forEach(id => clearTimeout(id));
                timeoutIds = [];
                sendResponse({ status: "deactivated" });
                break;
            default:
                sendResponse({ status: "unknown" });
                break;
        }
        return true; // Keeps the message channel open for asynchronous responses
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
            const unit = el.slice(-1);
            const value = parseInt(el.slice(0, -1));

            switch (unit) {
                case 's':
                    seconds += value;
                    break;
                case 'm':
                    seconds += value * 60;
                    break;
                case 'h':
                    seconds += value * 60 * 60;
                    break;
                case 'd':
                    seconds += value * 60 * 60 * 24;
                    break;
            }
        });

        return seconds;
    }
})();

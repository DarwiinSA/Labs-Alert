document.addEventListener('DOMContentLoaded', function() {
    
    const notificationElement = document.getElementById('notification');
    const timerContainer = document.getElementById('timersContainer');

    // Activate
    document.getElementById('activate').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: "activate"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                notificationElement.textContent = response.status;
                notificationElement.setAttribute('data-status', response.status);
            }
        });
    });

    // Deactivate
    document.getElementById('deactivate').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: "deactivate"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                notificationElement.textContent = response.status;
                notificationElement.setAttribute('data-status', response.status);
            }
        });
    });

    // Check status when popup is opened
    chrome.runtime.sendMessage({action: "checkStatus"}, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
        } else {
            notificationElement.textContent = response.status;
            notificationElement.setAttribute('data-status', response.status);
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "updateTimer") {
            let timerElement = document.getElementById('timer-' + message.timerId);
            if (!timerElement) {
                // Create a new timer element if it doesn't exist
                timerElement = document.createElement('p');
                timerElement.id = 'timer-' + message.timerId;
                timerContainer.appendChild(timerElement);
            }
            timerElement.textContent = message.name + ": " + message.time;

            // Optional: Remove timer element if time is "00:00"
            if (message.time === "00:00") {
                timerContainer.removeChild(timerElement);
            }
        }
    });

});

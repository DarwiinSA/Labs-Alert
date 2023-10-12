document.addEventListener('DOMContentLoaded', function() {
    const notificationElement = document.getElementById('notification');
    const timerContainer = document.getElementById('timersContainer');

    function toggleExtensionStatus(action) {
        chrome.runtime.sendMessage({action: action}, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
                return;
            }
            notificationElement.textContent = response.status;
            notificationElement.className = response.status.toLowerCase().replace(" ", "-");
         });
    }


    function updateTimerElement(timerId, name, time) {
        let timerElement = document.getElementById('timer-' + timerId);
        if (!timerElement) {
            timerElement = document.createElement('p');
            timerElement.id = 'timer-' + timerId;
            timerContainer.appendChild(timerElement);
        }
        timerElement.textContent = `${name}: ${time}`;

        if (time === "00:00") {
            timerContainer.removeChild(timerElement);
        }
    }

document.getElementById('activate').addEventListener('click', function() {
    toggleExtensionStatus("activate", function(response) {           
        notificationElement.textContent = response.status;
        notificationElement.className = response.status.toLowerCase();
    });
});



    document.getElementById('deactivate').addEventListener('click', function() {
        toggleExtensionStatus("deactivate");
    });

    toggleExtensionStatus("checkStatus");

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateTimer") {
            updateTimerElement(message.timerId, message.name, message.time);
        }
    });

    chrome.runtime.sendMessage({action: "getTimers"}, function(response) {
        if (response && response.timers) {
            for (let timerId in response.timers) {
                updateTimerElement(timerId, response.timers[timerId].name, response.timers[timerId].time);
            }
        } else {
            console.error("Unexpected response format:", response);
        }
    });

    document.getElementById('resetTimers').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: "resetTimers"}, function(response) {
            if (response && response.status === "reset") {
                // Clear the timer display in the popup
                timerContainer.innerHTML = "";
            } else {
                console.error("Failed to reset timers:", response);
            }
        });
    });
});

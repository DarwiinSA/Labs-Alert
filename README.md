# **SAGE LABS Alerts**
A Chrome extension designed to provide timely audio and visual notifications for mining and crafting events within the SAGE LABS platform.

### **Features**
**Timely Alerts:** 
Get audio and visual notifications for every mining or crafting event on the SAGE LABS platform.

**In-Browser Timer:**
Stay informed about the time left for your current event, even when browsing other tabs.

**Toggle Notifications:** 
Easily switch between active and inactive modes.

### Installation
- Clone or download this repository to your local machine.
- Open Chrome and navigate to chrome://extensions/.
- Enable Developer mode by toggling the switch in the top right corner.
- Click on Load unpacked and select the directory where you downloaded or cloned this repository.
- Navigate to labs.staratlas.com.
- To activate the extension, click on its icon in the Chrome toolbar and then select "Turn On".

### Known Issues
- The first crafting instance after activation might not always be recognized.
- If you encounter any quirks, a quick page refresh and reactivation usually does the trick.
- Timer drift: Over extended periods, the timer may drift from the actual time due to the limitations of setInterval and setTimeout. This can result in notifications being slightly delayed.

### Contributing
This extension is still under development. If you'd like to contribute or suggest improvements, please feel free to open an issue or submit a pull request.

Potential Areas for Contribution:
- Timer Accuracy: Implement a more accurate timer system to prevent drift over extended periods.
- Persistent Storage: Enhance the system to store timers in a more persistent storage to handle scenarios where the background script might be unloaded by Chrome.
- UI/UX Improvements: Enhance the popup UI for better user experience.
- Additional Features: Introduce features like custom notification sounds, options Page, manual timer set, etc...
- Code Optimization: Refactor and optimize the codebase for better performance and maintainability.
- Testing: Implement unit tests and integration tests to ensure the reliability of the extension.

### Acknowledgements
Special thanks to [Swift42]([url](https://github.com/Swift42)). The core content of this extension was inspired by their repo: https://github.com/Swift42/sa_notif

### License
This project is licensed under the GNU General Public License (GPL). See the [LICENSE]([url](https://github.com/DarwiinSA/sage-labs-alert/blob/main/LICENSE)https://github.com/DarwiinSA/sage-labs-alert/blob/main/LICENSE) file for details

let isPopupClosed = false; // Flag to track if the popup has been closed

// Load the saved speed value from Chrome storage when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup loaded");
    chrome.storage.sync.get(['readingSpeed'], (result) => {
        const savedSpeed = result.readingSpeed || 2;
        document.getElementById('speedRange').value = savedSpeed;
        document.getElementById('speedNumber').value = savedSpeed;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const selectedText = window.getSelection().toString().trim();
                    console.log("Selected text in tab: ", selectedText); // Debug output
                    return selectedText;
                }
            }, (results) => {
                const highlightedText = results[0].result;

                if (highlightedText) {
                        console.log('Popup opened, highlighted text found: ', highlightedText);
                        injectProcessHighlightedText(highlightedText, savedSpeed)
                }

                else {
                    console.error('No highlighted text found.');
                    injectSelectionMode(savedSpeed);
                }

            });
        });
    });

    // Add event listeners for the slider and number input
    document.getElementById('speedRange').addEventListener('input', updateSpeed);
    document.getElementById('speedNumber').addEventListener('input', updateSpeed);

    // Add event listener to close the popup manually
    document.getElementById('closePopup').addEventListener('click', () => {
        closePopup();
    });
});

// Function to automatically process any highlighted text
function injectProcessHighlightedText(text, speed) {
  console.log("Injecting processHighlightedText with text:", text, "and speed:", speed); // Debug output
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: processHighlightedText,
          args: [text, parseFloat(speed)]
      });
  });
}

// The function to be injected into the webpage
function processHighlightedText(text, speed) {
  console.log("Processing passed-in text:", text, "at speed:", speed); // Debug output
  if (text) {
      displayWords(text, speed);
      closePopup(); // Close the popup after processing the text
  }
}

// Function to start selection mode with the given speed
function injectSelectionMode(speed) {
    console.log("Starting selection mode with speed:", speed); // Debug output
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: startSelectionMode,
            args: [parseFloat(speed)]
        });
    });
    document.getElementById('cancelSelection').style.display = 'block'; // Show the "Cancel Selection Mode" button
}

// Function to start selection mode
function startSelectionMode(speed) {
    console.log('Selection mode started with speed:', speed);
    document.body.classList.add('selection-mode');

    const handleClick = function(event) {
        if (document.body.classList.contains('selection-mode')) {
            // Re-check the speed from storage when a click is registered
            chrome.storage.sync.get(['readingSpeed'], (result) => {
                const currentSpeed = result.readingSpeed || speed;

                // Proceed with paragraph click behavior
                let target = event.target;

                // Check if the clicked element is a paragraph
                const paragraphText = target.textContent.trim();
                console.log('Clicked-Text:', paragraphText);

                if (paragraphText) {
                    event.preventDefault();
                    displayWords(paragraphText, currentSpeed);
                    exitSelectionMode(); // End selection mode
                }
            });
        }
    };

    document.addEventListener('click', handleClick, { once: true });
}

// Update the speed in both the slider and the number input
function updateSpeed(event) {
    const speed = event.target.value;
    document.getElementById('speedRange').value = speed;
    document.getElementById('speedNumber').value = speed;

    console.log("Speed updated to:", speed); // Debug output

    // Save the new speed value in Chrome storage
    chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });

    // Optionally restart selection mode with the new speed
    injectSelectionMode(speed);
}

// Cancel selection mode when the cancel button is clicked
document.getElementById('cancelSelection').addEventListener('click', () => {
    cancelSelection();
});

// Function to cancel selection mode
function cancelSelection() {
    console.log("Cancelling selection mode"); // Debug output
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: cancelSelectionMode
        });
    });

    // Hide the "Cancel Selection Mode" button
    document.getElementById('cancelSelection').style.display = 'none';
}

// Function to close the popup
function closePopup() {
    console.log("Closing popup"); // Debug output
    if (!isPopupClosed) {
        isPopupClosed = true;
        window.close();
    }
}

// Function to cancel selection mode
function cancelSelectionMode() {
    console.log('Selection mode canceled');
    document.body.classList.remove('selection-mode');
    document.body.style.cursor = ''; // Reset the cursor to the default state
}

// Function to exit selection mode
function exitSelectionMode() {
    cancelSelectionMode(); // Cancel selection mode
    closePopup(); // Close the popup window
}

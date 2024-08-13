let isPopupClosed = false; // Flag to track if the popup has been closed

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['readingSpeed', 'fixedSizeBackground'], (result) => {
      const savedSpeed = result.readingSpeed || 2;
      const fixedSizeBackground = result.fixedSizeBackground !== undefined ? result.fixedSizeBackground : false;

      document.getElementById('speedRange').value = savedSpeed;
      document.getElementById('speedNumber').value = savedSpeed;
      document.getElementById('fixedSizeBackgroundToggle').checked = fixedSizeBackground;


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
                  injectProcessHighlightedText(highlightedText, savedSpeed, fixedSizeBackground);
              } else {
                  console.error('No highlighted text found.');
                  injectSelectionMode(savedSpeed, fixedSizeBackground);
              }

          });
      });
  });

    // Add event listeners
    document.getElementById('speedRange').addEventListener('input', updateSpeed);
    document.getElementById('speedNumber').addEventListener('input', updateSpeed);
    document.getElementById('fixedSizeBackgroundToggle').addEventListener('change', updateBackgroundSize);
    document.getElementById('closePopup').addEventListener('click', () => {
        closePopup();
  });
});


// Functions to automatically process any highlighted text
    function injectProcessHighlightedText(text, speed) {
      console.log("Injecting processHighlightedText with text:", text, "and speed:", speed); // Debug output
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: processHighlightedText,
              args: [text, parseFloat(speed)]
          });
      });
      closePopup(); // Close the popup after processing the text
    }

    function processHighlightedText(text, speed) {
      console.log("Processing passed-in text:", text, "at speed:", speed); // Debug output
      if (text) {
          displayWords(text, speed);
      }
    }

// Functions to start selection mode with the given speed
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

        // Save the new speed value in Chrome storage
        chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });

        // restart selection mode with the new speed
        injectSelectionMode(speed);
    }

// Upadte the background checkbox
    function updateBackgroundSize(event) {
      const isChecked = event.target.checked; // Get the current state of the checkbox
      chrome.storage.sync.set({ fixedSizeBackground: isChecked }); // Save the current state to storage
    }

//BUTTON STUFF
    // Cancel selection mode when the cancel button is clicked
    document.getElementById('cancelSelection').addEventListener('click', () => {
        cancelSelection();
    });

    // Start selection mode when the cancel button is clicked
    document.getElementById('startSelection').addEventListener('click', () => {
      startSelectionAgain();
    });
//BUTTON STUFF

// Functions to cancel selection mode
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
        document.getElementById('startSelection').style.display = 'block';

    }

    function cancelSelectionMode() {
      console.log('Selection mode canceled');
      document.body.classList.remove('selection-mode');
      document.body.style.cursor = ''; // Reset the cursor to the default state
    }

// Functions to start selection mode again
    function startSelectionAgain() {
      console.log("Starting selection mode"); // Debug output
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: startSelectionAgainMode
          });
      });

      // Hide the "Start Selection Mode" button
      document.getElementById('startSelection').style.display = 'none';
      document.getElementById('cancelSelection').style.display = 'block';

    }

    function startSelectionAgainMode() {
      console.log('Selection mode started');
      document.body.classList.add('selection-mode');
      document.body.style.cursor = ''; // Reset the cursor to the default state
    }

// Function to close the popup
    function closePopup() {
      console.log("Closing popup"); // Debug output
      if (!isPopupClosed) {
          isPopupClosed = true;
          window.close();
      }
    }

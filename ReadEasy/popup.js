let isPopupClosed = false; // Flag to track if the popup has been closed

// Debounce function to limit how often a function is executed (fixes the colour picking spamming storage with api requests)
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['readingSpeed', 'fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour'], (result) => { //1st storage change

      //2nd storage change
      const savedSpeed = result.readingSpeed || 2;
      const fixedSizeBackground = result.fixedSizeBackground !== undefined ? result.fixedSizeBackground : false;
      const textSize = result.textSize || 34
      const textColour = result.textColour || '#000000'
      const backgroundColour = result.backgroundColour || 'f9f9f9'


    // Set the values for speed and text size elements //3rd storage change
    document.getElementById('speedRange').value = savedSpeed;
    document.getElementById('speedNumber').value = savedSpeed;
    document.getElementById('fixedSizeBackgroundToggle').checked = fixedSizeBackground;
    document.getElementById('textSizeNumber').value = textSize;
    document.getElementById('textSizeRange').value = textSize;
    document.getElementById('textColour').value = textColour;
    document.getElementById('backgroundColour').value = backgroundColour;

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

    // Add event listeners //4th storage change
    document.getElementById('speedRange').addEventListener('input', updateSpeed);
    document.getElementById('speedNumber').addEventListener('input', updateSpeed);
    document.getElementById('fixedSizeBackgroundToggle').addEventListener('change', updateBackgroundSize);
    document.getElementById('textSizeRange').addEventListener('input', updateTextSize);
    document.getElementById('textSizeNumber').addEventListener('input', updateTextSize);
    document.getElementById('textColour').addEventListener('input', debounce(updateTextColour, 300));
    document.getElementById('backgroundColour').addEventListener('input', debounce(updateBackgroundColour, 300));


    document.getElementById('closePopup').addEventListener('click', () => closePopup());
});

//5th storage change below (make an update function)

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

        // Cancel selection mode before making a new one
        cancelSelection();

        // restart selection mode with the new speed
        injectSelectionMode(speed);
    }

// Update the text size in both the slider and the number input
    function updateTextSize(event) {
        const textSize = event.target.value;
        document.getElementById('textSizeRange').value = textSize;
        document.getElementById('textSizeNumber').value = textSize;

        // Save the new text size value in Chrome storage
        chrome.storage.sync.set({ textSize: parseFloat(textSize) });
    }

// Update the background checkbox
    function updateBackgroundSize(event) {
      const isChecked = event.target.checked; // Get the current state of the checkbox
      chrome.storage.sync.set({ fixedSizeBackground: isChecked }); // Save the current state to storage
    }

// Update the text colour
    function updateTextColour(event) {
        const textColour = event.target.value; // Get the current state of the colour input
        document.getElementById('textColour').value = textColour;
        chrome.storage.sync.set({ textColour: textColour }); // Save the current state to storage
    }

    function updateBackgroundColour(event) {
        const backgroundColour = event.target.value; // Get the current state of the colour input
        document.getElementById('backgroundColour').value = backgroundColour;
        chrome.storage.sync.set({ backgroundColour: backgroundColour }); // Save the current state to storage
    }

// Exit button
    document.getElementById('exit').addEventListener('click', () => {
        closePopup();
    });

// Function to close the popup
    function closePopup() {
      console.log("Closing popup"); // Debug output
      if (!isPopupClosed) {
          isPopupClosed = true;
          window.close();
      }
    }

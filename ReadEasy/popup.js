// Load the saved speed value from Chrome storage when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['readingSpeed'], (result) => {
    const savedSpeed = result.readingSpeed || 2;
    document.getElementById('speedRange').value = savedSpeed;
    document.getElementById('speedNumber').value = savedSpeed;
    startSelection(savedSpeed);
  });
  
  // Add event listeners for the slider and number input
  document.getElementById('speedRange').addEventListener('input', updateSpeed);
  document.getElementById('speedNumber').addEventListener('input', updateSpeed);
});

// Function to start selection mode with the given speed
function startSelection(speed) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: startSelectionMode,
      args: [parseFloat(speed)]
    });
  });
  
  document.getElementById('cancelSelection').style.display = 'block'; // Show the "Cancel Selection Mode" button
}

// Update the speed in both the slider and the number input
function updateSpeed(event) {
  const speed = event.target.value;
  document.getElementById('speedRange').value = speed;
  document.getElementById('speedNumber').value = speed;

  // Save the new speed value in Chrome storage
  chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });
}

// Cancel selection mode when the cancel button is clicked
document.getElementById('cancelSelection').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: cancelSelectionMode
    });
  });

  // Hide the "Cancel Selection Mode" button
  document.getElementById('cancelSelection').style.display = 'none';
});

// Function to start selection mode
function startSelectionMode(speed) {
  console.log('Selection mode started with speed:', speed);
  document.body.classList.add('selection-mode');

  document.addEventListener('click', function handleParagraphClick(event) {
    if (document.body.classList.contains('selection-mode')) {
      
      // Re-check the speed from storage when a click is registered
      chrome.storage.sync.get(['readingSpeed'], (result) => {
        const currentSpeed = result.readingSpeed || speed;

        // Check if any text is selected
        const selectedText = window.getSelection().toString().trim();
        console.log('Selected Text:', selectedText);

        if (selectedText) {
          // If text is selected, read it
          displayWords(selectedText, currentSpeed);
          cancelSelectionMode();
        } else {
          // If no text is selected, proceed with paragraph click behavior
          let target = event.target;

          // Check if the clicked element is a paragraph
          if (target.tagName.toLowerCase() === 'p') {
            const paragraphText = target.textContent.trim();
            console.log('Paragraph Text:', paragraphText);

            if (paragraphText) {
              event.preventDefault();
              displayWords(paragraphText, currentSpeed);
              cancelSelectionMode();
            }
          }
        }
      });

    }
  }, { once: true });
}

// Function to cancel selection mode
function cancelSelectionMode() {
  console.log('Selection mode canceled');
  document.body.classList.remove('selection-mode');
}

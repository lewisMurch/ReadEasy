// Start selection mode automatically when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  startSelection();
});

function startSelection() {
  const speed = document.getElementById('speedNumber').value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: startSelectionMode,
      args: [parseFloat(speed)]
    });
  });

  // Show the "Cancel Selection Mode" button
  document.getElementById('cancelSelection').style.display = 'block';
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

      // Check if any text is selected
      const selectedText = window.getSelection().toString().trim();
      console.log('Selected Text:', selectedText);

      if (selectedText) {
        // If text is selected, read it
        displayWords(selectedText, speed);
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
            displayWords(paragraphText, speed);
            cancelSelectionMode();
          }
        }
      }
    }
  }, { once: true });
}

// Function to cancel selection mode
function cancelSelectionMode() {
  console.log('Selection mode canceled');
  document.body.classList.remove('selection-mode');
  document.removeEventListener('click', handleParagraphClick);
}

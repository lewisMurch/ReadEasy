function displayWords(text, speed) {
  const words = text.split(/\s+/);
  let currentIndex = 0;
  let timeoutId;  // To keep track of the timeout
  let stopDisplay = false;  // Flag to stop the display

  const overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

  // Get the user's preferences from Chrome storage
  chrome.storage.sync.get(['fixedSizeBackground', 'displayTextSize'], function(result) {
    const fixedSizeBackground = result.fixedSizeBackground || false;
    const displayTextSize = result.displayTextSize || '44px';  // Default of 44px if not found

    // Style the overlay for proper centering
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'black';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.textAlign = 'center';
    overlay.style.fontFamily = 'Arial, sans-serif';  // Explicitly set the font to Arial
    overlay.style.fontSize = displayTextSize;  // Use the retrieved text size
    overlay.style.whiteSpace = 'nowrap';  // Prevent text from wrapping

    if (fixedSizeBackground) {
      const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
      overlay.style.width = `${longestWord.length + 2}ch`;  // Add 2ch to make the box bigger
    } else {
      // Ensure the width is set to auto first
      overlay.style.width = 'auto';

      // Add some extra pixels to the width
      let extraPixels = 0;  // Adjust this value as needed
      let currentWidth = overlay.offsetWidth;  // Get the computed width after setting to auto
      overlay.style.width = (currentWidth + extraPixels) + 'px';
    }

    function showWord() {
      if (stopDisplay) {
        overlay.remove();  // Remove the overlay if the display is stopped
        return;
      }

      if (currentIndex < words.length) {
        overlay.textContent = words[currentIndex];
        if (!fixedSizeBackground) {
          overlay.style.width = 'auto';  // Set width to auto for each word
        }
        currentIndex++;
        timeoutId = setTimeout(showWord, 1000 / (speed * 2));
      } else {
        overlay.remove();
      }
    }

    // Event listener to stop the display when the Escape key is pressed
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        stopDisplay = true;  // Set the flag to true
        clearTimeout(timeoutId);  // Clear the current timeout
        overlay.remove();  // Remove the overlay immediately
      }
    });

    showWord();
  });
}

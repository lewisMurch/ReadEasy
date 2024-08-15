function displayWords(text, speed) {
  const words = text.split(/\s+/);
  let currentIndex = 0;
  let timeoutId;  // To keep track of the timeout
  let stopDisplay = false;  // Flag to stop the display

  const overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

  // Function to make the overlay draggable
  function makeDraggable(element) {
    let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

    element.onmousedown = function(e) {
      e.preventDefault();

      mouseX = e.clientX;
      mouseY = e.clientY;

      document.onmousemove = dragElement;
      document.onmouseup = stopDragging;
    };

    function dragElement(e) {
      e.preventDefault();

      offsetX = mouseX - e.clientX;
      offsetY = mouseY - e.clientY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      element.style.top = (element.offsetTop - offsetY) + "px";
      element.style.left = (element.offsetLeft - offsetX) + "px";
    }

    function stopDragging() {
      document.onmousemove = null;
      document.onmouseup = null;
    }
  }

  // Get the user's preferences from Chrome storage
  chrome.storage.sync.get(['fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour'], function(result) {
    const fixedSizeBackground = result.fixedSizeBackground || false;
    const textSize = result.textSize || '5px';  // Default of 34px if not found
    const textColour = result.textColour || 'black';
    const backgroundColour = result.backgroundColour || 'white';

    // Style the overlay for proper centering
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = backgroundColour;
    overlay.style.color = textColour;
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.textAlign = 'center';
    overlay.style.fontFamily = 'Arial, sans-serif';  // Explicitly set the font to Arial
    overlay.style.fontSize = textSize + 'px';  // Use the retrieved text size
    overlay.style.whiteSpace = 'nowrap';  // Prevent text from wrapping
    overlay.style.cursor = 'move';  // Change cursor to move icon

    if (fixedSizeBackground) {
      const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
      overlay.style.width = `${longestWord.length + 2}ch`;  // Add 2ch to make the box bigger
    } else {
      overlay.style.width = 'auto';
      let extraPixels = 0;
      let currentWidth = overlay.offsetWidth;
      overlay.style.width = (currentWidth + extraPixels) + 'px';
    }

    makeDraggable(overlay);  // Make the overlay draggable

    function showWord() {
      if (stopDisplay) {
        overlay.remove();  // Remove the overlay if the display is stopped
        return;
      }

      if (currentIndex < words.length) {
        overlay.textContent = words[currentIndex];
        if (!fixedSizeBackground) {
          overlay.style.width = 'auto';
        }
        currentIndex++;
        timeoutId = setTimeout(showWord, 1000 / (speed * 2));
      } else {
        overlay.remove();
      }
    }

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

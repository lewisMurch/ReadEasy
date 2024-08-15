let tempPause = false;
let timeoutId;  // To keep track of the timeout
let paused = false;  // Flag to pause the display
let stopDisplay = false;  // Flag to stop the display
let currentIndex = 0;  // Track the current word index
let words = [];  // This will store the words

// Variables to be set by chrome.storage.sync.get
let fixedSizeBackground;
let overlay;

function showWord(speed) {
  if (stopDisplay) {
    overlay.remove();  // Remove the overlay if the display is stopped
    return;
  }

  if (paused) {
    return;  // Do nothing if the display is paused
  }

  if (currentIndex < words.length) {
    const currentWord = words[currentIndex];
    
    if (currentWord !== undefined) {
      overlay.textContent = currentWord;

      if (!fixedSizeBackground) {
        overlay.style.width = 'auto';
      }

      // Check if current word ends with punctuation before advancing the index
      if (currentWord.trim().endsWith('.') || currentWord.trim().endsWith('!')) {
        tempPause = true;
      }

      currentIndex++;

      console.log(currentWord);
      timeoutId = setTimeout(() => showWord(speed), 1000 / (speed * 2));

      if (tempPause) {
        pauseOverlay();
        tempPause = false;
        setTimeout(function() {
          console.log('pause over');
          playOverlay(speed);
        }, 400);  // Pause after displaying the punctuation word
      }
    }
  } else {
    overlay.remove();
  }
}

function displayWords(text, speed) {
  // Reset global variables
  stopDisplay = false;
  paused = false;
  tempPause = false;
  currentIndex = 0;

  words = text.split(/\s+/);  // Split text into words

  overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

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

      chrome.storage.sync.set({
        overlayPosition: {
          top: element.style.top,
          left: element.style.left
        }
      });
    }
  }

  chrome.storage.sync.get(['fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'overlayPosition', 'pausePunctuation'], function(result) {
    fixedSizeBackground = result.fixedSizeBackground || false;
    const textSize = result.textSize || '5px';
    const textColour = result.textColour || 'black';
    const backgroundColour = result.backgroundColour || 'white';
    const overlayPosition = result.overlayPosition || { top: '50%', left: '50%' };
    const pausePunctuation = result.pausePunctuation || false;

    overlay.style.position = 'fixed';
    overlay.style.top = overlayPosition.top;
    overlay.style.left = overlayPosition.left;
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = backgroundColour;
    overlay.style.color = textColour;
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.textAlign = 'center';
    overlay.style.fontFamily = 'Arial, sans-serif';
    overlay.style.fontSize = textSize + 'px';
    overlay.style.whiteSpace = 'nowrap';
    overlay.style.cursor = 'move';

    if (fixedSizeBackground) {
      const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
      overlay.style.width = `${longestWord.length + 2}ch`;
    } else {
      overlay.style.width = 'auto';
      let extraPixels = 0;
      let currentWidth = overlay.offsetWidth;
      overlay.style.width = (currentWidth + extraPixels) + 'px';
    }

    makeDraggable(overlay);

    showWord(speed);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      stopDisplay = true;
      clearTimeout(timeoutId);
      overlay.remove();
    }
  });
}

function pauseOverlay() {
  paused = true;
  clearTimeout(timeoutId);
}

function playOverlay(speed) {
  if (paused) {
    paused = false;
    showWord(speed);
  }
}

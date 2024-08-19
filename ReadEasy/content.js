let tempPause = false;
let timeoutId;  // To keep track of the timeout
let paused = false;  // Flag to pause the display
let stopDisplay = false;  // Flag to stop the display
let currentIndex = 0;  // Track the current word index
let words = [];  // This will store the words
let manualMode = true;
let currentOverlay = null;  // Track the current overlay

// Variables to be set by chrome.storage.sync.get
let fixedSizeBackground;
let pausePunctuation;
let pausePunctuationLength;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showOverlay") {
    if (currentOverlay) {
      currentOverlay.remove();  // Remove the existing overlay
      currentOverlay = null;    // Reset the currentOverlay immediately
    }
      displayWords(message.text, message.speed, message.manualMode);
  }

  if (message.action === "startSelectionMode") {
      startSelectionMode(message.speed);
  }
});

function showWord(speed, pausePunctuationLength) {
  if (stopDisplay) {
    if (currentOverlay) {
      currentOverlay.remove();  // Remove the overlay if the display is stopped
      currentOverlay = null;    // Reset the currentOverlay immediately
  }
  
      return;
  }

  if (paused) {
      return;  // Do nothing if the display is paused
  }

  if (currentIndex < words.length) {
      const currentWord = words[currentIndex];

      if (currentWord !== undefined) {
          currentOverlay.textContent = '';  // Clear the overlay content before updating
          currentOverlay.textContent = currentWord;  // Update with the current word

          if (!fixedSizeBackground) {
              currentOverlay.style.width = 'auto';
          }

          // Check if current word ends with punctuation before advancing the index, only if pausePunctuation is true
          if (pausePunctuation && (currentWord.trim().endsWith('.') || currentWord.trim().endsWith('!'))) {
              tempPause = true;
          }

          currentIndex++;

          timeoutId = setTimeout(() => showWord(speed, pausePunctuationLength), 1500 / Math.pow(speed, 1.65));

          if (tempPause) {
              pauseOverlay();
              tempPause = false;
              setTimeout(function() {
                  console.log('pause over');
                  playOverlay(speed);
              }, 160 * pausePunctuationLength);  // Pause after displaying the punctuation word
          }
      }
  } else {
      if (currentOverlay) {
          currentOverlay.remove();  // Ensure overlay is removed when done
          currentOverlay = null;
      }
  }
}

function displayWords(text, speed) {

  if (currentOverlay) {
    return;  // Exit if an overlay is already active
  }

  // Reset global variables
  stopDisplay = false;
  paused = false;
  tempPause = false;
  currentIndex = 0;

  words = text.split(/\s+/);  // Split text into words

  // Create the overlay
  currentOverlay = document.createElement('div');
  currentOverlay.className = 'word-overlay';
  document.body.appendChild(currentOverlay);

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

  chrome.storage.sync.get(['fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'overlayPosition', 'pausePunctuation', 'pausePunctuationLength', 'fontType'], function(result) {
      fixedSizeBackground = result.fixedSizeBackground || false;
      const textSize = result.textSize || '34px';  // Increase default text size
      const textColour = result.textColour || 'white';
      const backgroundColour = result.backgroundColour || 'black';
      const overlayPosition = result.overlayPosition || { top: '50%', left: '50%' };
      pausePunctuation = result.pausePunctuation || false;
      pausePunctuationLength = result.pausePunctuationLength || 4;
      const fontType = result.fontType || "'Comic Sans MS', cursive";

      currentOverlay.style.position = 'fixed';
      currentOverlay.style.top = overlayPosition.top;
      currentOverlay.style.left = overlayPosition.left;
      currentOverlay.style.transform = 'translate(-50%, -50%)';
      currentOverlay.style.backgroundColor = backgroundColour;
      currentOverlay.style.color = textColour;
      currentOverlay.style.padding = '10px';
      currentOverlay.style.borderRadius = '5px';
      currentOverlay.style.textAlign = 'center';
      currentOverlay.style.fontFamily = fontType;
      currentOverlay.style.fontSize = textSize + 'px';  // Append 'px' to the text size
      currentOverlay.style.whiteSpace = 'nowrap';
      currentOverlay.style.cursor = 'move';

      if (fixedSizeBackground) {
          const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
          currentOverlay.style.width = `${longestWord.length + 2}ch`;
      } else {
          currentOverlay.style.width = 'auto';
      }

      makeDraggable(currentOverlay);

      // Start displaying words automatically
      showWord(speed, pausePunctuationLength);
  });

  document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          stopDisplay = true;
          clearTimeout(timeoutId);
          if (currentOverlay) {
              currentOverlay.remove();
              currentOverlay = null;
          }
      }
  });
}

function showWordManual() {
  if (stopDisplay) {
      if (currentOverlay) {
          currentOverlay.remove();  // Remove the overlay if the display is stopped
          currentOverlay = null;    // Reset the currentOverlay
      }
      return;
  }

  if (paused) {
      return;  // Do nothing if the display is paused
  }

  if (currentIndex >= 0 && currentIndex < words.length) {
      const currentWord = words[currentIndex];

      if (currentWord !== undefined) {
          currentOverlay.textContent = '';  // Clear the overlay content before updating
          currentOverlay.textContent = currentWord;  // Update with the current word

          if (!fixedSizeBackground) {
              currentOverlay.style.width = 'auto';
          }
      }
  } else if (currentIndex >= words.length) {
      if (currentOverlay) {
          currentOverlay.remove();  // Remove the overlay when done
          currentOverlay = null;
      }
  }
}

function displayWordsManual(text) {

  if (currentOverlay) {
    return;  // Exit if an overlay is already active
  }

  // Reset global variables
  stopDisplay = false;
  paused = false;
  currentIndex = 0;

  words = text.split(/\s+/);  // Split text into words

  if (currentOverlay) {
      currentOverlay.remove();  // Remove any existing overlay
      currentOverlay = null;    // Reset the currentOverlay
  }

  // Create the overlay
  currentOverlay = document.createElement('div');
  currentOverlay.className = 'word-overlay';
  document.body.appendChild(currentOverlay);

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

  chrome.storage.sync.get(['fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'overlayPosition', 'fontType'], function(result) {
      fixedSizeBackground = result.fixedSizeBackground || false;
      const textSize = result.textSize || '34px';
      const textColour = result.textColour || 'white';
      const backgroundColour = result.backgroundColour || 'black';
      const overlayPosition = result.overlayPosition || { top: '50%', left: '50%' };
      const fontType = result.fontType || "'Comic Sans MS', cursive";

      currentOverlay.style.position = 'fixed';
      currentOverlay.style.top = overlayPosition.top;
      currentOverlay.style.left = overlayPosition.left;
      currentOverlay.style.transform = 'translate(-50%, -50%)';
      currentOverlay.style.backgroundColor = backgroundColour;
      currentOverlay.style.color = textColour;
      currentOverlay.style.padding = '10px';
      currentOverlay.style.borderRadius = '5px';
      currentOverlay.style.textAlign = 'center';
      currentOverlay.style.fontFamily = fontType;
      currentOverlay.style.fontSize = textSize + 'px';
      currentOverlay.style.whiteSpace = 'nowrap';
      currentOverlay.style.cursor = 'move';

      if (fixedSizeBackground) {
          const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
          currentOverlay.style.width = `${longestWord.length + 2}ch`;
      } else {
          currentOverlay.style.width = 'auto';
      }

      makeDraggable(currentOverlay);

      // Display the first word
      showWordManual();

      // Add event listeners for arrow key navigation
      document.addEventListener('keydown', function(event) {
          if (event.key === 'ArrowRight') {
              if (currentIndex < words.length - 1) {
                  currentIndex++;
                  showWordManual();
              }
          } else if (event.key === 'ArrowLeft') {
              if (currentIndex > 0) {
                  currentIndex--;
                  showWordManual();
              }
          } else if (event.key === 'Escape') {
              stopDisplay = true;
              clearTimeout(timeoutId);
              if (currentOverlay) {
                  currentOverlay.remove();
                  currentOverlay = null;
              }
          }
      });
  });
}

function pauseOverlay() {
  paused = true;
  clearTimeout(timeoutId);
}

function playOverlay(speed) {
  if (paused) {
      paused = false;
      showWord(speed, pausePunctuationLength);
  }
}

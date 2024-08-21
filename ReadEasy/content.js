let fullPunctuationPause = false;
let halfPunctuationPause = false;
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
let pausePunctuationPercentage;

function handleManualModeKeydown(event) {
    if(manualMode == true){
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
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showOverlay") {
    if (currentOverlay) {
      currentOverlay.remove();  // Remove the existing overlay
      currentOverlay = null;    // Reset the currentOverlay immediately
    }
      displayWords(message.text, message.speed, message.manualMode);
  }

  if (message.action === "showOverlayManual") {
    if (currentOverlay) {
      currentOverlay.remove();  // Remove the existing overlay
      currentOverlay = null;    // Reset the currentOverlay immediately
    }
    displayWordsManual(message.text);
  }

  if (message.action === "startSelectionMode") {
      startSelectionMode(message.speed);
  }
});

function showWord(speed, pausePunctuationLength, pausePunctuationPercentage) {
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
            // Temporarily remove the overlay from the DOM
            document.body.removeChild(currentOverlay);

            // Update the overlay's text content
            currentOverlay.textContent = currentWord;

            if (fixedSizeBackground) {
                const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
                currentOverlay.style.width = `${longestWord.length + 2}ch`;
                currentOverlay.style.height = 'auto';
            } else {
                currentOverlay.style.width = 'auto';
                currentOverlay.style.height = 'auto'; 
            }
            
            // Reattach the overlay to the DOM
            document.body.appendChild(currentOverlay);
            
            // Trigger a reflow
            currentOverlay.style.height = `${currentOverlay.scrollHeight*1.3}px`;

            // Ensure text is vertically centered
            currentOverlay.style.display = 'flex';
            currentOverlay.style.alignItems = 'center';
            currentOverlay.style.justifyContent = 'center';

            // Reattach the overlay to the DOM
            document.body.appendChild(currentOverlay);

            // Trigger a reflow 
            currentOverlay.offsetHeight;

            // Calculate the display duration for the current word
            const displayDuration = 1500 / Math.pow(speed, 1.65);
            let punctuationPauseDuration = 0;

            // Check if the current word ends with punctuation before advancing the index
            if (pausePunctuation && (currentWord.trim().endsWith('.') || currentWord.trim().endsWith('…') || currentWord.trim().endsWith('!') || currentWord.trim().endsWith('?'))) {
                punctuationPauseDuration = Math.max(displayDuration, 160 * pausePunctuationLength);
            } else if (pausePunctuation && (currentWord.trim().endsWith(',') || currentWord.trim().endsWith(';') || currentWord.trim().endsWith(':'))) {
                punctuationPauseDuration = Math.max(displayDuration, ((160 * pausePunctuationLength) / 100) * pausePunctuationPercentage);
            }

            currentIndex++;

            // Set a timeout for the next word display based on the calculated display duration
            timeoutId = setTimeout(() => showWord(speed, pausePunctuationLength, pausePunctuationPercentage), displayDuration);
            console.log(timeoutId);

            if (punctuationPauseDuration > 0) {
                pauseOverlay();
                setTimeout(function () {
                    console.log('pause over');
                    playOverlay(speed);
                }, punctuationPauseDuration);  // Pause after displaying a punctuation word
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
  fullPunctuationPause = false;
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

  chrome.storage.sync.get(['fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'overlayPosition', 'pausePunctuation', 'pausePunctuationLength', 'fontType', 'pausePunctuationPercentage'], function(result) {
    fixedSizeBackground = result.fixedSizeBackground || false;
    const textSize = result.textSize || '34px';  
    const textColour = result.textColour || 'white';
    const backgroundColour = result.backgroundColour || 'black';
    const overlayPosition = result.overlayPosition || { top: '50%', left: '50%' };
    pausePunctuation = result.pausePunctuation || false;
    pausePunctuationLength = result.pausePunctuationLength || 4;
    const fontType = result.fontType || "'Comic Sans MS', cursive";
    pausePunctuationPercentage = result.pausePunctuationPercentage || 40;

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
        currentOverlay.style.height = 'auto';
    } else {
        currentOverlay.style.width = 'auto';
        currentOverlay.style.height = 'auto'; 
    }
    // Reattach the overlay to the DOM
    document.body.appendChild(currentOverlay);

    // Trigger a reflow
    currentOverlay.style.height = `${currentOverlay.scrollHeight*1.3}px`;

    // Ensure text is vertically centered
    currentOverlay.style.display = 'flex';
    currentOverlay.style.alignItems = 'center';
    currentOverlay.style.justifyContent = 'center';

    // Reattach the overlay to the DOM
    document.body.appendChild(currentOverlay);

    // Trigger a reflow 
    currentOverlay.offsetHeight;

    makeDraggable(currentOverlay);

    // Start displaying words automatically
    showWord(speed, pausePunctuationLength, pausePunctuationPercentage);
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
      currentIndex = 0;
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

        if (fixedSizeBackground) {
        const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
        currentOverlay.style.width = `${longestWord.length + 2}ch`;
        currentOverlay.style.height = 'auto';
        } else {
            currentOverlay.style.width = 'auto';
            currentOverlay.style.height = 'auto'; 
        }

        // Trigger a reflow
        currentOverlay.style.height = `${currentOverlay.scrollHeight*1.3}px`;

        // Ensure text is vertically centered
        currentOverlay.style.display = 'flex';
        currentOverlay.style.alignItems = 'center';
        currentOverlay.style.justifyContent = 'center';

        // Trigger a reflow 
        currentOverlay.offsetHeight;
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
  words = text.split(/\s+/); 

  if (currentOverlay) {
    currentOverlay.remove();  // Remove any existing overlay
    currentOverlay = null;    // Reset the currentOverlay
    currentIndex = 0;         // reset the index
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
        currentOverlay.style.height = 'auto';
    } else {
        currentOverlay.style.width = 'auto';
        currentOverlay.style.height = 'auto'; 
    }

    // Trigger a reflow
    currentOverlay.style.height = `${currentOverlay.scrollHeight*1.3}px`;

    // Ensure text is vertically centered
    currentOverlay.style.display = 'flex';
    currentOverlay.style.alignItems = 'center';
    currentOverlay.style.justifyContent = 'center';

    // Trigger a reflow 
    currentOverlay.offsetHeight;


    makeDraggable(currentOverlay);

    // Display the first word
    showWordManual();

    document.removeEventListener('keydown', handleManualModeKeydown);  // Remove the previous listener if it exists
    document.addEventListener('keydown', handleManualModeKeydown);  // Add the new listener

  });
}

function pauseOverlay() {
  paused = true;
  clearTimeout(timeoutId);
}

function playOverlay(speed) {
  if (paused) {
      paused = false;
      showWord(speed, pausePunctuationLength, pausePunctuationPercentage);
  }
}
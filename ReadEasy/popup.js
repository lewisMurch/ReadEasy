// chrome.storage.sync.get(null, function(items) {
//     console.log(items);
// });

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
    chrome.storage.sync.get(['readingSpeed', 'fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'pausePunctuation', 'pausePunctuationLength', 'fontType'], (result) => { //1st storage change

        //2nd storage change
        const savedSpeed = result.readingSpeed || 4;
        const fixedSizeBackground = result.fixedSizeBackground !== undefined ? result.fixedSizeBackground : false;
        const textSize = result.textSize || 34;
        const textColour = result.textColour || '#f9f9f9';
        const backgroundColour = result.backgroundColour || '#000000';
        const pausePunctuation = result.pausePunctuation || false;
        const pausePunctuationLength = result.pausePunctuationLength || 4;
        const fontType = result.fontType || "'Arial', sans-serif"


        // Set the values for speed and text size elements //3rd storage change
        document.getElementById('speedRange').value = savedSpeed;
        document.getElementById('speedNumber').value = savedSpeed;
        document.getElementById('fixedSizeBackgroundToggle').checked = fixedSizeBackground;
        document.getElementById('textSizeNumber').value = textSize;
        document.getElementById('textSizeRange').value = textSize;
        document.getElementById('textColour').value = textColour;
        document.getElementById('backgroundColour').value = backgroundColour;
        document.getElementById('pausePunctuation').checked = pausePunctuation;
        document.getElementById('pausePunctuationRange').value = pausePunctuationLength;
        document.getElementById('pausePunctuationNumber').value = pausePunctuationLength;
        document.getElementById('fontChooser').value = fontType;
        

        if(pausePunctuation == true){
            document.getElementById('pausePunctuationNumber').parentElement.style.display = 'block';
        }
        else{
            document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
        }
        

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
    document.getElementById('pausePunctuation').addEventListener('change', updatePausePunctuation);
    document.getElementById('pausePunctuationRange').addEventListener('input', updatePausePunctuationLength);
    document.getElementById('pausePunctuationNumber').addEventListener('input', updatePausePunctuationLength);
    document.getElementById('fontChooser').addEventListener('input', updatefontType);


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
}

function startSelectionMode(speed) {
    console.log('Selection mode started with speed:', speed);
    document.body.classList.add('selection-mode');

    const handleMouseOver = function(event) {
        if (document.body.classList.contains('selection-mode')) {
            let target = event.target;
            if (target.textContent.trim()) {
                document.body.style.cursor = 'crosshair';
            }
        }
    };

    const handleClick = function(event) {
        if (document.body.classList.contains('selection-mode')) {
            // Re-check the speed from storage when a click is registered
            chrome.storage.sync.get(['readingSpeed'], (result) => {
                const currentSpeed = result.readingSpeed || speed;

                // Proceed with paragraph click behavior
                let target = event.target;
                const paragraphText = target.textContent.trim();
                document.body.style.cursor = '';
                document.body.classList.remove('selection-mode');

                if (paragraphText) {
                    event.preventDefault();
                    displayWords(paragraphText, currentSpeed);
                }
            });
        }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, { once: true });
}

// Update the speed in both the slider and the number input
function updateSpeed(event) {
    const speed = event.target.value;
    document.getElementById('speedRange').value = speed;
    document.getElementById('speedNumber').value = speed;

    // Save the new speed value in Chrome storage
    chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });
}

// Update the text size in both the slider and the number input
function updateTextSize(event) {
    const textSize = event.target.value;
    document.getElementById('textSizeNumber').value = textSize;
    document.getElementById('textSizeRange').value = textSize;

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

function updatePausePunctuation(event) {
    const pausePunctuation = event.target.checked; // Get the current state of the checkbox
    document.getElementById('pausePunctuation').value = pausePunctuation;

    if(pausePunctuation == true){
        document.getElementById('pausePunctuationNumber').parentElement.style.display = 'block';
    }
    else{
        document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
    }

    chrome.storage.sync.set({ pausePunctuation: pausePunctuation }); // Save the current state to storage
}

function updatePausePunctuationLength(event) {
    const pausePunctuation = event.target.value;
    document.getElementById('pausePunctuationRange').value = pausePunctuation;
    document.getElementById('pausePunctuationNumber').value = pausePunctuation;

    // Save the new text size value in Chrome storage
    chrome.storage.sync.set({ pausePunctuationLength: parseFloat(pausePunctuation) });
}

function updatefontType(event) {
    const fontType = event.target.value; // Get the current state of the colour input
    document.getElementById('fontChooser').value = fontType;
    chrome.storage.sync.set({ fontType: fontType }); // Save the current state to storage
}



// Exit button
document.getElementById('exit').addEventListener('click', () => {
    endSelectionMode(); // End selection mode before closing the popup
    closePopup();
});

function closePopup() {
    if (!isPopupClosed) {
        isPopupClosed = true;
        window.close();
    }
}

// Function to end selection mode
function endSelectionMode() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                document.body.classList.remove('selection-mode');
                document.body.style.cursor = ''; // Reset cursor style if it was changed
            }
        });
    });
}

// Reset settings button
document.getElementById('reset').addEventListener('click', () => {
    resetAllSettings();
});

function resetAllSettings() {
    console.log("Resetting settings"); // Debug output
    //default values
    const defaultSpeed = 4;
    const defaultBackgroundColour = '#000000';
    const defaultTextColour = '#FFFFFF';
    const defaultTextSize = 34;
    const defaultBackgroundSizeFlag = false;
    const defaultOverlayPosition = 'auto';
    const defaultPausePunctuation = false;
    const defaultpausePunctuationLength = 4;
    const defaultfontType = "'Arial', sans-serif";

    chrome.storage.sync.set({ readingSpeed: parseFloat(defaultSpeed) });
    chrome.storage.sync.set({ backgroundColour: defaultBackgroundColour });
    chrome.storage.sync.set({ textColour: defaultTextColour });
    chrome.storage.sync.set({ textSize: defaultTextSize });
    chrome.storage.sync.set({ fixedSizeBackground: defaultBackgroundSizeFlag });
    chrome.storage.sync.set({ overlayPosition: defaultOverlayPosition });
    chrome.storage.sync.set({ pausePunctuation: defaultPausePunctuation });
    chrome.storage.sync.set({ pausePunctuationLength: defaultpausePunctuationLength });
    chrome.storage.sync.set({ fontType: defaultfontType });

    document.getElementById('speedRange').value = defaultSpeed;
    document.getElementById('speedNumber').value = defaultSpeed;
    document.getElementById('backgroundColour').value = defaultBackgroundColour;
    document.getElementById('textColour').value = defaultTextColour;
    document.getElementById('textSizeNumber').value = defaultTextSize;
    document.getElementById('textSizeRange').value = defaultTextSize;
    document.getElementById('fixedSizeBackgroundToggle').checked = false;
    document.getElementById('pausePunctuation').checked = false;
    document.getElementById('pausePunctuationRange').value = defaultpausePunctuationLength;
    document.getElementById('pausePunctuationNumber').value = defaultpausePunctuationLength;
    document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
}

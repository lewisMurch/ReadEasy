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
    chrome.storage.sync.get(['readingSpeed', 'fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'pausePunctuation', 'pausePunctuationLength', 'fontType', 'manualMode', 'highlightSelectedText'], (result) => { //1st storage change

        //2nd storage change
        const savedSpeed = result.readingSpeed || 4;
        const fixedSizeBackground = result.fixedSizeBackground !== undefined ? result.fixedSizeBackground : false;
        const textSize = result.textSize || 34;
        const textColour = result.textColour || '#f9f9f9';
        const backgroundColour = result.backgroundColour || '#000000';
        const pausePunctuation = result.pausePunctuation || false;
        const pausePunctuationLength = result.pausePunctuationLength || 4;
        const fontType = result.fontType || "'Comic Sans MS', cursive"
        const manualMode = result.manualMode || false
        const highlightSelectedText = result.highlightSelectedText !== undefined ? result.highlightSelectedText : true;


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
        document.getElementById('manualMode').checked = manualMode;
        document.getElementById('highlightSelectedText').checked = highlightSelectedText;
        
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
                    return selectedText;
                }
            }, (results) => {
                const highlightedText = results[0].result;
        
                if (highlightedText) {
                    console.log('Popup opened, highlighted text found: ', highlightedText);
                    injectProcessHighlightedText(highlightedText, savedSpeed, manualMode); 
                } else {
                    injectSelectionMode(savedSpeed);
                }
            });
        });        
    });

    // Add event listeners //4th storage change
    document.getElementById('speedRange').addEventListener('input', debounce(updateSpeed, 100));
    document.getElementById('speedNumber').addEventListener('input', debounce(updateSpeed, 100));
    document.getElementById('fixedSizeBackgroundToggle').addEventListener('change', updateBackgroundSize);
    document.getElementById('textSizeRange').addEventListener('input', debounce(updateTextSize, 100));
    document.getElementById('textSizeNumber').addEventListener('input', debounce(updateTextSize, 100));
    document.getElementById('textColour').addEventListener('input', debounce(updateTextColour, 300));
    document.getElementById('backgroundColour').addEventListener('input', debounce(updateBackgroundColour, 300));
    document.getElementById('pausePunctuation').addEventListener('change', updatePausePunctuation);
    document.getElementById('pausePunctuationRange').addEventListener('input', debounce(updatePausePunctuationLength, 100));
    document.getElementById('pausePunctuationNumber').addEventListener('input', debounce(updatePausePunctuationLength, 100));
    document.getElementById('fontChooser').addEventListener('input', updatefontType);
    document.getElementById('manualMode').addEventListener('change', updateManualMode);
    document.getElementById('highlightSelectedText').addEventListener('change', updateHighlightSelectedText);
});

//5th storage change below (make an update function)

function injectProcessHighlightedText(text, speed, manualMode) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "showOverlay",
            text: text,
            speed: parseFloat(speed),
            manualMode: manualMode
        });
    });
    closePopup(); 
}

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
            // Re-check the speed, manualMode, and highlightSelectedText from storage when a click is registered
            chrome.storage.sync.get(['readingSpeed', 'manualMode', 'highlightSelectedText'], (result) => {
                const currentSpeed = result.readingSpeed || speed;
                const manualMode = result.manualMode || false;
                const highlightSelectedText = result.highlightSelectedText || false;
    
                let target = event.target;
    
                // Traverse up the DOM tree to find the nearest paragraph or similar container
                while (target && !target.matches('p, div, section, article')) {
                    target = target.parentElement;
                }
    
                if (target) {
                    const paragraphText = target.textContent.trim();
                    document.body.style.cursor = '';
                    document.body.classList.remove('selection-mode');
    
                    if (paragraphText) {
                        if (highlightSelectedText) {
                            // Add highlight class to the element for flash effect
                            target.classList.add('highlight-flash');
                            
                            // Remove the highlight class after the animation ends
                            setTimeout(() => {
                                target.classList.remove('highlight-flash');
                            }, 1000); // Match this duration with the animation duration
                        }
    
                        event.preventDefault();
                        if (manualMode) {
                            displayWordsManual(paragraphText);
                        } else {
                            displayWords(paragraphText, currentSpeed);
                        }
                    }
                }
            });
        }
    };
    
    
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, { once: true });
}

function updateSpeed(event) {
    const speed = event.target.value;
    document.getElementById('speedRange').value = speed;
    document.getElementById('speedNumber').value = speed;

    // Save the new speed value in Chrome storage
    chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });
}

function updateTextSize(event) {
    const textSize = event.target.value;
    document.getElementById('textSizeNumber').value = textSize;
    document.getElementById('textSizeRange').value = textSize;

    // Save the new text size value in Chrome storage
    chrome.storage.sync.set({ textSize: parseFloat(textSize) });
}

function updateBackgroundSize(event) {
    const isChecked = event.target.checked; // Get the current state of the checkbox
    chrome.storage.sync.set({ fixedSizeBackground: isChecked }); // Save the current state to storage
}

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

function updateManualMode(event) {
    const manualMode = event.target.checked; // Get the current state of the checkbox
    document.getElementById('manualMode').checked = manualMode;
    chrome.storage.sync.set({ manualMode: manualMode }); // Save the current state to storage
}

function updateHighlightSelectedText(event){
    const highlightSelectedText = event.target.checked; // Get the current state of the checkbox
    document.getElementById('highlightSelectedText').checked = highlightSelectedText;
    chrome.storage.sync.set({ highlightSelectedText: highlightSelectedText }); // Save the current state to storage
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
    const defaultfontType = "'Comic Sans MS', cursive";
    const defaultManualMode = false;
    const defaultHighlightSelectedText = true;

    chrome.storage.sync.set({ readingSpeed: parseFloat(defaultSpeed) });
    chrome.storage.sync.set({ backgroundColour: defaultBackgroundColour });
    chrome.storage.sync.set({ textColour: defaultTextColour });
    chrome.storage.sync.set({ textSize: defaultTextSize });
    chrome.storage.sync.set({ fixedSizeBackground: defaultBackgroundSizeFlag });
    chrome.storage.sync.set({ overlayPosition: defaultOverlayPosition });
    chrome.storage.sync.set({ pausePunctuation: defaultPausePunctuation });
    chrome.storage.sync.set({ pausePunctuationLength: defaultpausePunctuationLength });
    chrome.storage.sync.set({ fontType: defaultfontType });
    chrome.storage.sync.set({ manualMode: defaultManualMode });
    chrome.storage.sync.set({ highlightSelectedText: defaultHighlightSelectedText });

    document.getElementById('speedRange').value = defaultSpeed;
    document.getElementById('speedNumber').value = defaultSpeed;
    document.getElementById('backgroundColour').value = defaultBackgroundColour;
    document.getElementById('textColour').value = defaultTextColour;
    document.getElementById('textSizeNumber').value = defaultTextSize;
    document.getElementById('textSizeRange').value = defaultTextSize;
    document.getElementById('fixedSizeBackgroundToggle').checked = defaultBackgroundSizeFlag;
    document.getElementById('pausePunctuation').checked = defaultPausePunctuation;
    document.getElementById('pausePunctuationRange').value = defaultpausePunctuationLength;
    document.getElementById('pausePunctuationNumber').value = defaultpausePunctuationLength;
    document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
    document.getElementById('manualMode').checked = defaultManualMode;
    document.getElementById('highlightSelectedText').checked = defaultHighlightSelectedText;
}

document.addEventListener('DOMContentLoaded', () => {
    const fullPageButton = document.getElementById('fullPage');

    fullPageButton.addEventListener('click', () => {
        closePopup();
        // Retrieve the saved speed and highlight option from Chrome storage when the button is clicked
        chrome.storage.sync.get(['readingSpeed', 'highlightSelectedText'], (result) => {
            const readingSpeed = result.readingSpeed || 4; // Default to 4 if the stored value isn't found
            const highlightSelectedText = result.highlightSelectedText || false;

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                injectIntelligentSelectionMode(readingSpeed, highlightSelectedText);
            });
        });
    });
});

function injectIntelligentSelectionMode(speed, highlightSelectedText) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: startIntelligentSelectionMode,
            args: [parseFloat(speed), highlightSelectedText]
        });
    });
}

function startIntelligentSelectionMode(speed, highlightSelectedText) {
    let contentText = '';

    function isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.offsetParent !== null;
    }

    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(element => {
        if (isVisible(element)) {
            const text = element.textContent.trim();
            if (text.length > 0) {
                contentText += text + ' ';

                if (highlightSelectedText) {
                    element.classList.add('highlight-flash');
                    
                    setTimeout(() => {
                        element.classList.remove('highlight-flash');
                    }, 1000); // Match this duration with the animation duration
                }
            }
        }
    });

    if (contentText.trim().length > 0) {
        displayWords(contentText.trim(), speed);
    }
}

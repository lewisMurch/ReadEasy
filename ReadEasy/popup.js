let isPopupClosed = false; // Flag to track if the popup has been closed

// Debounce function to limit how often a function is executed
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
// Debounce function to limit how often a function is executed



//Main body
    document.addEventListener('DOMContentLoaded', () => {
        chrome.storage.sync.get(['readingSpeed', 'fixedSizeBackground', 'textSize', 'textColour', 'backgroundColour', 'pausePunctuation', 'pausePunctuationLength', 'fontType', 'manualMode', 'highlightSelectedText', 'pausePunctuationPercentage'], (result) => { //1st storage change

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
            const pausePunctuationPercentage = result.pausePunctuationPercentage || 40;


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
            document.getElementById('pausePunctuationPercentageRange').value = pausePunctuationPercentage;
            document.getElementById('pausePunctuationPercentageNumber').value = pausePunctuationPercentage;
            

            if(pausePunctuation == true){
                document.getElementById('pausePunctuationNumber').parentElement.style.display = 'block';
                document.getElementById('pausePunctuationPercentageNumber').parentElement.style.display = 'block';
            }
            else{
                document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
                document.getElementById('pausePunctuationPercentageNumber').parentElement.style.display = 'none';
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
                        injectProcessHighlightedText(highlightedText, savedSpeed); 
                    } else {
                        injectSelectionMode(savedSpeed);
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
        document.getElementById('textColour').addEventListener('input', updateTextColour);
        document.getElementById('backgroundColour').addEventListener('input', updateBackgroundColour);
        document.getElementById('pausePunctuation').addEventListener('change', updatePausePunctuation);
        document.getElementById('pausePunctuationRange').addEventListener('input', updatePausePunctuationLength);
        document.getElementById('pausePunctuationNumber').addEventListener('input', updatePausePunctuationLength);
        document.getElementById('fontChooser').addEventListener('input', updatefontType);
        document.getElementById('manualMode').addEventListener('change', updateManualMode);
        document.getElementById('highlightSelectedText').addEventListener('change', updateHighlightSelectedText);
        document.getElementById('pausePunctuationPercentageRange').addEventListener('input', updatePausePunctuationPercentageLength);
        document.getElementById('pausePunctuationPercentageNumber').addEventListener('input', updatePausePunctuationPercentageLength);
    });
//Main body



//Selection/ highlight modes
    function injectProcessHighlightedText(text, speed) {
        chrome.storage.sync.get(['manualMode'], (result) => {
            const manualMode = result.manualMode;

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (manualMode) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showOverlayManual",
                        text: text
                    });
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showOverlay",
                        text: text,
                        speed: parseFloat(speed)
                    });
                }
            });

            closePopup();
        });
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
                    let originalTarget = target; // Keep reference to the originally clicked element
        
                    // Traverse up the DOM tree to find the nearest paragraph or similar container
                    while (target && !target.matches('p, div, section, article')) {
                        target = target.parentElement;
                    }
        
                    // If no valid parent container is found, use the original clicked element
                    const selectedElement = target || originalTarget;
                    const selectedText = selectedElement.textContent.trim();
    
                    document.body.style.cursor = '';
                    document.body.classList.remove('selection-mode');
        
                    if (selectedText) {
                        if (highlightSelectedText) {
                            // Add highlight class to the selected element (either target or originalTarget)
                            selectedElement.classList.add('highlight-flash');
                            
                            // Remove the highlight class after the animation ends
                            setTimeout(() => {
                                selectedElement.classList.remove('highlight-flash');
                            }, 1000); // Match this duration with the animation duration
                        }
        
                        event.preventDefault();
                        if (manualMode) {
                            displayWordsManual(selectedText);
                        } else {
                            displayWords(selectedText, currentSpeed);
                        }
                    }
                });
            }
        };
    
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('click', handleClick, { once: true });
    }
//Selection/ highlight modes



//UPDATE FUNCTIONS BELOW
    function updateSpeed(event) {
        const speed = event.target.value;
        // Immediate visual update
        document.getElementById('speedRange').value = speed;
        document.getElementById('speedNumber').value = speed;
        
        // Debounced storage update
        debounceSaveSpeed(speed);
    }
    // Debounced function for saving to storage
    const debounceSaveSpeed = debounce((speed) => {
        chrome.storage.sync.set({ readingSpeed: parseFloat(speed) });
    }, 100);

    function updateBackgroundSize(event) {
        const isChecked = event.target.checked; // Get the current state of the checkbox
        chrome.storage.sync.set({ fixedSizeBackground: isChecked }); // Save the current state to storage
    }

    function updateTextSize(event) {
        const textSize = event.target.value;
        document.getElementById('textSizeNumber').value = textSize;
        document.getElementById('textSizeRange').value = textSize;

        // Save the new text size value in Chrome storage
        debounceSaveTextSize(textSize);
    }
    // Debounced function for saving to storage
    const debounceSaveTextSize = debounce((textSize) => {
        chrome.storage.sync.set({ textSize: parseFloat(textSize) });
    }, 100);

    function updateTextColour(event) {
        const textColour = event.target.value;
        document.getElementById('textColour').value = textColour;

        // Debounced save to storage
        debounceSaveTextColour(textColour);
    }
    // Debounced functions for saving to storage
    const debounceSaveTextColour = debounce((textColour) => {
        chrome.storage.sync.set({ textColour: textColour });
    }, 100);

    function updateBackgroundColour(event) {
        const backgroundColour = event.target.value;
        document.getElementById('backgroundColour').value = backgroundColour;

        // Debounced save to storage
        debounceSaveBackgroundColour(backgroundColour);
    }
    // Debounced functions for saving to storage
    const debounceSaveBackgroundColour = debounce((backgroundColour) => {
        chrome.storage.sync.set({ backgroundColour: backgroundColour });
    }, 100);

    function updatePausePunctuation(event) {
        const pausePunctuation = event.target.checked; // Get the current state of the checkbox
        document.getElementById('pausePunctuation').value = pausePunctuation;

        if(pausePunctuation == true){
            document.getElementById('pausePunctuationNumber').parentElement.style.display = 'block';
            document.getElementById('pausePunctuationPercentageNumber').parentElement.style.display = 'block';
        }
        else{
            document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
            document.getElementById('pausePunctuationPercentageNumber').parentElement.style.display = 'none';
        }

        chrome.storage.sync.set({ pausePunctuation: pausePunctuation }); // Save the current state to storage
    }

    function updatePausePunctuationLength(event) {
        const pausePunctuation = event.target.value;
        document.getElementById('pausePunctuationRange').value = pausePunctuation;
        document.getElementById('pausePunctuationNumber').value = pausePunctuation;

        // Debounced save to storage
        debounceSavePausePunctuationLength(pausePunctuation);
    }
    // Debounced functions for saving to storage
    const debounceSavePausePunctuationLength = debounce((pausePunctuationLength) => {
        chrome.storage.sync.set({ pausePunctuationLength: parseFloat(pausePunctuationLength) });
    }, 100);

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

    function updatePausePunctuationPercentageLength(event) {
        const pausePunctuationPercentage = event.target.value;
        document.getElementById('pausePunctuationPercentageRange').value = pausePunctuationPercentage;
        document.getElementById('pausePunctuationPercentageNumber').value = pausePunctuationPercentage;

        // Debounced save to storage
        debounceSavePausePunctuationPercentageLength(pausePunctuationPercentage);
    }
    // Debounced functions for saving to storage
    const debounceSavePausePunctuationPercentageLength = debounce((pausePunctuationPercentage) => {
        chrome.storage.sync.set({ pausePunctuationPercentage: parseFloat(pausePunctuationPercentage) });
    }, 100);
//UPDATE FUNCTIONS ABOVE



// Exit Stuff
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
// Exit Stuff



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
        const defaultPausePunctuationLength = 4;
        const defaultfontType = "'Comic Sans MS', cursive";
        const defaultManualMode = false;
        const defaultHighlightSelectedText = true;
        const defaultPausePunctuationPercentage = 40;


        chrome.storage.sync.set({ readingSpeed: parseFloat(defaultSpeed) });
        chrome.storage.sync.set({ backgroundColour: defaultBackgroundColour });
        chrome.storage.sync.set({ textColour: defaultTextColour });
        chrome.storage.sync.set({ textSize: defaultTextSize });
        chrome.storage.sync.set({ fixedSizeBackground: defaultBackgroundSizeFlag });
        chrome.storage.sync.set({ overlayPosition: defaultOverlayPosition });
        chrome.storage.sync.set({ pausePunctuation: defaultPausePunctuation });
        chrome.storage.sync.set({ pausePunctuationLength: defaultPausePunctuationLength });
        chrome.storage.sync.set({ fontType: defaultfontType });
        chrome.storage.sync.set({ manualMode: defaultManualMode });
        chrome.storage.sync.set({ highlightSelectedText: defaultHighlightSelectedText });
        chrome.storage.sync.set({ pausePunctuationPercentage: defaultPausePunctuationPercentage });

        
        document.getElementById('speedRange').value = defaultSpeed;
        document.getElementById('speedNumber').value = defaultSpeed;
        document.getElementById('backgroundColour').value = defaultBackgroundColour;
        document.getElementById('textColour').value = defaultTextColour;
        document.getElementById('textSizeNumber').value = defaultTextSize;
        document.getElementById('textSizeRange').value = defaultTextSize;
        document.getElementById('fixedSizeBackgroundToggle').checked = defaultBackgroundSizeFlag;
        document.getElementById('pausePunctuation').checked = defaultPausePunctuation;
        document.getElementById('pausePunctuationRange').value = defaultPausePunctuationLength;
        document.getElementById('pausePunctuationNumber').value = defaultPausePunctuationLength;
        document.getElementById('pausePunctuationNumber').parentElement.style.display = 'none';
        document.getElementById('manualMode').checked = defaultManualMode;
        document.getElementById('highlightSelectedText').checked = defaultHighlightSelectedText;
        document.getElementById('pausePunctuationPercentageRange').checked = defaultPausePunctuationPercentage;
        document.getElementById('pausePunctuationPercentageNumber').checked = defaultPausePunctuationPercentage;
    }
// Reset settings button



//Full page stuff
    document.getElementById('fullPage').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    let contentText = '';
                    
                    function isVisible(element) {
                        const style = window.getComputedStyle(element);
                        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.offsetParent !== null;
                    }
                    
                    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(element => {
                        if (isVisible(element)) {
                            const text = element.textContent.trim();
                            if (text.length > 0) {
                                contentText += text + ' ';  // Add a space after each text block
                                chrome.storage.sync.get(['highlightSelectedText'], (result) => {
                                    const highlightSelectedText = result.highlightSelectedText !== undefined ? result.highlightSelectedText : true;
                                    if (highlightSelectedText) {
                                        element.classList.add('highlight-flash');
                                        setTimeout(() => {
                                            element.classList.remove('highlight-flash');
                                        }, 1000);
                                    }
                                });
                            }
                        }
                    });
                    
                    return contentText.trim();  // Trim whitespace from the start and end
                }
            }, (results) => {
                const contentText = results[0].result;
                injectIntelligentSelectionMode(contentText);
            });
        });
    });

    function injectIntelligentSelectionMode(text) {
        chrome.storage.sync.get(['manualMode', 'readingSpeed'], (result) => {
            const manualMode = result.manualMode || false;
            const speed = result.readingSpeed || 4;

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (manualMode) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showOverlayManual",
                        text: text,
                        speed: parseFloat(speed)
                    });
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "showOverlay",
                        text: text,
                        speed: parseFloat(speed)
                    });
                }
            });
            endSelectionMode();
            closePopup();
        });
    }
//Full page stuff



//Donation button logic
    //Get the donation and settings dropdown objects and set them to constants
    const donationDetails = document.querySelector('.donation-buttons');
    const settingsDetails = document.querySelector('details');
    //If the settings dropdown is opened, make the donation button visible
    donationDetails.style.display = settingsDetails.open ? 'block' : 'none';
    // Add an event listener for when the settings menu is opened, then make the donation button visible 
    settingsDetails.addEventListener('toggle', () => {
        donationDetails.style.display = settingsDetails.open ? 'block' : 'none';
    });
//Donation button logic
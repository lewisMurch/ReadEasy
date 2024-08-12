document.getElementById('startSelection').addEventListener('click', () => {
  const speed = document.getElementById('speedNumber').value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: startSelectionMode,
      args: [parseFloat(speed)]
    });
  });
});

// Synchronize slider and number input
const speedRange = document.getElementById('speedRange');
const speedNumber = document.getElementById('speedNumber');

speedRange.addEventListener('input', () => {
  speedNumber.value = speedRange.value;
});

speedNumber.addEventListener('input', () => {
  speedRange.value = speedNumber.value;
});

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
        document.body.classList.remove('selection-mode');
        document.removeEventListener('click', handleParagraphClick);
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
            document.body.classList.remove('selection-mode');
            document.removeEventListener('click', handleParagraphClick);
          }
        }
      }
    }
  }, { once: true });
}

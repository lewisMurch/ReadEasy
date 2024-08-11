document.getElementById('startSelection').addEventListener('click', () => {
  const speed = document.getElementById('speed').value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: startSelectionMode,
      args: [parseFloat(speed)]
    });
  });
});

function startSelectionMode(speed) {
  console.log('Selection mode started with speed:', speed);  // Debugging line
  document.body.classList.add('selection-mode');

  document.addEventListener('mouseup', function handleTextSelection(event) {
    const selectedText = window.getSelection().toString().trim();
    console.log('Selected Text:', selectedText);  // Debugging line

    if (selectedText && document.body.classList.contains('selection-mode')) {
      event.preventDefault();
      displayWords(selectedText, speed);
      document.body.classList.remove('selection-mode');
      document.removeEventListener('mouseup', handleTextSelection);
    }
  });
}

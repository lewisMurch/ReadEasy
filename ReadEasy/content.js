function displayWords(text, speed, fixedSizeBackground = true) {
  const words = text.split(/\s+/);
  let currentIndex = 0;
  let timeoutId;  // To keep track of the timeout
  let stopDisplay = false;  // Flag to stop the display

  const overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

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

  if (fixedSizeBackground) {
    const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
    overlay.style.width = `${longestWord.length}ch`;
  }

  function showWord() {
    if (stopDisplay) {
      overlay.remove();  // Remove the overlay if the display is stopped
      return;
    }

    if (currentIndex < words.length) {
      overlay.textContent = words[currentIndex];
      if (!fixedSizeBackground) {
        overlay.style.width = `${words[currentIndex].length}ch`; // Adjust background width
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
}

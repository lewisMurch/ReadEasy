function displayWords(text, speed) {
  const words = text.split(/\s+/);
  let currentIndex = 0;
  let timeoutId;  // To keep track of the timeout
  let stopDisplay = false;  // Flag to stop the display

  const overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

  function showWord() {
    if (stopDisplay) {
      overlay.remove();  // Remove the overlay if the display is stopped
      return;
    }

    if (currentIndex < words.length) {
      overlay.textContent = words[currentIndex];
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

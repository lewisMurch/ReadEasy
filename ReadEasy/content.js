function displayWords(text, speed) {
  const words = text.split(/\s+/);
  let currentIndex = 0;

  const overlay = document.createElement('div');
  overlay.className = 'word-overlay';
  document.body.appendChild(overlay);

  function showWord() {
    if (currentIndex < words.length) {
      overlay.textContent = words[currentIndex];
      currentIndex++;
      setTimeout(showWord, 1000 / speed);
    } else {
      overlay.remove();
    }
  }

  showWord();
}

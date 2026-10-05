// Runs before React to avoid a flash of the wrong theme. Keep in sync with ThemeProvider.
(function () {
  var stored = null;
  try {
    stored = window.localStorage.getItem('elvi-theme');
  } catch (e) {
    /* storage unavailable (private mode) */
  }
  var dark = stored === 'dark' || ((stored === null || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();

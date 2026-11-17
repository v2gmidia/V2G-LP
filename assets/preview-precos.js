(function () {
  var form = document.getElementById('form-pre-cadastro');

  document.addEventListener('submit', function (event) {
    if (event.target !== form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var warning = document.getElementById('e-geral');
    if (warning) warning.textContent = 'Esta página é uma prévia. Para enviar seu interesse agora, use a página publicada da V2G.';
  }, true);
})();

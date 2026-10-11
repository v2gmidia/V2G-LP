/* Endereço público do produto. A LP não transporta dados pessoais pela URL. */
(function () {
  'use strict';

  var APP_ORIGIN = 'https://v2g-deploy-webapp.vercel.app';
  var LOCAL_APP_ORIGIN = 'http://localhost:3000';
  var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) !== -1;
  var origem = local ? LOCAL_APP_ORIGIN : APP_ORIGIN;

  document.querySelectorAll('[data-app-link]').forEach(function (link) {
    var modo = link.getAttribute('data-app-link');
    if (modo !== 'login' && modo !== 'cadastro') return;
    link.href = origem + '/entrar?modo=' + modo;
  });
})();

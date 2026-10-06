'use strict';
const explanations = [...document.querySelectorAll('.explanations details')];
explanations.forEach(item => item.addEventListener('toggle', () => {
  if (item.open) explanations.forEach(other => { if (other !== item) other.open = false; });
}));
const form = document.getElementById('preview-form');
const success = document.getElementById('success');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  form.reset();
  form.hidden = true;
  success.hidden = false;
  document.getElementById('reset-form').focus({preventScroll:true});
});
document.getElementById('reset-form').addEventListener('click', () => {
  success.hidden = true;
  form.hidden = false;
  document.getElementById('nome').focus({preventScroll:true});
});

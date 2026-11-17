'use strict';
const interesse = require('./comercial-interesse');
const {configuracaoPublica}=require('./_ambiente-comercial');
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' || !interesse._permitido(req)) {
    res.statusCode = 404;
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(configuracaoPublica()));
};

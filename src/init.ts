/// <reference path="../node_modules/awesome-typescript-loader/lib/runtime.d.ts" />
/// <reference path="augment.d.ts" />

import './vendor/modernizr';
import './styles/loading.scss';
import { config } from './config';
const pw = require('please-wait');

const logo = require('./assets/logo-01.svg');
const backgroundColor = '#375e97';

function loadingScreen() {
  if (config.environment !== 'local') {
    return pw.pleaseWait({
      logo,
      backgroundColor,
      loadingHtml: `<p class='loading-message'>Loading...</p><div class="spinner"></div>`
    });
  } else {
    return {
      finish() {}
    };
  }
}

if (Modernizr.es5syntax && Modernizr.svg) {

  let waitScreen = loadingScreen();

  require.ensure(['./app'], require => {
    require('./app').done.then(() => waitScreen.finish());
  });
} else {

  pw.pleaseWait({
    logo,
    backgroundColor,
    loadingHtml: `<p class='loading-message'>Pahoittelemme, mutta selaimesi ei tue tätä sovellusta / Unfortunately your browser doesn't support this application</p>`
  });
}

import './vendor/modernizr';
import './styles/loading.scss';
import { config } from './config';
const pw = require('please-wait');

const logo = require('./assets/logo.png');
const backgroundColor = '#3F51B5';

function loadingScreen() {
  if (config.production) {
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

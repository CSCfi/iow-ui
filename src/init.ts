import './vendor/modernizr';
import './styles/loading.scss';
const pw = require('please-wait');

const logo = require('./assets/logo.png');
const backgroundColor = '#3F51B5';

if (Modernizr.es5syntax && Modernizr.svg) {

  const waitScreen = pw.pleaseWait({
    logo,
    backgroundColor,
    loadingHtml: `<p class='loading-message'>Loading...</p><div class="spinner"></div>`
  });

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

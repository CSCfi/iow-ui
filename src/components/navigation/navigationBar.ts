import * as _ from 'lodash';
import { LanguageService, localizationStrings } from '../../services/languageService';
import { UserService } from '../../services/userService';
import { LoginModal } from './loginModal';
import { module as mod }  from './module';
import { availableUILanguages, UILanguage } from '../../utils/language';
import { User } from '../../entities/user';

const logoImage = require('../../assets/logo-01.svg');

mod.directive('navigationBar', () => {
  return {
    restrict: 'E',
    template: require('./navigationBar.html'),
    scope: {},
    bindToController: true,
    controllerAs: 'ctrl',
    controller: NavigationController
  };
});

class NavigationController {
  languages: { code: UILanguage, name: string }[];

  /* @ngInject */
  constructor(private languageService: LanguageService, private userService: UserService, private loginModal: LoginModal) {
    this.languages = _.map(availableUILanguages, language => {
      const stringsForLang = localizationStrings[language];
      return { code: language, name: (stringsForLang && stringsForLang['In language']) || language };
    });
  }

  get logoImage() {
    return logoImage;
  }

  get language(): UILanguage {
    return this.languageService.UILanguage;
  }

  set language(language: UILanguage) {
    this.languageService.UILanguage = language;
  }

  getUser(): User {
    return this.userService.user;
  }

  logout() {
    return this.userService.logout();
  }

  openLogin() {
    this.loginModal.open();
  }
}

import * as _ from 'lodash';
import { LanguageService } from '../../services/languageService';
import { UserService } from '../../services/userService';
import { User } from '../../services/entities';
import { LoginModal } from './loginModal';
import { module as mod }  from './module';
import { Language } from '../../utils/language';

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
  languages: {code: Language, name: string}[];

  /* @ngInject */
  constructor(private languageService: LanguageService, private userService: UserService, private loginModal: LoginModal) {
    this.languages = _.map(languageService.availableUILanguages, language => {
      switch (language) {
        case 'fi':
          return {code: language, name: 'Suomeksi'};
        case 'en':
          return {code: language, name: 'In English'};
        default:
          throw new Error('Unknown language: ' + language);
      }
    });
  }

  get language(): Language {
    return this.languageService.UILanguage;
  }

  set language(language: Language) {
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

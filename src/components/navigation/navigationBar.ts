import { module as mod }  from './module';
import { LanguageService, localizationStrings } from '../../services/languageService';
import { UserService } from '../../services/userService';
import { LoginModal } from './loginModal';
import { availableUILanguages, UILanguage } from '../../utils/language';
import { User } from '../../entities/user';
import { IScope, ILocationService } from 'angular';
import { config } from '../../config';
import { LibraryCreationStoryLine } from '../../help/libraryCreationHelpStoryLine';
import { HelpSelectionModal } from '../common/helpSelectionModal';

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
  showHelp: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              $location: ILocationService,
              private languageService: LanguageService,
              private userService: UserService,
              private loginModal: LoginModal,
              private helpSelectionModal: HelpSelectionModal,
              private libraryCreationStoryLine: LibraryCreationStoryLine) {
    this.languages = availableUILanguages.map(language => {
      const stringsForLang = localizationStrings[language];
      return { code: language, name: (stringsForLang && stringsForLang['In language']) || language };
    });

    $scope.$watch(() => $location.path(), path => this.showHelp = path === '/');
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

  canStartHelp() {
    return !config.production;
  }

  startHelp() {
    this.helpSelectionModal.open([this.libraryCreationStoryLine]);
  }
}

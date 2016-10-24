import { module as mod }  from './module';
import { LanguageService, localizationStrings } from '../../services/languageService';
import { UserService } from '../../services/userService';
import { LoginModal } from './loginModal';
import { availableUILanguages, UILanguage } from '../../utils/language';
import { User } from '../../entities/user';
import { config } from '../../config';
import { HelpSelectionModal } from '../common/helpSelectionModal';
import { StoryLine } from '../../help/contract';
import { HelpProvider } from '../common/helpProvider';
import { IScope } from 'angular';

const logoImage = require('../../assets/logo-01.svg');

mod.directive('navigationBar', () => {
  return {
    restrict: 'E',
    template: require('./navigationBar.html'),
    scope: {
      helpProvider: '<'
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: NavigationController
  };
});

class NavigationController {

  helpProvider: HelpProvider|null;

  languages: { code: UILanguage, name: string }[];
  helpStoryLines: StoryLine[];

  /* @ngInject */
  constructor($scope: IScope,
              private languageService: LanguageService,
              private userService: UserService,
              private loginModal: LoginModal,
              private helpSelectionModal: HelpSelectionModal) {

    this.languages = availableUILanguages.map(language => {
      const stringsForLang = localizationStrings[language];
      return { code: language, name: (stringsForLang && stringsForLang['In language']) || language };
    });

    const helpStoryLines = () => this.helpProvider ? this.helpProvider.getStoryLines() : [];
    $scope.$watchCollection(helpStoryLines, storyLines => this.helpStoryLines = storyLines);
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
    return !config.production && this.helpStoryLines.length > 0;
  }

  startHelp() {
    this.helpSelectionModal.open(this.helpStoryLines);
  }
}

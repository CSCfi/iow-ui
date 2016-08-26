import { Predicate, Class, Concept, Model } from '../../services/entities';
import { module as mod }  from './module';
import IScope = angular.IScope;
import { LanguageService } from '../../services/languageService';
import gettextCatalog = angular.gettext.gettextCatalog;
import { SearchConceptModal } from './searchConceptModal';

mod.directive('subjectView', () => {
  return {
    scope: {
      entity: '=',
      model: '=',
      isEditing: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    controller: SubjectViewController,
    template: require('./subjectView.html')
  };
});

class SubjectViewController {

  entity: Class|Predicate;
  model: Model;
  isEditing: () => boolean;

  subjectTitle: string;
  vocabularies: string;
  link: string;

  constructor($scope: IScope, private searchConceptModal: SearchConceptModal, languageService: LanguageService, gettextCatalog: gettextCatalog) {

    const localizer = languageService.createLocalizer(this.model);

    const setValues = () => {
      const subject = this.entity.subject;
      this.subjectTitle = (!subject || !subject.suggestion) ? 'Concept' : 'Concept suggestion';

      if (subject) {
        this.vocabularies = subject.getVocabularyNames().map(v => v.getLocalizedName(localizer, gettextCatalog)).join(', ');
        this.link = !subject.suggestion && subject.id.url;
      }
    };

    $scope.$watch(() => this.entity && this.entity.subject, setValues);
    $scope.$watch(() => languageService.UILanguage, setValues);
    $scope.$watch(() => localizer.language, setValues);
  }

  changeSubject() {
    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, true, this.entity.normalizedType).then(concept => this.entity.subject = concept);
  }
}

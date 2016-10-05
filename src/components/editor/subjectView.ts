import { Predicate, Class, Model } from '../../services/entities';
import { module as mod }  from './module';
import { IScope } from 'angular';
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
  link: string|null = null;

  constructor($scope: IScope, private searchConceptModal: SearchConceptModal, languageService: LanguageService, gettextCatalog: gettextCatalog) {

    const localizer = languageService.createLocalizer(this.model);

    const setValues = () => {
      const subject = this.entity.subject;
      this.subjectTitle = (!subject || !subject.suggestion) ? 'Concept' : 'Concept suggestion';

      if (subject) {
        this.vocabularies = subject.getVocabularyNames().map(v => v.getLocalizedName(localizer, gettextCatalog)).join(', ');
        this.link = subject.suggestion ? null : subject.id.url;
      } else {
        this.link = null;
      }
    };

    $scope.$watch(() => this.entity && this.entity.subject, setValues);
    $scope.$watch(() => languageService.UILanguage, setValues);
    $scope.$watch(() => localizer.language, setValues);
  }

  changeSubject() {
    const normalizedType = this.entity.normalizedType;
    if (normalizedType === 'property') {
      throw new Error('Must be known predicate type');
    }
    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, true, normalizedType).then(concept => this.entity.subject = concept);
  }
}

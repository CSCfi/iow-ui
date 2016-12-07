import { module as mod } from './module';

mod.directive('nonEditableVocabulary', () => {
  return {
    restrict: 'E',
    scope: {
      vocabularies: '=',
      context: '='
    },
    template: `
      <div class="editable-wrap form-group">
        <editable-label data-title="'Vocabulary'"></editable-label>
       
        <div ng-repeat="vocabulary in vocabularies">
          <a ng-href="{{vocabulary.href}}">{{vocabulary.title | translateValue: ctrl.context}}<span ng-show="!$last">, </span></a>
        </div>
      </div>
    `
  };
});

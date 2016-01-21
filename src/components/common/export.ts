import ICompiledExpression = angular.ICompiledExpression;
import IScope = angular.IScope;
import IWindowService = angular.IWindowService;
import * as _ from 'lodash';
import * as moment from 'moment';
import Moment = moment.Moment;
import { Uri, Predicate, Class, Model } from '../../services/entities';

export const mod = angular.module('iow.components.common');

const exportOptions = [
  {type: 'application/ld+json', extension: 'json'},
  {type: 'text/turtle', extension: 'ttl'},
  {type: 'application/rdf+xml', extension: 'rdf'}
];

mod.directive('export', () => {
  return {
    scope: {
      entity: '='
    },
    bindToController: true,
    restrict: 'E',
    template: require('./export.html'),
    controllerAs: 'ctrl',
    controller: ExportController
  }
});

type EntityType = Model|Class|Predicate;

function formatFileName(entity: EntityType, extension: string) {
  return `${entity.id.substr('http://'.length)}-${moment().format('YYYY-MM-DD')}.${extension}`;
}

class ExportController {

  entity: Model|Class|Predicate;
  downloads: { name: string, filename: string, href: string }[];
  framedUrlObject: string;

  /* @ngInject */
  constructor($scope: IScope, $window: IWindowService) {
     $scope.$watch(() => this.entity, entity => {
       const hrefBase = entity instanceof Model ? 'api/rest/exportModel' : 'api/rest/exportResource';
       this.downloads = _.map(exportOptions, option => {
         return {
           name: option.type,
           filename: formatFileName(entity, option.extension),
           href: `${hrefBase}?graph=${encodeURIComponent(entity.id)}&content-type=${encodeURIComponent(option.type)}`
         }
       });

       const framedData = {'@graph': entity.graph, '@context': entity.context};
       const framedDataBlob =  new Blob([JSON.stringify(framedData, null, 2)], { type: 'application/ld+json' });

       if (this.framedUrlObject) {
         $window.URL.revokeObjectURL(this.framedUrlObject);
       }
       this.framedUrlObject = $window.URL.createObjectURL(framedDataBlob);

       this.downloads.push({
         name: 'framed ld+json',
         filename: formatFileName(this.entity, 'json'),
         href: this.framedUrlObject
       });
     });
  }
}

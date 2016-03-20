import ICompiledExpression = angular.ICompiledExpression;
import IScope = angular.IScope;
import IWindowService = angular.IWindowService;
import * as _ from 'lodash';
import * as moment from 'moment';
import Moment = moment.Moment;
import { Predicate, Class, Model } from '../../services/entities';
import { config } from '../../config';

export const mod = angular.module('iow.components.common');

const exportOptions = [
  {type: 'application/ld+json', extension: 'json'},
  {type: 'text/turtle', extension: 'ttl'},
  {type: 'application/rdf+xml', extension: 'rdf'},
  {type: 'application/schema+json', extension: 'json'},
  {type: 'application/ld+json+context', extension: 'json'}
];

const UTF8_BOM = '\ufeff';

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
  };
});

type EntityType = Model|Class|Predicate;

function formatFileName(entity: EntityType, extension: string) {
  return `${entity.id.uri.substr('http://'.length)}-${moment().format('YYYY-MM-DD')}.${extension}`;
}

class ExportController {

  entity: Model|Class|Predicate;
  downloads: { name: string, filename: string, href: string , hrefRaw: string}[];

  framedUrlObject: string;
  framedUrlObjectRaw: string;
  frameUrlObject: string;
  frameUrlObjectRaw: string;

  /* @ngInject */
  constructor($scope: IScope, $window: IWindowService) {
    $scope.$watch(() => this.entity, entity => {
      const hrefBase = entity instanceof Model ? config.apiEndpointWithName('exportModel') : config.apiEndpointWithName('exportResource');
      this.downloads = _.map(exportOptions, option => {
        const href = `${hrefBase}?graph=${encodeURIComponent(entity.id.uri)}&content-type=${encodeURIComponent(option.type)}`;

        return {
          name: option.type,
          filename: formatFileName(entity, option.extension),
          href,
          hrefRaw: href + '&raw=true'
        };
      });

      if (Modernizr.bloburls) {
        const framedDataAsString = JSON.stringify({'@graph': entity.graph, '@context': entity.context}, null, 2);
        const framedDataBlob = new Blob([UTF8_BOM, framedDataAsString], {type: 'application/ld+json;charset=utf-8'});
        const framedDataBlobRaw = new Blob([UTF8_BOM, framedDataAsString], {type: 'text/plain;charset=utf-8'});

        if (this.framedUrlObject) {
          $window.URL.revokeObjectURL(this.framedUrlObject);
        }

        if (this.framedUrlObjectRaw) {
          $window.URL.revokeObjectURL(this.framedUrlObjectRaw);
        }

        if (this.frameUrlObject) {
          $window.URL.revokeObjectURL(this.frameUrlObject);
        }

        if (this.frameUrlObjectRaw) {
          $window.URL.revokeObjectURL(this.frameUrlObjectRaw);
        }

        this.framedUrlObject = $window.URL.createObjectURL(framedDataBlob);
        this.framedUrlObjectRaw = $window.URL.createObjectURL(framedDataBlobRaw);

        if (this.entity.frame) {
          const frameAsString = JSON.stringify(this.entity.frame, null, 2);
          const frameBlob = new Blob([UTF8_BOM, frameAsString], {type: 'application/json;charset=utf-8'});
          const frameBlobRaw = new Blob([UTF8_BOM, frameAsString], {type: 'text/plain;charset=utf-8'});

          this.frameUrlObject = $window.URL.createObjectURL(frameBlob);
          this.frameUrlObjectRaw = $window.URL.createObjectURL(frameBlobRaw);

          this.downloads.push({
            name: 'ld+json frame',
            filename: 'frame.json',
            href: this.frameUrlObject,
            hrefRaw: this.frameUrlObjectRaw
          });
        }

        this.downloads.push({
          name: 'framed ld+json',
          filename: formatFileName(this.entity, 'json'),
          href: this.framedUrlObject,
          hrefRaw: this.framedUrlObjectRaw
        });
      }
    });
  }
}

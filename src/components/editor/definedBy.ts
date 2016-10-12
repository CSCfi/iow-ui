import { module as mod } from './module';
import { Destination } from '../../utils/entity';
import { Model } from '../../entities/model';
import { normalizeModelType } from '../../entities/type';

mod.directive('definedBy', () => {
  return {
    restrict: 'E',
    template: require('./definedBy.html'),
    scope: {
      entity: '=',
      model: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    controller: DefinedByController
  };
});

class DefinedByController {

  entity: Destination;
  model: Model;

  get definedByTitle() {
    const type = normalizeModelType(this.entity && this.entity.definedBy && this.entity.definedBy.type || []);
    return 'Defined by' + (type ? ' ' + type : '');
  }

  linkTo() {
    return this.entity && this.model.linkToResource(this.entity.id);
  }
}

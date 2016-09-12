import { module as mod }  from './module';
import { IParseService, IScope, IAttributes } from 'angular';

interface ContextMenuAttributes extends IAttributes {
  ngContextMenu: string;
}

mod.directive('ngContextMenu', /* @ngInject */ ($parse: IParseService) => {
  return {
    link(scope: IScope, element: JQuery, attrs: ContextMenuAttributes) {

      const fn = $parse(attrs.ngContextMenu);

      element.on('contextmenu', e => {

        e.preventDefault();

        scope.$apply(() => {
          fn(scope, {$event: e});
        });
      });
    }
  };
});

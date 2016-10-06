import { ISCEService } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Moment } from 'moment';
import * as _ from 'lodash';
import { ConfirmationModal } from './confirmationModal';
import { DeleteConfirmationModal } from './deleteConfirmationModal';
import { HistoryModal } from './historyModal';
import { LanguageService } from '../../services/languageService';
import { Localizable, LanguageContext } from '../../services/entities';
import { module as mod }  from './module';
export default mod.name;

import './accordion';
import './accordionChevron';
import './ajaxLoadingIndicator';
import './ajaxLoadingIndicatorSmall';
import './buttonWithOptions';
import './clipboard';
import './export';
import './float';
import './highlight';
import './paragraphize';
import './history';
import './keyControl';
import './keyControlItem';
import './modalTemplate';
import './searchResults';
import './usage';
import './usagePanel';
import './ngContextMenu';

mod.service('confirmationModal', ConfirmationModal);
mod.service('deleteConfirmationModal', DeleteConfirmationModal);
mod.service('historyModal', HistoryModal);

mod.filter('translateValue', /* @ngInject */ (languageService: LanguageService) => {
  return (input: Localizable, context?: LanguageContext) => input ? languageService.translate(input, context) : '';
});

mod.filter('translateLabel', /* @ngInject */ (translateValueFilter: any) => {
  return (input: { label: Localizable }, context?: LanguageContext) => input ? translateValueFilter(input.label, context) : '';
});

mod.filter('capitalize', function() {
  return function(input: string) {
    return _.capitalize(input);
  };
});

mod.filter('trustAsHtml', /* @ngInject */ ($sce: ISCEService) => {
  return (text: string) => $sce.trustAsHtml(text);
});

mod.filter('localizedDate', /* @ngInject */ (gettextCatalog: gettextCatalog) => {
  return (moment: Moment) => {
    if (moment) {
      return moment.format(gettextCatalog.getString('date format'));
    } else {
      return null;
    }
  };
});

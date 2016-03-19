import IFilterService = angular.IFilterService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { ConfirmationModal } from './confirmationModal';
import { DeleteConfirmationModal } from './deleteConfirmationModal';
import { HistoryModal } from './historyModal';
import { LanguageService } from '../../services/languageService';
import { Localizable } from '../../services/entities';
import Moment = moment.Moment;

const mod = angular.module('iow.components.common', []);
export = mod.name;

import './accordionChevron';
import './ajaxLoadingIndicator';
import './ajaxLoadingIndicatorSmall';
import './export';
import './float';
import './history';
import './keyControl';
import './keyControlItem';
import './modalTemplate';
import './searchResults';

mod.service('confirmationModal', ConfirmationModal);
mod.service('deleteConfirmationModal', DeleteConfirmationModal);
mod.service('historyModal', HistoryModal);

mod.filter('translateValue', (languageService: LanguageService) => {
  'ngInject';
  return (input: Localizable) => input ? languageService.translate(input) : '';
});

mod.filter('translateLabel', (translateValueFilter: any) => {
  'ngInject';
  return (input: {label: Localizable}) => input ? translateValueFilter(input.label) : '';
});

mod.filter('orderByLabel', (translateLabelFilter: IFilterService, orderByFilter: any) => {
  'ngInject';
  return (array: {label: Localizable}[]) => {
    return orderByFilter(array, translateLabelFilter);
  };
});

mod.filter('capitalize', function() {
  return function(input: string) {
    return _.capitalize(input);
  }
});

mod.filter('trustAsHtml', ($sce: angular.ISCEService) => {
  'ngInject';
  return (text: string) => $sce.trustAsHtml(text);
});

mod.filter('localizedDate', (gettextCatalog: gettextCatalog) => {
  'ngInject';
  return (moment: Moment) => {
    if (moment) {
      return moment.format(gettextCatalog.getString('date format'));
    }
  }
});

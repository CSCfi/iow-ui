import { EditableComponent } from '../common/component/editableComponent.po';
import { AddModelModal } from './addModelModal.po';

export class GroupPage {

  path = (id: string) => `/#/group?urn=${encodeURIComponent(id)}`;
  navigate = (id: string) => browser.get(this.path(id));
  label = EditableComponent.byTitleLocalizationKey('Group label');

  addLibrary() {
    element(by.id('add-library-button')).click();
    return new AddModelModal('library');
  };

  addProfile() {
    element(by.id('add-profile-button')).click();
    return new AddModelModal('profile');
  };

  static JHS_ID = 'https://tt.eduuni.fi/sites/csc-iow#JHS';
  static KTK_ID = 'https://tt.eduuni.fi/sites/csc-iow#KTK';
}

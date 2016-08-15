import { EditableComponent } from '../components/editableComponent.po';
import { AddModelModal } from '../modal/addModelModal.po';

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

  JHS_ID = 'https://tt.eduuni.fi/sites/csc-iow#JHS';
  KTK_ID = 'https://tt.eduuni.fi/sites/csc-iow#KTK';
}

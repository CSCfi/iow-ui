import { EditableComponent } from '../components/editable.po';
import { AddModelModal } from '../modal/addModelModal.po';

export class GroupPage {

  path = (id: string) => `/#/group?urn=${id}`;
  navigate = (id: string) => browser.get(this.path(id));
  label = new EditableComponent('Group label');

  addLibrary = () => {
    element(by.id('add-library-button')).click();
    return new AddModelModal();
  };

  addProfile = () => {
    element(by.id('add-profile-button')).click();
    return new AddModelModal();
  };

  JHS_ID = encodeURIComponent('https://tt.eduuni.fi/sites/csc-iow#JHS');
  KTK_ID = encodeURIComponent('https://tt.eduuni.fi/sites/csc-iow#KTK');
}

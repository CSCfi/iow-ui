import { EditableComponent } from '../components/editable.po';

export class GroupPage {

  path = (id: string) => `/#/group?urn=${id}`;
  navigate = (id: string) => browser.get(this.path(id));
  label = new EditableComponent('Group label');

  JHS_ID = encodeURIComponent('https://tt.eduuni.fi/sites/csc-iow#JHS');
  KTK_ID = encodeURIComponent('https://tt.eduuni.fi/sites/csc-iow#KTK');
}

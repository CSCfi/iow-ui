import { NavBar } from '../pages/common/navbar.po';
import { ModelView } from '../pages/model/modelView.po';
import { ModelPage } from '../pages/model/modelPage.po';
import { library1Parameters, library2Parameters } from './test-data';
import { VocabulariesView } from '../pages/model/vocabulariesView.po';
import { ReferenceDataView } from '../pages/model/referenceDataView.po';

const navbar = new NavBar();

describe('Model view clean', () => {

  let view: ModelView;

  beforeEach(() => {
    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  it('Removes vocabulary', () => {
    view.edit();
    view.form.vocabularies.getRowByName(VocabulariesView.TUHA).remove();
    view.saveAndReload();
    expect(view.form.vocabularies.getRowByName(VocabulariesView.TUHA).isPresent()).toBe(false);
  });

  it('Removes reference data', () => {
    view.edit();
    view.form.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).remove();
    view.saveAndReload();
    expect(view.form.referenceData.table.isEmpty()).toBe(true);
  });

  it('Removes namespaces', () => {
    view.edit();
    view.form.namespaces.getRowByName(library2Parameters.label).remove();
    view.form.namespaces.getRowByName('Foobar edit').remove();
    view.saveAndReload();
    expect(view.form.namespaces.table.isEmpty()).toBe(true);
  });

  it('Removes link', () => {
    view.edit();
    view.form.links.removeRowByName('Example2');
    view.saveAndReload();
    expect(view.form.links.table.isEmpty()).toBe(true);
  });
});

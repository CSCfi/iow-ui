import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters, library2Parameters } from './test-data';
import { ModelView } from '../pages/model/modelView.po';
import { VocabulariesView } from '../pages/model/vocabulariesView.po';
import { ReferenceDataView } from '../pages/model/referenceDataView.po';

const navbar = new NavBar();

describe('Model view', () => {

  let view: ModelView;

  beforeEach(() => {
    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  describe('After navigated', () => {

    it('Modifies model properties', () => {
      view.edit();
      view.form.label.appendValue(' edit');
      view.form.description.appendValue('Kuvaus');
      view.form.language.addItem('pl');
      view.saveAndReload();

      expect(view.form.label.content.getText()).toBe(library1Parameters.label + ' edit');
      expect(view.form.description.content.getText()).toBe('Kuvaus');
      expect(view.form.language.content.getText()).toBe('fi, en, pl');
    });

    it('Adds vocabulary', () => {
      view.edit();
      const modal = view.form.vocabularies.addNew();
      modal.selectResultByName(VocabulariesView.EOS);
      view.saveAndReload();
      expect(view.form.vocabularies.getRowByName(VocabulariesView.EOS).isPresent()).toBe(true);
    });

    it('Adds reference data', () => {
      view.edit();
      const modal = view.form.referenceData.addNew();
      modal.search('haku');
      modal.selectResultById(ReferenceDataView.hakukelpoisuusId);
      modal.confirm();
      view.saveAndReload();
      expect(view.form.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).isPresent()).toBe(true);
    });

    it('Opens reference data details', () => {
      const modal = view.form.referenceData.clickName(ReferenceDataView.hakukelpoisuus);
      expect(modal.label.content.getText()).toBe(ReferenceDataView.hakukelpoisuus);
      modal.close();
      expect(modal.isClosed()).toBe(true);
    });

    it('Adds other library as namespace', () => {
      view.edit();
      const modal = view.form.namespaces.addNew();
      modal.search('E2E');
      modal.selectResultByName(library2Parameters.label);
      view.saveAndReload();
      expect(view.form.namespaces.getRowByName(library2Parameters.label).isPresent()).toBe(true);
    });

    it('Adds external namespace', () => {
      view.edit();
      const modal = view.form.namespaces.addNew();
      const addModal = modal.createNewNamespace();
      addModal.label.setValue('Foobar');
      addModal.namespace.setValue('http://www.google.com/');
      addModal.prefix.setValue('foo');
      addModal.confirm();
      view.saveAndReload();
      expect(view.form.namespaces.getRowByName('Foobar').isPresent()).toBe(true);
    });

    it('Edits external namespace', () => {
      view.edit();
      const modal = view.form.namespaces.editRowByName('Foobar');
      modal.label.appendValue(' edit');
      modal.confirm();
      view.saveAndReload();
      expect(view.form.namespaces.getRowByName('Foobar edit').isPresent()).toBe(true);
    });

    it('Adds link', () => {
      view.edit();
      const addModal = view.form.links.addNew();
      addModal.homepage.setValue('http://example.org');
      addModal.label.setValue('Example');
      addModal.description.setValue('Example description');
      addModal.confirm();
      view.saveAndReload();
      expect(view.form.links.getRowByName('Example').isPresent()).toBe(true);
    });

    it('Edits link', () => {
      view.edit();
      const editModal = view.form.links.editRowByName('Example');
      editModal.label.appendValue('2');
      editModal.confirm();
      view.saveAndReload();
      expect(view.form.links.getRowByName('Example2').isPresent()).toBe(true);
    });
  });
});

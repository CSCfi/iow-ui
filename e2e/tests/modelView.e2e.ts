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
    const page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(library1Parameters.prefix), library1Parameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  describe('After navigated', () => {

    it('Modifies model properties', () => {
      view.edit();
      view.label.appendValue(' edit');
      view.description.appendValue('Kuvaus');
      view.language.addItem('pl');
      view.saveAndReload();

      expect(view.label.content.getText()).toBe(library1Parameters.label + ' edit');
      expect(view.description.content.getText()).toBe('Kuvaus');
      expect(view.language.content.getText()).toBe('fi, en, pl');
    });

    it('Adds vocabulary', () => {
      view.edit();
      const modal = view.vocabularies.addNew();
      modal.selectResult(VocabulariesView.EOS);
      view.saveAndReload();
      expect(view.vocabularies.getRowByName(VocabulariesView.EOS).isPresent()).toBe(true);
    });

    it('Removes vocabulary', () => {
      view.edit();
      view.vocabularies.getRowByName(VocabulariesView.EOS).remove();
      view.saveAndReload();
      expect(view.vocabularies.getRowByName(VocabulariesView.EOS).isPresent()).toBe(false);
    });

    it('Adds reference data', () => {
      view.edit();
      const modal = view.referenceData.addNew();
      modal.search('haku');
      modal.selectResult(ReferenceDataView.hakukelpoisuus);
      modal.confirm();
      view.saveAndReload();
      expect(view.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).isPresent()).toBe(true);
    });

    it('Opens reference data details', () => {
      const modal = view.referenceData.clickName(ReferenceDataView.hakukelpoisuus);
      expect(modal.label.content.getText()).toBe(ReferenceDataView.hakukelpoisuus);
      modal.close();
      expect(modal.isClosed()).toBe(true);
    });

    it('Removes reference data', () => {
      view.edit();
      view.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).remove();
      view.saveAndReload();
      expect(view.referenceData.table.isEmpty()).toBe(true);
    });

    it('Adds other library as namespace', () => {
      view.edit();
      const modal = view.namespaces.addNew();
      modal.search('E2E');
      modal.selectResult(library2Parameters.label);
      view.saveAndReload();
      expect(view.namespaces.getRowByName(library2Parameters.label).isPresent()).toBe(true);
    });

    it('Adds external namespace', () => {
      view.edit();
      const modal = view.namespaces.addNew();
      const addModal = modal.createNewNamespace();
      addModal.label.setValue('Foobar');
      addModal.namespace.setValue('http://www.google.com/');
      addModal.prefix.setValue('foo');
      addModal.confirm();
      view.saveAndReload();
      expect(view.namespaces.getRowByName('Foobar').isPresent()).toBe(true);
    });

    it('Removes namespaces', () => {
      view.edit();
      view.namespaces.getRowByName(library2Parameters.label).remove();
      view.namespaces.getRowByName('Foobar').remove();
      view.saveAndReload();
      expect(view.namespaces.table.isEmpty()).toBe(true);
    });

    it('Adds link', () => {
      view.edit();
      const addModal = view.links.addNew();
      addModal.homepage.setValue('http://example.org');
      addModal.label.setValue('Example');
      addModal.description.setValue('Example description');
      addModal.confirm();
      view.saveAndReload();
      expect(view.links.getRowByName('Example').isPresent()).toBe(true);
    });

    it('Edits link', () => {
      view.edit();
      const editModal = view.links.editRowByName('Example');
      editModal.label.appendValue('2');
      editModal.confirm();
      view.saveAndReload();
      expect(view.links.getRowByName('Example2').isPresent()).toBe(true);
    });

    it('Removes link', () => {
      view.edit();
      view.links.removeRowByName('Example2');
      view.saveAndReload();
      expect(view.links.table.isEmpty()).toBe(true);
    });
  });
});

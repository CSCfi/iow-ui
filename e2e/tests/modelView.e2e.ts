import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { libraryParameters } from './test-data';
import { ModelView } from '../pages/model/modelView.po';
import { VocabulariesView } from '../pages/model/vocabulariesView.po';
import { ReferenceDataView } from '../pages/model/referenceDataView.po';

const navbar = new NavBar();

describe('Model view', () => {

  let view: ModelView;

  beforeEach(() => {
    const page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  describe('After navigated', () => {

    it('Modifies model properties', () => {
      view.edit();
      view.label.appendValue('2');
      view.description.appendValue('Kuvaus');
      view.language.addItem('pl');
      view.saveAndReload();

      expect(view.label.content.getText()).toBe(libraryParameters.label + '2');
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
  });
});

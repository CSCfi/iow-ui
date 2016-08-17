import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { libraryParameters } from './test-data';
import { ModelView } from '../pages/model/modelView.po';
import { VocabulariesView } from '../pages/model/vocabulariesView.po';
import { ReferenceDataView } from '../pages/model/referenceDataView.po';

describe('Model view', () => {

  let view: ModelView;
  const navbar = new NavBar();

  beforeEach(() => {
    const page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
    view = page.modelView;
  });

  it('Modifies model properties', () => {
    view.buttons.edit();
    view.label.appendValue('2');
    view.description.appendValue('Kuvaus');
    view.language.addItem('pl');
    view.buttons.save();

    expect(view.label.content.getText()).toBe(libraryParameters.label + '2');
    expect(view.description.content.getText()).toBe('Kuvaus');
    expect(view.language.content.getText()).toBe('fi, en, pl');
  });

  it('Adds vocabulary', () => {
    view.buttons.edit();
    const modal = view.vocabularies.addNew();
    modal.selectResult(VocabulariesView.EOS);
    view.buttons.save();
    expect(view.vocabularies.getRowByName(VocabulariesView.EOS).isPresent()).toBe(true);
  });

  it('Removes vocabulary', () => {
    view.buttons.edit();
    view.vocabularies.getRowByName(VocabulariesView.EOS).remove();
    view.buttons.save();
    expect(view.vocabularies.getRowByName(VocabulariesView.EOS).isPresent()).toBe(false);
  });

  it('Adds reference data', () => {
    view.buttons.edit();
    const modal = view.referenceData.addNew();
    modal.search('haku');
    modal.selectResult(ReferenceDataView.hakukelpoisuus);
    modal.confirm();
    view.buttons.save();
    expect(view.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).isPresent()).toBe(true);
  });

  it('Removes reference data', () => {
    view.buttons.edit();
    view.referenceData.getRowByName(ReferenceDataView.hakukelpoisuus).remove();
    view.buttons.save();
    expect(view.referenceData.table.isEmpty()).toBe(true);
  });
});

import EC = protractor.ExpectedConditions;
import ElementFinder = protractor.ElementFinder;

export function anyTextToBePresentInElement(elementFinder: ElementFinder) {
  const textExists: any = () => elementFinder.getText().then(t => !!t);
  return EC.and(EC.presenceOf(elementFinder), textExists);
}

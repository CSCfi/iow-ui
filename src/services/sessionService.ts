import { isDefined } from '../utils/object';
import { Language } from '../utils/language';
import { Show } from '../components/contracts';

const modelLanguageKey = 'modelLanguage';
const uiLanguageKey = 'UILanguage';
const showKey = 'show';

export class SessionService {

  private get<T>(key: string): T {
    const value = window.sessionStorage.getItem(key);
    return isDefined(value) ? JSON.parse(value) : null;
  }

  private set(key: string, value: any): void {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }

  get UILanguage(): Language {
    return this.get<Language>(uiLanguageKey);
  }

  set UILanguage(lang: Language) {
    this.set(uiLanguageKey, lang);
  }

  get modelLanguage(): {[entityId: string]: Language} {
    return this.get<{[entityId: string]: Language}>(modelLanguageKey);
  }

  set modelLanguage(lang: {[entityId: string]: Language}) {
    this.set(modelLanguageKey, lang);
  }

  get show(): Show {
    return this.get<Show>(showKey);
  }

  set show(value: Show) {
    this.set(showKey, value);
  }
}

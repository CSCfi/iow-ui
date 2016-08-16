import { Language } from '../../src/utils/language';
import { Type } from '../../src/services/entities';
import { GroupPage } from '../pages/group/group.po';

export const libraryParameters = {
  label: 'E2E Kirjasto',
  prefix: 'e2e',
  language: ['fi', 'en'] as Language[],
  groupId: GroupPage.JHS_ID,
  type: 'library' as Type
};

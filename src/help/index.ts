import { module as mod }  from './module';
export default mod.name;

import { LibraryCreationStoryLine } from './libraryCreationHelpStoryLine';

mod.service('libraryCreationStoryLine', LibraryCreationStoryLine);

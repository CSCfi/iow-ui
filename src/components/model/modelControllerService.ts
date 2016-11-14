import { Predicate } from '../../entities/predicate';
import { Class } from '../../entities/class';

export interface View {
  isEditing(): boolean;
  cancelEditing(): void;
}

export interface ModelControllerService {
  registerView(view: View): void;
  getUsedNamespaces(): Set<string>;
  selectionEdited(oldSelection: Class|Predicate|null, newSelection: Class|Predicate): void;
  selectionDeleted(selection: Class|Predicate): void;
}

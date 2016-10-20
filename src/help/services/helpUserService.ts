import { User } from '../../entities/user';
import { IPromise, IQService } from 'angular';
import { Uri } from '../../entities/uri';
import { AbstractGroup } from '../../entities/group';
import { AbstractModel } from '../../entities/model';
import { ResetableService } from './resetableService';

class InteractiveHelpUser implements User {

  name: string|any = 'Ohjekäyttäjä';

  isLoggedIn(): boolean {
    return true;
  }

  isMemberOf(_entity: AbstractModel|AbstractGroup): boolean {
    return true;
  }

  isMemberOfGroup(_id: Uri): boolean {
    return true;
  }

  isAdminOf(_entity: AbstractModel|AbstractGroup): boolean {
    return false;
  }

  isAdminOfGroup(_id: Uri): boolean {
    return false;
  }
}

export class InteractiveHelpUserService implements ResetableService {

  user = new InteractiveHelpUser();

  /* @ngInject */
  constructor(private $q: IQService) {
  }

  reset(): IPromise<any> {
    return this.$q.when();
  }

  updateLogin(): IPromise<User> {
    return this.$q.when(this.user);
  }

  ifStillLoggedIn(loggedInCallback: () => void, _notLoggedInCallback: () => void): void {
    loggedInCallback();
  }

  isLoggedIn(): boolean {
    return true;
  }

  logout(): IPromise<User> {
    throw new Error('Should not be able to logout when in help');
  }
}

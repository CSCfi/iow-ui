import IPromise = angular.IPromise;
import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import { EntityDeserializer, User, AnonymousUser } from './entities';

export class UserService {

  user: User = new AnonymousUser();

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  updateLogin(): IPromise<User> {
    return this.$http.get<boolean>('/api/rest/loginstatus')
      .then(statusResponse => statusResponse.data
        ? this.$http.get('/api/rest/user').then(response => this.entities.deserializeUser(response.data))
        : new AnonymousUser())
      .then(updatedUser => this.user = updatedUser);
  }

  isLoggedIn(): boolean {
    return this.user.isLoggedIn();
  }

  logout(): IPromise<User> {
    return this.$http.get('/api/rest/logout').then(() => this.user = new AnonymousUser());
  }
}

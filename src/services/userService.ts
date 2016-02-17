import IPromise = angular.IPromise;
import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import { EntityDeserializer, User, AnonymousUser } from './entities';
import { config } from '../config';

export class UserService {

  user: User = new AnonymousUser();

  /* @ngInject */
  constructor(private $http: IHttpService, private entities: EntityDeserializer) {
  }

  updateLogin(): IPromise<User> {
    return this.$http.get<boolean>(config.apiEndpointWithName('loginstatus'))
      .then(statusResponse => statusResponse.data
        ? this.$http.get(config.apiEndpointWithName('user')).then(response => this.entities.deserializeUser(response.data))
        : new AnonymousUser())
      .then(updatedUser => this.user = updatedUser);
  }

  ifStillLoggedIn(callback: () => void) {
    this.updateLogin().then(user => {
      if (user.isLoggedIn()) {
        callback();
      }
    });
  }

  isLoggedIn(): boolean {
    return this.user.isLoggedIn();
  }

  logout(): IPromise<User> {
    return this.$http.get(config.apiEndpointWithName('logout')).then(() => this.user = new AnonymousUser());
  }
}

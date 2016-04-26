import IPromise = angular.IPromise;
import IHttpPromise = angular.IHttpPromise;
import IHttpService = angular.IHttpService;
import { EntityDeserializer, User, AnonymousUser, GraphData } from './entities';
import { config } from '../config';
import IQService = angular.IQService;

export class UserService {

  user: User = new AnonymousUser();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private entities: EntityDeserializer) {
  }

  updateLogin(): IPromise<User> {
    return this.$http.get<boolean>(config.apiEndpointWithName('loginstatus'))
      .then(statusResponse => statusResponse.data
        ? this.$http.get<GraphData>(config.apiEndpointWithName('user')).then(response => this.entities.deserializeUser(response.data))
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

  /**
   * Usually should be just browser redirect
   */
  login(): IPromise<any> {
      return this.updateLogin().then<any>(user => !user.isLoggedIn()
      ? this.$http.get(config.apiEndpoint + '/login', { params: { target: 'http://dummy' } }).then(() => this.updateLogin())
      : this.$q.when());
  }

  logout(): IPromise<User> {
    return this.$http.get(config.apiEndpointWithName('logout')).then(() => this.user = new AnonymousUser());
  }
}

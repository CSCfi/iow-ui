import { IPromise, IHttpPromise, IHttpService, IQService } from 'angular';
import { EntityDeserializer, User, AnonymousUser, GraphData } from './entities';
import { config } from '../config';

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

  logout(): IPromise<User> {
    return this.$http.get(config.apiEndpointWithName('logout')).then(() => this.user = new AnonymousUser());
  }
}

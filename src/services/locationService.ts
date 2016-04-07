import { Model, Group, Localizable } from './entities';

export interface Location {
  localizationKey?: string;
  label?: Localizable;
  iowUrl?(): string;
}

const frontPage = {localizationKey: 'Front page', iowUrl: () => '/'};

export class LocationService {
  location: Location = [frontPage];

  private changeLocation(location: Location[]): void {
    location.unshift(frontPage);
    this.location = location;
  }

  atModel(model: Model, selection: Location): void {
    if (model) {
      if (model.unsaved) {
        this.changeLocation([model.group, {localizationKey: `New ${model.normalizedType} creation`}]);
      } else {
        if (selection) {
          this.changeLocation([model.group, model, selection]);
        } else {
          this.changeLocation([model.group, model]);
        }
      }
    }
  }

  atGroup(group: Group): void {
    this.changeLocation([group]);
  }

  atUser(): void {
    this.changeLocation([{
      localizationKey: 'User details',
      iowUrl() {
        return "/#user";
      }
    }]);
  }

  atFrontPage(): void {
    this.changeLocation([]);
  }
}

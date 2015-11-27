import { Location, Model, Group } from './entities';

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
        // TODO group
        this.changeLocation([{localizationKey: 'New model creation'}]);
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

  atFrontPage(): void {
    this.changeLocation([]);
  }
}

module.exports = function locationService($location) {
  'ngInject';

  const frontPage = {type: 'Front page', iowUrl: '/#/'};
  let location = [frontPage];

  function changeLocation(entities) {
    entities.unshift(frontPage);
    location = entities;
  }

  return {
    getLocation() {
      return location;
    },
    atModel(model, selection) {
      if (model) {
        // TODO: group
        if (model.unsaved) {
          changeLocation([{type: 'New model creation'}]);
        } else {
          if (selection) {
            changeLocation([model, selection]);
            $location.search({urn: model.id, [selection.type]: selection.id});
          } else {
            changeLocation([model]);
            $location.search({urn: model.id});
          }
        }
      }
    },
    atGroup(group) {
      changeLocation([group]);
    },
    atFrontPage() {
      changeLocation([]);
    }
  };
};

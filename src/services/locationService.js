module.exports = function locationService() {
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
          } else {
            changeLocation([model]);
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

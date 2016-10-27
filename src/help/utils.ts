
export const editableMargin = { left: 20, right: 20 };
export const editableMultipleMargin = Object.assign({}, editableMargin, { bottom: 15 });

export function getModalController<T>(controllerName = 'ctrl') {
  return (angular.element('.modal').scope() as any)[controllerName] as T;
}

export function initialInputValue(element: () => JQuery, value: string) {
  return () => {
    const initialInputNgModel = element().controller('ngModel');

    if (!initialInputNgModel) {
      throw new Error('ng-model does not exits for initial input');
    } else {
      if (!initialInputNgModel.$viewValue) {
        initialInputNgModel.$setViewValue(value);
        initialInputNgModel.$render();
      }
    }
  };
}

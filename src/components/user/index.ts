import { UserController } from './userController';

const mod = angular.module('iow.components.user', ['iow.services']);
export = mod.name;

mod.controller('userController', UserController);

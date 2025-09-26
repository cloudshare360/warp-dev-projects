/**
 * Controllers exports - centralized controller imports
 */

const userController = require('./userController');
const listController = require('./listController');
const todoController = require('./todoController');

module.exports = {
  // User controller methods
  user: {
    register: userController.register,
    login: userController.login,
    getProfile: userController.getProfile,
    updateProfile: userController.updateProfile,
    changePassword: userController.changePassword,
    forgotPassword: userController.forgotPassword,
    resetPassword: userController.resetPassword,
    deleteAccount: userController.deleteAccount,
    logout: userController.logout,
    refreshToken: userController.refreshToken
  },

  // List controller methods
  list: {
    getLists: listController.getLists,
    getListById: listController.getListById,
    createList: listController.createList,
    updateList: listController.updateList,
    deleteList: listController.deleteList,
    getListStats: listController.getListStats,
    duplicateList: listController.duplicateList,
    toggleListSharing: listController.toggleListSharing
  },

  // Todo controller methods
  todo: {
    getTodos: todoController.getTodos,
    getTodoById: todoController.getTodoById,
    createTodo: todoController.createTodo,
    updateTodo: todoController.updateTodo,
    deleteTodo: todoController.deleteTodo,
    toggleTodoCompletion: todoController.toggleTodoCompletion,
    reorderTodo: todoController.reorderTodo,
    getTodosByList: todoController.getTodosByList,
    getTodoStats: todoController.getTodoStats
  }
};
import * as model from './model.js';
import {MODAL_CLOSE_SEC} from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js/stable'; // polyfilling everything else
import 'regenerator-runtime/runtime'; // polyfilling async/await

// if (module.hot) {
//   module.hot.accept;
// }

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

// https://forkify-api.herokuapp.com/v2
///////////////////////////////////////
const controlRecipes = async function () {
  try {
    // get hash(# from URL) of recipe
    const id = window.location.hash.slice(1);
    
    // Guard clause
    if (!id) return;
    recipeView.renderSpinner();
    
    // 0) Update results view to mark selected search results
    resultsView.update(model.getSearchResultsPage());
    
    // 1) Updating bookmarks view
    bookmarksView.update(model.state.bookmarks)

    // 2) Loading recipe
    // no storing in a variable, because it does not return anything, it just manipulates the state in model.js
    await model.loadRecipe(id);
    
    // 3) Render recipe
    recipeView.render(model.state.recipe);

  } catch (err) {
    // recipeView.renderError(`You have failed me for the last time 🧠💨`); // render custom message
    recipeView.renderError(`You have failed me for the last time ☠️`); // render custom message
    // recipeView.renderError(); // render private preset message from RecipeView
  }
};

const controlPagination = function (goToPage) {
  // 1) Render NEW results
  resultsView.render(model.getSearchResultsPage(goToPage));
  
  // Render NEW pagination controls
  paginationView.render(model.state.search);
};

const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner();
    // Get search query
    const query = searchView.getQuery();
    if (!query) return;
    
    // 2) Load search results
    // no storing in a variable, because it does not return anything, it just manipulates the state in model.js
    await model.loadSearchResults(query);
    
    // 3) Render results
    // resultsView.render(model.state.search.results);
    resultsView.render(model.getSearchResultsPage());
    
    // 4 Render initial pagination controls
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlServings = function (newServings) {
  // Update the recipe servings (in state)
  model.updateServings(newServings);
  
  // Update the recipe view
  // recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function() {
  // 1) Add/remove bookmarks
  if (!model.state.recipe.bookmarked) {
    model.addBookmark(model.state.recipe)
  } 
  else {
    model.deleteBookmark(model.state.recipe.id)
  }

  // 2) Update recipe view
  recipeView.update(model.state.recipe)

  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
  }

const controlBookmarks = function() {
  bookmarksView.render(model.state.bookmarks)
}

const controlAddRecipe = async function(newRecipe) {
  try {
    // Show loading spinner
    addRecipeView.renderSpinner();

    // Upload new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // Render recipe
    recipeView.render(model.state.recipe);

    // Success message
    addRecipeView.renderMessage();

    // Render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // Change id in url
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close form window
    setTimeout(function() {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000)

  } catch(err) {
    console.error(err);
    addRecipeView.renderError(err.message);
  }

}

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks)
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addhandlerUpload(controlAddRecipe)
};
init();

// The MVC Architecture
/*
Perfect architecture = Structured (organized) + Maintainable + Expandable

Components of any architecture:
1) Business logic
- code that solves the actual business problem
- directly related to what business does and what it needs
Ex: sending messages, storing transactions, calculating taxes etc
2) State
- essentially stores all the data about the application
- should be the "single source of truth"
- UI should be kept in sync with the state
- state libraries exist
3) HTTP library
- responsible for making and receiving AJAX requests
- optional but almost always necessary in real-world apps
4) Application logic
- code that is only concerned about the implementantion of application itself
- handles navigation and UI events
5) Presentation logic (UI)
- code that is concerned about the visible part of the application
- essentially displays application state

THE MODEL-VIEW-CONTROLLER (MVC) ARCHITECTURE
MODEL -> business logic, state, HTTP library (web)
CONTROLLER -> application logic (bridge between model and views, which don't know about one another)
VIEW -> presentation logic (user)

Usual order of events (eg a click):
1) User click
2) Controller handles event; might involve updating the UI and asking the Model for some data (in other words: controller handles UI events and dispatches tasks to Model and View)
3) Model being asked for data might involve making an AJAX request to the web
4) When data arrives, Controller takes it and sends it to the view
5) View renders data to User
*/

// Publisher-Subscriber Patter
/*
- Events should be HANDLED in the CONTROLLER (otherwise we would have application logic in the view)
- Events should be LISTENED FOR in the VIEW (otherwise we would need DOM elements in the controller)

Publisher: Code that knows WHEN to react
Subscriber: Code that WANTS to react
- subscribe to publisher by passing in the subscriber function as an argumnet

Program starts -> init() -> addHandlerRender(controlRecipes) *controlRecipes will be passed into addHandlerRender when program starts* -> user clicks search result -> addHandlerRender listens for events (addEventListener), and uses controlRecipes as callback
*/

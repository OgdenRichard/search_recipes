export default class RecipesModel {
  /**
   * @constructor
   * @param {Object} recipes
   */
  constructor(recipes) {
    this.recipes = recipes;
    this.mainSearchValue = '';
    this.recipesArray = [];
    this.filteredRecipes = [];
    this.tagRecipes = [];
    this.ingredientsArray = [];
    this.filteredIngredients = [];
    this.appliancesArray = [];
    this.filteredAppliances = [];
    this.ustensilsArray = [];
    this.filteredUstensils = [];
    this.tagsRecipesIds = [];
    this.activeTags = [];
    this.init();
  }

  /**
   * Prepare data for RecipesView initialization
   * Regroup ingredients, ustensils and appliances data in specific arrays
   * @returns {void}
   */
  init = () => {
    this.recipes.forEach((recipe) => {
      const { id, name, time, ingredients, appliance, ustensils, description } =
        recipe;
      this.recipesArray.push({ id, name, time, ingredients, description });
      if (ingredients && ingredients.length) {
        this.processRecipesIngredients(id, ingredients);
      }
      if (ustensils && ustensils.length) {
        this.processRecipesUstensils(id, ustensils);
      }
      if (appliance) {
        this.processRecipesAppliances(id, appliance);
      }
    });
    RecipesModel.sortByNames(this.ingredientsArray);
    RecipesModel.sortByNames(this.ustensilsArray);
    RecipesModel.sortByNames(this.appliancesArray);
  };

  /**
   * Send back processed data to RecipesModel
   * @callback callback : Set and fired in RecipesController
   * @returns {void}
   */
  bindMainSearchData = (callback) => {
    this.onMainSearchResult = callback;
  };

  bindDropdownSearch = (callback) => {
    this.onDropdownSearchResult = callback;
  };

  bindTagSearch = (callback) => {
    this.onTagSearchResult = callback;
  };

  /**
   * Populate ingredientsArray property with formatted data
   * @param {Number} id
   * @param {Array} ingredients
   * @returns {void}
   */
  processRecipesIngredients = (id, ingredients) => {
    ingredients.forEach((ingredient) => {
      RecipesModel.populateItemsArray(
        id,
        ingredient.ingredient,
        this.ingredientsArray
      );
    });
  };

  /**
   * Populate appliancesArray property with formatted data
   * @param {Number} id
   * @param {String} appliance
   * @returns {void}
   */
  processRecipesAppliances = (id, appliance) => {
    RecipesModel.populateItemsArray(id, appliance, this.appliancesArray);
  };

  /**
   * Populate ustensilsArray property with formatted data
   * @param {Number} id
   * @param {Array} ustensils
   * @returns {void}
   */
  processRecipesUstensils = (id, ustensils) => {
    ustensils.forEach((ustensil) => {
      RecipesModel.populateItemsArray(id, ustensil, this.ustensilsArray);
    });
  };

  /**
   * Main search event handler
   * @param {String} inputValue
   * @returns {void}
   */
  processMainSearchValue = (inputValue) => {
    this.mainSearchValue = inputValue.toLowerCase();
    this.refreshTagsRecipes();
    this.searchMatchingRecipes();
    this.onMainSearchResult({
      recipes: this.filteredRecipes,
      ingredients: this.filteredIngredients,
      appliances: this.filteredAppliances,
      ustensils: this.filteredUstensils,
    });
  };

  searchMatchingRecipes = () => {
    const recipes = this.tagRecipes.length
      ? this.tagRecipes
      : this.recipesArray;
    let index = recipes.length;
    this.filteredRecipes = [];
    this.clearFilters();
    while (index) {
      index -= 1;
      if (
        RecipesModel.searchString(
          recipes[index].name.toLowerCase(),
          this.mainSearchValue
        ) ||
        RecipesModel.searchString(
          recipes[index].description.toLowerCase(),
          this.mainSearchValue
        ) ||
        this.browseRecipeIngredients(
          recipes[index].ingredients,
          this.mainSearchValue
        )
      ) {
        this.filteredRecipes.push(recipes[index]);
        this.trimIngredientsArray(recipes[index].ingredients);
      }
    }
    this.filteredAppliances = RecipesModel.setArrayFromRecipesIds(
      this.filteredRecipes,
      this.appliancesArray
    );
    this.filteredUstensils = RecipesModel.setArrayFromRecipesIds(
      this.filteredRecipes,
      this.ustensilsArray
    );
  };

  processDropdownSearch = (idPrefix, inputValue, clear = false) => {
    let sourceArray = [];
    switch (idPrefix) {
      case 'igr':
        sourceArray = !clear ? this.filteredIngredients : this.ingredientsArray;
        break;
      case 'apl':
        sourceArray = !clear ? this.filteredAppliances : this.appliancesArray;
        break;
      case 'ust':
        sourceArray = !clear ? this.filteredUstensils : this.ustensilsArray;
        break;
      default:
        break;
    }
    if (inputValue.length) {
      let result = [];
      result = RecipesModel.searchMatchingDropdownItems(
        sourceArray,
        inputValue
      );
      this.onDropdownSearchResult(result, idPrefix);
    } else if (sourceArray.length) {
      this.onDropdownSearchResult(sourceArray, idPrefix);
    }
  };

  processTagSearch = (idPrefix, tagValue) => {
    let tag = null;
    this.clearFilters();
    switch (idPrefix) {
      case 'igr':
        this.updateTagItemStatus(this.filteredIngredients, tagValue, idPrefix);
        tag = this.updateTagItemStatus(
          this.ingredientsArray,
          tagValue,
          idPrefix
        );
        this.activeTags.push(tag);
        break;
      case 'apl':
        this.updateTagItemStatus(this.filteredAppliances, tagValue, idPrefix);
        tag = this.updateTagItemStatus(
          this.appliancesArray,
          tagValue,
          idPrefix
        );
        this.activeTags.push(tag);
        break;
      case 'ust':
        this.updateTagItemStatus(this.filteredUstensils, tagValue, idPrefix);
        tag = this.updateTagItemStatus(this.ustensilsArray, tagValue, idPrefix);
        this.activeTags.push(tag);
        break;
      default:
        break;
    }
    this.restrictByTagRecipesIds(tag);
    this.refreshDisplayFromTags();
    this.onTagSearchResult({
      recipes: this.tagRecipes,
      ingredients: this.filteredIngredients,
      appliances: this.filteredAppliances,
      ustensils: this.filteredUstensils,
    });
  };

  removeTagFromSearch = (idPrefix, tagValue) => {
    let tag = null;
    switch (idPrefix) {
      case 'igr':
        this.updateTagItemStatus(
          this.filteredIngredients,
          tagValue,
          idPrefix,
          false
        );
        tag = this.updateTagItemStatus(
          this.ingredientsArray,
          tagValue,
          idPrefix,
          false
        );
        break;
      case 'apl':
        this.updateTagItemStatus(
          this.filteredAppliances,
          tagValue,
          idPrefix,
          false
        );
        tag = this.updateTagItemStatus(
          this.appliancesArray,
          tagValue,
          idPrefix,
          false
        );
        break;
      case 'ust':
        this.updateTagItemStatus(
          this.filteredUstensils,
          tagValue,
          idPrefix,
          false
        );
        tag = this.updateTagItemStatus(
          this.ustensilsArray,
          tagValue,
          idPrefix,
          false
        );
        break;
      default:
        break;
    }
    if (tag) {
      this.dismissTag(tagValue);
      this.restaureTagRecipesIds();
      if (this.activeTags.length) {
        this.refreshDisplayFromTags();
        this.onTagSearchResult({
          recipes: this.tagRecipes,
          ingredients: this.filteredIngredients,
          appliances: this.filteredAppliances,
          ustensils: this.filteredUstensils,
        });
      } else {
        this.tagRecipes = [];
        this.processMainSearchValue(this.mainSearchValue);
      }
    }
  };

  restaureTagRecipesIds = () => {
    let tagsIndex = this.activeTags.length;
    this.tagsRecipesIds = [];
    while (tagsIndex) {
      tagsIndex -= 1;
      this.restrictByTagRecipesIds(this.activeTags[tagsIndex]);
    }
  };

  dismissTag = (tagName) => {
    let index = this.activeTags.length;
    while (index) {
      index -= 1;
      if (this.activeTags[index].name === tagName) {
        this.activeTags.splice(index, 1);
        break;
      }
    }
  };

  updateTagItemStatus = (itemsArray, tagName, type, add = true) => {
    let index = itemsArray.length;
    const tag = {};
    while (index) {
      index -= 1;
      if (itemsArray[index].name === tagName) {
        itemsArray[index].isTag = add;
        tag.name = itemsArray[index].name;
        tag.type = type;
        tag.recipes = itemsArray[index].recipes;
        break;
      }
    }
    return tag;
  };

  restrictByTagRecipesIds = (sourceArray) => {
    let rcpIndex = this.tagsRecipesIds.length;
    const newRecipes = sourceArray.recipes;
    if (rcpIndex) {
      while (rcpIndex) {
        rcpIndex -= 1;
        let found = false;
        for (let index = 0; index < newRecipes.length; index += 1) {
          const recipe = newRecipes[index];
          found = recipe === this.tagsRecipesIds[rcpIndex];
          if (found) {
            break;
          }
        }
        if (!found) {
          this.tagsRecipesIds.splice(rcpIndex, 1);
        }
      }
    } else {
      let index = newRecipes.length;
      while (index) {
        index -= 1;
        this.tagsRecipesIds.push(newRecipes[index]);
      }
    }
  };

  refreshDisplayFromTags = () => {
    const recipesArray = this.filteredRecipes.length
      ? this.filteredRecipes
      : this.recipesArray;
    this.tagRecipes = [];
    let index = recipesArray.length;
    while (index) {
      index -= 1;
      let idsIndex = this.tagsRecipesIds.length;
      while (idsIndex) {
        idsIndex -= 1;
        if (recipesArray[index].id === this.tagsRecipesIds[idsIndex]) {
          this.tagRecipes.push(recipesArray[index]);
          this.trimIngredientsArray(recipesArray[index].ingredients);
        }
      }
    }
    this.filteredAppliances = RecipesModel.setArrayFromRecipesIds(
      this.tagRecipes,
      this.appliancesArray
    );
    this.filteredUstensils = RecipesModel.setArrayFromRecipesIds(
      this.tagRecipes,
      this.ustensilsArray
    );
  };

  refreshTagsRecipes = () => {
    if (this.activeTags.length) {
      this.tagRecipes = [];
      let tagsIndex = this.tagsRecipesIds.length;
      while (tagsIndex) {
        tagsIndex -= 1;
        let found = false;
        let rcpIndex = this.recipesArray.length;
        while (rcpIndex && !found) {
          rcpIndex -= 1;
          found =
            this.recipesArray[rcpIndex].id === this.tagsRecipesIds[tagsIndex];
          if (found) {
            this.tagRecipes.push(this.recipesArray[rcpIndex]);
          }
        }
      }
    }
  };

  clearFilters = () => {
    this.filteredIngredients = [];
    this.filteredAppliances = [];
    this.filteredUstensils = [];
  };

  static searchMatchingDropdownItems = (sourceArray, stringVal) => {
    const searchResult = [];
    let index = sourceArray.length;
    while (index) {
      index -= 1;
      const item = sourceArray[index];
      if (
        RecipesModel.searchString(
          item.name.toLowerCase(),
          stringVal.toLowerCase()
        ) &&
        !item.isTag
      ) {
        searchResult.push(item);
      }
    }
    return searchResult;
  };

  browseRecipeIngredients = (ingredients) => {
    let index = ingredients.length;
    let matchFound = false;
    while (index && !matchFound) {
      index -= 1;
      matchFound = RecipesModel.searchString(
        ingredients[index].ingredient.toLowerCase(),
        this.mainSearchValue
      );
    }
    return matchFound;
  };

  trimIngredientsArray = (newIngredients) => {
    let index = newIngredients.length;
    while (index) {
      index -= 1;
      let matchFound = false;
      let mainIndex = this.filteredIngredients.length;
      while (mainIndex) {
        mainIndex -= 1;
        matchFound =
          newIngredients[index].ingredient.toLowerCase() ===
          this.filteredIngredients[mainIndex].name.toLowerCase();
        if (matchFound) {
          break;
        }
      }
      if (!matchFound) {
        const ingredient = this.getItemDetails(
          this.ingredientsArray,
          newIngredients[index].ingredient
        );
        if (ingredient) {
          this.filteredIngredients.push(ingredient);
        }
      }
    }
  };

  getItemDetails = (sourceArray, stringVal) => {
    let index = sourceArray.length;
    while (index) {
      index -= 1;
      const item = sourceArray[index];
      if (item.name.toLowerCase() === stringVal.toLowerCase() && !item.isTag) {
        return item;
      }
    }
    return false;
  };

  static setArrayFromRecipesIds = (recipesArray, itemsArray) => {
    let itemsIndex = itemsArray.length;
    const filteredItems = [];
    // TODO : vérifier pertinence du check isTag
    while (itemsIndex) {
      itemsIndex -= 1;
      const itemRecipes = itemsArray[itemsIndex].recipes;
      for (let index = 0; index < itemRecipes.length; index += 1) {
        const item = itemsArray[itemsIndex];
        const itemRecipeId = itemRecipes[index];
        let recipesIndex = recipesArray.length;
        let matchFound = false;
        while (recipesIndex) {
          recipesIndex -= 1;
          if (itemRecipeId === recipesArray[recipesIndex].id && !item.isTag) {
            matchFound = true;
            filteredItems.push(item);
            break;
          }
        }
        if (matchFound) {
          break;
        }
      }
    }
    return filteredItems;
  };

  static searchString = (stringVal, needle) => stringVal.includes(needle);

  /**
   * Process data to fill property array
   * Avoid duplicates
   * Sort items by name alphabetically
   * Set first letter to uppercase
   * @param {Number} id
   * @param {String} itemName
   * @param {Array} itemArray
   * @returns {void}
   */
  static populateItemsArray = (id, itemName, itemArray) => {
    const itemObject = itemArray.find(
      (element) => element.name.toLowerCase() === itemName.toLowerCase()
    );
    if (!itemObject) {
      const renamedItem = RecipesModel.firstLetterToUpper(itemName);
      itemArray.push({
        id: itemArray.length,
        name: renamedItem,
        recipes: [id],
        isTag: false,
      });
    } else {
      itemObject.recipes.push(id);
    }
  };

  /**
   * Sort by string alphabetically (ascending)
   * @param {Array} elementsArray
   * @returns {void}
   */
  static sortByNames = (elementsArray) => {
    elementsArray.sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Set first letter to uppercase
   * @param {String} name
   * @returns {String}
   */
  static firstLetterToUpper = (name) =>
    `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

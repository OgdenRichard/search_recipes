export default class RecipeCard {
  constructor(id, title, time, ingredients, description) {
    this.id = id;
    this.title = title;
    this.time = time;
    this.ingredients = ingredients;
    this.description = description;
    this.article = this.setRecipe();
  }

  setRecipe = () => {
    const article = document.createElement('article');
    article.id = this.id;
    article.className = 'col';
    article.classList.add('col-xl-4');
    article.classList.add('col-md-6');
    article.appendChild(this.setCard());
    return article;
  };

  setCard = () => {
    const card = document.createElement('div');
    card.className = 'card';
    const body = document.createElement('div');
    body.className = 'card-body';
    const details = document.createElement('div');
    details.className = 'card-details';
    details.appendChild(this.setIngredients());
    details.appendChild(this.setDescription());
    body.appendChild(this.setCardHeader());
    body.appendChild(details);
    card.appendChild(RecipeCard.setCardImg);
    card.appendChild(body);
    return card;
  };

  setCardHeader = () => {
    const header = document.createElement('div');
    const name = document.createElement('h5');
    name.classList.add('card-name');
    const clock = document.createElement('h5');
    clock.classList.add('card-clock');
    header.classList.add('card-title');
    name.innerText = this.title;
    clock.innerText = `${this.time} min`;
    header.appendChild(name);
    header.appendChild(clock);
    return header;
  };

  setIngredients = () => {
    const container = document.createElement('div');
    container.className = 'card-ingredients';
    const list = document.createElement('dl');
    this.ingredients.forEach((ingredient) => {
      const elementTitle = document.createElement('dt');
      elementTitle.textContent = `${ingredient.ingredient}`;
      elementTitle.textContent += ingredient.quantity ? ' : ' : '';
      list.appendChild(elementTitle);
      const elementDesc = document.createElement('dd');
      if (ingredient.quantity) {
        const textUnit = ingredient.unit ? ingredient.unit : '';
        elementDesc.textContent = `${ingredient.quantity} ${textUnit}`;
      } else {
        elementDesc.classList.add('clearfix');
      }
      list.appendChild(elementDesc);
    });
    container.append(list);
    return container;
  };

  setDescription = () => {
    const container = document.createElement('div');
    container.className = 'card-recipe';
    container.textContent = this.description;
    return container;
  };

  static setCardImg = () => {
    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = './assets/img/grey_bg.jpg';
    img.alt = 'food image';
    return img;
  };
}

class PageEngine {
  constructor() {
    this.petCards = [];
    this.throttle = false;
    this.asyncInit();
  }

  async asyncInit() {
    const url = '../../assets/pets.json';
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data) {
        this.dataBase = data;

        this.cardsWindow = document.querySelector('.pets-cards-window');
        if (this.cardsWindow) {
          this.generatePetArray(3, 3);
          this.fillCardsGrid();
        }
        
        this.petsGrid = document.querySelector('.pets-grid');
        if (this.petsGrid) {
          this.currentPosition = 0;
          this.previousPosition = 0;
          this.previousGridStep = 0;
          this.generatePetArray(48, 4, 1);
          this.fillCardsGrid();
          setTimeout(() => {
            window.addEventListener('resize', () => this.updateGrid(), false);
          }, 250);
        }
      }
    } catch (error) {
      setTimeout(() => {
        this.asyncInit();
      }, 100);
    }
  }

  shuffle(array) {
    for (let i = 0; i < array.length; i += 1) {
      const j = Math.floor(Math.random() * i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  generatePetArray(amount, diff, collect=0) {
    let fillCount = 0;
    while(fillCount < amount) {
      let cardArray;
      while (!cardArray || cardArray.slice(0, diff).some((n) => this.petCards.slice(-diff).indexOf(n) !== -1)) {
        cardArray = this.shuffle(Array.from(new Array(this.dataBase.length).keys()));
      }
     if (amount < cardArray.length) cardArray = cardArray.slice(0, amount);
     this.petCards = (collect) ? this.petCards.concat(cardArray) : [].concat(cardArray);
     fillCount += cardArray.length;
    }
  }

  reFillCard(cardIndex, realCardIndex) {
      let petNumberInArray = realCardIndex || cardIndex;
      const petIndex = this.petCards[petNumberInArray];
      const petData = this.dataBase[petIndex];
      const cardName = petData.name;
      const cardImage = petData.img;
      const petCard = document.querySelector(`#pet-card-${cardIndex}`);
      petCard.children[0].src = cardImage; // Change card image .pet-card-image
      petCard.children[1].textContent = cardName; // Change card title .pet-card-title
      petCard.onclick = () => pageEngine.openPopup(petIndex);
      petCard.title = `Pet card #${++petNumberInArray} - ${cardName}`;
  }

  fillCardsGrid() {
    const cardsOnPage = document.querySelectorAll('.pet-card');
    cardsOnPage.forEach((_, cardIndex) => {
      this.reFillCard(cardIndex);
    });
  }

  slide(direction = 0) {
    if (this.throttle) return;
    this.throttle = true;
    const timer = Number(document.querySelector('.pets-cards-window').offsetWidth) + 5;
    const cardsOnPage = document.querySelectorAll('.pet-card');
    this.generatePetArray(3, 3);
    for (const card of cardsOnPage) {
      const computedStyle = getComputedStyle(card);
      if(computedStyle.display !== 'none') {
        card.classList.remove('slide-out-left');
        card.classList.remove('slide-out-right');
        if (direction) {
          card.classList.add('slide-out-left');
        } else {
          card.classList.add('slide-out-right');
        }
      }
    }
    setTimeout(() => {
      this.throttle = false;
    }, timer);
  }

  animationEnd(event) {
    const card = document.getElementById(event.target.id);
    const cardIndex = Number(event.target.id.slice(-1)); //Card's place on page
    const realCardIndex = Number(event.target.style.order);

    if (card.classList.contains('slide-out-left')) {
      this.reFillCard(cardIndex);
      card.classList.remove('slide-out-left');
      card.classList.add('slide-in-right');
      return;
    }

    if (card.classList.contains('slide-out-right')) {
      this.reFillCard(cardIndex);
      card.classList.remove('slide-out-right');
      card.classList.add('slide-in-left');
      return;
    }
    
    if (card.classList.contains('slide-in-right')) {
      card.classList.remove('slide-in-right');
    }

    if (card.classList.contains('slide-in-left')) {
      card.classList.remove('slide-in-left');
    }

    if (card.classList.contains('flip-out')) {
      this.reFillCard(cardIndex, realCardIndex);
      card.classList.remove('flip-out');
      card.classList.add('flip-in');
      return;
    }

    if (card.classList.contains('flip-in')) {
      card.classList.remove('flip-in');
    }
  }

  updateGrid() {
    const gridStep = Number(getComputedStyle(this.petsGrid).order);
    const gridEnd = this.petCards.length
    const buttonFirst = document.querySelector('#paginator-first');
    const buttonPrevious = document.querySelector('#paginator-previous');
    const PageNumber = document.querySelector('#paginator-page');
    const buttonNext = document.querySelector('#paginator-next');
    const buttonLast = document.querySelector('#paginator-last');
    let currentPosition = this.currentPosition;
    let gridDelta = Math.round((currentPosition % gridStep));
    if (gridDelta) currentPosition -= gridDelta;

    if (gridStep === this.previousGridStep && currentPosition === this.previousPosition) return;

    const allowPrevious = ((currentPosition - gridStep) < 0);
    buttonFirst.disabled = allowPrevious;
    buttonPrevious.disabled = allowPrevious;

    const allowNext = ((currentPosition + gridStep) >= gridEnd);
    buttonLast.disabled = allowNext;
    buttonNext.disabled = allowNext;

    const currentPage = parseInt(currentPosition / gridStep) + 1;
    PageNumber.textContent = currentPage;

    for(let cardInGrid = currentPosition; cardInGrid < currentPosition + gridStep; cardInGrid++) {
      const card = document.querySelector(`#pet-card-${cardInGrid - currentPosition}`);
      const computedStyle = getComputedStyle(card);
      card.style.order = cardInGrid;
      if(computedStyle.display !== 'none') {
        card.classList.remove('flip-out');
        card.classList.remove('flip-in');
        card.classList.add('flip-out');
      }
    }

    this.previousPosition = currentPosition;
    this.previousGridStep = gridStep;
  }

  goPage(direction=0, rewind=0) {
    if (this.throttle) return;
    this.throttle = true;
    const gridStep = Number(getComputedStyle(this.petsGrid).order);
    const gridEnd = this.petCards.length;
    const gridLastPosition = gridEnd - gridStep;
    let currentPosition = this.currentPosition;
    let gridDelta = Math.round((currentPosition % gridStep));
    if (gridDelta) currentPosition -= gridDelta;
    currentPosition += (direction) ? gridStep : -gridStep;
    if (rewind) currentPosition = (direction) ? gridLastPosition : 0;
    if (currentPosition < 0) currentPosition = 0;
    if (currentPosition > gridLastPosition) currentPosition = gridLastPosition;
    this.currentPosition = currentPosition;
    this.updateGrid();
    setTimeout(() => {
      this.throttle = false;
    }, 955);
  }

  switchView(elements) {
    if (!Array.isArray(elements)) elements = [elements];
      for (const element of elements) {
        document.getElementById(element).classList.toggle('change');   
      }
  }

  resetView(elements) {
    if (!Array.isArray(elements)) elements = [elements];
    for (const element of elements) {
      document.getElementById(element).classList.remove('change');  
    }
  }

  switchMenu() {
    const elements = ['header-burger', 'header-menu', 'header-logo', 'header-logo-title', 'header-logo-subtitle', 'blackout', 'body'];
    this.switchView(elements);
  }

  resetMenu() {
    const elements = ['header-burger', 'header-menu', 'header-logo', 'header-logo-title', 'header-logo-subtitle', 'blackout', 'body'];
    this.resetView(elements);
  }

  openPopup(petIndex) {
    const popupWindow = document.querySelector('#popup-window');
    const petData = this.dataBase[petIndex];
    popupWindow.innerHTML = `
                <div class="block-popup-image"><img class="popup-image" src="${petData.img}" alt=""></div>
                <div class="popup-content">
                    <div class="popup-content-caption">
                        <h3 class="text-black popup-content-title">${petData.name}</h3>
                        <h4 class="text-black popup-content-subtitle">${petData.type} - ${petData.breed}</h4>
                    </div>
                    <div class="popup-content-description">
                        <h5 class="text-black popup-description-text">${petData.description}</h5>
                    </div>
                    <div>
                        <ul class="popup-list">
                            <li class="popup-list-item"><h5 class="text-black"><span class="text-bold">Age: </span>${petData.age}</h5></li>
                            <li class="popup-list-item"><h5 class="text-black"><span class="text-bold">Inoculations: </span>${petData.inoculations.join(', ').trim()}</h5></li>
                            <li class="popup-list-item"><h5 class="text-black"><span class="text-bold">Diseases: </span>${petData.diseases.join(', ').trim()}</h5></li>
                            <li class="popup-list-item"><h5 class="text-black"><span class="text-bold">Parasites: </span>${petData.parasites.join(', ').trim()}</h5></li>
                        </ul>
                    </div>
                </div>
              `;
    const elements = ['popup', 'popup-window', 'body'];
    this.switchView(elements);
  }

  closePopup() {
    const elements = ['popup', 'popup-window', 'body'];
    this.switchView(elements);
  }

  popupOver(event) {
    const popupClose = document.querySelector('#popup-close');
    if (Array.from(popupClicks).find(node => node === event.target)) popupClose.classList.add('change');
  }

  popupOut(event) {
    document.querySelector('#popup-close').classList.remove('change');
  }

}

const pageEngine = new PageEngine();

// popup Events
const popupClicks = document.querySelectorAll('.popup-click');
const popupWindow = document.querySelector('#popup-window');
popupClicks.forEach(popupBlock => {
  popupBlock.addEventListener("mouseover", (event) => pageEngine.popupOver(event), false);
  popupBlock.addEventListener("mouseout", (event) => pageEngine.popupOut(event), false);
});
popupWindow.addEventListener('click', (event) => event.stopPropagation(), false);

// pet card animation Event
const cardsOnPage = document.querySelectorAll('.pet-card');
cardsOnPage.forEach(card => {
  card.addEventListener("animationend", (event) => pageEngine.animationEnd(event), false);
});
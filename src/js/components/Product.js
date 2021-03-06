import {utils} from '../utils.js';
import {select, templates, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id; // dodajemy do obiektu właściwość
    thisProduct.data = data;

    // kolejność wywoływania metod ma DUŻE znaczenie dla poprawności działania kodu
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }

  renderInMenu(){
    const thisProduct = this;

    // generate HTML based on template
    const generatedHTML = templates.menuProduct(thisProduct.data); // używamy metody z obiektu templates i dokładamy do niej cały obiekt z danymi produktu
    // create element using utils.createElementFromHTML
    thisProduct.element = utils.createDOMFromHTML(generatedHTML); // dodajemy właściwość(element) do obiektu, który tworzy DOM z wygenerowanego wyżej stringa HTML
    // find menu container
    const menuContainer = document.querySelector(select.containerOf.menu); // targetujemy <div></div>, do którego wstawimy wygenerowany element
    // add element to menu
    menuContainer.appendChild(thisProduct.element); // wstawiamy utoworzy element DOM z kodem HTML do odpowiedniego <div></div> w kodzie HTML
  }
  // metoda getElements jest wywoływana po renderInMenu, która szykuje właściwość thisProduct.element - dlatego w getElements możemy skorzystać z tej właściwości bez potrzeby wpisywania argumentu - jeśli zapiszemy coś do właściwości instancji, to możemy z tego korzystać w każdej jej metodzie
  getElements(){
    const thisProduct = this;

    // dodajemy referencje jako właściwości do naszego obiektu = SZYBKI DOSTĘP!
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); // referencja do nagłówka (clickable trigger)
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form); // referencja do formularza produktu
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs); // referencja do kontrolek w formularzu
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton); // referencja do buttona
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem); // referencja do diva z ceną produktu
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper); // referencja do wrapera na obrazki danego produktu
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget); // referencja do diva z widgetem ilości
  }

  initAccordion(){
    const thisProduct = this;

    // START add eventListener to clickable trigger
    thisProduct.accordionTrigger.addEventListener('click', function(event){ // korzysta z getElements, żeby wybrać target klikania
      // prevent default action
      event.preventDefault();
      // find active product (with class active)
      const activeProduct = document.querySelector(select.all.menuProductsActive); // targetuje aktywny produkt
      // if found, remove active class
      if(activeProduct !== null && activeProduct !== thisProduct.element){ // jeżeli produkt nie jest nullem, ani wybranym aktywnym elementem
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive); // usuwa klasę active
      }
      // toggle class active to active element
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive); // przełącza klase active to aktualnie wybranego elementu
    });
  }

  initOrderForm(){
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form); // zamienia formularz z zaznaczonymi opcjami na tablicę w JS

    let price = thisProduct.data.price; // zmiennej price przypisujemy referencję do ceny w bazie danych

    for(let paramId in thisProduct.data.params){ // dla każdej właściwości (nazwa) w obiekcie thisProduct.data.params
      const param = thisProduct.data.params[paramId]; // stała param zwraca cały obiekt dla nazwy właściwości (paramId)

      for(let optionId in param.options){ // dla każdej właściwości (nazwa) w obiekcie param.options
        const option = param.options[optionId]; // stała option zwraca cały obiekt dla nazwy właściwości (optionId)

        // jeżeli w obiekcie formData[paramId] znajduje się właściwość o nazwie paramId i zawiera w sobie właściwość o nazwie optionId to...
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected){ 
          if(!option.default){ // jeżeli NIE posiada właściwości default
            price += option.price; // dodaj cenę kiedy jest zaznaczony składnik
          }
        } else { // ... w innym wypadku (cena price zostaje bez zmian), ale ...
          if(option.default){ // ... jeżeli zaznaczona opcja ma właściwość default
            price -= option.price; // odejmij wartość ceny od ceny podstawowej price jeżeli opca zostanie odznaczona
          }
        }

        // zapisujemy w stałej referencję do obrazka o klasie paramId-optionId w divie z obrazkami
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId); 

        if(optionImage){ // jeżeli obrazek znajduje się w divie z obrazkami
          if(optionSelected){ // jeżeli opcja jest zaznaczona
            optionImage.classList.add(classNames.menuProduct.imageVisible); // dodaj klasę .active, która pokaże obrazek przy zaznaczeniu opcji
          } else { // w innym przypadku (odznaczanie)
            optionImage.classList.remove(classNames.menuProduct.imageVisible); // usuń klasę .active
          }
        } 

      }
    }

    thisProduct.priceSingle = price; // cena jednostkowa po ustaleniu parametrów produktu > wpisana przed mnożeniem przez value
    price *= thisProduct.amountWidget.value; // tutaj daje nam wynik mnożenia price * ilość produktów
    thisProduct.priceElem.innerHTML = price; // znalezione wartości wstawiamy do elementu dom, który ma wyświetlać aktualną cenę
  }

  initAmountWidget(){ // metoda odpowiedziala za utworzenie nowej instancji(obiektu) klasy AmountWidget
    const thisProduct = this;

    // tworzymy instancję klasy AmountWidget i zapisujemy jako właściwość obiketu thisProduct
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem); // jako argument wpisujemy referencję do diva z widgetem ilości
    // thisWidget.element = thisProduct.amountWidgetElem -- dodajemy nasłuchiwacz na stworzony event 'updated' na input
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder(); // po wykryciu 'updated' cena zostanie ponownie przeliczona
    });
  }

  addToCart(){
    const thisProduct = this;
    // dostęp do metody add w klasie cart > thisProduct.prepareCartProduct() później w metodzie add występuje jako argument menuProduct
    //app.cart.add(thisProduct.prepareCartProduct());

    //zmiana podejścia przy rozbiciu kodu na moduły
    // wejście do pliku app.js przez CustomEvent
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    // wywołanie eventu na wybranym elemencie
    thisProduct.element.dispatchEvent(event);

    // później nasłuchujemy event w app > initCart();
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {}; // przygotowujemy obiekt, który zostanie dodany do koszyka (później występuje jako argument menuProduct)
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.priceSingle * productSummary.amount;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form); // zamienia formularz z zaznaczonymi opcjami na tablicę w JS

    let params = {}; // zmienna, w której zapisujemy obiekt z parametrami produktu

    for(let paramId in thisProduct.data.params){ // pętle skopiowane z processOrder();
      const param = thisProduct.data.params[paramId];

      params[paramId] = { // dodajemy strukturę obiektu params dla każdego produktu w pętli > zmienna powyżej pętli
        label: param.label, // etykieta (właściwość) wzięta z obiektu w stałej param
        options: {} // pusty obiekt, do którego będziemy wstawiać zaznaczone opcje z pętli poniżej
      };

      for(let optionId in param.options) {
        const option = param.options[optionId];
          
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected){
          // w obiekcie params[paramId].options definiujemy nazwę właściwości options[optionId] i dodajemy do niej wartość option.label (wartość właściwości label w obiekcie option, czyli nazwę składnika, która póżniej będzie wyświetlana w elemencie DOM)
          params[paramId].options[optionId] = option.label;
        }
      }
    }

    return params; // zwracamy obiekt z parametrami produktu
  }
}

export default Product;
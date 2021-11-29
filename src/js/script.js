/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product', // pojedynczy produkt w templatce
      menuProductsActive: '#product-list > .product.active', // pojedynczy produkt w templatce - AKTYWNY!
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

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
      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {}; // przygotowujemy obiekt, który zostanie dodany do koszyka
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

        params[paramId] = { // dodajemy strukturę obiektu params dla wybranego produktu > zmienna powyżej pętli
          label: param.label, // etykieta (właściwość) wzięta z obiektu w stałej param
          options: {} // pusty obiekt, do którego będziemy wstawiać zaznaczone opcje z pętli poniżej
        };

        for(let optionId in param.options) {
          const option = param.options[optionId];
          
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected){
            // w obiekcie params[paramId].options definiujemy nazwę właściwości options[optionId] i dodajemy do niej wartość option.label (wartość właściwości label w obiekcie option)
            params[paramId].options[optionId] = option.label;
          }
        }
      }

      return params; // zwracamy obiekt z parametrami produktu
    }
  }

  class AmountWidget {
    // podczas tworzenia nowych instancji klasy AmountWidget odpali się constructor, dlatego musimy mu przekazać argument, na którym ma pracować (referencja z klasy Product, metody initAmountWidget)
    constructor(element){
      const thisWidget = this;

      // wywołujemy z argumentem element, który jest referencją do właściwości thisProduct.amountWidget (div z widgetem) w metodzie initAmountWidget klasy Product
      thisWidget.getElements(element);
      // wywołujemy metodę z argumentem, który podaje domyślą wartość inputa
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element){ // argument przekazujemy dalej do metody getElements klasy AmountWidget
      const thisWidget = this;

      thisWidget.element = element; // referencja do argumentu zapisana we właściwości instancji(obiektu) thisWidget klasy AmountWidget
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input); // referencja do inputu w divie z widgetem ilości
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease); // referencja do buttona - w divie z widgetem ilości
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease); // referencja do buttona + w divie z widgetem ilości
    }

    setValue(value){ // funkcja pośrednik, która kontroluje wartości wpisywane w inpucie widgetu ilości
      const thisWidget = this;
      
      const newValue = parseInt(value); // konwertuje przekazaną inputowi wartość na liczbę
      
      // Jeśli value ma jakąkolwiek wartość negatywną, undefined, NaN, false, to if się odpali, bo np !undefined = true, !false = true itd.
      // Czyli wszystko co "złe" z wykrzyknikiem na początku odwraca się.
      if(!value){
        thisWidget.value = settings.amountWidget.defaultValue; // defaultowa wartość inputa
      }

      // jeżeli obecna wartość inputa jest różna od nowej wartości ORAZ nowa wartość nie jest tekstem
      // ORAZ nowa wartość jest większa/równa niż X ORAZ nowa wartość jest mniejsza/równa X
      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue; // zastąp bierzącą wartość, nową wartością
      }

      thisWidget.input.value = thisWidget.value; // aktualizuje właściwość o wartość podaną w inpucie

      thisWidget.announce(); // wywołujemy stworzony event "updated" po tym jak wiemy, że wartość inputa jest poprawna
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce(){
      const thisWidget = this;

      const event = new Event('updated'); // klasa Event jest wbudowana w silnik JS i pozwala tworzyć nowe eventy
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    // konstruktor tej klasy oczekuje na przekazanie referencji do diva , w któym ten koszyk ma być obecny
    // przekażemy jej więc wrapper (czyli kontener, element okalający) koszyka (select.containerOf.cart) > app.initCart
    constructor(element){
      const thisCart = this;

      thisCart.products = []; // w tej właściwości [tablica] będziemy przechowywać produkty dodane do koszyka

      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = []; // dodajemy właściwość [tablica], w której będziemy przechowywać referencje do obiektów DOM

      thisCart.dom.wrapper = element; // element DOM okalający cały koszyk, w nim szukamy poszczególnych elementów koszyka
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive); // przełączamy klasę active na wraperze koszyka
      });
    }

    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);
    }
  }

  const app = {
    initMenu: function(){ // tworzy instancję każdego produktu korzystając z app.initData
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){ // udostępnia nam łatwy dostęp do danych
      const thisApp = this;

      thisApp.data = dataSource;  //dodajemy do obiektu app (this) referencję do obiektu z danymi produktów
    },

    initCart: function(){ // tworzy instancję produktu w koszyku
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem); // instancja klasy Cart zapisana jako właściwość obiektu thisApp pozwala na wywołanie poza obiektem
    },

    init: function(){ // odpala całą aplikację!
      const thisApp = this;

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}

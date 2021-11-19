/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product', // templatka do Handlebars
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
      clickable: '.product__header', // nagłówek produktu, który po kliknięciu ma sie rozwinąć
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active', // target aktywnej klasy produktu
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML), // skompilowana templatka
  };

  class Product {
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id; // dodajemy do obiektu właściwość
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();
    }

    renderInMenu(){
      const thisProduct = this;

      // generate HTML based on template
      const generatedHTML = templates.menuProduct(thisProduct.data); // używamy metody z obiektu templates i dokładamy do niej cały obiekt z danymi produktu
      // create element using utils.createElementFromHTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML); // dodajemy właściwość(element) do obiektu, tworzymy DOM z wygenerowanego wyżej stringa HTML
      // find menu container
      const menuContainer = document.querySelector(select.containerOf.menu); // targetujemy <div></div>, do którego wstawimy wygenerowany element
      // add element to menu
      menuContainer.appendChild(thisProduct.element); // wstawiamy utoworzy element DOM z kodem HTML do odpowiedniego <div></div> w kodzie HTML
    }

    getElements(){
      const thisProduct = this;

      // dodajemy referencje do elementów HTML jako właściwości do naszego obiektu
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); // referencja do nagłówka (clickable trigger)
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form); // referencja do formularza produktu
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs); // referencja do kontrolek w formularzu
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton); // referencja do buttona
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem); // referencja do kontenerka z ceną produktu
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
      });
    }

    processOrder(){
      const thisProduct = this;

      console.log(thisProduct);
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

    init: function(){ // odpala całą aplikację!
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}

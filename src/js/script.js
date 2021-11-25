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

      price *= thisProduct.amountWidget.value;
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
  }

  class AmountWidget {
    // podczas tworzenia nowych instancji klasy AmountWidget odpali się constructor, dlatego musimy mu przekazać argument, na którym ma pracować
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
      
      // TU POTRZEBA WSPARCIA MENTORA!!!
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

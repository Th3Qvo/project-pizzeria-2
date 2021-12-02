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
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
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

  class AmountWidget {
    // podczas tworzenia nowych instancji klasy AmountWidget odpali się constructor, dlatego musimy mu przekazać argument, na którym ma pracować (referencja z klasy Product, metody initAmountWidget)
    constructor(element){
      const thisWidget = this;

      // wywołujemy z argumentem element, który jest referencją do właściwości thisProduct.amountWidget (div z widgetem) w metodzie initAmountWidget klasy Product
      thisWidget.getElements(element);
      // wywołujemy metodę z argumentem, który podaje wartość inputa
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

      // klasa Event/CustomEvent jest wbudowana w silnik JS i pozwala tworzyć nowe eventy
      const event = new CustomEvent('updated', {
        // przy tym zapisie tworzymy event, który możemy kontrolować
        // bez bubbles event jest emitowany tylko na jednym elemencie, na tym, na któym odpalamy dispatchEvent
        // z opcją bubbles będzie nadal emitowany na tym elemencie, ale również na jego rodzicu, dziadku, itd...
        // np.: event 'click', bąbelkuje domyślnie, dzięki czemu przekazywany jest dalej
        // w wypadku customowego eventu bąbelkowanie musimy włączyć sami
        bubbles: true
      }); 
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
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.formSubmit = thisCart.dom.wrapper.querySelector(select.cart.formSubmit);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive); // przełączamy klasę active na wraperze koszyka
      });

      // Nasłuchujemy tutaj na liste produktów, w której umieszczamy produkty, w których znajduje się widget liczby sztuk, który generuje ten event. Dzieki właściwości bubbles "usłyszymy" go na tej liście. Jest to dla nas informacja, że w "którymś" z produktów doszło do zmiany ilości sztuk. Nieważne, w któym. Waże, żeby uruchomić metodę update(); żeby ponownie przeliczyć kwoty.
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
    
      // Wywołując event zawarliśmy w nim odwołanie do instancji thisCartProduct (CartProduct > remove();). Właśnie w ten sposób (event.detail.cartProduct) teraz ją odbieramy i przekazujemy do metody thisCart.remove
      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct); // patrz: Product > renderInMenu();

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);

      // dodaje produkty do tablicy thisCart.products > argumenty przekazywane dalej do klasy CartProduct
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.update(); // aktualizuje dane zawsze po dodaniu nowego produktu
    }

    update(){
      const thisCart = this;

      // podstawowa kwota za dostawę
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      // liczba wszystkich produktów w koszyku
      thisCart.totalNumber = 0;
      // cena za produkty bez dostawy
      thisCart.subtotalPrice = 0;

      for(let product of thisCart.products){
        // zwiększamy totalNumber o wartość właściwości amount, obiektu product
        thisCart.totalNumber += product.amount;
        // zwiększamy subtotalPrice o wartość właściwości price, obiektu product
        thisCart.subtotalPrice += product.price;
      }

      if(thisCart.totalNumber == 0){ // jeżeli w koszyku nie ma produktów
        thisCart.deliveryFee = 0; // dostawa równa jest 0
      } else { // w innym wypadku
        thisCart.deliveryFee = settings.cart.defaultDeliveryFee; // dostawa równa się defaultDeliveryFee
      }

      // suma do zapłaty równa cenie produktów i cenie dostawy
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

      // dodajemy wartości liczbowe do elemetów DOM w HTML
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

      // pętla dla każdego z elemtów DOM, gdzie ma być wyświetlana suma zamówienia
      for(let elementTotalPrice of thisCart.dom.totalPrice){
        elementTotalPrice.innerHTML = thisCart.totalPrice;
      }
    }

    // metoda remove przyjmuje jeden argument, referencję do instancji produktu, który chcemy usunąć (patrz: Cart > initAction(); > CartProduct > remove();)
    remove(productToRemove){
      const thisCart = this;

      //dzięki wbudowanej w silknik JS metodzie indexOf(); wyszukujemy index produktu, który chcemy usunąć z koszyka (naszej tablicy z produktami) (productToRemove)
      const indexOfProduct = thisCart.products.indexOf(productToRemove);
      // dzięki wbudowanej w silnik JS metodzie splice(); usuwamy znaleziony wyżej element do usunicia poprzez (index od któego zaczynamy modyfikację tablicy, licza określająca ilość elementów do usunięcia)
      thisCart.products.splice(indexOfProduct, 1);

      // usuwamy reprezentację produktu z HTML
      // znajdujemy produkt, któy chcemy usunąć we wraperze koszyka i wywołujemy na nim metodę remove();
      productToRemove.dom.wrapper.remove();

      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;

      // stała z adresem endpointu, z którym się będziemy komunikować
      const url = settings.db.url + '/' + settings.db.orders;

      // obiekt z informacjami o zamówieniu, które wyślemy na serwer
      let payload = {};

      payload.address = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.totalNumber = thisCart.totalNumber;
      payload.deliveryFee = thisCart.deliveryFee;
      payload.products = [];

      // dodajemy element tablicy o nazwie prod i zawartości utworzonej przez metodę CartProduct > getData();
      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }

      // ustawienia dla metody fetch();
      const options = {
        method: 'POST', // rodzaj metody
        headers: { // nagłówki, informacja, że serwer ma się spodziewać jsona
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload), // obiekt JS przekonwertowany do JSON
      };

      fetch(url, options); // połączenie z serwerem
    }
  }

  class CartProduct {
    // konstruktor przyjmuje dwa argumenty, referencję do obiektu podsumowania (produkt w koszyku) oraz referencę do utworzonego dla tego produktu elementu HTML (generatedDOM)
    constructor(menuProduct, element){
      const thisCartProduct = this;

      // tworzymy łatwy dostęp do właściwości obiektu menuProducts (produktu znajdującego się w koszyku)
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initAction();
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {}; // patrz: Cart > getElements();

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;

      // patrz: Product > initAmountWidget
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        // aktualna wartość widgetu jest dostępna pod właściwością value w thisCartProduct.amountWidget
        // value to wartość wpisywana w pole inputa // patrz: class AmountWidget
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove(){
      const thisCartProduct = this;

      // patrz: AmountWidget > announce();
      const event = new CustomEvent('remove', {
        bubbles: true,
        // We właściwości detail możemy przekazywać dowolne informace do handlera eventu. To ważna informacja. Kiedy emitowaliśmy event informujący o zmianie sztuk, to np. Cart nie interesowało, co dokłądnie się zmieniło. Sam fakt, że event się wyemitował był wystarczający. Tym razem Cart będzie musiało wiedzieć co trzeba usunąć. W tym przypadku przekazujemy więc wraz z eventem dodatkowo odwołanie do tej instancji, dla której kliknięto guzik usuwania.
        // detail można więc rozumieć jako "szczegóły", które mają być przekazane wraz z eventem
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initAction(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    // tworzymy obiekt z danymi, które chcemy umieścić w Cart > sendOrder(); > payload.products
    getData(){
      const thisCartProduct = this;

      let orderData = {};
      orderData.id = thisCartProduct.id;
      orderData.amount = thisCartProduct.amount;
      orderData.price = thisCartProduct.price;
      orderData.priceSingle = thisCartProduct.priceSingle;
      orderData.name = thisCartProduct.name;
      orderData.params = thisCartProduct.params;

      return orderData;
    }
  }

  const app = {
    initMenu: function(){ // tworzy instancję każdego produktu korzystając z app.initData
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]); // nazwa, obiekt z danymi
      }
    },

    initData: function(){ // udostępnia nam łatwy dostęp do danych
      const thisApp = this;

      thisApp.data = {}; // pusty obiekt na dane produktów, w któym zapiszemy zparsowany obiekt z danymi z serwera

      const url = settings.db.url + '/' + settings.db.products;

      fetch(url) // zapytanie do serwera - domyślnie GET
        .then(function(rawResponse){ // kiedy serwer odpowie, otrzymany obiekt 
          return rawResponse.json(); // zwróć w formacie .json
        })
        .then(function(parsedResponse){ // nastepnie, obiekt w formacie .json zamień na obiekt JS-owy
          thisApp.data.products = parsedResponse; // zapisz jako właściwość obiektu thisApp.data
          thisApp.initMenu(); // i uruchom metodę renderującą menu na stonie na podstawie otrzymanych danych
        });
    },

    initCart: function(){ // tworzy instancję produktu w koszyku
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem); // instancja klasy Cart zapisana jako właściwość obiektu thisApp pozwala na wywołanie poza obiektem
    },

    init: function(){ // odpala całą aplikację!
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}

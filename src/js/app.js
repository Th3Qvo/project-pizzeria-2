// export pojedynczych obiektów z innego pliku > zamykamy w nawiasach klamrowych
import {settings, select, classNames} from './settings.js';
// export default > możemy wykorzystać gdy mamy jeden obiekt w pliku (np. Klasę)
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
  // metoda uruchamiana w momencie odświeżenia strony
  initPages: function(){
    const thisApp = this;

    // zapisujemy we właściwościach obiektu thisApp referencje do potrzebnych elementów DOM
    // dzięki właściwości .children uzyskujemy dostęp do jego dzieci (czyli elementów HTML z naszymi podstronami)
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    // wydobywamy z wartości hash ID strony
    // dzięki właściwości .replace, pozbywamy się zbędnego ciągu znaków
    const idFromHash = window.location.hash.replace('#/', '');

    // ustalamy ID strony, która ma zostać otwarta jako domyślna
    let pageMatchingHash = thisApp.pages[0].id;

    console.log(thisApp.pages[0].id, thisApp.pages[1].id);
    // sprawdzamy czy ID strony pasuje do ID wydobytego z hashu strony
    // jeśli tak odpalamy stronę o tym ID
    // jeśli nie odpalamy stronę z pageMatchingHash
    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    // odpalamy odpowiednią stronę
    thisApp.activatePage(pageMatchingHash);

    // dodajemy eventListenery do linków, które odsyłają do konkretnych podstron
    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();
        /* get ID from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');
        /* run thisApp.activatePage w/ this ID */
        thisApp.activatePage(id);

        /* change URL hash (hash = końcówka adresu strony, zaczynająca się od #) */
        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function(pageId){
    const thisApp = this;

    // add class 'active' to matching pages, remove from non-matching
    for(let page of thisApp.pages){
      // przy użyciu classList.toggle możemy jako drugi argument wpisać warunek, kiedy klasa ma zostać ztoglowana
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    // add class 'active' to matching links, remove from non-matching
    for(let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

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

    // nasłuchujemy eventu stworzonego w Product > addToCart();
    // tworzymy właściwość productList, któa będzie elementem DOM
    thisApp.productList = document.querySelector(select.containerOf.menu);
    // dodajemy do niej eventListener nasłuchujący eventu stworzonego w Product > addToCart
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product); // odnosimy się do thisProduct.prepareCartProduct() poprzez właściwości eventu
    });
  },

  init: function(){ // odpala całą aplikację!
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();

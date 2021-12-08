// export pojedynczych obiektów z innego pliku > zamykamy w nawiasach klamrowych
import {settings, select} from './settings.js';
// export default > możemy wykorzystać gdy mamy jeden obiekt w pliku (np. Klasę)
import Product from './components/Product.js';
import Cart from './components/Cart.js';

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

    // nasłuchujemy eventu stworzonego w Product > addToCart();
    // tworzymy właściwość productList, któa będzie elementem DOM
    thisApp.productList = document.querySelector(select.containerOf.menu);
    // dodajemy do niej eventListener nasłuchujący eventu stworzonego w Product > addToCart
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product); // odnosimy się do thisProduct poprzez właściwości eventu :)
    });
  },

  init: function(){ // odpala całą aplikację!
    const thisApp = this;

    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();

import {select, classNames, templates, settings} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

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
    thisCart.dom.productList.addEventListener('remove', function(event){
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

export default Cart;
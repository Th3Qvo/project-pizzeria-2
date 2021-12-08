import {select} from '../settings.js';
import AmountWidget from './AmountWidget.js';

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

export default CartProduct;
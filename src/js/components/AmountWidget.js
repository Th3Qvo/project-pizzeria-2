import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  // podczas tworzenia nowych instancji klasy AmountWidget odpali się constructor, dlatego musimy mu przekazać argument, na którym ma pracować (referencja z klasy Product, metody initAmountWidget)
  constructor(element){
    // wyrażenie super(); odwołuje się do konstruktora klasy nadrzędnej
    // argumenty odpowiadające klasie BaseWidget: wrapperElement, initialValue
    super(element, settings.amountWidget.defaultValue);
    
    const thisWidget = this;

    // wywołujemy z argumentem element, który jest referencją do właściwości thisProduct.amountWidget (div z widgetem) w metodzie initAmountWidget klasy Product
    thisWidget.getElements(element);
    
    thisWidget.initActions();
  }

  getElements(){ // argument przekazujemy dalej do metody getElements klasy AmountWidget
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input); // referencja do inputu w divie z widgetem ilości
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease); // referencja do buttona - w divie z widgetem ilości
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease); // referencja do buttona + w divie z widgetem ilości
  }

  isValid(value){
    return !isNaN(value)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax;
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value; // aktualizuje właściwość o wartość podaną w inpucie
  }

  initActions(){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      thisWidget.setValue(thisWidget.dom.input.value);
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }
}

export default AmountWidget;
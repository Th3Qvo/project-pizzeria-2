import {settings, select} from '../settings.js';

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

export default AmountWidget;
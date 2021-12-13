/* eslint-disable indent */

class BaseWidget {
	constructor(wrapperElement, initialValue){
		const thisWidget = this;

		thisWidget.dom = {};
		thisWidget.dom.wrapper = wrapperElement;

		thisWidget.correctValue = initialValue;
	}

	get value(){
		const thisWidget = this;

		return thisWidget.correctValue;
	}

	set value(value){ // funkcja pośrednik, która kontroluje wartości wpisywane w inpucie widgetu ilości
    const thisWidget = this;
      
    const newValue = thisWidget.parseValue(value); // konwertuje przekazaną inputowi wartość na liczbę

    // jeżeli obecna wartość inputa jest różna od nowej wartości ORAZ nowa wartość nie jest tekstem
    // ORAZ nowa wartość jest większa/równa niż X ORAZ nowa wartość jest mniejsza/równa X
    if(thisWidget.correctValue !== newValue && thisWidget.isValid(newValue)){
      thisWidget.correctValue = newValue; // zastąp bierzącą wartość, nową wartością
      thisWidget.announce(); // wywołujemy stworzony event "updated" po tym jak wiemy, że wartość inputa jest poprawna
    }

    thisWidget.renderValue();
  }

	setValue(value){
		const thisWidget = this;

		thisWidget.value = value;
	}

	parseValue(value){
    return parseInt(value);
  }

  isValid(value){
    return !isNaN(value);
  }

	renderValue(){
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value; // aktualizuje właściwość o wartość podaną w inpucie
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
		
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default BaseWidget;
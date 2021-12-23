/* global Flickity */
import {select, templates} from '../settings.js';

class Home {
  constructor(element){
    const thisHome = this;
	
    thisHome.render(element);
    thisHome.initWidgets();
  }

  render(element){
    const thisHome = this;

    const generatedHTML = templates.homePage();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;

    thisHome.dom.wrapper.innerHTML = generatedHTML;

    thisHome.dom.orderBtn = thisHome.dom.wrapper.querySelector(select.home.order);
    thisHome.dom.bookBtn = thisHome.dom.wrapper.querySelector(select.home.book);
  }

  initWidgets() {
    const thisHome = this;

    setTimeout(() => {
      thisHome.element = document.querySelector('.carousel');
      thisHome.flkty = new Flickity(thisHome.element, {
        wrapAround: true,
        autoPlay: 3000,
        cellAlign: 'left',
        contain: true,
        prevNextButtons: false,
        pageDots: false,
      });
    }, 2000);
  }
}

export default Home;
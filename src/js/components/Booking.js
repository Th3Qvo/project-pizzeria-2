/* eslint-disable indent */
import {templates, select} from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
  }

	render(element){
		const thisBooking = this;

		const generatedHTML = templates.bookingWidget();

		thisBooking.createdHTML = utils.createDOMFromHTML(generatedHTML);

		thisBooking.dom = {};

		thisBooking.dom.wrapper = element;

		thisBooking.dom.wrapper.appendChild(thisBooking.createdHTML);

		thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
		thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
	}

	initWidgets(){
		const thisBooking = this;

		thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
		thisBooking.dom.peopleAmount.addEventListener('updated', function(){
			console.log('updated!');
		});

		thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
		thisBooking.dom.hoursAmount.addEventListener('updated', function(){
			console.log('updated!');
		});
	}
}

export default Booking;
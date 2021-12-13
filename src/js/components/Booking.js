/* eslint-disable indent */
import {templates, select} from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

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

		thisBooking.dom.datePickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
		
		thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
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

		thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePickerWrapper);
		thisBooking.dom.datePickerWrapper.addEventListener('updated', function(){
			console.log('updated!');
		});

		thisBooking.hourPickerWrapper = new HourPicker(thisBooking.dom.hourPickerWrapper);
		thisBooking.dom.hourPickerWrapper.addEventListener('updated', function(){
			console.log('updated!');
		});
	}
}

export default Booking;
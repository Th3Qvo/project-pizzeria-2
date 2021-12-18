
import {templates, select, settings, classNames} from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.selectedTable;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;

    const startDayParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDayParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDayParam,
        endDayParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDayParam,
        endDayParam,

      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDayParam,
      ],
    };

    const urls = {
      bookings:      settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events   + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events   + '?' + params.eventsRepeat.join('&'),
    };

    // get filtered data from endpoints
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of eventsCurrent){
      thisBooking.makeBook(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBook(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBook(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBook(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
	
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
			||
			typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
				&&
				thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) > -1
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
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

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);

    thisBooking.dom.submitBtn = thisBooking.dom.wrapper.querySelector(select.booking.submitBtn);
    thisBooking.dom.phoneInput = thisBooking.dom.wrapper.querySelector(select.booking.phoneInput);
    thisBooking.dom.addressInput = thisBooking.dom.wrapper.querySelector(select.booking.addressInput);
    thisBooking.dom.startersCheckbox = thisBooking.dom.wrapper.querySelectorAll(select.booking.startersCheckbox);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerWrapper);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerWrapper);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
      for(let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.selectedTable = undefined;
    });

    thisBooking.dom.floor.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.initTables(event.target);
    });

    thisBooking.dom.submitBtn.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  initTables(clickedItem){
    const thisBooking = this;

    /* CHANGING SELECTED TABLE CLASS */
    if(!clickedItem.classList.contains(classNames.booking.tableBooked)){

      clickedItem.classList.toggle(classNames.booking.tableSelected);

      for(let table of thisBooking.dom.tables){
        if(table != clickedItem){
          table.classList.remove(classNames.booking.tableSelected);
        }
      }
    } else {
      alert('We are sorry! This table is unavaiable.');
    }

    /* GETTING SELECTED TABLE NUMBER */
    if(clickedItem.classList.contains(classNames.booking.tableSelected)){
      thisBooking.selectedTable = clickedItem.getAttribute('data-table');
    } else {
      thisBooking.selectedTable = undefined;
    }
  }

  sendBooking(){
    const thisBooking = this;

    let payload = {};

    payload.date = thisBooking.datePicker.value;
    payload.hour = thisBooking.hourPicker.value;
    payload.table = parseInt(thisBooking.selectedTable);
    payload.duration = parseInt(thisBooking.hoursAmountWidget.value);
    payload.ppl = parseInt(thisBooking.peopleAmountWidget.value);
    payload.phone = thisBooking.dom.phoneInput.value;
    payload.address = thisBooking.dom.addressInput.value;
    payload.starters = [];

    for(let starter of thisBooking.dom.startersCheckbox){
      if(starter.checked){
        payload.starters.push(starter.value);
      }
    }

    const url = settings.db.url + '/' + settings.db.bookings;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }
}

export default Booking;
import { Component, AfterViewInit } from '@angular/core';

import flatpickr from 'flatpickr';
import { CalendarComponent } from '../../calendar/calendar.component';
@Component({
  selector: 'app-search-board-nd',
  imports: [CalendarComponent],
  templateUrl: './search-board-nd.component.html',
  styleUrl: './search-board-nd.component.css',
})
export class SearchBoardNdComponent {
  ngAfterViewInit(): void {
    flatpickr('#datePicker', {
      dateFormat: 'd.m.Y',

      minDate: 'today',

      disableMobile: true,

      appendTo: document.body,

      position: 'auto center',
    });
  }
}

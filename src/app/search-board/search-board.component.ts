import { Component } from '@angular/core';
import { CalendarComponent } from '../calendar/calendar.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-search-board',
  imports: [CalendarComponent, RouterLink],
  templateUrl: './search-board.component.html',
  styleUrl: './search-board.component.css',
})
export class SearchBoardComponent {}

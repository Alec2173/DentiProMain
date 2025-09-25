import { Component } from '@angular/core';
import { SearchBoardComponent } from '../search-board/search-board.component';
import { DisclaimerComponent } from '../disclaimer/disclaimer.component';
import { DescriptionComponent } from '../description/description.component';
import { CliniciComponent } from '../clinici/clinici.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-home',
  imports: [
    SearchBoardComponent,
    DisclaimerComponent,
    DescriptionComponent,
    CliniciComponent,
    HeaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RoCitiesService } from '../ro-cities.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-orase',
  imports: [FormsModule, DropdownModule],
  standalone: true,
  templateUrl: './orase.component.html',
  styleUrl: './orase.component.css',
})
export class OraseComponent {
  constructor(private roCitiesService: RoCitiesService) {}
  @Output() citySelected = new EventEmitter<string>();

  selectedCity: any = '';
  city: any = [];
  cityObjects: any = [];
  caca: any[] = [];
  ngOnInit(): void {
    this.city = this.roCitiesService.noRepeat();

    this.cityObjects = this.city.map((name: string, index: number) => ({
      id: index + 1,
      name: name,
    }));
  }
  onCityChange() {
    this.citySelected.emit(this.selectedCity.name);
  }
}

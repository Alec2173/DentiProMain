import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ServiciiService } from '../servicii.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-servicii',
  imports: [FormsModule, DropdownModule],
  templateUrl: './servicii.component.html',
  styleUrl: './servicii.component.css',
})
export class ServiciiComponent {
  constructor(private service: ServiciiService) {}
  @Output() citySelected = new EventEmitter<string>();

  selectedService: any = '';
  servicii: any = [];
  serviceObjects: any = [];
  caca: any[] = [];
  ngOnInit(): void {
    this.servicii = this.service.getServiciuName();

    this.serviceObjects = this.servicii.map((name: string, index: number) => ({
      id: index + 1,
      name: name,
    }));
  }
  onServiceChange() {
    this.citySelected.emit(this.selectedService.name);
  }
}

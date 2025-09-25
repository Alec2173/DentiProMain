import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OraseComponent } from '../orase/orase.component';
import { ServiciiComponent } from '../servicii/servicii.component';
import { DataShareService } from '../data-share.service';
@Component({
  selector: 'app-filter-nav',
  imports: [OraseComponent, ServiciiComponent],
  templateUrl: './filter-nav.component.html',
  styleUrl: './filter-nav.component.css',
})
export class FilterNavComponent implements OnInit {
  constructor(private serviceData: DataShareService) {}
  @Output() filterChange = new EventEmitter<any>();

  data: any = {
    oras: '',
  };

  ngOnInit(): void {}

  onSubmit() {
    console.log(this.data.oras);
    this.serviceData.setCity(this.data.oras);
  }
}

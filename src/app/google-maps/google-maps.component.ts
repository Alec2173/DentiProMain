import {
  Component,
  Output,
  EventEmitter,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
@Component({
  selector: 'app-google-maps',
  imports: [GoogleMapsModule],
  templateUrl: './google-maps.component.html',
  styleUrl: './google-maps.component.css',
})
export class GoogleMapsComponent implements AfterViewInit {
  @Output() locationSelected = new EventEmitter<google.maps.LatLngLiteral>();

  @ViewChild(GoogleMap) mapComponent!: GoogleMap;

  center: google.maps.LatLngLiteral = {
    lat: 45.79060444919348,
    lng: 24.84495491918869,
  };
  zoom: number = 6;
  markerPosition?: google.maps.LatLngLiteral;

  options: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: true,
  };

  ngAfterViewInit(): void {
    const input = document.getElementById('searchBox') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      this.markerPosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      this.center = this.markerPosition;
      this.zoom = 15;

      // folosește componenta Angular pentru a muta harta
      this.mapComponent.panTo(this.markerPosition);

      this.locationSelected.emit(this.markerPosition);
    });
  }

  clearSearch() {
    const input = document.getElementById('searchBox') as HTMLInputElement;
    if (input) input.value = '';
    this.markerPosition = undefined;
    this.center = { lat: 45.79060444919348, lng: 24.84495491918869 };
    this.zoom = 6;
    this.mapComponent.panTo(this.center);
  }

  placeMarker(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      this.locationSelected.emit(this.markerPosition);
    }
  }
}

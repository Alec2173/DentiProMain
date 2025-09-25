import { Component } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
@Component({
  selector: 'app-map-test',
  imports: [],
  templateUrl: './map-test.component.html',
  styleUrl: './map-test.component.css',
})
export class MapTestComponent {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=cwyGOMCDF8',
    center: [25, 45],
    zoom: 6,
  });
  marker = new maplibregl.Marker()
    .setLngLat([44.49050441163511, 26.084211524469154])
    .addTo(this.map);
}

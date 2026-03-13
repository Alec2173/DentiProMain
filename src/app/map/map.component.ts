import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  viewChild,
  signal,
  computed,
  inject,
} from '@angular/core';
import {
  Map,
  NavigationControl,
  ScaleControl,
  TerrainControl,
} from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, OnDestroy {
  mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapppp');

  loaded = signal(false);
  mapSignal = signal<Map | null>(null); // vei folosi această instanță peste tot

  ngOnInit() {
    const map = new Map({
      container: this.mapElement().nativeElement,
      style:
        'https://api.maptiler.com/maps/streets-v2/style.json?key=cwyGOMCDF8zwmBEDJrCr',
      center: [26, 44],
      zoom: 9,
    });

    this.mapSignal.set(map);

    map.addControl(
      new NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.addControl(new ScaleControl(), 'bottom-left');
    map.addControl(new TerrainControl({ source: 'terraindem' }), 'top-right');

    map.on('load', () => {
      this.loaded.set(true);
      map.resize();
      // Adaugă markerul aici!
      new maplibregl.Marker().setLngLat([0.11, 51.49]).addTo(map);
    });
  }
  ngOnDestroy(): void {
    this.mapSignal()?.remove();
  }
}

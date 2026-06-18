import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-drepturile-tale-gdpr',
  imports: [RouterLink],
  templateUrl: './drepturile-tale-gdpr.component.html',
  styleUrl: '../gdpr/gdpr.component.css',
})
export class DrepturileTaleGdprComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Drepturile tale GDPR | DentiPro',
      description: 'Cum îți exerciți drepturile GDPR față de DentiPro — acces, rectificare, ștergere, portabilitate și opoziție.',
      canonical: 'https://dentipro.ro/drepturile-tale-gdpr',
    });
  }
}

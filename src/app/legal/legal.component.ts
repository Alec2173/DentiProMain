import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css',
})
export class LegalComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Centrul Legal | DentiPro',
      description: 'Toate documentele legale DentiPro — termeni și condiții, GDPR, politica de cookie-uri, rambursare și disclaimer medical.',
      canonical: 'https://dentipro.ro/legal',
    });
  }
}

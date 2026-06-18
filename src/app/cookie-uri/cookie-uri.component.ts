import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-cookie-uri',
  imports: [RouterLink],
  templateUrl: './cookie-uri.component.html',
  styleUrl: '../gdpr/gdpr.component.css',
})
export class CookieUriComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Politica de Cookie-uri | DentiPro',
      description: 'Politica de utilizare a cookie-urilor pe platforma DentiPro — ce cookie-uri folosim și cum îți gestionezi consimțământul.',
      canonical: 'https://dentipro.ro/cookie-uri',
    });
  }
}

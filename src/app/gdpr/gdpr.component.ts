import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-gdpr',
  imports: [],
  templateUrl: './gdpr.component.html',
  styleUrl: './gdpr.component.css',
})
export class GDPRComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Politica de confidențialitate & GDPR | DentiPro',
      description: 'Politica de confidențialitate, cookie policy și termenii și condițiile platformei DentiPro — marketplace dentar din România.',
      canonical: 'https://dentipro.ro/GDPR',
    });
  }
}

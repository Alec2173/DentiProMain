import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-disclaimer-medical',
  imports: [RouterLink],
  templateUrl: './disclaimer-medical.component.html',
  styleUrl: '../gdpr/gdpr.component.css',
})
export class DisclaimerMedicalComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Disclaimer privind Răspunderea Medicală | DentiPro',
      description: 'DentiPro este o platformă software și director online — nu oferă consultații sau servicii medicale. Detalii despre limitele răspunderii.',
      canonical: 'https://dentipro.ro/disclaimer-medical',
    });
  }
}

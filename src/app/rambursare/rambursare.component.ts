import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-rambursare',
  imports: [RouterLink],
  templateUrl: './rambursare.component.html',
  styleUrl: '../gdpr/gdpr.component.css',
})
export class RambursareComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Politica de Rambursare | DentiPro',
      description: 'Politica de rambursare pentru abonamentele DentiPro — condiții, procedură și termene.',
      canonical: 'https://dentipro.ro/rambursare',
    });
  }
}

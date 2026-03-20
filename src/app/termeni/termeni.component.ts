import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-termeni',
  standalone: true,
  templateUrl: './termeni.component.html',
  styleUrl: './termeni.component.css',
})
export class TermeniComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({
      title: 'Termeni și Condiții | DentiPro',
      description: 'Termenii și condițiile de utilizare a platformei DentiPro.',
      canonical: 'https://dentipro.ro/termeni',
    });
  }
}

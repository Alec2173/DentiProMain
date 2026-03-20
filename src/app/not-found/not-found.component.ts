import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent implements OnInit {
  private seo = inject(SeoService);
  private metaService = inject(Meta);

  ngOnInit() {
    this.seo.set({
      title: 'Pagina nu a fost găsită (404) | DentiPro',
      description: 'Pagina căutată nu există. Întoarce-te la homepage sau caută o clinică dentară în orașul tău.',
    });
    this.metaService.updateTag({ name: 'robots', content: 'noindex, follow' });
  }
}

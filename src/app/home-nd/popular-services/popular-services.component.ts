import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface FeaturedService {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-popular-services',
  imports: [],
  templateUrl: './popular-services.component.html',
  styleUrl: './popular-services.component.css',
})
export class PopularServicesComponent {
  featured: FeaturedService[] = [
    { id: 'implanturi',  label: 'Implant dentar',          desc: 'Înlocuiește dinții lipsă cu soluții moderne și durabile pe termen lung.',       icon: 'dentistry' },
    { id: 'albire',     label: 'Albire dentară',           desc: 'Obține un zâmbet mai strălucitor prin proceduri sigure și eficiente.',           icon: 'sentiment_satisfied' },
    { id: 'detartraj',  label: 'Detartraj profesional',    desc: 'Curățare dentară aprofundată pentru sănătatea dinților și a gingiilor.',         icon: 'clean_hands' },
    { id: 'aparate',    label: 'Aparat dentar',            desc: 'Corectează alinierea dinților cu tratamente ortodontice personalizate.',          icon: 'straighten' },
    { id: 'endodontie', label: 'Tratament de canal',       desc: 'Endodonție modernă cu instrumente de precizie și anestezie eficientă.',          icon: 'medical_services' },
    { id: 'estetica',   label: 'Estetică dentară',         desc: 'Fațete, coroane și reconstrucții pentru un zâmbet perfect și natural.',          icon: 'auto_awesome' },
  ];

  constructor(private router: Router) {}

  navigate(serviceId: string) {
    this.router.navigate(['/finder'], { queryParams: { service: serviceId } });
  }
}

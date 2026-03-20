import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [],
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.css',
})
export class ServicesPageComponent implements OnInit {
  private seo = inject(SeoService);
  constructor(private router: Router) {}

  ngOnInit() {
    this.seo.set({
      title: 'Servicii stomatologice | DentiPro',
      description: 'Descoperă toate serviciile stomatologice disponibile în România — de la detartraj și albire la implanturi și ortodonție. Găsește clinici specializate pentru orice tratament dentar.',
      canonical: 'https://dentipro.ro/services',
    });
  }

  readonly services = [
    {
      id: 'detartraj',
      label: 'Detartraj',
      icon: 'fa-toothbrush',
      desc: 'Curățare profesională pentru îndepărtarea tartrului și a petelor de pe dinți.',
      color: 'blue',
    },
    {
      id: 'albire',
      label: 'Albire dentară',
      icon: 'fa-magic',
      desc: 'Tratamente profesionale pentru un zâmbet mai luminos cu mai multe nuanțe.',
      color: 'violet',
    },
    {
      id: 'obturatii',
      label: 'Obturații (plombe)',
      icon: 'fa-tooth',
      desc: 'Tratarea cariilor cu materiale estetice moderne, durabile și biocompatibile.',
      color: 'cyan',
    },
    {
      id: 'implanturi',
      label: 'Implanturi dentare',
      icon: 'fa-screwdriver',
      desc: 'Înlocuirea dinților lipsă cu implanturi din titan pentru un rezultat permanent.',
      color: 'blue',
    },
    {
      id: 'ortodontie',
      label: 'Ortodonție',
      icon: 'fa-teeth-open',
      desc: 'Corectarea aliniamentului dinților cu aparate fixe, mobile sau Invisalign.',
      color: 'violet',
    },
    {
      id: 'endodontie',
      label: 'Endodonție (canal)',
      icon: 'fa-teeth',
      desc: 'Tratamentul de canal pentru salvarea dinților cu infecții sau pulpă deteriorată.',
      color: 'red',
    },
    {
      id: 'chirurgie',
      label: 'Chirurgie orală',
      icon: 'fa-scalpel',
      desc: 'Extracții, rezecții, frenulectomii și alte intervenții chirurgicale dentare.',
      color: 'red',
    },
    {
      id: 'protetica',
      label: 'Protetică dentară',
      icon: 'fa-crown',
      desc: 'Coroane, punți și proteze pentru restaurarea funcționalității și esteticii.',
      color: 'amber',
    },
    {
      id: 'fatete',
      label: 'Fațete dentare',
      icon: 'fa-gem',
      desc: 'Fațete ceramice ultra-subțiri pentru corectarea culorii, formei și aliniamentului.',
      color: 'violet',
    },
    {
      id: 'estetica',
      label: 'Estetică dentară',
      icon: 'fa-star',
      desc: 'Zâmbete complet transformate prin combinarea mai multor tehnici estetice moderne.',
      color: 'amber',
    },
    {
      id: 'pedodontie',
      label: 'Stomatologie pediatrică',
      icon: 'fa-child',
      desc: 'Tratamente dentare specializate pentru copii, într-un mediu prietenos și sigur.',
      color: 'green',
    },
    {
      id: 'profilaxie',
      label: 'Profilaxie',
      icon: 'fa-shield-alt',
      desc: 'Periaj profesional, sigilări și fluorizare pentru prevenirea problemelor dentare.',
      color: 'green',
    },
    {
      id: 'radiologie',
      label: 'Radiologie dentară',
      icon: 'fa-x-ray',
      desc: 'Investigații radiologice digitale pentru diagnosticare precisă și rapidă.',
      color: 'blue',
    },
    {
      id: 'coronite',
      label: 'Coroane dentare',
      icon: 'fa-crown',
      desc: 'Coroane ceramice, zirconiu sau metalice pentru dinți deteriorați sau tratați.',
      color: 'amber',
    },
    {
      id: 'proteze',
      label: 'Proteze dentare',
      icon: 'fa-teeth',
      desc: 'Proteze totale sau parțiale pentru pacienții cu mai mulți dinți lipsă.',
      color: 'cyan',
    },
    {
      id: 'laser',
      label: 'Tratamente cu laser',
      icon: 'fa-bolt',
      desc: 'Proceduri minim-invazive cu laser pentru gingii, carii și albire accelerată.',
      color: 'violet',
    },
    {
      id: 'anxietate',
      label: 'Sedare pentru anxioși',
      icon: 'fa-spa',
      desc: 'Tratamente cu sedare conștientă pentru pacienții cu frică de dentist.',
      color: 'green',
    },
    {
      id: 'grefe',
      label: 'Grefe osoase',
      icon: 'fa-bone',
      desc: 'Regenerare osoasă pentru pregătirea amplasării implanturilor dentare.',
      color: 'red',
    },
    {
      id: 'sinuslift',
      label: 'Sinus lift',
      icon: 'fa-layer-group',
      desc: 'Procedură chirurgicală de mărire a sinusului maxilar pentru implantologie.',
      color: 'red',
    },
    {
      id: 'bruxism',
      label: 'Tratament bruxism',
      icon: 'fa-moon',
      desc: 'Gutiere și terapie pentru pacienții care strâng sau scrâșnesc dinții.',
      color: 'blue',
    },
    {
      id: 'analgesie',
      label: 'Anestezie fără ac',
      icon: 'fa-syringe',
      desc: 'Tehnici moderne de analgezie pentru un tratament complet fără durere.',
      color: 'cyan',
    },
    {
      id: 'dantura',
      label: 'Reconstrucție dentară',
      icon: 'fa-sync',
      desc: 'Transformarea completă a dentiției prin combinarea mai multor tratamente.',
      color: 'amber',
    },
    {
      id: 'aparate',
      label: 'Aparate dentare',
      icon: 'fa-band-aid',
      desc: 'Aparate fixe metalice, ceramice sau invizibile Invisalign/Clear Aligner.',
      color: 'violet',
    },
    {
      id: 'pediatrica',
      label: 'Pediatrie stomatologică',
      icon: 'fa-child-reaching',
      desc: 'Profilaxie, sigilări și tratamente pentru o dentiție sănătoasă de la copilărie.',
      color: 'green',
    },
    {
      id: 'digital',
      label: 'Consult digital',
      icon: 'fa-laptop-medical',
      desc: 'Evaluare online sau scanare 3D pentru planificarea tratamentului.',
      color: 'blue',
    },
    {
      id: 'altele',
      label: 'Alte servicii',
      icon: 'fa-plus-circle',
      desc: 'Caută clinici cu servicii specializate sau tratamente mai puțin frecvente.',
      color: 'cyan',
    },
  ];

  navigate(serviceId: string) {
    this.router.navigate(['/finder'], { queryParams: { service: serviceId } });
  }
}

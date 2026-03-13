import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoCitiesService } from '../ro-cities.service';
import { OraseComponent } from '../orase/orase.component';
import { ServiciiService } from '../servicii.service';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { ViewerComponent } from './viewer/viewer.component';
import { IphonePreviewComponent } from './iphone-preview/iphone-preview.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsComponent } from '../google-maps/google-maps.component';

@Component({
  selector: 'app-form',
  imports: [
    FormsModule,
    CommonModule,
    OraseComponent,
    RouterLink,
    ViewerComponent,
    IphonePreviewComponent,
    FormsModule,
    CommonModule,
    OraseComponent,
    RouterLink,
    ViewerComponent,
    IphonePreviewComponent,
    GoogleMapsComponent,
    GoogleMapsModule,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
})
export class FormComponent implements OnInit {
  constructor(
    private roCitiesService: RoCitiesService,
    private serviciiService: ServiciiService,
    private http: HttpClient,
    private router: Router
  ) {}
  isLoading: boolean = false;
  errorMessage = '';
  validMessage = '';
  showOtherService = false;
  otherService: string = '';
  additionalNotes: string = '';
  city: any = [];
  selectedCity: string = '';
  serviceObject: { id: string; label: string }[] = [];
  serviceName: string[] = [];
  logoName: string = '';
  formData: any = {
    name: '',
    phone: '',
    email: '',
    confirmEmail: '',
    selectedServices: [],
    city: '',
    logo: null,
    clinicImages: [],
    clientPhone: '',
    clientEmail: '',
    showPrices: null, // <=== adaugă
    managerPhone: '', // <=== adaugă
    additionalNotes: '', // <=== adaugă
    location: { lat: null, lng: null }, // <=== adaugă
    onWebAccepted: false,
    termsAccepted: false,
  };

  clicked: boolean = false;
  formInput: any = {
    nume: '',
    telefon: '',
    email: '',
    oras: '',
  };

  ngOnInit(): void {
    this.city = this.roCitiesService.getCities();
    this.serviceObject = this.serviciiService.getServices();
    this.serviceName = this.serviciiService.getServiciuName();
    console.log(this.clicked);
  }
  getTel(event: Event) {
    const { value } = event.target as HTMLInputElement;
    this.formInput.telefon = value;
  }
  getName(event: Event) {
    const { value } = event.target as HTMLInputElement;
    this.formInput.nume = value;
  }
  getEmail(event: Event) {
    const { value } = event.target as HTMLInputElement;
    this.formInput.email = value;
  }

  onClick() {
    this.clicked = true;
    console.log(this.clicked);
  }

  onSubmit() {
    this.errorMessage = '';
    this.validMessage = '';
    this.isLoading = true;

    const {
      name,
      phone,
      email,
      confirmEmail,
      selectedServices,
      city,
      clientPhone,
      clientEmail,
      showPrices,
      managerPhone,
      additionalNotes,
    } = this.formData;

    const { lat, lng } = this.formData.location;

    if (name.trim().length === 0) {
      this.errorMessage = 'Numele clinicii este obligatoriu.';
      this.isLoading = false;
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      this.errorMessage = 'Numărul de telefon este incorect.';
      this.isLoading = false;
      return;
    }

    if (!email) {
      this.errorMessage = 'Email-ul este obligatoriu.';
      this.isLoading = false;
      return;
    }

    if (email !== confirmEmail) {
      this.errorMessage = 'Email-urile nu se potrivesc.';
      this.isLoading = false;
      return;
    }

    if (!city) {
      this.errorMessage = 'Selectarea orașului este obligatorie.';
      this.isLoading = false;
      return;
    }

    if (this.formData.showPrices === null) {
      this.errorMessage =
        'Vă rugăm să selectați DA sau NU pentru afișarea prețurilor!';
      this.isLoading = false;
      return;
    }

    if (!/^\d{10}$/.test(managerPhone)) {
      this.errorMessage =
        'Numărul de telefon al managerului trebuie să conțină exact 10 cifre!';
      this.isLoading = false;
      return;
    }

    if (additionalNotes.length > 100) {
      this.errorMessage = 'Observațiile nu pot depăși 100 de caractere!';
      this.isLoading = false;
      return;
    }

    if (!lat || !lng) {
      this.errorMessage = 'Adăugați locația clinicii pe hartă!';
      this.isLoading = false;
      return;
    }

    if (!this.formData.termsAccepted || !this.formData.onWebAccepted) {
      this.errorMessage =
        'Trebuie să acceptați termenii și condițiile și să fiți de acord cu afișarea datelor.';
      this.isLoading = false;
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', name);
    formDataToSend.append('phone', phone);
    formDataToSend.append('email', email);
    formDataToSend.append('confirmEmail', confirmEmail);
    formDataToSend.append('city', city);
    formDataToSend.append('clientPhone', clientPhone);
    formDataToSend.append('clientEmail', clientEmail);
    formDataToSend.append('showPrices', showPrices);
    formDataToSend.append('managerPhone', managerPhone);
    formDataToSend.append('additionalNotes', additionalNotes);
    formDataToSend.append('latitude', lat?.toString() || '');
    formDataToSend.append('longitude', lng?.toString() || '');

    for (let s of selectedServices) {
      formDataToSend.append('selectedServices', s);
    }

    if (this.formData.logo) {
      formDataToSend.append('logo', this.formData.logo);
    }

    if (this.formData.clinicImages && this.formData.clinicImages.length > 0) {
      this.formData.clinicImages.forEach((img: File) => {
        formDataToSend.append('clinicImages', img);
      });
    }

    this.http
      .post('https://www.dentipro.ro/api/clinics', formDataToSend)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.validMessage = 'Formularul a fost trimis cu succes!';
        },
        error: (err) => {
          console.error('Eroare la trimitere:', err);
          this.errorMessage =
            'A apărut o eroare la trimiterea formularului. Vă rugăm să încercați mai târziu.';
          this.isLoading = false;
        },
      });
  }

  onServiceChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;

    if (!this.formData.selectedServices) {
      this.formData.selectedServices = [];
    }

    if (checked) {
      this.formData.selectedServices.push(value);
    } else {
      this.formData.selectedServices = this.formData.selectedServices.filter(
        (s: string) => s !== value
      );
    }
  }
  onLocationSelected(location: google.maps.LatLngLiteral) {
    this.formData.location = {
      lat: location.lat,
      lng: location.lng,
    };
  }

  onLogoUpload(event: Event) {
    const formInput = event.target as HTMLInputElement;
    if (formInput.files && formInput.files.length > 0) {
      this.formData.logo = formInput.files[0];

      this.logoName = this.formData.logo.name;
    }
  }

  onImagesUpload(event: Event) {
    const formInput = event.target as HTMLInputElement;
    if (formInput.files && formInput.files.length > 0) {
      this.formData.clinicImages = Array.from(formInput.files);
    }
  }
}

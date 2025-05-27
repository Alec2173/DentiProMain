import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoCitiesService } from '../ro-cities.service';
import { OraseComponent } from '../orase/orase.component';
import { ServiciiService } from '../servicii.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form',
  imports: [FormsModule, CommonModule, OraseComponent],
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
    onWebAccepted: false,
    termsAccepted: false,
  };

  ngOnInit(): void {
    this.city = this.roCitiesService.getCities();
    this.serviceObject = this.serviciiService.getServices();
    this.serviceName = this.serviciiService.getName();
  }

  onSubmit() {
    this.errorMessage = '';
    this.validMessage = '';
    setTimeout(() => {
      const {
        name,
        phone,
        email,
        confirmEmail,
        selectedServices,
        city,
        clientPhone,
        clientEmail,
      } = this.formData;
      console.log(
        'Cacacac' + this.formData.onWebAccepted + this.formData.termsAccepted
      );

      if (name.trim().length === 0) {
        this.errorMessage = 'Numele clinicii  este obligatoriu.';
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        this.errorMessage = 'Numărul de telefon  este incorect';
        return;
      }
      if (email === '') {
        this.errorMessage = 'Email-ul este obligatoriu.';
        return;
      }

      if (email !== confirmEmail) {
        this.errorMessage = 'Email-urile nu se potrivesc.';
        return;
      }

      if (!selectedServices || selectedServices.length === 0) {
        this.errorMessage = 'Trebuie să selectați cel puțin un serviciu.';
        return;
      }

      if (!city) {
        this.errorMessage = 'Selectarea orasului este obligatorie.';
        return;
      }
      if (!this.formData.termsAccepted || !this.formData.onWebAccepted) {
        this.errorMessage =
          'Trebuie să acceptați termenii și condițiile și să fiți de acord cu afișarea datelor.';
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
        .post('http://localhost:3000/clinics', formDataToSend)
        .subscribe({
          next: (res) => {
            console.log('Trimis cu succes:', res);
            this.validMessage = 'Formularul a fost trimis cu succes!';
          },
          error: (err) => {
            console.error('Eroare la trimitere:', err);
            this.errorMessage =
              'A apărut o eroare la trimiterea formularului. Va rugam incercati mai tarziu';
          },
        });
    }, 100);
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

  onLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData.logo = input.files[0];
      console.log('Logo:', this.formData.logo);
      this.logoName = this.formData.logo.name;
      console.log('Numele logo-ului:', this.logoName);
    }
  }

  onImagesUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData.clinicImages = Array.from(input.files);
      console.log('Imagini:', this.formData.clinicImages);
    }
  }
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  formName = '';
  formEmail = '';
  formMessage = '';
  formLoading = false;
  formSuccess = false;
  formError = '';

  constructor(public auth: AuthService, private http: HttpClient) {}

  submitForm() {
    if (!this.formEmail.trim() || !this.formMessage.trim()) {
      this.formError = 'Te rugăm să completezi emailul și mesajul.';
      return;
    }
    this.formLoading = true;
    this.formError = '';

    this.http.post(`${API}/support/message`, {
      message: this.formMessage.trim(),
      guestEmail: this.formEmail.trim(),
      guestName: this.formName.trim() || undefined,
    }).subscribe({
      next: () => {
        this.formSuccess = true;
        this.formLoading = false;
        this.formName = '';
        this.formEmail = '';
        this.formMessage = '';
      },
      error: (err) => {
        this.formError = err?.error?.error || 'Eroare la trimitere. Încearcă din nou.';
        this.formLoading = false;
      },
    });
  }
}

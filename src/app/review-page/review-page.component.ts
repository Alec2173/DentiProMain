import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './review-page.component.html',
  styleUrl: './review-page.component.css',
})
export class ReviewPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http  = inject(HttpClient);

  loading = true;
  error = '';
  submitted = false;
  submitting = false;
  submitError = '';

  token = '';
  clinicName = '';
  clinicId = 0;
  patientName = '';
  slotDate = '';
  slotTime = '';

  rating = 0;
  hoverRating = 0;
  reviewText = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) { this.error = 'Link invalid.'; this.loading = false; return; }

    this.http.get<any>(`${API}/reviews/by-token/${this.token}`).subscribe({
      next: (data) => {
        this.clinicName  = data.clinicName;
        this.clinicId    = data.clinicId;
        this.patientName = data.patientName;
        this.slotDate    = data.slotDate;
        this.slotTime    = data.slotTime;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Link invalid sau expirat.';
        this.loading = false;
      },
    });
  }

  setRating(r: number) { this.rating = r; }
  setHover(r: number)  { this.hoverRating = r; }
  clearHover()         { this.hoverRating = 0; }

  get displayRating(): number { return this.hoverRating || this.rating; }

  get ratingLabel(): string {
    const labels = ['', 'Foarte slab', 'Slab', 'Mediu', 'Bun', 'Excelent'];
    return labels[this.displayRating] || '';
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  submit() {
    if (!this.rating) { this.submitError = 'Selectează un număr de stele.'; return; }
    if (!this.reviewText.trim() || this.reviewText.trim().length < 10) {
      this.submitError = 'Recenzia trebuie să aibă minim 10 caractere.'; return;
    }
    this.submitting = true;
    this.submitError = '';
    this.http.post(`${API}/reviews/by-token`, {
      token: this.token,
      rating: this.rating,
      text: this.reviewText.trim(),
    }).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: (err) => {
        this.submitError = err?.error?.error || 'A apărut o eroare. Încearcă din nou.';
        this.submitting = false;
      },
    });
  }
}

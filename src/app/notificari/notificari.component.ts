import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../auth.service';
import { SeoService } from '../seo.service';

const API = '/api';

const NOTIF_META: Record<string, { icon: string; color: string }> = {
  appointment_created    : { icon: 'fa-calendar-plus',   color: '#60a5fa' },
  appointment_confirmed  : { icon: 'fa-calendar-check',  color: '#4ade80' },
  appointment_cancelled  : { icon: 'fa-calendar-times',  color: '#f87171' },
  appointment_completed  : { icon: 'fa-calendar-day',    color: '#a78bfa' },
  appointment_reminder   : { icon: 'fa-bell',            color: '#fbbf24' },
  review_request         : { icon: 'fa-star',            color: '#fb923c' },
  reward_earned          : { icon: 'fa-gift',            color: '#fbbf24' },
  profile_incomplete     : { icon: 'fa-user-edit',       color: '#94a3b8' },
  clinic_reactivation    : { icon: 'fa-heartbeat',       color: '#f472b6' },
  new_post               : { icon: 'fa-comment-medical', color: '#38bdf8' },
  new_booking            : { icon: 'fa-calendar-alt',   color: '#60a5fa' },
};

@Component({
  selector: 'app-notificari',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './notificari.component.html',
  styleUrl: './notificari.component.css',
})
export class NotificariComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);

  notifications: any[] = [];
  loading = true;
  markingAll = false;

  filter: 'all' | 'unread' | 'appointments' | 'rewards' = 'all';

  private isClinic = false;

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  get filtered(): any[] {
    switch (this.filter) {
      case 'unread':       return this.notifications.filter(n => !n.read_at);
      case 'appointments': return this.notifications.filter(n => n.type?.startsWith('appointment'));
      case 'rewards':      return this.notifications.filter(n => n.type === 'reward_earned');
      default:             return this.notifications;
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read_at).length;
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/']); return; }
    this.isClinic = this.auth.isClinic;
    this.seo.set({ title: 'Notificările mele | DentiPro', description: 'Toate notificările tale DentiPro — programări, recompense, recenzii.' });
    this.load();
  }

  load() {
    this.loading = true;
    const url = this.isClinic
      ? `${API}/notifications`
      : `${API}/patient/notifications?limit=50`;
    this.http.get<any[]>(url, { headers: this.headers }).subscribe({
      next: (data) => { this.notifications = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  markRead(n: any) {
    if (n.read_at) return;
    const url = this.isClinic
      ? `${API}/notifications/${n.id}/read`
      : `${API}/patient/notifications/${n.id}/read`;
    this.http.patch(url, {}, { headers: this.headers }).subscribe();
    n.read_at = new Date().toISOString();
    if (n.link) this.router.navigate([n.link]);
  }

  markAllRead() {
    this.markingAll = true;
    const url = this.isClinic
      ? `${API}/notifications/read-all`
      : `${API}/patient/notifications/read-all`;
    this.http.patch(url, {}, { headers: this.headers }).subscribe({
      next: () => {
        this.notifications.forEach(n => { if (!n.read_at) n.read_at = new Date().toISOString(); });
        this.markingAll = false;
      },
      error: () => { this.markingAll = false; },
    });
  }

  meta(type: string) {
    return NOTIF_META[type] ?? { icon: 'fa-bell', color: '#94a3b8' };
  }
}

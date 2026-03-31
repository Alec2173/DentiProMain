import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-clinic-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './clinic-navbar.component.html',
  styleUrl: './clinic-navbar.component.css',
})
export class ClinicNavbarComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  userMenuOpen = false;

  // ── Notificări ──────────────────────────────────────────────
  notifOpen = false;
  notifications: any[] = [];
  unreadCount = 0;
  notifLoading = false;
  private pollInterval: any;

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private router: Router,
  ) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  ngOnInit() {
    if (this.authService.isClinic) {
      this.fetchUnreadCount();
      this.pollInterval = setInterval(() => this.fetchUnreadCount(), 30000);
    }
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  private fetchUnreadCount() {
    if (!this.authService.isClinic) return;
    this.http.get<{ count: number }>(`${API}/notifications/unread-count`, { headers: this.headers })
      .subscribe({ next: (r) => { this.unreadCount = r.count; }, error: () => {} });
  }

  toggleNotif(event: Event) {
    event.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.userMenuOpen = false;
    if (this.notifOpen) this.loadNotifications();
  }

  private loadNotifications() {
    this.notifLoading = true;
    this.http.get<any[]>(`${API}/notifications`, { headers: this.headers }).subscribe({
      next: (list) => {
        this.notifications = list;
        this.notifLoading = false;
        // Marchează toate ca citite
        if (this.unreadCount > 0) {
          this.http.patch(`${API}/notifications/read-all`, {}, { headers: this.headers })
            .subscribe({ next: () => { this.unreadCount = 0; }, error: () => {} });
        }
      },
      error: () => { this.notifLoading = false; },
    });
  }

  goNotif(notif: any) {
    notif.read_at = notif.read_at || new Date().toISOString();
    this.notifOpen = false;
    this.router.navigateByUrl(notif.link || '/feed');
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'acum';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}z`;
  }

  // ── User menu ───────────────────────────────────────────────
  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    this.notifOpen = false;
  }

  logout() {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  getInitials(): string {
    return (this.authService.currentUser?.name ?? '')
      .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const t = e.target as HTMLElement;
    if (!t.closest('.cn-user-area')) this.userMenuOpen = false;
    if (!t.closest('.cn-notif-wrap')) this.notifOpen = false;
  }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-support-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './support-widget.component.html',
  styleUrl: './support-widget.component.css',
})
export class SupportWidgetComponent implements OnInit {
  isOpen = false;
  message = '';
  guestEmail = '';
  sending = false;
  sent = false;
  history: any[] = [];
  loadingHistory = false;
  unreadReplies = 0;

  // Thread activ (follow-up)
  activeThreadId: number | null = null;
  followUp = '';
  sendingFollowUp = false;

  constructor(public auth: AuthService, private http: HttpClient) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    if (this.auth.isClinic) {
      this.loadHistory();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.auth.isClinic) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loadingHistory = true;
    this.http.get<any[]>(`${API}/support/messages`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.history = data;
        this.unreadReplies = data.filter(m =>
          !m.reply_seen && m.replies?.some((r: any) => r.sender === 'admin')
        ).length;
        this.loadingHistory = false;
      },
      error: () => { this.loadingHistory = false; },
    });
  }

  get canSend(): boolean {
    if (!this.message.trim()) return false;
    if (!this.auth.isClinic && !this.guestEmail.trim()) return false;
    return true;
  }

  send() {
    if (!this.canSend || this.sending) return;
    this.sending = true;
    const body: any = { message: this.message.trim() };
    if (!this.auth.isClinic) body.guestEmail = this.guestEmail.trim();
    const options = this.auth.isClinic ? { headers: this.headers } : {};
    this.http.post(`${API}/support/message`, body, options).subscribe({
      next: () => {
        this.sending = false;
        this.sent = true;
        this.message = '';
        if (this.auth.isClinic) this.loadHistory();
      },
      error: () => { this.sending = false; },
    });
  }

  sendFollowUp(thread: any) {
    if (!this.followUp.trim() || this.sendingFollowUp) return;
    this.sendingFollowUp = true;
    this.http.post(`${API}/support/messages/${thread.id}/reply`, { message: this.followUp.trim() }, { headers: this.headers }).subscribe({
      next: () => {
        if (!thread.replies) thread.replies = [];
        thread.replies.push({ sender: 'clinic', body: this.followUp.trim(), created_at: new Date().toISOString() });
        this.followUp = '';
        this.sendingFollowUp = false;
        this.sent = false;
      },
      error: () => { this.sendingFollowUp = false; },
    });
  }

  hasUnseenAdminReply(m: any): boolean {
    return !m.reply_seen && m.replies?.some((r: any) => r.sender === 'admin');
  }

  toggleThread(id: number) {
    this.activeThreadId = this.activeThreadId === id ? null : id;
    this.followUp = '';
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}

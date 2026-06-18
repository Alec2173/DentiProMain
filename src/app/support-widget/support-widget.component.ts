import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

const API = '/api';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

@Component({
  selector: 'app-support-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './support-widget.component.html',
  styleUrl: './support-widget.component.css',
})
export class SupportWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  isOpen = false;
  unreadReplies = 0;

  // ── BOT MODE ─────────────────────────────────────────────
  mode: 'bot' | 'human' | 'human-form' | 'human-sent' = 'bot';
  botMessages: ChatMessage[] = [];
  userInput = '';
  botTyping = false;
  showEscalateBtn = false;
  escalateClicks = 0;

  // ── HUMAN MODE (existent) ─────────────────────────────────
  guestEmail = '';
  humanMessage = '';
  sendingHuman = false;
  history: any[] = [];
  loadingHistory = false;
  activeThreadId: number | null = null;
  followUp = '';
  sendingFollowUp = false;

  private shouldScroll = false;

  constructor(public auth: AuthService, private http: HttpClient) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    if (this.auth.isClinic) this.loadHistory();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try { this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.auth.isClinic) this.loadHistory();
      if (this.botMessages.length === 0) this.sendBotGreeting();
    }
  }

  // ── BOT ──────────────────────────────────────────────────

  private sendBotGreeting() {
    const greeting = this.auth.isClinic
      ? `Salut! 👋 Sunt asistentul DentiPro. Cum te pot ajuta astăzi? Poți întreba despre planuri, funcționalități sau orice altceva legat de platformă.`
      : `Salut! 👋 Sunt asistentul virtual DentiPro. Te pot ajuta cu întrebări despre programări, clinici, prețuri sau cum funcționează platforma. Ce te interesează?`;

    this.botMessages = [{
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }];
    this.shouldScroll = true;
  }

  get canSendBot(): boolean {
    return this.userInput.trim().length > 0 && !this.botTyping;
  }

  sendBotMessage() {
    const text = this.userInput.trim();
    if (!text || this.botTyping) return;

    this.botMessages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.botTyping = true;
    this.shouldScroll = true;

    const apiMessages = this.botMessages
      .filter(m => m.role !== 'system' && !m.isTyping)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    this.http.post<{ reply: string; shouldEscalate: boolean }>(`${API}/support/bot`, {
      messages: apiMessages,
    }).subscribe({
      next: (res) => {
        this.botTyping = false;
        this.botMessages.push({
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
        });
        if (res.shouldEscalate || this.escalateClicks >= 1) {
          this.showEscalateBtn = true;
        }
        this.shouldScroll = true;
      },
      error: () => {
        this.botTyping = false;
        this.botMessages.push({
          role: 'assistant',
          content: 'Am întâmpinat o problemă. Poți folosi butonul "Vorbește cu echipa" pentru asistență directă.',
          timestamp: new Date(),
        });
        this.showEscalateBtn = true;
        this.shouldScroll = true;
      },
    });
  }

  onBotKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendBotMessage();
    }
  }

  escalateToHuman() {
    this.escalateClicks++;
    this.mode = 'human-form';
    // Pre-populează mesajul cu rezumatul conversației
    if (this.botMessages.length > 1) {
      const summary = this.botMessages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' / ');
      this.humanMessage = `[Continuat din chat bot] ${summary.slice(0, 300)}`;
    }
  }

  // ── HUMAN MODE ──────────────────────────────────────────

  loadHistory() {
    this.loadingHistory = true;
    this.http.get<any[]>(`${API}/support/messages`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.history = data;
        this.unreadReplies = data.filter(m =>
          !m.reply_seen && m.replies?.some((r: any) => r.sender === 'admin')
        ).length;
        this.loadingHistory = false;
        if (data.length > 0) this.mode = 'human';
      },
      error: () => { this.loadingHistory = false; },
    });
  }

  get canSendHuman(): boolean {
    if (!this.humanMessage.trim()) return false;
    if (!this.auth.isClinic && !this.guestEmail.trim()) return false;
    return true;
  }

  sendHumanMessage() {
    if (!this.canSendHuman || this.sendingHuman) return;
    this.sendingHuman = true;
    const body: any = { message: this.humanMessage.trim() };
    if (!this.auth.isClinic) body.guestEmail = this.guestEmail.trim();
    const options = this.auth.isClinic ? { headers: this.headers } : {};
    this.http.post(`${API}/support/message`, body, options).subscribe({
      next: () => {
        this.sendingHuman = false;
        this.mode = 'human-sent';
        this.humanMessage = '';
        if (this.auth.isClinic) this.loadHistory();
      },
      error: () => { this.sendingHuman = false; },
    });
  }

  sendFollowUp(thread: any) {
    if (!this.followUp.trim() || this.sendingFollowUp) return;
    this.sendingFollowUp = true;
    this.http.post(`${API}/support/messages/${thread.id}/reply`,
      { message: this.followUp.trim() }, { headers: this.headers }
    ).subscribe({
      next: () => {
        if (!thread.replies) thread.replies = [];
        thread.replies.push({ sender: 'clinic', body: this.followUp.trim(), created_at: new Date().toISOString() });
        this.followUp = '';
        this.sendingFollowUp = false;
      },
      error: () => { this.sendingFollowUp = false; },
    });
  }

  toggleThread(id: number) {
    this.activeThreadId = this.activeThreadId === id ? null : id;
    this.followUp = '';
  }

  hasUnseenAdminReply(m: any): boolean {
    return !m.reply_seen && m.replies?.some((r: any) => r.sender === 'admin');
  }

  backToBot() {
    this.mode = 'bot';
    this.showEscalateBtn = false;
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }
}

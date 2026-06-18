import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LegalTab = 'termeni' | 'gdpr';

@Component({
  selector: 'app-legal-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal-modal.component.html',
  styleUrl: './legal-modal.component.css',
})
export class LegalModalComponent implements OnInit, OnDestroy {
  @Input() initialTab: LegalTab = 'termeni';
  @Output() closed = new EventEmitter<void>();

  activeTab: LegalTab = 'termeni';

  ngOnInit() {
    this.activeTab = this.initialTab;
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  close() {
    this.closed.emit();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('lm-overlay')) {
      this.close();
    }
  }
}

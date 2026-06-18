import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ToastService, Toast } from '../toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of (toastService.toasts | async); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon material-symbols-outlined">
            @switch (toast.type) {
              @case ('success') { check_circle }
              @case ('error') { error }
              @case ('warning') { warning }
              @default { info }
            }
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" aria-label="Închide">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.4;
      color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
      backdrop-filter: blur(12px);
      cursor: pointer;
      pointer-events: all;
      animation: toast-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      border: 1px solid rgba(255,255,255,0.1);
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    .toast--success { background: rgba(5, 150, 105, 0.92); }
    .toast--error   { background: rgba(185, 28, 28, 0.92); }
    .toast--warning { background: rgba(180, 120, 10, 0.92); }
    .toast--info    { background: rgba(29, 78, 216, 0.92); }

    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
      font-variation-settings: 'FILL' 1;
    }

    .toast-msg { flex: 1; }

    .toast-close {
      all: unset;
      display: flex;
      align-items: center;
      opacity: 0.65;
      cursor: pointer;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }
    .toast-close .material-symbols-outlined { font-size: 16px; }

    @media (max-width: 480px) {
      .toast-container { left: 16px; right: 16px; bottom: 16px; max-width: none; }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}

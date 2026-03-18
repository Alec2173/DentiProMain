import { Component, Input, Output, EventEmitter, DoCheck, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-iphone-preview',
  imports: [],
  templateUrl: './iphone-preview.component.html',
  styleUrl: './iphone-preview.component.css',
})
export class IphonePreviewComponent implements DoCheck, OnDestroy {
  @Input() transferData: any;
  @Input() dataForImage: any;
  @Output() closeViewer = new EventEmitter<void>();

  logoUrl = '';
  private _lastLogoFile: File | null = null;

  ngDoCheck() {
    const file = this.dataForImage?.logo;
    if (file !== this._lastLogoFile) {
      if (this.logoUrl) URL.revokeObjectURL(this.logoUrl);
      this.logoUrl = file ? URL.createObjectURL(file) : '';
      this._lastLogoFile = file;
    }
  }

  ngOnDestroy() {
    if (this.logoUrl) URL.revokeObjectURL(this.logoUrl);
  }

  onClose() {
    this.closeViewer.emit();
  }
}

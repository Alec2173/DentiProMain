import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-iphone-preview',
  imports: [],
  templateUrl: './iphone-preview.component.html',
  styleUrl: './iphone-preview.component.css',
})
export class IphonePreviewComponent {
  @Input() transferData: any;
  @Input() dataForImage: any;
  @Output() closeViewer = new EventEmitter<void>();
  onClose() {
    this.closeViewer.emit();
  }
  logoToUrl(file: File) {
    return file ? URL.createObjectURL(file) : '';
  }
  imageToUrl(file: File) {
    return file ? URL.createObjectURL(file) : '';
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-viewer',
  imports: [CommonModule],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.css',
})
export class ViewerComponent {
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

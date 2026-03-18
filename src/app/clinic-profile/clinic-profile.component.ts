import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClinicDataService, Clinic } from '../clinic-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clinic-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clinic-profile.component.html',
  styleUrl: './clinic-profile.component.css',
})
export class ClinicProfileComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;

  clinic: Clinic | null = null;
  clinicImages: string[] = [];
  activeImageIndex = 0;
  isLoading = true;

  editingField: string | null = null;
  editValue = '';

  editingGallery = false;
  newImagePreviews: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private clinicService: ClinicDataService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.clinicService.loadClinicsAuto().subscribe({
      next: (clinics: Clinic[]) => {
        this.clinic = clinics.find((c) => c.id === id) || null;
        if (!this.clinic) { this.isLoading = false; return; }
        try {
          this.clinicImages =
            typeof this.clinic.clinic_images === 'string'
              ? JSON.parse(this.clinic.clinic_images as any)
              : this.clinic.clinic_images ?? [];
        } catch {
          this.clinicImages = [];
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  startEdit(field: string, value: string) {
    this.editingField = field;
    this.editValue = value ?? '';
  }

  saveEdit() {
    if (!this.clinic || !this.editingField) return;
    const field = this.editingField;
    const value = this.editValue;
    (this.clinic as any)[field] = value;
    this.editingField = null;
    this.editValue = '';
    this.clinicService.updateClinic(this.clinic.id, { [field]: value } as Partial<Clinic>).subscribe({
      error: (err) => console.error('Eroare la salvare:', err),
    });
  }

  cancelEdit() {
    this.editingField = null;
    this.editValue = '';
  }

  get servicesArray(): string[] {
    if (!this.clinic?.services) return [];
    return this.clinic.services.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // --- Logo ---
  triggerLogoInput() {
    this.logoInput.nativeElement.click();
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0] || !this.clinic) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.clinic!.logo_path = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  // --- Gallery ---
  openGalleryEdit() {
    this.editingGallery = true;
  }

  closeGalleryEdit() {
    this.editingGallery = false;
    this.newImagePreviews = [];
  }

  triggerGalleryInput() {
    this.galleryInput.nativeElement.click();
  }

  onGalleryFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newImagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeExistingImage(index: number) {
    this.clinicImages.splice(index, 1);
    if (this.activeImageIndex >= this.clinicImages.length) {
      this.activeImageIndex = Math.max(0, this.clinicImages.length - 1);
    }
  }

  removeNewPreview(index: number) {
    this.newImagePreviews.splice(index, 1);
  }

  saveGallery() {
    this.clinicImages = [...this.clinicImages, ...this.newImagePreviews];
    if (this.activeImageIndex >= this.clinicImages.length) {
      this.activeImageIndex = 0;
    }
    if (this.clinic) {
      this.clinicService.updateClinic(this.clinic.id, {
        clinic_images: JSON.stringify(this.clinicImages) as any,
      }).subscribe({
        error: (err) => console.error('Eroare la salvare galerie:', err),
      });
    }
    this.closeGalleryEdit();
  }
}

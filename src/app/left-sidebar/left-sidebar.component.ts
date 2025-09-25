import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OraseComponent } from '../orase/orase.component';

@Component({
  selector: 'app-left-sidebar',
  imports: [CommonModule, RouterModule, OraseComponent],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.css',
})
export class LeftSidebarComponent {
  isLeftSidebarCollapsed = signal<boolean>(false);
  @HostListener('window:resize')
  onResize() {
    this.isLeftSidebarCollapsed.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.isLeftSidebarCollapsed.set(window.innerWidth < 768);
  }

  // 🔹 Toggle manual la click pe buton
  toggleSidebar(): void {
    this.isLeftSidebarCollapsed.set(!this.isLeftSidebarCollapsed());
  }

  toggleCollapse() {
    this.isLeftSidebarCollapsed.update((c) => !c);
  }

  closeSidenav() {
    this.isLeftSidebarCollapsed.set(true);
  }

  items = [
    {
      routeLink: '',
      icon: 'fal fa-home',
      label: 'Acasa',
    },
    {
      routeLink: 'Inscriere',
      icon: 'fa-solid fa-plus',
      label: 'Inscrie clinica',
    },
    {
      routeLink: 'finder',
      icon: 'fa-solid fa-magnifying-glass',
      label: 'Cauta',
    },
  ];
}

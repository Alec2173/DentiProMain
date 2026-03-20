import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../auth.service';
import { SeoService } from '../seo.service';
import { ServiciiService } from '../servicii.service';

const API = 'https://www.dentipro.ro/api';

export interface FeedPost {
  id: number;
  patient_name: string;
  patient_user_id?: number;
  title: string;
  description: string;
  services: string[];
  images?: string[];
  image_count: number;
  budget_max: number | null;
  city: string;
  status: 'open' | 'closed';
  offers_count: number;
  created_at: string;
}

export interface PostOffer {
  id: number;
  clinic_id: number;
  clinic_name: string;
  logo_url: string | null;
  clinic_city: string;
  plan: string;
  message: string;
  price_estimate: number | null;
  created_at: string;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent implements OnInit {
  private seo = inject(SeoService);

  // Feed
  posts: FeedPost[] = [];
  loading = true;
  hasMore = true;
  loadingMore = false;
  filterCity = '';
  appliedCity = '';

  // My posts tab (patient)
  tab: 'all' | 'mine' = 'all';
  myPosts: FeedPost[] = [];
  myPostsLoading = false;
  myPostsLoaded = false;

  // ── CREATE MODAL ─────────────────────────────────────────
  showCreate = false;
  createTitle = '';
  createDescription = '';
  createCity = '';
  createBudget = '';
  createSelectedServices: Set<string> = new Set();
  createImages: string[] = [];
  createLoading = false;
  createError = '';
  allServices: { id: string; label: string }[] = [];

  // ── VIEW POST MODAL ──────────────────────────────────────
  showPost = false;
  activePost: FeedPost | null = null;
  postLoading = false;
  postOffers: PostOffer[] = [];
  offersLoading = false;

  // Offer form (clinic)
  offerMessage = '';
  offerPrice = '';
  offerLoading = false;
  offerError = '';
  offerSuccess = false;
  alreadyOffered = false;
  existingOffer: { message: string; price_estimate: number | null } | null = null;

  // Image viewer
  viewerImages: string[] = [];
  viewerIndex = 0;
  showViewer = false;

  constructor(public auth: AuthService, private http: HttpClient, private serviciiSvc: ServiciiService) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    this.seo.set({
      title: 'Cereri de tratament | DentiPro',
      description: 'Postează-ți nevoile dentare și primește oferte de la clinici. Sau, dacă ești o clinică, descoperă pacienți care au nevoie de tratamentul tău.',
      canonical: 'https://dentipro.ro/feed',
    });
    this.allServices = this.serviciiSvc.getServices();
    this.loadFeed();
  }

  // ── FEED ─────────────────────────────────────────────────

  loadFeed(reset = true) {
    if (reset) {
      this.posts = [];
      this.loading = true;
      this.hasMore = true;
    } else {
      this.loadingMore = true;
    }

    const offset = reset ? 0 : this.posts.length;
    const cityParam = this.appliedCity ? `&city=${encodeURIComponent(this.appliedCity)}` : '';

    this.http.get<FeedPost[]>(`${API}/feed?limit=20&offset=${offset}${cityParam}`).subscribe({
      next: (data) => {
        if (reset) {
          this.posts = data;
        } else {
          this.posts.push(...data);
        }
        this.hasMore = data.length === 20;
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  applyFilter() {
    this.appliedCity = this.filterCity.trim();
    this.loadFeed(true);
  }

  clearFilter() {
    this.filterCity = '';
    this.appliedCity = '';
    this.loadFeed(true);
  }

  loadMore() {
    if (this.loadingMore || !this.hasMore) return;
    this.loadFeed(false);
  }

  // ── MY POSTS ─────────────────────────────────────────────

  switchTab(t: 'all' | 'mine') {
    this.tab = t;
    if (t === 'mine' && !this.myPostsLoaded) {
      this.loadMyPosts();
    }
  }

  loadMyPosts() {
    this.myPostsLoading = true;
    this.http.get<FeedPost[]>(`${API}/feed/mine`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.myPosts = data;
        this.myPostsLoading = false;
        this.myPostsLoaded = true;
      },
      error: () => { this.myPostsLoading = false; }
    });
  }

  toggleMyPostStatus(post: FeedPost) {
    const newStatus = post.status === 'open' ? 'closed' : 'open';
    this.http.patch(`${API}/feed/${post.id}/status`, { status: newStatus }, { headers: this.headers }).subscribe({
      next: () => {
        post.status = newStatus;
      }
    });
  }

  deleteMyPost(post: FeedPost) {
    if (!confirm('Ești sigur că vrei să ștergi această cerere?')) return;
    this.http.delete(`${API}/feed/${post.id}`, { headers: this.headers }).subscribe({
      next: () => {
        this.myPosts = this.myPosts.filter(p => p.id !== post.id);
        this.posts = this.posts.filter(p => p.id !== post.id);
      }
    });
  }

  // ── CREATE POST ───────────────────────────────────────────

  openCreate() {
    this.createTitle = '';
    this.createDescription = '';
    this.createCity = '';
    this.createBudget = '';
    this.createSelectedServices = new Set();
    this.createImages = [];
    this.createError = '';
    this.showCreate = true;
  }

  closeCreate() {
    this.showCreate = false;
  }

  toggleCreateService(id: string) {
    if (this.createSelectedServices.has(id)) {
      this.createSelectedServices.delete(id);
    } else {
      this.createSelectedServices.add(id);
    }
  }

  isServiceSelected(id: string): boolean {
    return this.createSelectedServices.has(id);
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      if (this.createImages.length >= 4) return;
      if (file.size > 3 * 1024 * 1024) {
        this.createError = 'Imaginile trebuie să fie mai mici de 3MB fiecare.';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.createImages.length < 4) {
          this.createImages.push(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeCreateImage(i: number) {
    this.createImages.splice(i, 1);
  }

  submitCreate() {
    if (!this.createTitle.trim()) { this.createError = 'Adaugă un titlu cererii.'; return; }
    if (this.createSelectedServices.size === 0) { this.createError = 'Selectează cel puțin un serviciu.'; return; }
    this.createError = '';
    this.createLoading = true;

    const body = {
      title: this.createTitle.trim(),
      description: this.createDescription.trim(),
      city: this.createCity.trim(),
      budget_max: this.createBudget ? Number(this.createBudget) : null,
      services: Array.from(this.createSelectedServices),
      images: this.createImages,
    };

    this.http.post<FeedPost>(`${API}/feed`, body, { headers: this.headers }).subscribe({
      next: (post) => {
        this.createLoading = false;
        this.closeCreate();
        this.loadFeed(true);
        if (this.myPostsLoaded) {
          this.myPostsLoaded = false;
        }
        // Switch to mine tab after creating
        this.tab = 'mine';
        this.loadMyPosts();
      },
      error: (err) => {
        this.createError = err.error?.error || 'Eroare la publicare.';
        this.createLoading = false;
      }
    });
  }

  // ── VIEW POST ─────────────────────────────────────────────

  openPost(postSummary: FeedPost) {
    this.showPost = true;
    this.activePost = null;
    this.postLoading = true;
    this.postOffers = [];
    this.offerMessage = '';
    this.offerPrice = '';
    this.offerError = '';
    this.offerSuccess = false;
    this.alreadyOffered = false;
    this.existingOffer = null;

    // Load full post (with images)
    this.http.get<FeedPost>(`${API}/feed/${postSummary.id}`).subscribe({
      next: (post) => {
        this.activePost = post;
        this.postLoading = false;
        if (this.auth.isLoggedIn) {
          this.loadOffers(post.id);
        }
      },
      error: () => { this.postLoading = false; }
    });
  }

  closePost() {
    this.showPost = false;
    this.activePost = null;
    this.showViewer = false;
  }

  loadOffers(postId: number) {
    this.offersLoading = true;
    this.http.get<any[]>(`${API}/feed/${postId}/offers`, { headers: this.headers }).subscribe({
      next: (offers) => {
        this.offersLoading = false;
        if (this.auth.isClinic) {
          if (offers.length > 0) {
            this.alreadyOffered = true;
            this.existingOffer = { message: offers[0].message, price_estimate: offers[0].price_estimate };
          }
        } else {
          this.postOffers = offers;
        }
      },
      error: () => { this.offersLoading = false; }
    });
  }

  sendOffer() {
    if (!this.offerMessage.trim()) { this.offerError = 'Mesajul este obligatoriu.'; return; }
    this.offerError = '';
    this.offerLoading = true;

    const body = {
      message: this.offerMessage.trim(),
      price_estimate: this.offerPrice ? Number(this.offerPrice) : null,
    };

    this.http.post(`${API}/feed/${this.activePost!.id}/offers`, body, { headers: this.headers }).subscribe({
      next: () => {
        this.offerLoading = false;
        this.offerSuccess = true;
        this.alreadyOffered = true;
        this.existingOffer = { message: this.offerMessage.trim(), price_estimate: body.price_estimate };
        if (this.activePost) this.activePost.offers_count++;
        // Update feed count
        const fp = this.posts.find(p => p.id === this.activePost?.id);
        if (fp) fp.offers_count++;
      },
      error: (err) => {
        this.offerError = err.error?.error || 'Eroare la trimitere.';
        this.offerLoading = false;
        if (err.status === 409) this.alreadyOffered = true;
      }
    });
  }

  // ── IMAGE VIEWER ──────────────────────────────────────────

  openViewer(images: string[], index: number) {
    this.viewerImages = images;
    this.viewerIndex = index;
    this.showViewer = true;
  }

  closeViewer() {
    this.showViewer = false;
  }

  prevImage() {
    this.viewerIndex = (this.viewerIndex - 1 + this.viewerImages.length) % this.viewerImages.length;
  }

  nextImage() {
    this.viewerIndex = (this.viewerIndex + 1) % this.viewerImages.length;
  }

  // ── HELPERS ───────────────────────────────────────────────

  serviceLabel(id: string): string {
    return this.allServices.find(s => s.id === id)?.label ?? id;
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'acum';
    if (m < 60) return `acum ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `acum ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `acum ${d} zile`;
    return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  }

  isOwnPost(post: FeedPost): boolean {
    return this.auth.isPatient && String(post.patient_user_id) === String(this.auth.currentUser?.id);
  }
}

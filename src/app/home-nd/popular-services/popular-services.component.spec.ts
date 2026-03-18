import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularServicesComponent } from './popular-services.component';

describe('PopularServicesComponent', () => {
  let component: PopularServicesComponent;
  let fixture: ComponentFixture<PopularServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

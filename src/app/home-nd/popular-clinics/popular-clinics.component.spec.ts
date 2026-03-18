import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularClinicsComponent } from './popular-clinics.component';

describe('PopularClinicsComponent', () => {
  let component: PopularClinicsComponent;
  let fixture: ComponentFixture<PopularClinicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularClinicsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularClinicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

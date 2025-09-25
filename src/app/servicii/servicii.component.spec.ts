import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciiComponent } from './servicii.component';

describe('ServiciiComponent', () => {
  let component: ServiciiComponent;
  let fixture: ComponentFixture<ServiciiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

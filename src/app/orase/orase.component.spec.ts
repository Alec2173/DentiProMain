import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OraseComponent } from './orase.component';

describe('OraseComponent', () => {
  let component: OraseComponent;
  let fixture: ComponentFixture<OraseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OraseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OraseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTextComponent } from './mobile-text.component';

describe('MobileTextComponent', () => {
  let component: MobileTextComponent;
  let fixture: ComponentFixture<MobileTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliniciComponent } from './clinici.component';

describe('CliniciComponent', () => {
  let component: CliniciComponent;
  let fixture: ComponentFixture<CliniciComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliniciComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CliniciComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptonPageComponent } from './descripton-page.component';

describe('DescriptonPageComponent', () => {
  let component: DescriptonPageComponent;
  let fixture: ComponentFixture<DescriptonPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescriptonPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

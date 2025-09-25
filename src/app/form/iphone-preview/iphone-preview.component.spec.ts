import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IphonePreviewComponent } from './iphone-preview.component';

describe('IphonePreviewComponent', () => {
  let component: IphonePreviewComponent;
  let fixture: ComponentFixture<IphonePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IphonePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IphonePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

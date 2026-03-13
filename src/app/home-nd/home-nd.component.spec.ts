import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeNdComponent } from './home-nd.component';

describe('HomeNdComponent', () => {
  let component: HomeNdComponent;
  let fixture: ComponentFixture<HomeNdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeNdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeNdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

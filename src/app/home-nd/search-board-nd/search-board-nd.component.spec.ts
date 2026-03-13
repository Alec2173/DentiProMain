import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBoardNdComponent } from './search-board-nd.component';

describe('SearchBoardNdComponent', () => {
  let component: SearchBoardNdComponent;
  let fixture: ComponentFixture<SearchBoardNdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBoardNdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchBoardNdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ServiciiService } from './servicii.service';

describe('ServiciiService', () => {
  let service: ServiciiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiciiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

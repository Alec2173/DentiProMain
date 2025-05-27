import { TestBed } from '@angular/core/testing';

import { ClinicDataService } from './clinic-data.service';

describe('ClinicDataService', () => {
  let service: ClinicDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClinicDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

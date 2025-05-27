import { TestBed } from '@angular/core/testing';

import { RoCitiesService } from './ro-cities.service';

describe('RoCitiesService', () => {
  let service: RoCitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoCitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

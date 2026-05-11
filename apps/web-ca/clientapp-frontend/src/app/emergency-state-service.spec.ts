import { TestBed } from '@angular/core/testing';

import { EmergencyStateService } from './emergency-state-service';

describe('EmergencyStateService', () => {
  let service: EmergencyStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmergencyStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InstructionMenuService, Measure, Plan } from './instruction-menu.service';
import { environment } from '../../environments/environment';

describe('InstructionMenuService - Tag Persistence and Handling', () => {
  let service: InstructionMenuService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        InstructionMenuService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InstructionMenuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    localStorage.clear();
  });

  it('toTitleCase converts strings correctly', () => {
    expect(service.toTitleCase('reanimation')).toBe('Reanimation');
    expect(service.toTitleCase('REANIMATION')).toBe('Reanimation');
    expect(service.toTitleCase('  atmung  ')).toBe('Atmung');
    expect(service.toTitleCase('kReIsLaUf')).toBe('Kreislauf');
    expect(service.toTitleCase('')).toBe('');
  });

  it('normalizeTags filters invalid characters, enforces max length and deduplicates', () => {
    const raw = ['reanimation', 'Reanimation', 'herz123', 'a'.repeat(51), 'Validtag', 'blutung!', '  atmung  '];
    const normalized = service.normalizeTags(raw);

    expect(normalized).toEqual(['Reanimation', 'Validtag', 'Atmung']);
  });

  it('getAllKnownTags aggregates existing tags and returns TitleCase sorted list', () => {
    service.fetchInitialData();
    const reqMeasures = httpMock.expectOne(`${environment.apiUrl}/Measures`);
    reqMeasures.flush([]);
    const reqPlans = httpMock.expectOne(`${environment.apiUrl}/Plans`);
    reqPlans.flush([]);

    const known = service.getAllKnownTags();
    expect(known).toContain('Reanimation');
    expect(known).toContain('Atmung');
    expect(known).toContain('Blutung');
    expect(known).toContain('Kreislauf');
    expect(known).toContain('Trauma');
  });

  it('createMeasure sends normalized tags to API and caches in localStorage', () => {
    const tags = ['reanimation', 'herz'];
    let createdMeasure: Measure | undefined;

    service.createMeasure('Test Measure', 'Description', undefined, tags).subscribe(m => {
      createdMeasure = m;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Measures`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tags).toEqual(['Reanimation', 'Herz']);

    req.flush({
      id: 99,
      name: 'Test Measure',
      description: 'Description',
      tags: ['Reanimation', 'Herz']
    });

    expect(createdMeasure).toBeDefined();
    expect(createdMeasure?.tags).toEqual(['Reanimation', 'Herz']);

    const cached = JSON.parse(localStorage.getItem('rg_measure_tags') || '{}');
    expect(cached[99]).toEqual(['Reanimation', 'Herz']);
  });

  it('createPlan sends normalized tags to API and caches in localStorage', () => {
    const tags = ['notfall', 'kreislauf'];
    let createdPlan: Plan | undefined;

    service.createPlan('Test Plan', [], tags).subscribe(p => {
      createdPlan = p;
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Plans`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tags).toEqual(['Notfall', 'Kreislauf']);

    req.flush({
      id: 88,
      name: 'Test Plan',
      tags: ['Notfall', 'Kreislauf'],
      measures: []
    });

    expect(createdPlan).toBeDefined();
    expect(createdPlan?.tags).toEqual(['Notfall', 'Kreislauf']);

    const cached = JSON.parse(localStorage.getItem('rg_plan_tags') || '{}');
    expect(cached[88]).toEqual(['Notfall', 'Kreislauf']);
  });
});

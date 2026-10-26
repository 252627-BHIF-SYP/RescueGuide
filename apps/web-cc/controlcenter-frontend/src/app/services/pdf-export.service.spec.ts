import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PdfExportService } from './pdf-export.service';
import { EmergencyProtocol } from './emergency.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  const mockProtocol: EmergencyProtocol = {
    id: 42,
    emergencyId: 105,
    type: 'Verkehrsunfall',
    callerName: 'Erika Musterfrau',
    callerType: 'Zeuge',
    callbackNumber: '+43 664 1234567',
    address: 'Kärntner Straße 5, 1010 Wien',
    injuredCount: 3,
    description: 'Kollision zweier PKW an Kreuzung, Airbags ausgelöst',
    dispatcherName: 'Disponent Leitstelle 1',
    date: '2026-10-26',
    time: '16:45',
    alarmedRD: true,
    alarmedNA: true,
    alarmedPol: true,
    alarmedFW: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), PdfExportService],
    });
    service = TestBed.inject(PdfExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate PDF without throwing errors (Issue 97)', async () => {
    await expectAsync(
      service.exportProtocol(mockProtocol, {
        emergencyId: 105,
        startedAt: '2026-10-26T16:40:00Z',
        endedAt: '2026-10-26T17:15:00Z',
        status: 'Beendet',
      }),
    ).toBeResolved();
  });

  it('should handle empty or minimal protocol gracefully', async () => {
    const minimalProtocol: EmergencyProtocol = {
      type: '',
      callerName: '',
      callerType: '',
      callbackNumber: '',
      address: '',
      injuredCount: '',
      description: '',
      dispatcherName: '',
      date: '',
      time: '',
      alarmedRD: false,
      alarmedNA: false,
      alarmedPol: false,
      alarmedFW: false,
    };

    await expectAsync(service.exportProtocol(minimalProtocol)).toBeResolved();
  });
});

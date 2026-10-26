import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EmergencyChecklist } from './emergency-checklist';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { EmergencyProtocol } from '../services/emergency.service';

describe('EmergencyChecklist', () => {
  let component: EmergencyChecklist;
  let fixture: ComponentFixture<EmergencyChecklist>;

  const mockProtocol: EmergencyProtocol = {
    id: 1,
    emergencyId: 101,
    type: 'Medizinischer Notfall',
    callerName: 'Max Mustermann',
    callerType: 'Ersthelfer',
    callbackNumber: '+43 123 456789',
    address: 'Hauptstraße 12, 1010 Wien',
    injuredCount: 2,
    description: 'Person gestürzt, bewusstlos',
    dispatcherName: 'Disponent Alpha',
    date: '2026-10-26',
    time: '14:30',
    alarmedRD: true,
    alarmedNA: false,
    alarmedPol: false,
    alarmedFW: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyChecklist],
      providers: [provideZonelessChangeDetection(), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergencyChecklist);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('emergencyData', { ...mockProtocol });
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly detect filled fields (Issue 134)', () => {
    expect(component.isFilled('type')).toBeTrue();
    expect(component.isFilled('address')).toBeTrue();
    expect(component.isFilled('injuredCount')).toBeTrue();
    expect(component.isFilled('alarms')).toBeTrue();
    expect(component.isFilled('callerName')).toBeTrue();
    expect(component.isFilled('callbackNumber')).toBeTrue();
    expect(component.isFilled('description')).toBeTrue();

    // Check filled count
    expect(component.filledFieldsCount).toBe(7);
    expect(component.progressPercent).toBe(100);
  });

  it('should detect empty fields correctly (Issue 134)', () => {
    const emptyProtocol: EmergencyProtocol = {
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
    fixture.componentRef.setInput('emergencyData', emptyProtocol);
    fixture.detectChanges();

    expect(component.isFilled('type')).toBeFalse();
    expect(component.isFilled('address')).toBeFalse();
    expect(component.isFilled('injuredCount')).toBeFalse();
    expect(component.isFilled('alarms')).toBeFalse();
    expect(component.isFilled('callerName')).toBeFalse();
    expect(component.filledFieldsCount).toBe(0);
    expect(component.progressPercent).toBe(0);
  });

  it('should toggle alarmed units and count them', () => {
    expect(component.alarmedUnitsCount).toBe(1);

    component.toggleAlarm('NA');
    expect(component.emergencyData().alarmedNA).toBeTrue();
    expect(component.alarmedUnitsCount).toBe(2);

    component.toggleAlarm('NA');
    expect(component.emergencyData().alarmedNA).toBeFalse();
    expect(component.alarmedUnitsCount).toBe(1);
  });

  it('should render injured count on the left panel and alarms on the right panel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const leftPanel = compiled.querySelector('.form-card-panel.left-panel');
    const rightPanel = compiled.querySelector('.form-card-panel.right-panel');
    expect(leftPanel).toBeTruthy();
    expect(rightPanel).toBeTruthy();

    // Verify injuredCount input is inside left panel
    const injuredInput = leftPanel?.querySelector('#injuredCount');
    expect(injuredInput).toBeTruthy();

    // Verify alarm section is inside right panel
    const alarmSection = rightPanel?.querySelector('.alarm-section');
    expect(alarmSection).toBeTruthy();
  });
});

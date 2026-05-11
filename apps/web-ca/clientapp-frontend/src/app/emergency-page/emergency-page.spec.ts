import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyPage } from './emergency-page';

describe('EmergencyPage', () => {
  let component: EmergencyPage;
  let fixture: ComponentFixture<EmergencyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gps } from './gps';

describe('Gps', () => {
  let component: Gps;
  let fixture: ComponentFixture<Gps>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gps]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gps);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

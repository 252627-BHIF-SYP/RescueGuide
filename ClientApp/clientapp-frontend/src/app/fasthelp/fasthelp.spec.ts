import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fasthelp } from './fasthelp';

describe('Fasthelp', () => {
  let component: Fasthelp;
  let fixture: ComponentFixture<Fasthelp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fasthelp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fasthelp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

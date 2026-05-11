import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectingComponent } from './connecting-component';

describe('ConnectingComponent', () => {
  let component: ConnectingComponent;
  let fixture: ComponentFixture<ConnectingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

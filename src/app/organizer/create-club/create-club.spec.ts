import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateClub } from './create-club';

describe('CreateClub', () => {
  let component: CreateClub;
  let fixture: ComponentFixture<CreateClub>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateClub]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateClub);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

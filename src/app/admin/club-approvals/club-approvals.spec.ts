import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubApprovals } from './club-approvals';

describe('ClubApprovals', () => {
  let component: ClubApprovals;
  let fixture: ComponentFixture<ClubApprovals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubApprovals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubApprovals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

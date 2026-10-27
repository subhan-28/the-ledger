import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpendChart } from './spend-chart';

describe('SpendChart', () => {
  let component: SpendChart;
  let fixture: ComponentFixture<SpendChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SpendChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

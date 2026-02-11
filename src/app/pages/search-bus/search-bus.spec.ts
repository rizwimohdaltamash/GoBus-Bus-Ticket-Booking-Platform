import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBus } from './search-bus';

describe('SearchBus', () => {
  let component: SearchBus;
  let fixture: ComponentFixture<SearchBus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchBus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

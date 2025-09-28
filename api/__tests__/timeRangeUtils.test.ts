import { rangesOverlap, TimeRange } from '../src/utils/timeRangeUtils';

describe('rangesOverlap', () => {
  it('should detect overlapping ranges', () => {
    const a: TimeRange = { start: new Date('2023-01-01T10:00:00'), end: new Date('2023-01-01T12:00:00') };
    const b: TimeRange = { start: new Date('2023-01-01T11:00:00'), end: new Date('2023-01-01T13:00:00') };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  it('should detect non-overlapping ranges', () => {
    const a: TimeRange = { start: new Date('2023-01-01T10:00:00'), end: new Date('2023-01-01T11:00:00') };
    const b: TimeRange = { start: new Date('2023-01-01T11:00:00'), end: new Date('2023-01-01T12:00:00') };
    expect(rangesOverlap(a, b)).toBe(false);
  });

  it('should detect touching ranges as non-overlapping', () => {
    const a: TimeRange = { start: new Date('2023-01-01T10:00:00'), end: new Date('2023-01-01T11:00:00') };
    const b: TimeRange = { start: new Date('2023-01-01T11:00:00'), end: new Date('2023-01-01T12:00:00') };
    expect(rangesOverlap(a, b)).toBe(false);
  });

  it('should detect fully contained ranges as overlapping', () => {
    const a: TimeRange = { start: new Date('2023-01-01T10:00:00'), end: new Date('2023-01-01T14:00:00') };
    const b: TimeRange = { start: new Date('2023-01-01T11:00:00'), end: new Date('2023-01-01T12:00:00') };
    expect(rangesOverlap(a, b)).toBe(true);
  });
});

import { formatDepartment, formatPriority } from '../../../utils/complaintFormatters';

describe('formatDepartment', () => {
  it('returns General for null/undefined', () => {
    expect(formatDepartment(null as any)).toBe('General');
    expect(formatDepartment(undefined as any)).toBe('General');
  });

  it('formats road-related departments', () => {
    expect(formatDepartment('Road Maintenance')).toBe('Roads');
    expect(formatDepartment('road')).toBe('Roads');
  });

  it('formats drain-related departments', () => {
    expect(formatDepartment('Drainage')).toBe('Drainage');
    expect(formatDepartment('drain')).toBe('Drainage');
  });

  it('formats garbage-related departments', () => {
    expect(formatDepartment('Garbage Collection')).toBe('Garbage');
    expect(formatDepartment('sanitary')).toBe('Garbage');
  });

  it('formats water-related departments', () => {
    expect(formatDepartment('Water Department')).toBe('Water');
  });

  it('formats electricity-related departments', () => {
    expect(formatDepartment('Electricity')).toBe('Electricity');
    expect(formatDepartment('elect')).toBe('Electricity');
  });

  it('returns General for unknown departments', () => {
    expect(formatDepartment('Unknown Department')).toBe('General');
  });
});

describe('formatPriority', () => {
  it('returns Low for null/undefined', () => {
    expect(formatPriority(null as any)).toBe('Low');
    expect(formatPriority(undefined as any)).toBe('Low');
  });

  it('formats critical priorities', () => {
    expect(formatPriority('critical')).toBe('Critical');
    expect(formatPriority('urgent')).toBe('Critical');
    expect(formatPriority('emergency')).toBe('Critical');
  });

  it('formats high priorities', () => {
    expect(formatPriority('high')).toBe('High');
  });

  it('formats medium priorities', () => {
    expect(formatPriority('medium')).toBe('Medium');
    expect(formatPriority('med')).toBe('Medium');
  });

  it('returns Low for unknown priorities', () => {
    expect(formatPriority('unknown')).toBe('Low');
  });
});

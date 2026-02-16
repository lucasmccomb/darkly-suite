import { shouldBeDark } from '../scheduler';

// We need to mock Date to control currentHour
const RealDate = Date;

function mockDate(hour: number) {
  const mockNow = new RealDate(2026, 1, 16, hour, 30, 0); // Feb 16, 2026 at HH:30
  jest.spyOn(globalThis, 'Date').mockImplementation(
    (...args: ConstructorParameters<typeof Date>) => {
      if (args.length === 0) return mockNow;
      // @ts-expect-error: spreading constructor args
      return new RealDate(...args);
    },
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('shouldBeDark', () => {
  describe('same-day range (startHour <= endHour)', () => {
    // e.g., dark from 08:00 to 18:00
    it('returns true when current hour is within range', () => {
      mockDate(12); // noon
      expect(shouldBeDark(8, 18)).toBe(true);
    });

    it('returns true at exactly start hour', () => {
      mockDate(8);
      expect(shouldBeDark(8, 18)).toBe(true);
    });

    it('returns false at exactly end hour', () => {
      mockDate(18);
      expect(shouldBeDark(8, 18)).toBe(false);
    });

    it('returns false when before start hour', () => {
      mockDate(6);
      expect(shouldBeDark(8, 18)).toBe(false);
    });

    it('returns false when after end hour', () => {
      mockDate(20);
      expect(shouldBeDark(8, 18)).toBe(false);
    });
  });

  describe('midnight-wrapping range (startHour > endHour)', () => {
    // e.g., dark from 20:00 to 07:00 (default schedule)
    it('returns true when current hour is after start', () => {
      mockDate(22); // 10 PM
      expect(shouldBeDark(20, 7)).toBe(true);
    });

    it('returns true at exactly start hour', () => {
      mockDate(20);
      expect(shouldBeDark(20, 7)).toBe(true);
    });

    it('returns true at midnight', () => {
      mockDate(0);
      expect(shouldBeDark(20, 7)).toBe(true);
    });

    it('returns true when before end hour (after midnight)', () => {
      mockDate(5);
      expect(shouldBeDark(20, 7)).toBe(true);
    });

    it('returns false at exactly end hour', () => {
      mockDate(7);
      expect(shouldBeDark(20, 7)).toBe(false);
    });

    it('returns false during daytime', () => {
      mockDate(12);
      expect(shouldBeDark(20, 7)).toBe(false);
    });

    it('returns false just before start', () => {
      mockDate(19);
      expect(shouldBeDark(20, 7)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles start == end (should always be false for same-day logic)', () => {
      mockDate(12);
      // When startHour === endHour, the range is empty
      expect(shouldBeDark(12, 12)).toBe(false);
    });

    it('handles 0-24 boundary hours', () => {
      mockDate(23);
      expect(shouldBeDark(22, 6)).toBe(true);
    });

    it('handles 0 start hour', () => {
      mockDate(2);
      expect(shouldBeDark(0, 6)).toBe(true);
    });
  });
});

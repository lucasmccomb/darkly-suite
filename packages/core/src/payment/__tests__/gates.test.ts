import { canUseFeature } from '../gates';

describe('canUseFeature', () => {
  it('returns true when user has Pro status', () => {
    expect(canUseFeature('presets', true)).toBe(true);
expect(canUseFeature('sunrise-sunset', true)).toBe(true);
    expect(canUseFeature('custom-accent', true)).toBe(true);
  });

  it('returns false when user does not have Pro status', () => {
    expect(canUseFeature('presets', false)).toBe(false);
expect(canUseFeature('sunrise-sunset', false)).toBe(false);
    expect(canUseFeature('custom-accent', false)).toBe(false);
  });

  it('returns false for unknown features when not Pro', () => {
    expect(canUseFeature('some-unknown-feature', false)).toBe(false);
  });

  it('returns true for unknown features when Pro', () => {
    expect(canUseFeature('some-unknown-feature', true)).toBe(true);
  });
});

import { faker } from '@faker-js/faker';

faker.seed(42);

export { faker };

const AVATAR_COLORS = [
  '#1a73e8',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#ff6d01',
  '#46bdc6',
  '#9334e6',
  '#e91e63',
];

/**
 * Returns a consistent color for a given name, suitable for avatar backgrounds.
 * The same name always returns the same color (deterministic hash).
 */
export function generateAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Returns the initials (first letter of first and last name) for an avatar.
 */
export function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

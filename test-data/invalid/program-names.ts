/** Curated invalid program names — fixed sets for validation cases, not Faker. */
export const INVALID_PROGRAM_NAMES = {
  empty: '',
  whitespaceOnly: '   ',
  overMaxLength: 'A'.repeat(256),
  xssPayload: "<script>alert('xss')</script>",
} as const;

import { faker } from '@faker-js/faker';

export type ProgramInput = {
  name: string;
  description: string;
};

/** Happy-path program payload. Each call yields a unique name for parallel runs. */
export function buildProgram(
  overrides: Partial<ProgramInput> = {},
): ProgramInput {
  return {
    name: `${faker.company.buzzNoun()} Program ${faker.string.alphanumeric(6)}`,
    description: faker.lorem.sentence(),
    ...overrides,
  };
}

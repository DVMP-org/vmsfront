import commercial from "./commercial.json";
import hospitality from "./hospitality.json";
import mixedUse from "./mixed_use.json";
import residential from "./residential.json";
import {
  domainExperienceSchema,
  type DomainExperience,
  type DomainUseCase,
} from "./schema";

const definitions = {
  residential,
  commercial,
  hospitality,
  mixed_use: mixedUse,
} as const;

export const domainExperiences: Record<DomainUseCase, DomainExperience> =
  Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => [
      key,
      domainExperienceSchema.parse(definition),
    ]),
  ) as Record<DomainUseCase, DomainExperience>;

export function domainExperience(
  useCase: string | null | undefined,
): DomainExperience | null {
  if (
    useCase === "residential" ||
    useCase === "commercial" ||
    useCase === "hospitality" ||
    useCase === "mixed_use"
  ) {
    return domainExperiences[useCase];
  }
  return null;
}

export type { DomainExperience, DomainUseCase };

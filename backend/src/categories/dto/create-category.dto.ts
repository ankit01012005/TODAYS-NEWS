import { IsString, Matches, MaxLength, MinLength } from "class-validator";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, { message: "slug must be lowercase letters, numbers and hyphens only" })
  slug!: string;
}

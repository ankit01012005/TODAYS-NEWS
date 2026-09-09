import { IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

/// The address is a permanent public promise once first published (BR-15) —
/// the editor sets it explicitly rather than it being derived silently.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateArticleDto {
  @IsString()
  @MaxLength(200)
  @Matches(SLUG_PATTERN, { message: "slug must be lowercase letters, numbers and hyphens only" })
  slug!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  bylineOverride?: string;
}

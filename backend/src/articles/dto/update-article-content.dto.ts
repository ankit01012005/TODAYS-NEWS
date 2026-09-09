import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

/// T2/T8 — save. Every field is optional (a partial update); `version` is
/// mandatory so the write can be checked against optimistic concurrency
/// (P2-23). Body's full block-schema validation happens in the service
/// (body.util.ts) — see the disclosed-gap note there.
export class UpdateArticleContentDto {
  @IsInt()
  @Min(0)
  version!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  headline?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  summary?: string;

  @IsOptional()
  @IsArray()
  body?: unknown[];

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsUUID()
  featuredImageId?: string;

  @IsOptional()
  @IsString()
  featuredImageAlt?: string;

  @IsOptional()
  @IsString()
  featuredImageCredit?: string;

  @IsOptional()
  @IsString()
  featuredImageCaption?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  bylineOverride?: string;
}

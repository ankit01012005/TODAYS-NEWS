import { IsInt, IsString, Min, MinLength } from "class-validator";

/// BR-07 — non-empty comment required.
export class RequestChangesDto {
  @IsInt()
  @Min(0)
  version!: number;

  @IsString()
  @MinLength(1)
  comment!: string;
}

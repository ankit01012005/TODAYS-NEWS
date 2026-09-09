import { IsInt, IsString, Min, MinLength } from "class-validator";

/// BR-08 — non-empty reason required.
export class RejectDto {
  @IsInt()
  @Min(0)
  version!: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}

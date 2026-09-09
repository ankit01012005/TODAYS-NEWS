import { IsInt, IsString, Min, MinLength } from "class-validator";

/// T12's "Requires" column (docs/11 §4): a reason.
export class UnpublishDto {
  @IsInt()
  @Min(0)
  version!: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}

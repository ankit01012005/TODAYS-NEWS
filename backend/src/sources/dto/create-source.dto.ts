import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /// Where the source lives online — http(s) only. Empty string clears it.
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;
}

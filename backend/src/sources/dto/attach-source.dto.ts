import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

/// `version` is the open revision's version as the editor last saw it —
/// mandatory, same as saving (docs/27 A3).
export class AttachSourceDto {
  @IsInt()
  @Min(0)
  version!: number;

  @IsUUID()
  sourceId!: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

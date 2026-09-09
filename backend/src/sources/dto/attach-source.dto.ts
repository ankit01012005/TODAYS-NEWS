import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class AttachSourceDto {
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

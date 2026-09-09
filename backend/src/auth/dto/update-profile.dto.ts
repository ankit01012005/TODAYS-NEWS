import { IsOptional, IsString, MinLength } from "class-validator";

/// docs/09 E-10 / docs/12 PG-EDT-10 — an editor may change their own
/// display name and password; changing the password requires the current
/// one. That cross-field rule is enforced in the service, not here — the
/// same convention as every other cross-field rule in this codebase.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  newPassword?: string;
}

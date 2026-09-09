import { IsString, MinLength } from "class-validator";

/// Shared by accept-invitation and reset-password — both are "spend a
/// single-use token to set a password" (docs/23 §11.3: same mechanism).
export class SetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

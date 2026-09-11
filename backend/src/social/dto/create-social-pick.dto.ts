import { IsEnum, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { SocialPlatform } from "@prisma/client";

/// One hand-picked post. `url` is re-checked in the service against the
/// same http(s)-only allow-list body links use; this just enforces shape.
export class CreateSocialPickDto {
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  /// "@handle" — letters, digits, dots and underscores, as the platforms
  /// themselves allow; the leading @ is optional on input, stored with it.
  @IsString()
  @Matches(/^@?[A-Za-z0-9._]{1,64}$/, { message: "accountHandle must look like @handle" })
  accountHandle!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  headline!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  url!: string;
}

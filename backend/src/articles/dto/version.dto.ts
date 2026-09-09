import { IsInt, Min } from "class-validator";

/// Shared by every transition that needs no text of its own — submit,
/// withdraw, approve, reopen, restore. Optimistic concurrency (P2-23): the
/// caller asserts the version they last saw.
export class VersionDto {
  @IsInt()
  @Min(0)
  version!: number;
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { InviteUserDto } from "./dto/invite-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { RequireCapability } from "../common/decorators/require-capability.decorator";
import { StaffUserView } from "./staff-user.view";

@Controller("users")
@RequireCapability("user:manage")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  invite(
    @Body() dto: InviteUserDto,
  ): Promise<{ user: StaffUserView; invitationToken: string }> {
    return this.users.invite(dto.email, dto.displayName, dto.role);
  }

  @Get()
  list(): Promise<StaffUserView[]> {
    return this.users.list();
  }

  @Patch(":id/role")
  changeRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ): Promise<StaffUserView> {
    return this.users.changeRole(id, dto.role);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id", ParseUUIDPipe) id: string): Promise<StaffUserView> {
    return this.users.deactivate(id);
  }

  @Patch(":id/reactivate")
  reactivate(@Param("id", ParseUUIDPipe) id: string): Promise<StaffUserView> {
    return this.users.reactivate(id);
  }
}

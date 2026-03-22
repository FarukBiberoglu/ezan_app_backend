import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UserSettingsService } from '../service/user-settings.service';


@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('location')
  updateLocation(
    @GetUser() user: { userId: string },
    @Body() dto: UpdateLocationDto,
  ) {
    return this.userSettingsService.updateLocation(
      user.userId,
      dto.latitude,
      dto.longitude,
    );
  }
}
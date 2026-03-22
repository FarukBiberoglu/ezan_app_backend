import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UserSettingsService } from './service/user-settins.service';


@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('location')
  updateLocation(
    @GetUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.userSettingsService.updateLocation(
      userId,
      dto.latitude,
      dto.longitude,
    );
  }
}
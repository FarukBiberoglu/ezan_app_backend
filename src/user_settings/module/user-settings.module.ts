import { Module } from '@nestjs/common';
import { UserSettingsService } from '../service/user-settings.service';
import { UserSettingsController } from '../controller/user-settings.controller';


@Module({
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
})
export class UserSettingsModule {}
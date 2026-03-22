import { Module } from '@nestjs/common';
import { UserSettingsService } from './user-settins.service';
import { UserSettingsController } from './user-settings.controller';


@Module({
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
})
export class UserSettingsModule {}
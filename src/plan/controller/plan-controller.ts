import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { PlanService } from '../service/plan-service';
import { CreatePlanDto } from '../dto/create-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  createPlan(@GetUser() user: { userId: string }, @Body() dto: CreatePlanDto) {
    return this.planService.createPlan(user.userId, dto);
  }

  @Get()
  getPlans(@GetUser() user: { userId: string }) {
    return this.planService.getPlans(user.userId);
  }

  @Get(':id')
  getPlan(@Param('id') id: string) {
    return this.planService.getPlanById(id);
  }

  @Patch('day/:id')
  toggleDay(@Param('id') id: string) {
    return this.planService.toggleDay(id);
  }

  @Get('day/:id/verses')
  getDayVerses(@Param('id') id: string) {
    return this.planService.getPlanDayVerses(id);
  }
}

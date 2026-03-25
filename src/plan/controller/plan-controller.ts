import {
  Body,
  Controller,
  Delete,
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
import { UpdatePlanDto } from '../dto/update-plan.dto';

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
  getPlan(@GetUser() user: { userId: string }, @Param('id') id: string) {
    return this.planService.getPlanById(id, user.userId);
  }

  @Patch('day/:id')
  toggleDay(@Param('id') id: string) {
    return this.planService.toggleDay(id);
  }

  @Get('day/:id/verses')
  getDayVerses(@GetUser() user: { userId: string }, @Param('id') id: string) {
    return this.planService.getPlanDayVerses(id, user.userId);
  }

  @Delete(':id')
  deletePlan(@GetUser() user: { userId: string }, @Param('id') id: string) {
    return this.planService.deletePlan(id, user.userId);
  }

  @Patch(':id')
  updatePlan(
    @GetUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.planService.updatePlan(id, user.userId, dto);
  }

  @Patch(':id/active')
  setActivePlan(@GetUser() user: { userId: string }, @Param('id') id: string) {
    return this.planService.setActivePlan(id, user.userId);
  }
}

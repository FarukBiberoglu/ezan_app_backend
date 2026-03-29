import { IsDateString } from 'class-validator';

export class CreatePlanDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

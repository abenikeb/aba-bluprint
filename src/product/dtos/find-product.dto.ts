import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class FindProductParamDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id: number;
}

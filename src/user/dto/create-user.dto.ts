import { MinLength } from 'class-validator';

export class CreateUserDto {
  @MinLength(3)
  name?: string;
  provider?: string;
  provider_id?: string;
}

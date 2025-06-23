import { PartialType } from '@nestjs/mapped-types';
import { CreateUniversityPartnershipDto } from './create-partnership.dto';

export class UpdateUniversityPartnershipDto extends PartialType(
  CreateUniversityPartnershipDto,
) {}

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@university.edu',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'The role of the user',
    example: UserRole.STUDENT,
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.STUDENT;

  @ApiProperty({
    description: 'The university of the user',
    example: 'University of Technology',
    required: false,
  })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiProperty({
    description: 'The major of the user',
    example: 'Computer Science',
    required: false,
  })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiProperty({
    description: 'The graduation year of the user',
    example: 2025,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2030)
  graduationYear?: number;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'john.doe@university.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  verificationCode: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'john.doe@university.edu' })
  @IsEmail()
  email: string;
}

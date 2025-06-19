import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateChatGroupDto {
  @ApiProperty({ example: 'Group name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Group description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['user1', 'user2'] })
  @IsString({ each: true })
  @IsOptional()
  members?: string[];
}

export class UpdateChatGroupDto extends PartialType(CreateChatGroupDto) {}

export class AddGroupMembersDto {
  @ApiProperty({ example: ['user1', 'user2'] })
  @IsString({ each: true })
  memberIds: string[];
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, this is a message!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'recipient-user-id' })
  @IsUUID()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({ example: 'group-id' })
  @IsUUID()
  @IsOptional()
  groupId?: string;
}

export class LeaveGroupDto {
  @ApiProperty({ example: 'group-id' })
  @IsUUID()
  groupId: string;
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import {
  UpdateUserProfileDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  CreateSkillDto,
  UpdateSkillDto,
  UserSearchDto,
  GetRecommendationsDto,
  VerifyUserDto,
  UpdateAccountStatusDto,
  PaginationDto,
} from './dto/user.dto';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============= PROFILE MANAGEMENT =============

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getCurrentUser(@CurrentUser() user: any) {
    const profile = await this.usersService.findById(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateCurrentUser(
    @CurrentUser() user: any,
    @Body() updateData: UpdateUserProfileDto,
  ) {
    const updatedProfile = await this.usersService.updateProfile(
      user.id,
      updateData,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: any) {
    // In a real app, you'd upload to cloud storage and get URL
    const avatarUrl = `uploads/avatars/${file.filename}`;
    const updatedUser = await this.usersService.uploadAvatar(
      user.id,
      avatarUrl,
    );

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: updatedUser.avatar },
    };
  }

  @Post('me/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user resume' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('resume'))
  async uploadResume(@CurrentUser() user: any, @UploadedFile() file: any) {
    // In a real app, you'd upload to cloud storage and get URL
    const resumeUrl = `uploads/resumes/${file.filename}`;
    const updatedUser = await this.usersService.uploadResume(
      user.id,
      resumeUrl,
    );

    return {
      success: true,
      message: 'Resume uploaded successfully',
      data: { resume: updatedUser.resume },
    };
  }

  // ============= EDUCATION MANAGEMENT =============

  @Post('me/education')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add education to profile' })
  @ApiResponse({ status: 201, description: 'Education added successfully' })
  async addEducation(
    @CurrentUser() user: any,
    @Body() educationData: CreateEducationDto,
  ) {
    const education = await this.usersService.addEducation(
      user.id,
      educationData,
    );
    return {
      success: true,
      message: 'Education added successfully',
      data: education,
    };
  }

  @Patch('me/education/:educationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update education record' })
  @ApiParam({ name: 'educationId', description: 'Education ID' })
  async updateEducation(
    @CurrentUser() user: any,
    @Param('educationId') educationId: string,
    @Body() updateData: UpdateEducationDto,
  ) {
    const education = await this.usersService.updateEducation(
      user.id,
      educationId,
      updateData,
    );
    return {
      success: true,
      message: 'Education updated successfully',
      data: education,
    };
  }

  @Delete('me/education/:educationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete education record' })
  @ApiParam({ name: 'educationId', description: 'Education ID' })
  async deleteEducation(
    @CurrentUser() user: any,
    @Param('educationId') educationId: string,
  ) {
    await this.usersService.deleteEducation(user.id, educationId);
    return {
      success: true,
      message: 'Education deleted successfully',
    };
  }

  // ============= EXPERIENCE MANAGEMENT =============

  @Post('me/experience')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add work experience to profile' })
  @ApiResponse({ status: 201, description: 'Experience added successfully' })
  async addExperience(
    @CurrentUser() user: any,
    @Body() experienceData: CreateExperienceDto,
  ) {
    const experience = await this.usersService.addExperience(
      user.id,
      experienceData,
    );
    return {
      success: true,
      message: 'Experience added successfully',
      data: experience,
    };
  }

  @Patch('me/experience/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update experience record' })
  @ApiParam({ name: 'experienceId', description: 'Experience ID' })
  async updateExperience(
    @CurrentUser() user: any,
    @Param('experienceId') experienceId: string,
    @Body() updateData: UpdateExperienceDto,
  ) {
    const experience = await this.usersService.updateExperience(
      user.id,
      experienceId,
      updateData,
    );
    return {
      success: true,
      message: 'Experience updated successfully',
      data: experience,
    };
  }

  @Delete('me/experience/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete experience record' })
  @ApiParam({ name: 'experienceId', description: 'Experience ID' })
  async deleteExperience(
    @CurrentUser() user: any,
    @Param('experienceId') experienceId: string,
  ) {
    await this.usersService.deleteExperience(user.id, experienceId);
    return {
      success: true,
      message: 'Experience deleted successfully',
    };
  }

  // ============= SKILLS MANAGEMENT =============

  @Post('me/skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add skill to profile' })
  @ApiResponse({ status: 201, description: 'Skill added successfully' })
  async addSkill(@CurrentUser() user: any, @Body() skillData: CreateSkillDto) {
    const skill = await this.usersService.addSkill(user.id, skillData);
    return {
      success: true,
      message: 'Skill added successfully',
      data: skill,
    };
  }

  @Patch('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update skill' })
  @ApiParam({ name: 'skillId', description: 'Skill ID' })
  async updateSkill(
    @CurrentUser() user: any,
    @Param('skillId') skillId: string,
    @Body() updateData: UpdateSkillDto,
  ) {
    const skill = await this.usersService.updateSkill(
      user.id,
      skillId,
      updateData,
    );
    return {
      success: true,
      message: 'Skill updated successfully',
      data: skill,
    };
  }

  @Delete('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete skill' })
  @ApiParam({ name: 'skillId', description: 'Skill ID' })
  async deleteSkill(
    @CurrentUser() user: any,
    @Param('skillId') skillId: string,
  ) {
    await this.usersService.deleteSkill(user.id, skillId);
    return {
      success: true,
      message: 'Skill deleted successfully',
    };
  }

  @Post('skills/:skillId/endorse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endorse a skill' })
  @ApiParam({ name: 'skillId', description: 'Skill ID' })
  async endorseSkill(
    @CurrentUser() user: any,
    @Param('skillId') skillId: string,
  ) {
    const skill = await this.usersService.endorseSkill(skillId, user.id);
    return {
      success: true,
      message: 'Skill endorsed successfully',
      data: skill,
    };
  }

  // ============= USER SEARCH & DISCOVERY =============

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users with advanced filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async searchUsers(@Query() searchDto: UserSearchDto) {
    const result = await this.usersService.searchUsers(searchDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students with filters' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  async getStudents(@Query() searchDto: UserSearchDto) {
    const result = await this.usersService.getStudents(searchDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('alumni')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all alumni with filters' })
  @ApiResponse({ status: 200, description: 'Alumni retrieved successfully' })
  async getAlumni(@Query() searchDto: UserSearchDto) {
    const result = await this.usersService.getAlumni(searchDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('employers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all employers with filters' })
  @ApiResponse({ status: 200, description: 'Employers retrieved successfully' })
  async getEmployers(@Query() searchDto: UserSearchDto) {
    const result = await this.usersService.getEmployers(searchDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('professors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all professors with filters' })
  @ApiResponse({
    status: 200,
    description: 'Professors retrieved successfully',
  })
  async getProfessors(@Query() searchDto: UserSearchDto) {
    const result = await this.usersService.getProfessors(searchDto);
    return {
      success: true,
      ...result,
    };
  }

  // ============= RECOMMENDATIONS =============

  @Post('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized user recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
  })
  async getRecommendations(
    @CurrentUser() user: any,
    @Body() recommendationDto: GetRecommendationsDto,
  ) {
    const result = await this.usersService.getRecommendations(
      user.id,
      recommendationDto,
    );
    return {
      success: true,
      ...result,
    };
  }

  // ============= PUBLIC PROFILES =============

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  // ============= ADMIN OPERATIONS =============

  @Patch(':userId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify or unverify a user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User verification status updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async verifyUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() verifyDto: Omit<VerifyUserDto, 'userId'>,
  ) {
    const result = await this.usersService.verifyUser(admin.id, {
      userId,
      ...verifyDto,
    });
    return {
      success: true,
      message: 'User verification status updated successfully',
      data: result,
    };
  }

  @Patch(':userId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user account status (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateAccountStatus(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() statusDto: UpdateAccountStatusDto,
  ) {
    const result = await this.usersService.updateAccountStatus(
      admin.id,
      userId,
      statusDto,
    );
    return {
      success: true,
      message: 'Account status updated successfully',
      data: result,
    };
  }

  // ============= ANALYTICS & STATISTICS =============

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getUserStats(@CurrentUser() admin: any) {
    // Verify admin role in service
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const stats = await this.usersService.getUserStats();
    return {
      success: true,
      data: stats,
    };
  }
}

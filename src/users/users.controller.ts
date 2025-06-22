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
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  UnauthorizedException,
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
import { QueryArrayTransformPipe } from '../common/pipes/query-array-transform.pipe';
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
  SoftDeleteUserDto,
  HardDeleteUserDto,
  SelfDeleteAccountDto,
  CleanupOldUsersDto,
  DeletedUserResponseDto,
  HardDeleteResponseDto,
  CleanupResponseDto,
  CreateUserResponseDto,
  CreateUserByAdminDto,
  UserStatsDto,
  ComprehensiveAnalyticsDto,
  AnalyticsFiltersDto,
  ExportReportDto,
  ChangePasswordDto,
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

  @Patch('me/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or password validation failed',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // Validate that new password and confirm password match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    const result = await this.usersService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      success: true,
      message: result.message,
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
  @UsePipes(new QueryArrayTransformPipe())
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
  @UsePipes(new QueryArrayTransformPipe())
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
  @UsePipes(new QueryArrayTransformPipe())
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
  @UsePipes(new QueryArrayTransformPipe())
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
  @UsePipes(new QueryArrayTransformPipe())
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

  @Get(':userId/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID (alternative endpoint)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfileAlt(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive information
    const { password, ...userProfile } = user;
    return userProfile;
  }

  // ============= ADMIN OPERATIONS =============

  @Post('admin/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUserByAdmin(
    @CurrentUser() admin: any,
    @Body() createUserDto: CreateUserByAdminDto,
  ) {
    const result = await this.usersService.createUserByAdmin(
      admin.id,
      createUserDto,
    );
    return {
      success: true,
      message: 'User created successfully',
      data: result,
    };
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users for admin management' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @UsePipes(new QueryArrayTransformPipe())
  async getAdminUsers(
    @CurrentUser() admin: any,
    @Query() searchDto: UserSearchDto,
  ) {
    // Verify admin role
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const result = await this.usersService.searchUsers(searchDto);
    return {
      success: true,
      ...result,
    };
  }

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

  @Patch(':userId/suspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async suspendUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    const result = await this.usersService.updateAccountStatus(
      admin.id,
      userId,
      { status: 'SUSPENDED', reason: body.reason },
    );
    return {
      success: true,
      message: 'User suspended successfully',
      data: result,
    };
  }

  @Patch(':userId/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async activateUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    const result = await this.usersService.updateAccountStatus(
      admin.id,
      userId,
      { status: 'ACTIVE', reason: body.reason },
    );
    return {
      success: true,
      message: 'User activated successfully',
      data: result,
    };
  }

  @Patch(':userId/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deactivateUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    const result = await this.usersService.updateAccountStatus(
      admin.id,
      userId,
      { status: 'INACTIVE', reason: body.reason },
    );
    return {
      success: true,
      message: 'User deactivated successfully',
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
    type: UserStatsDto,
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

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comprehensive analytics data (Admin only)' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'roles',
    required: false,
    type: [String],
    example: ['STUDENT', 'ALUMNI'],
  })
  @ApiQuery({
    name: 'genders',
    required: false,
    type: [String],
    example: ['MALE', 'FEMALE'],
  })
  @ApiQuery({
    name: 'countries',
    required: false,
    type: [String],
    example: ['US', 'CA'],
  })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({
    name: 'accountStatus',
    required: false,
    type: [String],
    example: ['ACTIVE'],
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    type: String,
    example: '30d',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    type: ComprehensiveAnalyticsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getComprehensiveAnalytics(
    @CurrentUser() admin: any,
    @Query() filters: AnalyticsFiltersDto,
  ) {
    // Verify admin role in service
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const analytics =
      await this.usersService.getComprehensiveAnalytics(filters);
    return {
      success: true,
      data: analytics,
    };
  }

  @Post('admin/analytics/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export analytics report (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async exportAnalyticsReport(
    @CurrentUser() admin: any,
    @Body() exportDto: ExportReportDto,
  ) {
    // Verify admin role in service
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const exportData = await this.usersService.exportAnalyticsReport(exportDto);
    return {
      success: true,
      data: exportData,
    };
  }

  @Get('admin/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent users (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Recent users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getRecentUsers(
    @CurrentUser() admin: any,
    @Query('limit') limit: number = 10,
  ) {
    // Verify admin role
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const users = await this.usersService.getRecentUsers(limit);
    return {
      success: true,
      data: users,
    };
  }

  @Get('admin/pending-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users pending verification (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Pending verification users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getPendingVerificationUsers(
    @CurrentUser() admin: any,
    @Query('limit') limit: number = 10,
  ) {
    // Verify admin role
    await this.usersService.findByIdWithRole(admin.id, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    const users = await this.usersService.getPendingVerificationUsers(limit);
    return {
      success: true,
      data: users,
    };
  }

  // ============= USER DELETION OPERATIONS =============

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own account (self-delete)' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    type: DeletedUserResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Invalid password' })
  async selfDeleteAccount(
    @CurrentUser() user: any,
    @Body() selfDeleteDto: SelfDeleteAccountDto,
  ) {
    const result = await this.usersService.selfDeleteAccount(
      user.id,
      selfDeleteDto.password,
      selfDeleteDto.reason,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Delete(':userId/soft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'User soft deleted successfully',
    type: DeletedUserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already deleted' })
  async softDeleteUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() softDeleteDto: SoftDeleteUserDto,
  ) {
    const result = await this.usersService.softDeleteUser(
      admin.id,
      userId,
      softDeleteDto.reason,
    );

    return {
      success: true,
      message: 'User soft deleted successfully',
      data: result,
    };
  }

  @Delete(':userId/hard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Permanently delete a user (Super Admin only)',
    description:
      'This action is irreversible. Requires confirmation code in format: HARD_DELETE_{userId}_{YYYY-MM-DD}',
  })
  @ApiParam({ name: 'userId', description: 'User ID to permanently delete' })
  @ApiResponse({
    status: 200,
    description: 'User permanently deleted successfully',
    type: HardDeleteResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Super Admin access required or invalid confirmation code',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async hardDeleteUser(
    @CurrentUser() superAdmin: any,
    @Param('userId') userId: string,
    @Body() hardDeleteDto: HardDeleteUserDto,
  ) {
    const result = await this.usersService.hardDeleteUser(
      superAdmin.id,
      userId,
      hardDeleteDto.confirmationCode,
    );

    return result;
  }

  @Patch(':userId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to restore' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    type: DeletedUserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is not deleted' })
  async restoreUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
  ) {
    const result = await this.usersService.restoreUser(admin.id, userId);

    return {
      success: true,
      message: 'User restored successfully',
      data: result,
    };
  }

  @Get('admin/deleted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all deleted users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Deleted users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getDeletedUsers(
    @CurrentUser() admin: any,
    @Query() pagination: PaginationDto,
  ) {
    const result = await this.usersService.getDeletedUsers(
      admin.id,
      pagination,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('admin/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cleanup old deleted users (Super Admin only)',
    description:
      'Permanently deletes users that have been soft-deleted for specified number of days',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
    type: CleanupResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  async cleanupOldDeletedUsers(
    @CurrentUser() superAdmin: any,
    @Body() cleanupDto: CleanupOldUsersDto,
  ) {
    const result = await this.usersService.cleanupOldDeletedUsers(
      superAdmin.id,
      cleanupDto.daysOld,
    );

    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getCurrentUserProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Return user profile without sensitive information
    const { password, ...userProfile } = user;
    return userProfile;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  async updateCurrentUserProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'role', required: false, type: String, enum: UserRole })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsers(
    @CurrentUser() currentUser: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    const users = await this.usersService.findUsers({
      page,
      limit,
      role,
      search,
      excludeUserId: currentUser.id,
    });

    return {
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          headline: user.headline,
        })),
      },
    };
  }
}

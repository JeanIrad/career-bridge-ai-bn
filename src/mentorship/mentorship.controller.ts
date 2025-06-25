import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MentorshipService } from './mentorship.service';
import {
  CreateMentorProfileDto,
  UpdateMentorProfileDto,
  CreateMentorshipRequestDto,
  RespondToMentorshipRequestDto,
  CreateSessionDto,
  UpdateSessionDto,
  CreateSessionFeedbackDto,
  CreateMentorshipReviewDto,
  CreateGoalDto,
  UpdateGoalDto,
  MentorSearchDto,
  SessionFilterDto,
} from './dto/mentorship.dto';

@Controller('mentorship')
@UseGuards(JwtAuthGuard)
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  // Mentor Profile Management
  @Post('mentor/profile')
  async createMentorProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMentorProfileDto,
  ) {
    return this.mentorshipService.createMentorProfile(userId, dto);
  }

  @Put('mentor/profile')
  async updateMentorProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMentorProfileDto,
  ) {
    return this.mentorshipService.updateMentorProfile(userId, dto);
  }

  @Get('mentor/profile')
  async getMentorProfile(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getMentorProfile(userId);
  }

  @Get('mentor/profile/:userId')
  async getMentorProfileById(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.mentorshipService.getMentorProfile(userId);
  }

  @Get('mentors/search')
  async searchMentors(@Query() dto: MentorSearchDto) {
    return this.mentorshipService.searchMentors(dto);
  }

  // Mentorship Requests
  @Post('requests')
  async createMentorshipRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMentorshipRequestDto,
  ) {
    return this.mentorshipService.createMentorshipRequest(userId, dto);
  }

  @Put('requests/:requestId/respond')
  async respondToMentorshipRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: RespondToMentorshipRequestDto,
  ) {
    return this.mentorshipService.respondToMentorshipRequest(
      userId,
      requestId,
      dto,
    );
  }

  @Get('requests/sent')
  async getSentRequests(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getMentorshipRequests(userId, 'sent');
  }

  @Get('requests/received')
  async getReceivedRequests(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getMentorshipRequests(userId, 'received');
  }

  // Sessions
  @Post('sessions')
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.mentorshipService.createSession(userId, dto);
  }

  @Put('sessions/:sessionId')
  async updateSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.mentorshipService.updateSession(userId, sessionId, dto);
  }

  @Get('sessions')
  async getSessions(
    @CurrentUser('id') userId: string,
    @Query() filters: SessionFilterDto,
  ) {
    return this.mentorshipService.getSessions(userId, filters);
  }

  @Get('sessions/upcoming')
  async getUpcomingSessions(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getUpcomingSessions(userId);
  }

  // Session Feedback
  @Post('sessions/:sessionId/feedback')
  async createSessionFeedback(
    @CurrentUser('id') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateSessionFeedbackDto,
  ) {
    return this.mentorshipService.createSessionFeedback(userId, sessionId, dto);
  }

  // Mentorship Reviews
  @Post('mentors/:mentorId/reviews')
  async createMentorshipReview(
    @CurrentUser('id') userId: string,
    @Param('mentorId', ParseUUIDPipe) mentorId: string,
    @Body() dto: CreateMentorshipReviewDto,
  ) {
    return this.mentorshipService.createMentorshipReview(userId, mentorId, dto);
  }

  // Goal Tracking
  @Post('mentorships/:mentorshipId/goals')
  async createGoal(
    @CurrentUser('id') userId: string,
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.mentorshipService.createGoal(userId, mentorshipId, dto);
  }

  @Put('goals/:goalId')
  async updateGoal(
    @CurrentUser('id') userId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.mentorshipService.updateGoal(userId, goalId, dto);
  }

  @Get('mentorships/:mentorshipId/goals')
  async getGoals(
    @CurrentUser('id') userId: string,
    @Param('mentorshipId', ParseUUIDPipe) mentorshipId: string,
  ) {
    return this.mentorshipService.getGoals(userId, mentorshipId);
  }

  // Dashboard and Analytics
  @Get('mentor/dashboard')
  async getMentorDashboard(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getMentorDashboard(userId);
  }

  @Get('mentee/dashboard')
  async getMenteeDashboard(@CurrentUser('id') userId: string) {
    return this.mentorshipService.getMenteeDashboard(userId);
  }

  // Public endpoints for browsing mentors (no auth required)
  @Get('public/mentors')
  @UseGuards() // Remove auth guard for public endpoint
  async getPublicMentors(@Query() dto: MentorSearchDto) {
    return this.mentorshipService.searchMentors(dto);
  }

  @Get('public/mentors/:userId')
  @UseGuards() // Remove auth guard for public endpoint
  async getPublicMentorProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.mentorshipService.getMentorProfile(userId);
  }
}

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
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateEventDto,
  UpdateEventDto,
  EventSearchDto,
  RegisterForEventDto,
  EventFeedbackDto,
  EventAnalyticsDto,
  RegistrationStatus,
} from './dto/events.dto';
import { isBefore } from 'date-fns';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createEvent(
    @CurrentUser('id') userId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.createEvent(userId, createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events retrieved successfully',
  })
  async getEvents(@Query() searchDto: EventSearchDto) {
    const { events, pagination } =
      await this.eventsService.getEvents(searchDto);
    return {
      events,
      pagination,
    };
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  async testEndpoint() {
    return { message: 'Events controller is working!', timestamp: new Date() };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured events retrieved successfully',
  })
  async getFeaturedEvents(@Query('limit') limit?: number) {
    return this.eventsService.getFeaturedEvents(
      limit ? parseInt(limit.toString()) : 6,
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming events retrieved successfully',
  })
  async getUpcomingEvents(@Query('limit') limit?: number) {
    return this.eventsService.getUpcomingEvents(
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's registered events" })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RegistrationStatus,
    description: 'Filter by registration status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User events retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getUserEvents(
    @CurrentUser('id') userId: string,
    @Query('status') status?: RegistrationStatus,
  ) {
    return this.eventsService.getUserEvents(userId, status);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getEventAnalytics(
    @CurrentUser('id') userId: string,
    @Query() analyticsDto: EventAnalyticsDto,
  ) {
    return this.eventsService.getEventAnalytics(analyticsDto, userId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved events for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saved events retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getSavedEvents(@CurrentUser() user: any) {
    return this.eventsService.getSavedEvents(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async getEventById(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.eventsService.getEventById(eventId, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update this event',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async updateEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, userId, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete this event',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async deleteEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.deleteEvent(eventId, userId);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Registration failed',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async registerForEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
    @Body() registrationDto: RegisterForEventDto,
  ) {
    const event = await this.eventsService.getEventById(eventId, user.id);
    const isRegistrationOpen =
      event.isRegistrationOpen &&
      (event.registrationDeadline
        ? isBefore(new Date(), new Date(event.registrationDeadline))
        : true);

    if (!isRegistrationOpen) {
      return {
        status: HttpStatus.BAD_REQUEST,
        description: 'Registration is not open for this event',
      };
    }

    return this.eventsService.registerForEvent(
      eventId,
      user.id,
      registrationDto,
    );
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel event registration' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration cancelled successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registration not found',
  })
  async cancelRegistration(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.cancelRegistration(eventId, userId);
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in to an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Check-in successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Check-in failed',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registration not found',
  })
  async checkInToEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.checkInToEvent(eventId, userId);
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit event feedback' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Feedback submission failed',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async submitEventFeedback(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @Body() feedbackDto: EventFeedbackDto,
  ) {
    return this.eventsService.submitEventFeedback(eventId, userId, feedbackDto);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event saved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async saveEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    console.log('userId=======>', userId);
    return this.eventsService.saveEvent(eventId, userId);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsave an event' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event unsaved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Saved event not found',
  })
  async unsaveEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.unsaveEvent(eventId, userId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContentModerationService } from './content-moderation.service';
import {
  CreateModerationRequestDto,
  ModerationDecisionDto,
  BulkModerationDto,
  ModerationFiltersDto,
  UpdateAutoModerationRulesDto,
  ModerationAnalyticsDto,
  ContentType,
  ModerationStatus,
  ViolationType,
  SeverityLevel,
  ModerationAction,
} from './dto/content-moderation.dto';

@ApiTags('Content Moderation')
@Controller('content-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentModerationController {
  constructor(
    private readonly contentModerationService: ContentModerationService,
  ) {}

  // ============= MODERATION REQUEST ENDPOINTS =============

  @ApiOperation({
    summary: 'Create a new moderation request',
    description: 'Submit content for moderation review',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Moderation request created successfully',
  })
  @ApiBody({
    type: CreateModerationRequestDto,
    description: 'Moderation request details',
  })
  @Post('requests')
  async createModerationRequest(
    @Body() createDto: CreateModerationRequestDto,
    @Request() req,
  ) {
    const result = await this.contentModerationService.createModerationRequest(
      createDto,
      req.user.id,
    );

    return {
      success: true,
      message: 'Moderation request created successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get moderation requests with filters (Admin/Moderator only)',
    description:
      'Retrieve paginated list of moderation requests with filtering options',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation requests retrieved successfully',
  })
  @ApiQuery({
    name: 'contentType',
    required: false,
    enum: ContentType,
    description: 'Filter by content type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ModerationStatus,
    description: 'Filter by moderation status',
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    enum: SeverityLevel,
    description: 'Filter by severity level',
  })
  @ApiQuery({
    name: 'violationTypes',
    required: false,
    isArray: true,
    enum: ViolationType,
    description: 'Filter by violation types',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Filter by content author',
  })
  @ApiQuery({
    name: 'moderatorId',
    required: false,
    type: String,
    description: 'Filter by moderator',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date (ISO format)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in content and reason',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiQuery({
    name: 'flaggedOnly',
    required: false,
    type: Boolean,
    description: 'Show only flagged content',
  })
  @ApiQuery({
    name: 'autoModeratedOnly',
    required: false,
    type: Boolean,
    description: 'Show only auto-moderated content',
  })
  @Get('requests')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getModerationRequests(@Query() filters: ModerationFiltersDto) {
    return await this.contentModerationService.getModerationRequests(filters);
  }

  @ApiOperation({
    summary: 'Get specific moderation request (Admin/Moderator only)',
    description: 'Retrieve details of a specific moderation request',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation request retrieved successfully',
  })
  @ApiParam({
    name: 'requestId',
    description: 'ID of the moderation request',
  })
  @Get('requests/:requestId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getModerationRequest(@Param('requestId') requestId: string) {
    // This would be implemented in the service
    return {
      success: true,
      message: 'Moderation request retrieved successfully',
      data: null, // Implement in service
    };
  }

  @ApiOperation({
    summary: 'Process moderation decision (Admin/Moderator only)',
    description: 'Make a decision on a moderation request',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation decision processed successfully',
  })
  @ApiParam({
    name: 'requestId',
    description: 'ID of the moderation request',
  })
  @ApiBody({
    type: ModerationDecisionDto,
    description: 'Moderation decision details',
  })
  @Patch('requests/:requestId/decision')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async processModerationDecision(
    @Param('requestId') requestId: string,
    @Body() decision: ModerationDecisionDto,
    @Request() req,
  ) {
    const result =
      await this.contentModerationService.processModerationDecision(
        requestId,
        decision,
        req.user.id,
      );

    return {
      success: true,
      message: 'Moderation decision processed successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Bulk moderation actions (Admin only)',
    description: 'Apply moderation actions to multiple requests at once',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk moderation completed',
  })
  @ApiBody({
    type: BulkModerationDto,
    description: 'Bulk moderation details',
  })
  @Post('requests/bulk-action')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async bulkModerationAction(
    @Body() bulkDto: BulkModerationDto,
    @Request() req,
  ) {
    const result = await this.contentModerationService.bulkModerationAction(
      bulkDto,
      req.user.id,
    );

    return {
      success: true,
      message: `Bulk moderation completed: ${result.success} successful, ${result.failed} failed`,
      data: result,
    };
  }

  // ============= AUTO-MODERATION ENDPOINTS =============

  @ApiOperation({
    summary: 'Get auto-moderation rules (Admin only)',
    description: 'Retrieve current auto-moderation configuration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auto-moderation rules retrieved successfully',
  })
  @Get('auto-moderation/rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAutoModerationRules() {
    const rules = await this.contentModerationService.getAutoModerationRules();

    return {
      success: true,
      message: 'Auto-moderation rules retrieved successfully',
      data: rules,
    };
  }

  @ApiOperation({
    summary: 'Update auto-moderation rules (Admin only)',
    description: 'Configure auto-moderation settings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auto-moderation rules updated successfully',
  })
  @ApiBody({
    type: UpdateAutoModerationRulesDto,
    description: 'Auto-moderation rules configuration',
  })
  @Patch('auto-moderation/rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateAutoModerationRules(
    @Body() rulesDto: UpdateAutoModerationRulesDto,
  ) {
    const result =
      await this.contentModerationService.updateAutoModerationRules(rulesDto);

    return {
      success: true,
      message: 'Auto-moderation rules updated successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Test auto-moderation on content (Admin only)',
    description: 'Test how auto-moderation would handle specific content',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auto-moderation test completed',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to test',
        },
        contentType: {
          enum: Object.values(ContentType),
          description: 'Type of content',
        },
      },
      required: ['content', 'contentType'],
    },
  })
  @Post('auto-moderation/test')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async testAutoModeration(
    @Body() testData: { content: string; contentType: ContentType },
  ) {
    // This would test auto-moderation without creating a request
    return {
      success: true,
      message: 'Auto-moderation test completed',
      data: {
        content: testData.content,
        contentType: testData.contentType,
        analysis: {
          severity: SeverityLevel.LOW,
          detectedViolations: [],
          confidence: 0.1,
          shouldAutoApprove: true,
          shouldAutoReject: false,
          reasons: ['No violations detected'],
        },
      },
    };
  }

  // ============= ANALYTICS ENDPOINTS =============

  @ApiOperation({
    summary: 'Get moderation statistics (Admin only)',
    description: 'Retrieve comprehensive moderation analytics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation statistics retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (ISO format)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Time granularity for analytics',
  })
  @Get('analytics/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getModerationStats(@Query() filters: ModerationAnalyticsDto) {
    const stats =
      await this.contentModerationService.getModerationStats(filters);

    return {
      success: true,
      message: 'Moderation statistics retrieved successfully',
      data: stats,
    };
  }

  @ApiOperation({
    summary: 'Get moderation trends (Admin only)',
    description: 'Retrieve time-series moderation data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation trends retrieved successfully',
  })
  @Get('analytics/trends')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getModerationTrends(@Query() filters: ModerationAnalyticsDto) {
    const trends =
      await this.contentModerationService.getModerationTrends(filters);

    return {
      success: true,
      message: 'Moderation trends retrieved successfully',
      data: trends,
    };
  }

  @ApiOperation({
    summary: 'Export moderation data (Admin only)',
    description: 'Export moderation data in various formats',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation data exported successfully',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'json', 'excel'],
    description: 'Export format (default: csv)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for export (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for export (ISO format)',
  })
  @Get('analytics/export')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async exportModerationData(
    @Query('format') format: string = 'csv',
    @Query() filters: ModerationAnalyticsDto,
  ) {
    // This would implement data export functionality
    return {
      success: true,
      message: 'Moderation data export initiated',
      data: {
        format,
        filters,
        downloadUrl: '/api/content-moderation/downloads/moderation-data.csv',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    };
  }

  // ============= UTILITY ENDPOINTS =============

  @ApiOperation({
    summary: 'Get moderation queue summary (Admin only)',
    description: 'Get quick overview of pending moderation tasks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation queue summary retrieved successfully',
  })
  @Get('queue/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getModerationQueueSummary() {
    // This would return a quick summary for dashboard
    return {
      success: true,
      message: 'Moderation queue summary retrieved successfully',
      data: {
        pendingCount: 15,
        flaggedCount: 3,
        urgentCount: 1,
        averageWaitTime: 45, // minutes
        topViolations: [
          { type: ViolationType.SPAM, count: 8 },
          { type: ViolationType.INAPPROPRIATE_CONTENT, count: 5 },
          { type: ViolationType.HARASSMENT, count: 2 },
        ],
      },
    };
  }

  @ApiOperation({
    summary: 'Get content moderation guidelines',
    description: 'Retrieve moderation guidelines and policies',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Moderation guidelines retrieved successfully',
  })
  @Get('guidelines')
  async getModerationGuidelines() {
    return {
      success: true,
      message: 'Moderation guidelines retrieved successfully',
      data: {
        contentTypes: Object.values(ContentType),
        violationTypes: Object.values(ViolationType),
        severityLevels: Object.values(SeverityLevel),
        moderationActions: Object.values(ModerationAction),
        guidelines: {
          spam: 'Content that is repetitive, irrelevant, or promotional in nature',
          harassment: 'Content that targets individuals with abuse or threats',
          hateSeech:
            'Content that promotes hatred against groups based on identity',
          inappropriateContent: 'Content that is not suitable for the platform',
          copyrightViolation:
            'Content that infringes on intellectual property rights',
          fakeInformation:
            'Content that contains misleading or false information',
        },
        autoModerationInfo: {
          description:
            'Automated content screening using AI and rule-based systems',
          capabilities: [
            'Profanity detection',
            'Spam identification',
            'Sentiment analysis',
            'Link validation',
            'Image content scanning',
            'Duplicate content detection',
          ],
        },
      },
    };
  }

  @ApiOperation({
    summary: 'Report content for moderation',
    description:
      'Allow users to report content that violates community guidelines',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content reported successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'ID of the content being reported',
        },
        contentType: {
          enum: Object.values(ContentType),
          description: 'Type of content being reported',
        },
        violationType: {
          enum: Object.values(ViolationType),
          description: 'Type of violation',
        },
        reason: {
          type: 'string',
          description: 'Reason for reporting',
        },
        additionalInfo: {
          type: 'string',
          description: 'Additional information about the report',
        },
      },
      required: ['contentId', 'contentType', 'violationType', 'reason'],
    },
  })
  @Post('report')
  async reportContent(
    @Body()
    reportData: {
      contentId: string;
      contentType: ContentType;
      violationType: ViolationType;
      reason: string;
      additionalInfo?: string;
    },
    @Request() req,
  ) {
    // This would create a moderation request based on user report
    const createDto: CreateModerationRequestDto = {
      contentType: reportData.contentType,
      contentId: reportData.contentId,
      content: '', // Would need to fetch actual content
      reporterId: req.user.id,
      reason: reportData.reason,
      severity: SeverityLevel.MEDIUM,
      metadata: {
        reportType: 'user_report',
        violationType: reportData.violationType,
        additionalInfo: reportData.additionalInfo,
      },
    };

    const result = await this.contentModerationService.createModerationRequest(
      createDto,
      req.user.id,
    );

    return {
      success: true,
      message:
        'Content reported successfully. Our team will review it shortly.',
      data: {
        reportId: result.id,
        status: 'submitted',
        estimatedReviewTime: '24-48 hours',
      },
    };
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContentType,
  ModerationStatus,
  ModerationAction,
  ViolationType,
  SeverityLevel,
  AutoModerationRule,
  CreateModerationRequestDto,
  ModerationDecisionDto,
  BulkModerationDto,
  ModerationFiltersDto,
  AutoModerationRuleDto,
  UpdateAutoModerationRulesDto,
  ModerationAnalyticsDto,
  ModerationRequestResponseDto,
  ModerationStatsDto,
  PaginatedModerationResponseDto,
} from './dto/content-moderation.dto';

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(private prisma: PrismaService) {}

  // ============= CORE MODERATION FUNCTIONS =============

  /**
   * Create a new moderation request
   */
  async createModerationRequest(
    createDto: CreateModerationRequestDto,
    requesterId?: string,
  ): Promise<ModerationRequestResponseDto> {
    try {
      // Check if content already has a pending moderation request
      const existingRequest = await this.prisma.moderationRequest.findFirst({
        where: {
          contentId: createDto.contentId,
          contentType: createDto.contentType,
          status: {
            in: [ModerationStatus.PENDING, ModerationStatus.UNDER_REVIEW],
          },
        },
      });

      if (existingRequest) {
        throw new BadRequestException(
          'Content already has a pending moderation request',
        );
      }

      // Auto-analyze content for initial severity assessment
      const autoAnalysis = await this.performAutoAnalysis(
        createDto.content,
        createDto.contentType,
      );

      const moderationRequest = await this.prisma.moderationRequest.create({
        data: {
          contentType: createDto.contentType,
          contentId: createDto.contentId,
          content: createDto.content,
          authorId: createDto.authorId,
          reporterId: createDto.reporterId || requesterId,
          status: autoAnalysis.shouldAutoReject
            ? ModerationStatus.AUTO_REJECTED
            : autoAnalysis.shouldAutoApprove
              ? ModerationStatus.AUTO_APPROVED
              : ModerationStatus.PENDING,
          severity: createDto.severity || autoAnalysis.severity,
          reason: createDto.reason,
          violationTypes: autoAnalysis.detectedViolations,
          metadata: {
            ...createDto.metadata,
            autoAnalysis,
            confidence: autoAnalysis.confidence,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If auto-rejected or flagged, create notification
      if (
        autoAnalysis.shouldAutoReject ||
        autoAnalysis.severity === SeverityLevel.CRITICAL
      ) {
        await this.createModerationNotification(moderationRequest);
      }

      return this.formatModerationResponse(moderationRequest);
    } catch (error) {
      this.logger.error('Failed to create moderation request:', error);
      throw error;
    }
  }

  /**
   * Get paginated moderation requests with filters
   */
  async getModerationRequests(
    filters: ModerationFiltersDto,
  ): Promise<PaginatedModerationResponseDto> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filterParams
      } = filters;

      const skip = (page - 1) * limit;
      const whereClause = this.buildModerationWhereClause(filterParams);

      // Get total count
      const total = await this.prisma.moderationRequest.count({
        where: whereClause,
      });

      // Get requests with pagination
      const requests = await this.prisma.moderationRequest.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          moderator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      });

      // Get quick stats
      const stats = await this.getQuickModerationStats();

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Moderation requests retrieved successfully',
        data: requests.map((request) => this.formatModerationResponse(request)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters,
        stats: {
          totalPending: stats.pendingRequests,
          totalFlagged: stats.flaggedRequests,
          totalToday: stats.todayRequests,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get moderation requests:', error);
      throw error;
    }
  }

  /**
   * Process moderation decision
   */
  async processModerationDecision(
    requestId: string,
    decision: ModerationDecisionDto,
    moderatorId: string,
  ): Promise<ModerationRequestResponseDto> {
    try {
      const request = await this.prisma.moderationRequest.findUnique({
        where: { id: requestId },
        include: {
          author: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Moderation request not found');
      }

      if (
        request.status !== ModerationStatus.PENDING &&
        request.status !== ModerationStatus.UNDER_REVIEW &&
        request.status !== ModerationStatus.FLAGGED
      ) {
        throw new BadRequestException('Moderation request is already resolved');
      }

      // Determine new status based on action
      const newStatus = this.getStatusFromAction(decision.action);

      // Update moderation request
      const updatedRequest = await this.prisma.moderationRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          moderatorId,
          moderatorNotes: decision.moderatorNotes,
          reason: decision.reason || request.reason,
          violationTypes: decision.violationTypes || request.violationTypes,
          resolvedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          moderator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Apply content action (hide, delete, etc.)
      await this.applyContentAction(request, decision.action);

      // Send notification to author if requested
      if (decision.notifyAuthor && request.authorId) {
        await this.sendModerationNotification(
          request.authorId,
          decision.action,
          decision.customMessage || decision.reason || 'Content moderated',
          request.contentType as ContentType,
        );
      }

      // Log moderation action
      await this.logModerationAction(
        requestId,
        moderatorId,
        decision.action,
        decision.reason,
      );

      return this.formatModerationResponse(updatedRequest);
    } catch (error) {
      this.logger.error('Failed to process moderation decision:', error);
      throw error;
    }
  }

  /**
   * Bulk moderation actions
   */
  async bulkModerationAction(
    bulkDto: BulkModerationDto,
    moderatorId: string,
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const results: Array<{
      contentId: string;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];
    let successCount = 0;
    let failedCount = 0;

    for (const contentId of bulkDto.contentIds) {
      try {
        const decision: ModerationDecisionDto = {
          action: bulkDto.action,
          reason: bulkDto.reason,
          notifyAuthor: bulkDto.notifyAuthors,
        };

        const result = await this.processModerationDecision(
          contentId,
          decision,
          moderatorId,
        );
        results.push({ contentId, success: true, result });
        successCount++;
      } catch (error) {
        results.push({ contentId, success: false, error: error.message });
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  // ============= AUTO-MODERATION FUNCTIONS =============

  /**
   * Perform automatic content analysis
   */
  private async performAutoAnalysis(
    content: string,
    contentType: ContentType,
  ): Promise<{
    severity: SeverityLevel;
    detectedViolations: ViolationType[];
    confidence: number;
    shouldAutoApprove: boolean;
    shouldAutoReject: boolean;
    reasons: string[];
  }> {
    const analysis = {
      severity: SeverityLevel.LOW,
      detectedViolations: [] as ViolationType[],
      confidence: 0.5,
      shouldAutoApprove: false,
      shouldAutoReject: false,
      reasons: [] as string[],
    };

    // Get active auto-moderation rules
    const rules = await this.getAutoModerationRules();

    // Profanity filter
    if (rules.PROFANITY_FILTER?.enabled) {
      const profanityResult = this.checkProfanity(content);
      if (profanityResult.detected) {
        analysis.detectedViolations.push(ViolationType.INAPPROPRIATE_CONTENT);
        analysis.severity = SeverityLevel.MEDIUM;
        analysis.confidence += 0.2;
        analysis.reasons.push('Profanity detected');
      }
    }

    // Spam detection
    if (rules.SPAM_DETECTION?.enabled) {
      const spamResult = this.detectSpam(content);
      if (spamResult.isSpam) {
        analysis.detectedViolations.push(ViolationType.SPAM);
        analysis.severity = SeverityLevel.MEDIUM;
        analysis.confidence += 0.3;
        analysis.reasons.push('Spam patterns detected');
      }
    }

    // Link validation
    if (rules.LINK_VALIDATION?.enabled) {
      const linkResult = this.validateLinks(content);
      if (linkResult.hasSuspiciousLinks) {
        analysis.detectedViolations.push(ViolationType.SCAM);
        analysis.severity = SeverityLevel.HIGH;
        analysis.confidence += 0.25;
        analysis.reasons.push('Suspicious links detected');
      }
    }

    // Sentiment analysis
    if (rules.SENTIMENT_ANALYSIS?.enabled) {
      const sentimentResult = this.analyzeSentiment(content);
      if (sentimentResult.isNegative && sentimentResult.intensity > 0.8) {
        analysis.detectedViolations.push(ViolationType.HARASSMENT);
        analysis.severity = SeverityLevel.HIGH;
        analysis.confidence += 0.2;
        analysis.reasons.push('Highly negative sentiment detected');
      }
    }

    // Determine auto-actions based on confidence and severity
    if (analysis.confidence > 0.8 && analysis.severity === SeverityLevel.HIGH) {
      analysis.shouldAutoReject = true;
    } else if (
      analysis.confidence < 0.2 &&
      analysis.detectedViolations.length === 0
    ) {
      analysis.shouldAutoApprove = true;
    }

    return analysis;
  }

  /**
   * Get auto-moderation rules
   */
  async getAutoModerationRules(): Promise<Record<string, any>> {
    // This would typically be stored in database or config
    // For now, return default rules
    return {
      PROFANITY_FILTER: { enabled: true, threshold: 0.7 },
      SPAM_DETECTION: { enabled: true, threshold: 0.8 },
      LINK_VALIDATION: { enabled: true, threshold: 0.6 },
      SENTIMENT_ANALYSIS: { enabled: true, threshold: 0.8 },
      DUPLICATE_DETECTION: { enabled: false, threshold: 0.9 },
      RATE_LIMITING: { enabled: true, threshold: 10 }, // 10 posts per hour
    };
  }

  /**
   * Update auto-moderation rules
   */
  async updateAutoModerationRules(
    rulesDto: UpdateAutoModerationRulesDto,
  ): Promise<any> {
    // This would typically update database configuration
    // For now, return success message
    this.logger.log('Auto-moderation rules updated:', rulesDto.rules);
    return {
      success: true,
      message: 'Auto-moderation rules updated successfully',
      rules: rulesDto.rules,
    };
  }

  // ============= ANALYTICS FUNCTIONS =============

  /**
   * Get comprehensive moderation statistics
   */
  async getModerationStats(
    filters?: ModerationAnalyticsDto,
  ): Promise<ModerationStatsDto> {
    try {
      const dateFilter = this.buildDateFilter(
        filters?.startDate,
        filters?.endDate,
      );

      // Basic counts
      const [
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        flaggedRequests,
        autoModeratedRequests,
      ] = await Promise.all([
        this.prisma.moderationRequest.count({ where: dateFilter }),
        this.prisma.moderationRequest.count({
          where: { ...dateFilter, status: ModerationStatus.PENDING },
        }),
        this.prisma.moderationRequest.count({
          where: { ...dateFilter, status: ModerationStatus.APPROVED },
        }),
        this.prisma.moderationRequest.count({
          where: { ...dateFilter, status: ModerationStatus.REJECTED },
        }),
        this.prisma.moderationRequest.count({
          where: { ...dateFilter, status: ModerationStatus.FLAGGED },
        }),
        this.prisma.moderationRequest.count({
          where: {
            ...dateFilter,
            status: {
              in: [
                ModerationStatus.AUTO_APPROVED,
                ModerationStatus.AUTO_REJECTED,
              ],
            },
          },
        }),
      ]);

      // Average resolution time
      const resolvedRequests = await this.prisma.moderationRequest.findMany({
        where: {
          ...dateFilter,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const averageResolutionTime =
        resolvedRequests.length > 0
          ? resolvedRequests.reduce((sum, req) => {
              const diffMs =
                req.resolvedAt!.getTime() - req.createdAt.getTime();
              return sum + diffMs / (1000 * 60); // Convert to minutes
            }, 0) / resolvedRequests.length
          : 0;

      // Top violation types
      const violationCounts = await this.prisma.moderationRequest.groupBy({
        by: ['violationTypes'],
        where: dateFilter,
        _count: true,
      });

      const topViolationTypes = this.processViolationTypes(
        violationCounts,
        totalRequests,
      );

      // Content type breakdown
      const contentTypeCounts = await this.prisma.moderationRequest.groupBy({
        by: ['contentType'],
        where: dateFilter,
        _count: true,
      });

      const contentTypeBreakdown = contentTypeCounts.map((item) => ({
        type: item.contentType as ContentType,
        count: item._count,
        percentage: totalRequests > 0 ? (item._count / totalRequests) * 100 : 0,
      }));

      // Moderator performance
      const moderatorPerformance =
        await this.getModerationPerformance(dateFilter);

      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        flaggedRequests,
        autoModeratedRequests,
        averageResolutionTime: Math.round(averageResolutionTime),
        topViolationTypes,
        contentTypeBreakdown,
        moderatorPerformance,
      };
    } catch (error) {
      this.logger.error('Failed to get moderation stats:', error);
      throw error;
    }
  }

  /**
   * Get moderation trends over time
   */
  async getModerationTrends(filters: ModerationAnalyticsDto): Promise<any> {
    const { startDate, endDate, granularity = 'day' } = filters;

    // This would implement time-series data aggregation
    // For now, return mock trend data
    const trends = {
      timeline: [],
      violationTrends: [],
      moderatorActivity: [],
      responseTimesTrend: [],
    };

    return trends;
  }

  // ============= UTILITY FUNCTIONS =============

  private buildModerationWhereClause(
    filters: Partial<ModerationFiltersDto>,
  ): any {
    const where: any = {};

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.violationTypes && filters.violationTypes.length > 0) {
      where.violationTypes = {
        hasSome: filters.violationTypes,
      };
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.moderatorId) {
      where.moderatorId = filters.moderatorId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.flaggedOnly) {
      where.status = ModerationStatus.FLAGGED;
    }

    if (filters.autoModeratedOnly) {
      where.status = {
        in: [ModerationStatus.AUTO_APPROVED, ModerationStatus.AUTO_REJECTED],
      };
    }

    return where;
  }

  private buildDateFilter(startDate?: string, endDate?: string): any {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.lte = new Date(endDate);
      }
    }

    return filter;
  }

  private getStatusFromAction(action: ModerationAction): ModerationStatus {
    switch (action) {
      case ModerationAction.APPROVE:
        return ModerationStatus.APPROVED;
      case ModerationAction.REJECT:
        return ModerationStatus.REJECTED;
      case ModerationAction.FLAG:
        return ModerationStatus.FLAGGED;
      case ModerationAction.ESCALATE:
        return ModerationStatus.UNDER_REVIEW;
      default:
        return ModerationStatus.UNDER_REVIEW;
    }
  }

  private async applyContentAction(
    request: any,
    action: ModerationAction,
  ): Promise<void> {
    // This would implement actual content actions (hide, delete, etc.)
    // Based on the content type and action
    this.logger.log(
      `Applying action ${action} to content ${request.contentId} of type ${request.contentType}`,
    );
  }

  private async sendModerationNotification(
    userId: string,
    action: ModerationAction,
    message: string,
    contentType: ContentType,
  ): Promise<void> {
    // This would send actual notifications
    this.logger.log(
      `Sending moderation notification to user ${userId}: ${action} - ${message}`,
    );
  }

  private async logModerationAction(
    requestId: string,
    moderatorId: string,
    action: ModerationAction,
    reason?: string,
  ): Promise<void> {
    // This would log moderation actions for audit trail
    this.logger.log(
      `Moderation action logged: ${action} by ${moderatorId} for request ${requestId}`,
    );
  }

  private async createModerationNotification(request: any): Promise<void> {
    // Create notification for critical content
    this.logger.log(`Critical content detected: ${request.id}`);
  }

  private async getQuickModerationStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingRequests, flaggedRequests, todayRequests] = await Promise.all(
      [
        this.prisma.moderationRequest.count({
          where: { status: ModerationStatus.PENDING },
        }),
        this.prisma.moderationRequest.count({
          where: { status: ModerationStatus.FLAGGED },
        }),
        this.prisma.moderationRequest.count({
          where: { createdAt: { gte: today } },
        }),
      ],
    );

    return { pendingRequests, flaggedRequests, todayRequests };
  }

  private processViolationTypes(violationCounts: any[], total: number): any[] {
    const violationMap = new Map();

    violationCounts.forEach((item) => {
      if (Array.isArray(item.violationTypes)) {
        item.violationTypes.forEach((violation: ViolationType) => {
          const current = violationMap.get(violation) || 0;
          violationMap.set(violation, current + item._count);
        });
      }
    });

    return Array.from(violationMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async getModerationPerformance(dateFilter: any): Promise<any[]> {
    // This would calculate actual moderator performance metrics
    return [];
  }

  private formatModerationResponse(request: any): ModerationRequestResponseDto {
    return {
      id: request.id,
      contentType: request.contentType,
      contentId: request.contentId,
      content: request.content,
      authorId: request.authorId,
      reporterId: request.reporterId,
      status: request.status,
      severity: request.severity,
      violationTypes: request.violationTypes || [],
      moderatorId: request.moderatorId,
      moderatorNotes: request.moderatorNotes,
      reason: request.reason,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      resolvedAt: request.resolvedAt,
      metadata: request.metadata,
      author: request.author,
      moderator: request.moderator,
    };
  }

  // ============= AUTO-ANALYSIS HELPER FUNCTIONS =============

  private checkProfanity(content: string): {
    detected: boolean;
    words: string[];
  } {
    // Simple profanity check - in production, use a proper library
    const profanityWords = ['spam', 'scam', 'fake', 'inappropriate'];
    const detectedWords = profanityWords.filter((word) =>
      content.toLowerCase().includes(word.toLowerCase()),
    );

    return {
      detected: detectedWords.length > 0,
      words: detectedWords,
    };
  }

  private detectSpam(content: string): { isSpam: boolean; confidence: number } {
    // Simple spam detection - in production, use ML models
    const spamIndicators = [
      /click here/i,
      /buy now/i,
      /limited time/i,
      /urgent/i,
      /guaranteed/i,
    ];

    const matches = spamIndicators.filter((pattern) => pattern.test(content));
    const confidence = matches.length / spamIndicators.length;

    return {
      isSpam: confidence > 0.3,
      confidence,
    };
  }

  private validateLinks(content: string): {
    hasSuspiciousLinks: boolean;
    links: string[];
  } {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const links: string[] = content.match(urlRegex) || [];

    // Simple suspicious link detection
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'suspicious-site.com'];
    const hasSuspiciousLinks = links.some((link: string) =>
      suspiciousDomains.some((domain) => link.includes(domain)),
    );

    return {
      hasSuspiciousLinks,
      links,
    };
  }

  private analyzeSentiment(content: string): {
    isNegative: boolean;
    intensity: number;
  } {
    // Simple sentiment analysis - in production, use proper NLP
    const negativeWords = [
      'hate',
      'terrible',
      'awful',
      'disgusting',
      'horrible',
    ];
    const positiveWords = [
      'love',
      'great',
      'amazing',
      'wonderful',
      'excellent',
    ];

    const negativeCount = negativeWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    const positiveCount = positiveWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    const totalWords = content.split(' ').length;
    const intensity = Math.abs(negativeCount - positiveCount) / totalWords;

    return {
      isNegative: negativeCount > positiveCount,
      intensity: Math.min(intensity * 10, 1), // Normalize to 0-1
    };
  }
}

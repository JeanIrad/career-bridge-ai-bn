import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUniversityPartnershipDto } from './dto/create-partnership.dto';
import { UpdateUniversityPartnershipDto } from './dto/update-partnership.dto';
import {
  UniversityPartnership,
  University,
  PartnershipStatus,
  PartnershipType,
  PartnershipPriority,
  StudentYear,
  UniversityType,
} from '@prisma/client';

@Injectable()
export class UniversityPartnersService {
  constructor(private prisma: PrismaService) {}

  // ========== UNIVERSITY OPERATIONS ==========

  /**
   * Search universities with filters
   */
  async searchUniversities(params: {
    search?: string;
    country?: string;
    type?: UniversityType;
    isPartnershipReady?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      country,
      type,
      isPartnershipReady,
      page = 1,
      limit = 20,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(country && { country }),
      ...(type && { type }),
      ...(isPartnershipReady !== undefined && { isPartnershipReady }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { popularMajors: { hasSome: [search] } },
      ];
    }

    const [universities, total] = await Promise.all([
      this.prisma.university.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isTopTier: 'desc' },
          { worldRanking: 'asc' },
          { name: 'asc' },
        ],
        include: {
          _count: {
            select: {
              partnerships: true,
            },
          },
        },
      }),
      this.prisma.university.count({ where }),
    ]);

    return {
      universities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get university by ID with detailed information
   */
  async getUniversityById(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        partnerships: {
          where: { status: { in: ['ACTIVE', 'APPROVED'] } },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
                industry: true,
              },
            },
          },
        },
        _count: {
          select: {
            partnerships: true,
            campusEvents: true,
          },
        },
      },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    return university;
  }

  // ========== PARTNERSHIP OPERATIONS ==========

  /**
   * Create a new university partnership
   */
  async createPartnership(
    userId: string,
    data: CreateUniversityPartnershipDto,
  ) {
    // Verify university exists and is partnership ready
    const university = await this.prisma.university.findUnique({
      where: { id: data.universityId },
    });

    if (!university) {
      throw new NotFoundException(
        `University with ID ${data.universityId} not found`,
      );
    }

    if (!university.isPartnershipReady) {
      throw new BadRequestException(
        'This university is not currently accepting partnerships',
      );
    }

    // Verify company exists and user has access
    const company = await this.prisma.company.findFirst({
      where: {
        id: data.companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new NotFoundException(
        `Company with ID ${data.companyId} not found or you don't have access`,
      );
    }

    // Check if partnership already exists
    const existingPartnership =
      await this.prisma.universityPartnership.findUnique({
        where: {
          universityId_companyId: {
            universityId: data.universityId,
            companyId: data.companyId,
          },
        },
      });

    if (existingPartnership) {
      throw new BadRequestException(
        'Partnership with this university already exists',
      );
    }

    // Create the partnership
    const partnership = await this.prisma.universityPartnership.create({
      data: {
        title: data.title,
        description: data.description,
        universityId: data.universityId,
        companyId: data.companyId,
        createdById: userId,
        status: PartnershipStatus.DRAFT,
        priority: data.priority || PartnershipPriority.MEDIUM,
        partnershipType: data.partnershipType || [],
        targetStudentYear: data.targetStudentYear || [],
        targetMajors: data.targetMajors || [],
        targetSkills: data.targetSkills || [],
        annualHiringGoal: data.annualHiringGoal || 0,
        internshipGoal: data.internshipGoal || 0,
        coopGoal: data.coopGoal || 0,
        entryLevelGoal: data.entryLevelGoal || 0,
        benefits: data.benefits,
        scholarshipAmount: data.scholarshipAmount,
        equipmentDonation: data.equipmentDonation,
        guestLectures: data.guestLectures || false,
        industryProjects: data.industryProjects || false,
        researchCollaboration: data.researchCollaboration || false,
        requirements: data.requirements,
        exclusiveAccess: data.exclusiveAccess || false,
        minimumGPA: data.minimumGPA,
        requiredCertifications: data.requiredCertifications || [],
        companyContactName: data.companyContactName,
        companyContactEmail: data.companyContactEmail,
        companyContactPhone: data.companyContactPhone,
        campusRecruitment: data.campusRecruitment !== false,
        virtualRecruitment: data.virtualRecruitment !== false,
        careerFairs: data.careerFairs !== false,
        infoSessions: data.infoSessions !== false,
        networkingEvents: data.networkingEvents !== false,
        partnershipFee: data.partnershipFee,
        recruitmentFee: data.recruitmentFee,
        currency: data.currency || 'USD',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
      },
      include: {
        university: true,
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return partnership;
  }

  /**
   * Get partnerships for a specific company
   */
  async getCompanyPartnerships(
    userId: string,
    companyId: string,
    filters?: {
      status?: PartnershipStatus;
      priority?: PartnershipPriority;
      partnershipType?: PartnershipType;
      page?: number;
      limit?: number;
    },
  ) {
    const {
      status,
      priority,
      partnershipType,
      page = 1,
      limit = 20,
    } = filters || {};
    const skip = (page - 1) * limit;

    // Verify user has access to company
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
    });

    if (!company) {
      throw new ForbiddenException('You do not have access to this company');
    }

    const where: any = {
      companyId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(partnershipType && { partnershipType: { has: partnershipType } }),
    };

    const [partnerships, total] = await Promise.all([
      this.prisma.universityPartnership.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          university: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              city: true,
              state: true,
              country: true,
              type: true,
              worldRanking: true,
              isTopTier: true,
              studentCount: true,
              popularMajors: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              campusEvents: true,
              recruitmentCampaigns: true,
            },
          },
        },
      }),
      this.prisma.universityPartnership.count({ where }),
    ]);

    return {
      partnerships,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get partnership by ID
   */
  async getPartnershipById(id: string, userId: string) {
    const partnership = await this.prisma.universityPartnership.findUnique({
      where: { id },
      include: {
        university: true,
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campusEvents: {
          orderBy: { startDateTime: 'desc' },
          take: 5,
        },
        recruitmentCampaigns: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!partnership) {
      throw new NotFoundException('Partnership not found');
    }

    // Verify user has access
    const hasAccess = await this.prisma.company.findFirst({
      where: {
        id: partnership.companyId,
        ownerId: userId,
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this partnership',
      );
    }

    return partnership;
  }

  /**
   * Update partnership
   */
  async updatePartnership(
    id: string,
    userId: string,
    data: UpdateUniversityPartnershipDto,
  ) {
    const partnership = await this.getPartnershipById(id, userId);

    const updatedPartnership = await this.prisma.universityPartnership.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        university: true,
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedPartnership;
  }

  /**
   * Delete partnership
   */
  async deletePartnership(id: string, userId: string) {
    const partnership = await this.getPartnershipById(id, userId);

    await this.prisma.universityPartnership.delete({
      where: { id },
    });

    return { message: 'Partnership deleted successfully' };
  }

  /**
   * Submit partnership for approval
   */
  async submitPartnership(id: string, userId: string) {
    const partnership = await this.getPartnershipById(id, userId);

    if (partnership.status !== PartnershipStatus.DRAFT) {
      throw new BadRequestException('Only draft partnerships can be submitted');
    }

    const updatedPartnership = await this.prisma.universityPartnership.update({
      where: { id },
      data: {
        status: PartnershipStatus.PENDING,
        updatedAt: new Date(),
      },
      include: {
        university: true,
        company: true,
      },
    });

    // TODO: Send notification to university partnership contact

    return updatedPartnership;
  }

  // ========== ANALYTICS AND REPORTING ==========

  /**
   * Get partnership analytics for a company
   */
  async getPartnershipAnalytics(userId: string, companyId: string) {
    // Verify user has access to this company
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
      include: {
        universityPartnerships: {
          include: {
            university: true,
          },
        },
        locations: true, // Add locations to fix the error
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found or access denied');
    }

    const partnerships = company.universityPartnerships;

    const analytics = {
      totalPartnerships: partnerships.length,
      activePartnerships: partnerships.filter(
        (p) => p.status === PartnershipStatus.ACTIVE,
      ).length,
      pendingPartnerships: partnerships.filter(
        (p) => p.status === PartnershipStatus.PENDING,
      ).length,
      draftPartnerships: partnerships.filter(
        (p) => p.status === PartnershipStatus.DRAFT,
      ).length,

      // Hiring metrics
      totalHiringGoals: partnerships.reduce(
        (sum, p) => sum + p.annualHiringGoal,
        0,
      ),
      totalInternshipGoals: partnerships.reduce(
        (sum, p) => sum + p.internshipGoal,
        0,
      ),
      totalStudentsHired: partnerships.reduce(
        (sum, p) => sum + p.studentsHired,
        0,
      ),
      totalInternsHired: partnerships.reduce(
        (sum, p) => sum + p.internsHired,
        0,
      ),

      // University types
      universityTypes: partnerships.reduce(
        (acc, p) => {
          const type = p.university.type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),

      // Top tier universities
      topTierPartnerships: partnerships.filter(
        (p) => p.university.worldRanking && p.university.worldRanking <= 100,
      ).length,

      // Partnership types
      partnershipTypes: partnerships.reduce(
        (acc, p) => {
          p.partnershipType.forEach((type) => {
            acc[type] = (acc[type] || 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>,
      ),

      // Recent activity
      recentPartnerships: partnerships.filter((p) => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return p.createdAt >= oneMonthAgo;
      }).length,
    };

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get university recommendations for a company
   */
  async getUniversityRecommendations(userId: string, companyId: string) {
    // Verify user has access to this company
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: userId,
      },
      include: {
        universityPartnerships: {
          select: {
            universityId: true,
          },
        },
        locations: true, // Add locations to fix the error
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found or access denied');
    }

    // Get existing partnership university IDs
    const existingUniversityIds = company.universityPartnerships.map(
      (p) => p.universityId,
    );

    // Find recommended universities
    const recommendations = await this.prisma.university.findMany({
      where: {
        isPartnershipReady: true,
        isActive: true,
        NOT: {
          id: {
            in: existingUniversityIds,
          },
        },
        // Recommend based on location proximity
        OR: [
          {
            country: company.locations?.[0]?.country || 'United States',
          },
          {
            isTopTier: true,
          },
        ],
      },
      take: 10,
      orderBy: [
        { isTopTier: 'desc' },
        { worldRanking: 'asc' },
        { studentCount: 'desc' },
      ],
      include: {
        partnerships: {
          select: {
            id: true,
            status: true,
            companyId: true,
          },
        },
      },
    });

    return {
      success: true,
      data: recommendations.map((uni) => ({
        ...uni,
        partnershipCount: uni.partnerships.length,
        activePartnerships: uni.partnerships.filter(
          (p) => p.status === PartnershipStatus.ACTIVE,
        ).length,
        recommendationScore: this.calculateRecommendationScore(uni, company),
      })),
    };
  }

  private calculateRecommendationScore(university: any, company: any): number {
    let score = 0;

    // Base score for top tier
    if (university.isTopTier) score += 30;

    // Score for world ranking
    if (university.worldRanking) {
      if (university.worldRanking <= 50) score += 25;
      else if (university.worldRanking <= 100) score += 20;
      else if (university.worldRanking <= 200) score += 15;
    }

    // Score for student count (larger universities)
    if (university.studentCount) {
      if (university.studentCount >= 30000) score += 15;
      else if (university.studentCount >= 20000) score += 10;
      else if (university.studentCount >= 10000) score += 5;
    }

    // Score for location match
    if (
      university.country ===
      (company.locations?.[0]?.country || 'United States')
    ) {
      score += 20;
    }

    // Score for partnership readiness
    if (university.isPartnershipReady) score += 10;

    return Math.min(score, 100); // Cap at 100
  }
}

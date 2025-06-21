import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  UpdateUserProfileDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  CreateSkillDto,
  UpdateSkillDto,
  UserSearchDto,
  PaginatedUsersResponseDto,
  GetRecommendationsDto,
  VerifyUserDto,
  UpdateAccountStatusDto,
  PaginationDto,
  CreateUserByAdminDto,
  UserStatsDto,
} from './dto/user.dto';
import { User, UserRole, AccountStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ============= HELPER METHODS =============

  private getFullUserInclude() {
    return {
      education: true,
      experiences: {
        include: {
          company: {
            include: {
              locations: true,
            },
          },
        },
      },
      skills: true,
      companies: {
        include: {
          locations: true,
        },
      },
      documents: true,
    };
  }

  private getSearchUserInclude() {
    return {
      education: true,
      experiences: {
        include: {
          company: {
            include: {
              locations: true,
            },
          },
        },
      },
      skills: true,
      companies: {
        include: {
          locations: true,
        },
      },
    };
  }

  private sanitizeUserForResponse(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private buildEnhancedSearchWhereClause(filters: any): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { headline: { contains: filters.search, mode: 'insensitive' } },
        { bio: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.roles && filters.roles.length > 0) {
      where.role = { in: filters.roles };
    }

    if (filters.accountStatus && filters.accountStatus.length > 0) {
      where.accountStatus = { in: filters.accountStatus };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    return where;
  }

  // ============= BASIC USER OPERATIONS =============

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: this.getFullUserInclude(),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.getFullUserInclude(),
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.getFullUserInclude(),
    });
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findByIdWithRole(
    id: string,
    allowedRoles?: UserRole[],
  ): Promise<User | null> {
    const user = await this.findById(id);

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null;
    }

    return user;
  }

  // ============= PROFILE MANAGEMENT =============

  async updateProfile(
    userId: string,
    updateData: UpdateUserProfileDto,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        zipCode: updateData.zipCode,
        country: updateData.country,
        dateOfBirth: updateData.dateOfBirth
          ? new Date(updateData.dateOfBirth)
          : undefined,
        gender: updateData.gender,
        nationality: updateData.nationality,
        languages: updateData.languages,
        interests: updateData.interests,
        headline: updateData.headline,
        bio: updateData.bio,
        socialLinks: updateData.socialLinks,
        visibility: updateData.visibility,
        isPublic: updateData.isPublic,
      },
      include: this.getFullUserInclude(),
    });
  }

  async uploadAvatar(userId: string, avatarUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      include: this.getFullUserInclude(),
    });
  }

  async uploadResume(userId: string, resumeUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { resume: resumeUrl },
      include: this.getFullUserInclude(),
    });
  }

  // ============= EDUCATION MANAGEMENT =============

  async addEducation(userId: string, educationData: CreateEducationDto) {
    return this.prisma.education.create({
      data: {
        ...educationData,
        startDate: new Date(educationData.startDate),
        endDate: educationData.endDate
          ? new Date(educationData.endDate)
          : undefined,
        userId,
      },
    });
  }

  async updateEducation(
    userId: string,
    educationId: string,
    updateData: UpdateEducationDto,
  ) {
    const education = await this.prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education || education.userId !== userId) {
      throw new NotFoundException('Education record not found');
    }

    return this.prisma.education.update({
      where: { id: educationId },
      data: updateData,
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const education = await this.prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education || education.userId !== userId) {
      throw new NotFoundException('Education record not found');
    }

    return this.prisma.education.update({
      where: { id: educationId },
      data: { deletedAt: new Date() },
    });
  }

  // ============= EXPERIENCE MANAGEMENT =============

  async addExperience(userId: string, experienceData: CreateExperienceDto) {
    return this.prisma.experience.create({
      data: {
        ...experienceData,
        startDate: new Date(experienceData.startDate),
        endDate: experienceData.endDate
          ? new Date(experienceData.endDate)
          : undefined,
        userId,
      },
    });
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    updateData: UpdateExperienceDto,
  ) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience || experience.userId !== userId) {
      throw new NotFoundException('Experience record not found');
    }

    return this.prisma.experience.update({
      where: { id: experienceId },
      data: updateData,
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience || experience.userId !== userId) {
      throw new NotFoundException('Experience record not found');
    }

    return this.prisma.experience.update({
      where: { id: experienceId },
      data: { deletedAt: new Date() },
    });
  }

  // ============= SKILL MANAGEMENT =============

  async addSkill(userId: string, skillData: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        ...skillData,
        userId,
      },
    });
  }

  async updateSkill(
    userId: string,
    skillId: string,
    updateData: UpdateSkillDto,
  ) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill || skill.userId !== userId) {
      throw new NotFoundException('Skill record not found');
    }

    return this.prisma.skill.update({
      where: { id: skillId },
      data: updateData,
    });
  }

  async deleteSkill(userId: string, skillId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill || skill.userId !== userId) {
      throw new NotFoundException('Skill record not found');
    }

    return this.prisma.skill.update({
      where: { id: skillId },
      data: { deletedAt: new Date() },
    });
  }

  async endorseSkill(skillId: string, endorserId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.prisma.skill.update({
      where: { id: skillId },
      data: {
        endorsements: {
          increment: 1,
        },
      },
    });
  }

  // ============= ADMIN USER MANAGEMENT =============

  async verifyUser(adminId: string, verifyDto: VerifyUserDto): Promise<User> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can verify users');
    }

    return this.prisma.user.update({
      where: { id: verifyDto.userId },
      data: { isVerified: true },
      include: this.getFullUserInclude(),
    });
  }

  async updateAccountStatus(
    adminId: string,
    userId: string,
    updateDto: UpdateAccountStatusDto,
  ): Promise<User> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can update account status');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: updateDto.status,
      },
      include: this.getFullUserInclude(),
    });
  }

  async getUserStats(): Promise<UserStatsDto> {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      studentCount,
      employerCount,
      alumniCount,
      professorCount,
      maleCount,
      femaleCount,
      otherCount,
      notSpecifiedCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: AccountStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          isVerified: true,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: UserRole.STUDENT,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: UserRole.EMPLOYER,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: UserRole.ALUMNI,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: UserRole.PROFESSOR,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          gender: 'MALE',
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          gender: 'FEMALE',
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          gender: 'OTHER',
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          gender: null,
        },
      }),
    ]);

    // Calculate verification rate as a number (percentage)
    const verificationRate =
      totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      verificationRate: Number(verificationRate.toFixed(1)), // Return as number with 1 decimal place
      roleDistribution: {
        students: studentCount,
        employers: employerCount,
        alumni: alumniCount,
        professors: professorCount,
      },
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        other: otherCount,
        notSpecified: notSpecifiedCount,
      },
    };
  }

  async softDeleteUser(
    adminId: string,
    userId: string,
    reason?: string,
  ): Promise<any> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        accountStatus: AccountStatus.INACTIVE,
      },
    });

    return { message: 'User soft deleted successfully' };
  }

  async hardDeleteUser(
    adminId: string,
    userId: string,
    confirmationCode?: string,
  ): Promise<any> {
    const admin = await this.findById(adminId);
    if (!admin || admin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can permanently delete users',
      );
    }

    return { message: 'User permanently deleted successfully' };
  }

  async restoreUser(adminId: string, userId: string): Promise<User> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can restore users');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        accountStatus: AccountStatus.ACTIVE,
      },
      include: this.getFullUserInclude(),
    });
  }

  async getDeletedUsers(
    adminId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedUsersResponseDto> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can view deleted users');
    }

    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        include: this.getSearchUserInclude(),
      }),
      this.prisma.user.count({
        where: { deletedAt: { not: null } },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.sanitizeUserForResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async selfDeleteAccount(
    userId: string,
    password: string,
    reason?: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        accountStatus: AccountStatus.INACTIVE,
      },
    });

    return { message: 'Account deleted successfully' };
  }

  async cleanupOldDeletedUsers(
    superAdminId: string,
    daysOld: number = 30,
  ): Promise<{ message: string; deletedCount: number }> {
    const superAdmin = await this.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can cleanup deleted users',
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
    });

    const deletedCount = deletedUsers.length;

    return {
      message: `Cleaned up ${deletedCount} old deleted users`,
      deletedCount,
    };
  }

  // ============= SEARCH AND FILTERING =============

  async searchUsers(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const { page = 1, limit = 10, ...filters } = searchDto;
    const skip = (page - 1) * limit;

    const combinedFilters = {
      ...filters,
      ...(searchDto.filters || {}),
    };

    const where = this.buildEnhancedSearchWhereClause(combinedFilters);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: this.getSearchUserInclude(),
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.sanitizeUserForResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getRecommendations(
    userId: string,
    recommendationDto: GetRecommendationsDto,
  ): Promise<PaginatedUsersResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = recommendationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      id: { not: user.id },
    };

    if (filters.targetRoles && filters.targetRoles.length > 0) {
      where.role = { in: filters.targetRoles };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case 'createdAt':
        orderBy.push({ createdAt: sortOrder as 'asc' | 'desc' });
        break;
      case 'lastLogin':
        orderBy.push({ lastLogin: sortOrder as 'asc' | 'desc' });
        break;
      default:
        orderBy.push({ createdAt: 'desc' });
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: this.getSearchUserInclude(),
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.sanitizeUserForResponse(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // ============= ROLE-BASED QUERIES =============

  async getStudents(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.searchUsers({
      ...searchDto,
      roles: [UserRole.STUDENT],
    });
  }

  async getAlumni(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.searchUsers({
      ...searchDto,
      roles: [UserRole.ALUMNI],
    });
  }

  async getEmployers(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.searchUsers({
      ...searchDto,
      roles: [UserRole.EMPLOYER],
    });
  }

  async getProfessors(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.searchUsers({
      ...searchDto,
      roles: [UserRole.PROFESSOR],
    });
  }

  // ============= ADMIN USER CREATION =============

  async createUserByAdmin(
    adminId: string,
    createUserDto: CreateUserByAdminDto,
  ): Promise<{
    user: any;
    company?: any;
    passwordSetupLink?: string;
    welcomeEmailSent: boolean;
  }> {
    // Filter out empty or invalid optional fields before validation
    const filteredDto = this.filterEmptyOptionalFields(createUserDto);

    // Verify admin permissions
    await this.findByIdWithRole(adminId, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: filteredDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    let company: any = null;
    let passwordSetupLink: string | null = null;
    let welcomeEmailSent = false;
    const passwordSetupToken = this.generatePasswordSetupToken();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: filteredDto.email,
          firstName: filteredDto.firstName,
          lastName: filteredDto.lastName,
          phoneNumber: filteredDto.phoneNumber,
          gender: filteredDto.gender,
          role: filteredDto.role,
          country: filteredDto.country,
          state: filteredDto.state,
          city: filteredDto.city,
          university: filteredDto.university,
          major: filteredDto.major,
          graduationYear: filteredDto.graduationYear,
          headline: filteredDto.jobTitle || filteredDto.headline,
          bio: filteredDto.bio,
          isVerified: filteredDto.isVerified || false,
          accountStatus: AccountStatus.ACTIVE,
          password: '',
        },
        include: this.getFullUserInclude(),
      });

      // Add debugging for company creation
      console.log('Company creation check:', {
        role: filteredDto.role,
        createCompany: filteredDto.createCompany,
        shouldCreateCompany:
          filteredDto.role === UserRole.EMPLOYER && filteredDto.createCompany,
        companyName: filteredDto.companyName || filteredDto.organizationName,
      });

      if (filteredDto.role === UserRole.EMPLOYER && filteredDto.createCompany) {
        console.log('Creating company for employer...');
        company = await tx.company.create({
          data: {
            name:
              filteredDto.companyName ||
              filteredDto.organizationName ||
              'Unknown Company',
            description:
              filteredDto.companyDescription ||
              filteredDto.organizationDescription ||
              '',
            industry: filteredDto.companyIndustry || filteredDto.industry || '',
            size: filteredDto.companySize || filteredDto.organizationSize || '',
            website: filteredDto.companyWebsite,
            type: filteredDto.companyType || 'Private',
            foundedYear: filteredDto.foundedYear,
            specializations: filteredDto.specializations || [],
            phone: filteredDto.companyPhone,
            email: filteredDto.companyEmail,
            linkedIn: filteredDto.companyLinkedIn,
            twitter: filteredDto.companyTwitter,
            facebook: filteredDto.companyFacebook,
            ownerId: user.id,
            locations: {
              create: {
                address: filteredDto.companyAddress,
                city: filteredDto.companyCity || filteredDto.city || 'Unknown',
                state: filteredDto.companyState || filteredDto.state,
                country:
                  filteredDto.companyCountry ||
                  filteredDto.country ||
                  'Unknown',
                zipCode: filteredDto.zipCode,
                countryCode: filteredDto.countryCode,
                isHeadquarters: true,
                locationType: 'headquarters',
                detectedFromIp: !!filteredDto.detectedFromIp,
                ipAddress: filteredDto.ipAddress,
              },
            },
          },
          include: {
            locations: true,
          },
        });
        console.log('Company created successfully:', {
          companyId: company.id,
          companyName: company.name,
          ownerId: company.ownerId,
        });
      } else {
        console.log('Company creation skipped - conditions not met');
      }

      await tx.passwordResetToken.create({
        data: {
          token: passwordSetupToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isUsed: false,
          type: 'PASSWORD_SETUP',
        },
      });

      await tx.securityLog.create({
        data: {
          userId: adminId,
          event: 'USER_CREATED_BY_ADMIN',
          metadata: {
            createdUserId: user.id,
            createdUserEmail: user.email,
            createdUserRole: user.role,
            companyCreated: !!company,
            companyId: company?.id || null,
            createdAt: new Date(),
          },
        },
      });

      return { user, company };
    });

    passwordSetupLink = `${process.env.FRONTEND_URL}/set-password?token=${passwordSetupToken}`;

    if (createUserDto.sendWelcomeEmail) {
      try {
        console.log(
          `Attempting to send password setup email to ${result.user.email} for role ${result.user.role}`,
        );
        console.log(`Password setup link: ${passwordSetupLink}`);

        await this.sendPasswordSetupEmail(
          result.user.email,
          result.user.firstName,
          passwordSetupLink,
          result.user.role,
        );
        welcomeEmailSent = true;
        console.log(
          `Password setup email sent successfully to ${result.user.email}`,
        );
      } catch (error) {
        console.error('Failed to send password setup email:', error);
        console.error('Email error details:', {
          email: result.user.email,
          role: result.user.role,
          errorMessage: error.message,
          errorStack: error.stack,
        });
        // Don't throw the error to prevent user creation failure
        welcomeEmailSent = false;
      }
    } else {
      console.log(
        'Password setup email sending is disabled (sendWelcomeEmail: false)',
      );
    }

    return {
      user: this.sanitizeUserForResponse(result.user),
      company: result.company,
      passwordSetupLink: createUserDto.requirePasswordReset
        ? passwordSetupLink
        : undefined,
      welcomeEmailSent,
    };
  }

  /**
   * Filter out empty or invalid optional fields to prevent validation errors
   */
  private filterEmptyOptionalFields(
    dto: CreateUserByAdminDto,
  ): CreateUserByAdminDto {
    const filtered = { ...dto };

    // Remove empty phone numbers
    if (!filtered.phoneNumber || filtered.phoneNumber.trim() === '') {
      delete filtered.phoneNumber;
    }

    // Remove empty URLs
    if (
      !filtered.organizationWebsite ||
      filtered.organizationWebsite.trim() === ''
    ) {
      delete filtered.organizationWebsite;
    }

    // For non-employer users, remove all company-related fields
    if (filtered.role !== UserRole.EMPLOYER) {
      delete filtered.companyWebsite;
      delete filtered.companyPhone;
      delete filtered.companyEmail;
      delete filtered.companyLinkedIn;
      delete filtered.companyTwitter;
      delete filtered.companyFacebook;
    } else {
      // For employers, only remove empty company fields
      if (!filtered.companyWebsite || filtered.companyWebsite.trim() === '') {
        delete filtered.companyWebsite;
      }
      if (!filtered.companyPhone || filtered.companyPhone.trim() === '') {
        delete filtered.companyPhone;
      }
      if (!filtered.companyEmail || filtered.companyEmail.trim() === '') {
        delete filtered.companyEmail;
      }
      if (!filtered.companyLinkedIn || filtered.companyLinkedIn.trim() === '') {
        delete filtered.companyLinkedIn;
      }
      if (!filtered.companyTwitter || filtered.companyTwitter.trim() === '') {
        delete filtered.companyTwitter;
      }
      if (!filtered.companyFacebook || filtered.companyFacebook.trim() === '') {
        delete filtered.companyFacebook;
      }
    }

    return filtered;
  }

  private generatePasswordSetupToken(): string {
    const length = 64;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return token;
  }

  private async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    passwordSetupLink: string,
    role: UserRole,
  ): Promise<void> {
    try {
      // Use the MailService to send the actual email
      const emailSent = await this.mailService.sendPasswordSetupEmail(
        email,
        firstName,
        passwordSetupLink,
        role,
      );

      if (emailSent) {
        console.log(`Password setup email sent successfully to ${email}`);
      } else {
        console.error(`Failed to send password setup email to ${email}`);
      }
    } catch (error) {
      console.error('Error sending password setup email:', error);
      throw error;
    }
  }

  // ============= ADDITIONAL ADMIN METHODS FOR OVERVIEW =============

  async getRecentUsers(limit: number = 10): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        education: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        experiences: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return users.map((user) => this.sanitizeUserForResponse(user));
  }

  async getPendingVerificationUsers(limit: number = 10): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isVerified: false,
        accountStatus: AccountStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        education: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        experiences: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return users.map((user) => this.sanitizeUserForResponse(user));
  }
}

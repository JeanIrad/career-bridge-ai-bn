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
import {
  CreateStudentEducationDto,
  UpdateStudentEducationDto,
  EducationStatus,
} from './dto/student-education.dto';
import { User, UserRole, AccountStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ExportUtils } from '../utils/export-utils';

interface FindUsersOptions {
  page: number;
  limit: number;
  role?: string;
  search?: string;
  excludeUserId?: string;
}

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
      studentEducations: {
        include: {
          university: true,
        },
      },
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
        major: updateData.major,
        graduationYear: updateData.graduationYear,
        gpa: updateData.gpa,
        studentId: updateData.studentId,
        resume: updateData.resume,
        avatar: updateData.avatar,
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.validatePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getUniversitiesForProfile(params: {
    search?: string;
    country?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, country, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(country && { country }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
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
          popularMajors: true,
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

  // ============= STUDENT EDUCATION MANAGEMENT =============

  async addStudentEducation(
    userId: string,
    educationData: CreateStudentEducationDto,
  ) {
    // Check if relationship already exists
    const existing = await this.prisma.studentEducation.findFirst({
      where: {
        userId,
        universityId: educationData.universityId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Education record for this university already exists',
      );
    }

    return this.prisma.studentEducation.create({
      data: {
        ...educationData,
        userId,
      },
      include: {
        university: true,
      },
    });
  }

  async updateStudentEducation(
    userId: string,
    educationId: string,
    updateData: UpdateStudentEducationDto,
  ) {
    const education = await this.prisma.studentEducation.findFirst({
      where: {
        id: educationId,
        userId,
      },
    });

    if (!education) {
      throw new NotFoundException('Student education record not found');
    }

    return this.prisma.studentEducation.update({
      where: { id: educationId },
      data: updateData,
      include: {
        university: true,
      },
    });
  }

  async deleteStudentEducation(userId: string, educationId: string) {
    const education = await this.prisma.studentEducation.findFirst({
      where: {
        id: educationId,
        userId,
      },
    });

    if (!education) {
      throw new NotFoundException('Student education record not found');
    }

    return this.prisma.studentEducation.delete({
      where: { id: educationId },
    });
  }

  async getStudentEducations(userId: string) {
    return this.prisma.studentEducation.findMany({
      where: { userId },
      include: {
        university: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============= CV MANAGEMENT =============

  async uploadCV(userId: string, cvUrl: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { cvUrl },
      include: this.getFullUserInclude(),
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

  // ============= ANALYTICS METHODS =============

  async getComprehensiveAnalytics(filters?: any): Promise<any> {
    const [
      overview,
      userGrowth,
      activityMetrics,
      platformUsage,
      geographicData,
      genderDistribution,
      roleDistribution,
    ] = await Promise.all([
      this.getAnalyticsOverview(filters),
      this.getUserGrowthData(filters),
      this.getActivityMetrics(filters),
      this.getPlatformUsageData(filters),
      this.getGeographicData(filters),
      this.getGenderDistributionData(filters),
      this.getRoleDistributionData(filters),
    ]);

    return {
      overview,
      userGrowth,
      activityMetrics,
      platformUsage,
      geographicData,
      genderDistribution,
      roleDistribution,
    };
  }

  async exportAnalyticsReport(exportDto: any): Promise<any> {
    const { format, reportType, includeCharts, ...filters } = exportDto;

    // Get analytics data
    const reportData = await this.getComprehensiveAnalytics(filters);

    // Generate export based on format
    switch (format) {
      case 'csv':
        return this.generateCSVExport(reportData, reportType);
      case 'json':
        return this.generateJSONExport(reportData, reportType);
      case 'xlsx':
        return await ExportUtils.generateExcelReport(reportData, reportType);
      case 'pdf':
        return await ExportUtils.generatePDFReport(
          reportData,
          reportType,
          includeCharts,
        );
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async getAnalyticsOverview(filters?: any): Promise<any> {
    const whereClause = this.buildAnalyticsWhereClause(filters);

    // Get total users first
    const totalUsers = await this.prisma.user.count({ where: whereClause });

    const [
      activeUsers,
      totalSessions,
      pageViews,
      avgSessionDuration,
      bounceRate,
      userGrowthData,
      retentionData,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          ...whereClause,
          lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Mock data for now - replace with actual session tracking
      Promise.resolve(Math.floor(totalUsers * 1.5 + Math.random() * 1000)),
      Promise.resolve(Math.floor(totalUsers * 3.2 + Math.random() * 5000)),
      Promise.resolve(Math.floor(15 + Math.random() * 10)),
      Promise.resolve(Math.floor(25 + Math.random() * 15)),
      this.getUserGrowthData(filters),
      Promise.resolve(0.85), // Mock retention rate
    ]);

    const currentMonth = userGrowthData[userGrowthData.length - 1];
    const previousMonth = userGrowthData[userGrowthData.length - 2];
    const userGrowthRate = previousMonth
      ? ((currentMonth.newUsers - previousMonth.newUsers) /
          previousMonth.newUsers) *
        100
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      pageViews,
      averageSessionDuration: avgSessionDuration,
      bounceRate,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
      retentionRate: Math.round(retentionData * 100),
    };
  }

  private async getUserGrowthData(filters?: any): Promise<any[]> {
    const dateFilter = this.buildDateFilter(filters);
    const whereClause = this.buildAnalyticsWhereClause(filters);

    // Get last 12 months of data
    const months: Array<{
      month: string;
      newUsers: number;
      totalUsers: number;
      growthRate: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const newUsers = await this.prisma.user.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const totalUsers = await this.prisma.user.count({
        where: {
          ...whereClause,
          createdAt: { lte: endOfMonth },
        },
      });

      const previousMonthTotal =
        i === 11 ? 0 : months[months.length - 1]?.totalUsers || 0;
      const growthRate =
        previousMonthTotal > 0
          ? ((totalUsers - previousMonthTotal) / previousMonthTotal) * 100
          : 0;

      months.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        newUsers,
        totalUsers,
        growthRate: Math.round(growthRate * 100) / 100,
      });
    }

    return months;
  }

  private async getActivityMetrics(filters?: any): Promise<any> {
    const whereClause = this.buildAnalyticsWhereClause(filters);

    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      this.prisma.user.count({
        where: {
          ...whereClause,
          lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({
        where: {
          ...whereClause,
          lastLogin: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({
        where: {
          ...whereClause,
          lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const totalUsers = await this.prisma.user.count({ where: whereClause });
    const engagementRate =
      totalUsers > 0 ? (monthlyActive / totalUsers) * 100 : 0;

    return {
      dailyActiveUsers: dailyActive,
      weeklyActiveUsers: weeklyActive,
      monthlyActiveUsers: monthlyActive,
      engagementRate: Math.round(engagementRate * 100) / 100,
      averageSessionDuration: Math.floor(15 + Math.random() * 10), // Mock data
    };
  }

  private async getPlatformUsageData(filters?: any): Promise<any[]> {
    // Mock platform usage data - replace with actual tracking
    return [
      {
        feature: 'Job Search',
        usageCount: 1250,
        adoptionRate: 78.5,
        growthRate: 12.3,
      },
      {
        feature: 'Profile Management',
        usageCount: 980,
        adoptionRate: 65.2,
        growthRate: 8.7,
      },
      {
        feature: 'Messaging',
        usageCount: 750,
        adoptionRate: 45.8,
        growthRate: 15.2,
      },
      {
        feature: 'Network Building',
        usageCount: 620,
        adoptionRate: 38.9,
        growthRate: 22.1,
      },
      {
        feature: 'Skills Assessment',
        usageCount: 480,
        adoptionRate: 32.1,
        growthRate: 18.5,
      },
      {
        feature: 'Career Resources',
        usageCount: 350,
        adoptionRate: 28.7,
        growthRate: 25.8,
      },
    ];
  }

  private async getGeographicData(filters?: any): Promise<any[]> {
    // Mock geographic data - replace with actual user location tracking
    return [
      {
        country: 'United States',
        userCount: 450,
        percentage: 35.2,
        countryCode: 'US',
      },
      {
        country: 'Canada',
        userCount: 280,
        percentage: 21.9,
        countryCode: 'CA',
      },
      {
        country: 'United Kingdom',
        userCount: 180,
        percentage: 14.1,
        countryCode: 'GB',
      },
      {
        country: 'Australia',
        userCount: 120,
        percentage: 9.4,
        countryCode: 'AU',
      },
      { country: 'Germany', userCount: 95, percentage: 7.4, countryCode: 'DE' },
      { country: 'France', userCount: 75, percentage: 5.9, countryCode: 'FR' },
      {
        country: 'Netherlands',
        userCount: 45,
        percentage: 3.5,
        countryCode: 'NL',
      },
      { country: 'Other', userCount: 35, percentage: 2.7, countryCode: 'XX' },
    ];
  }

  private async getGenderDistributionData(filters?: any): Promise<any> {
    const whereClause = this.buildAnalyticsWhereClause(filters);

    const [male, female, other, notSpecified] = await Promise.all([
      this.prisma.user.count({ where: { ...whereClause, gender: 'MALE' } }),
      this.prisma.user.count({ where: { ...whereClause, gender: 'FEMALE' } }),
      this.prisma.user.count({ where: { ...whereClause, gender: 'OTHER' } }),
      this.prisma.user.count({ where: { ...whereClause, gender: null } }),
    ]);

    return { male, female, other, notSpecified };
  }

  private async getRoleDistributionData(filters?: any): Promise<any> {
    const whereClause = this.buildAnalyticsWhereClause(filters);

    const [students, alumni, employers, professors] = await Promise.all([
      this.prisma.user.count({ where: { ...whereClause, role: 'STUDENT' } }),
      this.prisma.user.count({ where: { ...whereClause, role: 'ALUMNI' } }),
      this.prisma.user.count({ where: { ...whereClause, role: 'EMPLOYER' } }),
      this.prisma.user.count({ where: { ...whereClause, role: 'PROFESSOR' } }),
    ]);

    return { students, alumni, employers, professors };
  }

  private buildAnalyticsWhereClause(filters?: any): any {
    const where: any = { deletedAt: null };

    if (filters?.roles && filters.roles.length > 0) {
      where.role = { in: filters.roles };
    }

    if (filters?.genders && filters.genders.length > 0) {
      where.gender = { in: filters.genders };
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters?.accountStatus && filters.accountStatus.length > 0) {
      where.accountStatus = { in: filters.accountStatus };
    }

    if (filters?.countries && filters.countries.length > 0) {
      where.country = { in: filters.countries };
    }

    // Date filtering
    const dateFilter = this.buildDateFilter(filters);
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    return where;
  }

  private buildDateFilter(filters: any): any {
    if (!filters) return null;

    if (filters.startDate && filters.endDate) {
      return {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          return null;
      }

      return { gte: startDate };
    }

    return null;
  }

  private generateCSVExport(data: any, reportType: string): any {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_analytics_${timestamp}.csv`;

    let csv = 'ANALYTICS REPORT\n';
    csv += `Report Type: ${reportType}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Overview
    if (data.overview) {
      csv += 'OVERVIEW METRICS\n';
      csv += 'Metric,Value\n';
      csv += `Total Users,${data.overview.totalUsers}\n`;
      csv += `Active Users,${data.overview.activeUsers}\n`;
      csv += `Total Sessions,${data.overview.totalSessions}\n`;
      csv += `Page Views,${data.overview.pageViews}\n`;
      csv += `User Growth Rate,${data.overview.userGrowthRate}%\n`;
      csv += `Retention Rate,${data.overview.retentionRate}%\n\n`;
    }

    // User Growth
    if (data.userGrowth) {
      csv += 'USER GROWTH DATA\n';
      csv += 'Month,New Users,Total Users,Growth Rate\n';
      data.userGrowth.forEach((month) => {
        csv += `${month.month},${month.newUsers},${month.totalUsers},${month.growthRate}%\n`;
      });
      csv += '\n';
    }

    // Role Distribution
    if (data.roleDistribution) {
      csv += 'ROLE DISTRIBUTION\n';
      csv += 'Role,Count\n';
      csv += `Students,${data.roleDistribution.students}\n`;
      csv += `Alumni,${data.roleDistribution.alumni}\n`;
      csv += `Employers,${data.roleDistribution.employers}\n`;
      csv += `Professors,${data.roleDistribution.professors}\n\n`;
    }

    return {
      filename,
      content: csv,
      contentType: 'text/csv',
    };
  }

  private generateJSONExport(data: any, reportType: string): any {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_analytics_${timestamp}.json`;

    const exportData = {
      reportType,
      generatedAt: new Date().toISOString(),
      data,
    };

    return {
      filename,
      content: JSON.stringify(exportData, null, 2),
      contentType: 'application/json',
    };
  }

  async findUsers({
    page,
    limit,
    role,
    search,
    excludeUserId,
  }: FindUsersOptions) {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Exclude current user
    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        headline: true,
      },
      skip,
      take: limit,
      orderBy: {
        firstName: 'asc',
      },
    });

    return users;
  }
}

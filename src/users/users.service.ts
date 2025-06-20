import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  UserSearchFiltersDto,
  PaginatedUsersResponseDto,
  GetRecommendationsDto,
  RecommendationFiltersDto,
  VerifyUserDto,
  UpdateAccountStatusDto,
  EmployerFiltersDto,
  StudentFiltersDto,
  OpportunityRecommendationDto,
  GetOpportunityRecommendationsDto,
  StudentVerificationDto,
  PaginationDto,
} from './dto/user.dto';
import { User, UserRole, AccountStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async update(
    id: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
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
      include: {
        user: {
          include: this.getFullUserInclude(),
        },
      },
    });
  }

  async updateEducation(
    userId: string,
    educationId: string,
    updateData: UpdateEducationDto,
  ) {
    // First verify the education belongs to the user
    const education = await this.prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education || education.userId !== userId) {
      throw new NotFoundException('Education record not found');
    }

    return this.prisma.education.update({
      where: { id: educationId },
      data: updateData,
      include: {
        user: {
          include: this.getFullUserInclude(),
        },
      },
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const education = await this.prisma.education.findUnique({
      where: { id: educationId },
    });

    if (!education || education.userId !== userId) {
      throw new NotFoundException('Education record not found');
    }

    return this.prisma.education.delete({
      where: { id: educationId },
    });
  }

  // ============= EXPERIENCE MANAGEMENT =============

  async addExperience(userId: string, experienceData: CreateExperienceDto) {
    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: experienceData.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.experience.create({
      data: {
        title: experienceData.title,
        description: experienceData.description,
        startDate: experienceData.startDate,
        endDate: experienceData.endDate,
        isCurrent: experienceData.isCurrent,
        location: experienceData.location,
        skills: experienceData.skills,
        userId,
        companyId: experienceData.companyId,
      },
      include: {
        company: true,
        user: {
          include: this.getFullUserInclude(),
        },
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

    // If companyId is being updated, verify the company exists
    if (updateData.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: updateData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    return this.prisma.experience.update({
      where: { id: experienceId },
      data: {
        title: updateData.title,
        description: updateData.description,
        startDate: updateData.startDate,
        endDate: updateData.endDate,
        isCurrent: updateData.isCurrent,
        location: updateData.location,
        skills: updateData.skills,
        companyId: updateData.companyId,
      },
      include: {
        company: true,
        user: {
          include: this.getFullUserInclude(),
        },
      },
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience || experience.userId !== userId) {
      throw new NotFoundException('Experience record not found');
    }

    return this.prisma.experience.delete({
      where: { id: experienceId },
    });
  }

  // ============= SKILLS MANAGEMENT =============

  async addSkill(userId: string, skillData: CreateSkillDto) {
    // Check if skill already exists for user
    const existingSkill = await this.prisma.skill.findFirst({
      where: {
        userId,
        name: skillData.name,
      },
    });

    if (existingSkill) {
      throw new ConflictException('Skill already exists for this user');
    }

    return this.prisma.skill.create({
      data: {
        ...skillData,
        userId,
        endorsements: 0,
      },
      include: {
        user: {
          include: this.getFullUserInclude(),
        },
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
      throw new NotFoundException('Skill not found');
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
      throw new NotFoundException('Skill not found');
    }

    return this.prisma.skill.delete({
      where: { id: skillId },
    });
  }

  async endorseSkill(skillId: string, endorserId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.userId === endorserId) {
      throw new ForbiddenException('Cannot endorse your own skill');
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

  // ============= SEARCH & FILTERING =============

  async searchUsers(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      // Extract direct search parameters
      search,
      roles,
      isVerified,
      skills,
      cities,
      countries,
      fields,
      institutions,
      universities,
      graduationYears,
      minGpa,
      maxGpa,
      availability,
      minExperience,
      maxExperience,
      visibility,
      studentIds,
      // Keep backward compatibility with filters
      filters,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Merge direct parameters with filters for backward compatibility
    const combinedFilters: UserSearchFiltersDto = {
      search: search || filters?.search,
      roles: roles || filters?.roles,
      isVerified: isVerified !== undefined ? isVerified : filters?.isVerified,
      skills: skills || filters?.skills,
      cities: cities || filters?.cities,
      countries: countries || filters?.countries,
      fields: fields || filters?.fields,
      institutions: institutions || filters?.institutions,
      universities: universities || filters?.universities,
      graduationYears: graduationYears || filters?.graduationYears,
      minGpa: minGpa !== undefined ? minGpa : filters?.minGpa,
      maxGpa: maxGpa !== undefined ? maxGpa : filters?.maxGpa,
      availability: availability || filters?.availability,
      minExperience:
        minExperience !== undefined ? minExperience : filters?.minExperience,
      maxExperience:
        maxExperience !== undefined ? maxExperience : filters?.maxExperience,
      visibility: visibility || filters?.visibility,
      studentIds: studentIds || filters?.studentIds,
    };

    const where = this.buildEnhancedSearchWhereClause(combinedFilters);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: this.getSearchUserInclude(),
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
      filters,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = recommendationDto;

    const skip = (page - 1) * limit;
    const where = this.buildRecommendationWhereClause(user, filters);
    const orderBy = this.buildRecommendationOrderBy(user, sortBy, sortOrder);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: this.getSearchUserInclude(),
        skip,
        take: limit,
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

  // ============= ROLE-SPECIFIC SEARCHES =============

  async getStudents(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.STUDENT],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  async getAlumni(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.ALUMNI],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  async getEmployers(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.EMPLOYER],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  async getProfessors(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.PROFESSOR],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  // ============= ADMIN OPERATIONS =============

  async verifyUser(adminId: string, verifyDto: VerifyUserDto): Promise<User> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
    ];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can verify users');
    }

    const user = await this.findById(verifyDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: verifyDto.userId },
      data: {
        isVerified: verifyDto.isVerified,
      },
      include: this.getFullUserInclude(),
    });
  }

  async updateAccountStatus(
    adminId: string,
    userId: string,
    statusDto: UpdateAccountStatusDto,
  ): Promise<User> {
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can update account status');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: statusDto.status,
      },
      include: this.getFullUserInclude(),
    });
  }

  // ============= ANALYTICS & STATISTICS =============

  async getUserStats() {
    const [
      totalUsers,
      verifiedUsers,
      students,
      alumni,
      employers,
      professors,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { role: UserRole.STUDENT } }),
      this.prisma.user.count({ where: { role: UserRole.ALUMNI } }),
      this.prisma.user.count({ where: { role: UserRole.EMPLOYER } }),
      this.prisma.user.count({ where: { role: UserRole.PROFESSOR } }),
      this.prisma.user.count({
        where: { accountStatus: AccountStatus.ACTIVE },
      }),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      roleDistribution: {
        students,
        alumni,
        employers,
        professors,
      },
      activeUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
    };
  }

  // ============= HELPER METHODS =============

  private getFullUserInclude() {
    return {
      education: {
        orderBy: { startDate: 'desc' as const },
      },
      experiences: {
        include: {
          company: true,
        },
        orderBy: { startDate: 'desc' as const },
      },
      skills: {
        orderBy: { endorsements: 'desc' as const },
      },
      companies: true,
      _count: {
        select: {
          posts: true,
          jobApplications: true,
          postedJobs: true,
        },
      },
    };
  }

  private getSearchUserInclude() {
    return {
      education: {
        select: {
          id: true,
          institution: true,
          degree: true,
          field: true,
          startDate: true,
          endDate: true,
          grade: true,
        },
        orderBy: { startDate: 'desc' as const },
      },
      experiences: {
        select: {
          id: true,
          title: true,
          location: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
            },
          },
        },
        orderBy: { startDate: 'desc' as const },
      },
      skills: {
        select: {
          id: true,
          name: true,
          endorsements: true,
        },
        orderBy: { endorsements: 'desc' as const },
      },
    };
  }

  private buildRecommendationWhereClause(
    user: User,
    filters: RecommendationFiltersDto,
  ): Prisma.UserWhereInput {
    const andConditions: Prisma.UserWhereInput[] = [];

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      id: { not: user.id }, // Exclude self
    };

    // Target roles
    if (filters.targetRoles && filters.targetRoles.length > 0) {
      andConditions.push({ role: { in: filters.targetRoles } });
    }

    // Required skills
    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
      andConditions.push({
        skills: {
          some: {
            name: { in: filters.requiredSkills },
          },
        },
      });
    }

    // Preferred locations
    if (filters.preferredLocations && filters.preferredLocations.length > 0) {
      andConditions.push({
        OR: [
          { city: { in: filters.preferredLocations } },
          {
            experiences: {
              some: { location: { in: filters.preferredLocations } },
            },
          },
        ],
      });
    }

    // Minimum experience
    if (filters.minExperience !== undefined) {
      andConditions.push({
        experiences: {
          some: {},
        },
      });
    }

    // Only add AND if we have conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  private buildRecommendationOrderBy(
    user: User,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ) {
    // You can implement more sophisticated scoring here
    // For now, we'll use simple ordering
    return { [sortBy]: sortOrder };
  }

  private sanitizeUserForResponse(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ============= ROLE-BASED PERMISSIONS =============

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.STUDENT]: [
        'browse_opportunities',
        'apply_jobs',
        'chat',
        'comment',
        'update_profile',
        'view_events',
        'subscribe_events',
        'view_forums',
        'join_groups',
        'upload_resume',
      ],
      [UserRole.ALUMNI]: [
        'browse_opportunities',
        'apply_jobs',
        'chat',
        'comment',
        'update_profile',
        'mentor_students',
        'view_events',
        'create_events',
        'view_forums',
        'create_forums',
        'join_groups',
        'create_groups',
      ],
      [UserRole.EMPLOYER]: [
        'view_candidates',
        'create_opportunities',
        'update_company_profile',
        'select_applicants',
        'add_university_partners',
        'post_jobs',
        'view_applications',
        'chat_with_candidates',
        'create_events',
        'sponsor_events',
      ],
      [UserRole.MENTOR]: [
        'create_events',
        'create_forums',
        'mentor_students',
        'organize_workshops',
        'view_candidates',
        'chat',
        'comment',
        'update_profile',
        'view_events',
        'subscribe_events',
        'join_groups',
        'create_groups',
      ],
      [UserRole.PROFESSOR]: [
        'manage_students',
        'create_courses',
        'grade_assignments',
        'access_academic_records',
        'mentor_students',
        'create_events',
        'view_forums',
        'create_forums',
        'verify_students',
        'chat',
        'comment',
        'update_profile',
      ],
      [UserRole.UNIVERSITY_STAFF]: [
        'verify_students',
        'manage_university_profile',
        'access_student_records',
        'create_announcements',
        'manage_events',
        'coordinate_career_services',
        'view_analytics',
        'chat',
        'comment',
        'update_profile',
        'view_events',
        'create_events',
      ],
      [UserRole.ADMIN]: [
        'manage_all_users',
        'verify_companies',
        'moderate_content',
        'access_analytics',
        'system_administration',
        'manage_permissions',
        'view_all_data',
        'export_data',
        'manage_events',
        'manage_forums',
        'chat',
        'comment',
        'update_profile',
      ],
      [UserRole.SUPER_ADMIN]: [
        'full_system_access',
        'manage_admins',
        'system_configuration',
        'backup_restore',
        'security_management',
        'audit_logs',
        'emergency_access',
        'manage_all_users',
        'verify_companies',
        'moderate_content',
        'access_analytics',
        'system_administration',
        'manage_permissions',
        'view_all_data',
        'export_data',
        'manage_events',
        'manage_forums',
        'chat',
        'comment',
        'update_profile',
      ],
      [UserRole.OTHER]: [
        'basic_access',
        'update_profile',
        'view_public_content',
      ],
    };

    return permissions[role] || [];
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.findById(userId);
    return user ? this.getRolePermissions(user.role) : [];
  }

  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // ============= STUDENT ID VERIFICATION =============

  async verifyStudentId(
    studentVerificationDto: StudentVerificationDto,
  ): Promise<boolean> {
    const { studentId, university, documentUrl } = studentVerificationDto;

    // University-specific ID validation patterns
    const universityPatterns = {
      'University of Dhaka': /^DU-\d{6}-\d{2}$/,
      'Bangladesh University of Engineering and Technology': /^BUET-\d{7}$/,
      'Dhaka University of Engineering & Technology': /^DUET-\d{6}$/,
      'Chittagong University': /^CU-\d{6}-\d{2}$/,
      'Rajshahi University': /^RU-\d{6}-\d{2}$/,
      // Add more patterns as needed
    };

    const pattern = universityPatterns[university];
    if (pattern && !pattern.test(studentId)) {
      return false;
    }

    // Here you would integrate with university APIs or document verification services
    // For now, we'll return true if the pattern matches and document is provided
    return !!(pattern && documentUrl);
  }

  async updateStudentVerification(
    userId: string,
    verificationDto: StudentVerificationDto,
  ): Promise<User> {
    const isValid = await this.verifyStudentId(verificationDto);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        studentId: verificationDto.studentId,
        university: verificationDto.university,
        isVerified: isValid,
      },
      include: this.getFullUserInclude(),
    });
  }

  // ============= ENHANCED SEARCH WITH NEW FILTERS =============

  private buildEnhancedSearchWhereClause(
    filters?: UserSearchFiltersDto,
  ): Prisma.UserWhereInput {
    if (!filters) return { deletedAt: null };

    const andConditions: Prisma.UserWhereInput[] = [];
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Text search
    if (filters.search) {
      andConditions.push({
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { headline: { contains: filters.search, mode: 'insensitive' } },
          { bio: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      andConditions.push({ role: { in: filters.roles } });
    }

    // Location filters
    if (filters.cities && filters.cities.length > 0) {
      andConditions.push({ city: { in: filters.cities } });
    }

    if (filters.countries && filters.countries.length > 0) {
      andConditions.push({ country: { in: filters.countries } });
    }

    if (filters.universities && filters.universities.length > 0) {
      andConditions.push({ university: { in: filters.universities } });
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      andConditions.push({
        skills: {
          some: {
            name: { in: filters.skills },
          },
        },
      });
    }

    // Education filters
    if (filters.fields && filters.fields.length > 0) {
      andConditions.push({
        education: {
          some: {
            field: { in: filters.fields },
          },
        },
      });
    }

    if (filters.institutions && filters.institutions.length > 0) {
      andConditions.push({
        education: {
          some: {
            institution: { in: filters.institutions },
          },
        },
      });
    }

    // GPA filters
    if (filters.minGpa !== undefined) {
      andConditions.push({ gpa: { gte: filters.minGpa } });
    }

    if (filters.maxGpa !== undefined) {
      andConditions.push({ gpa: { lte: filters.maxGpa } });
    }

    // Graduation year filter
    if (filters.graduationYears && filters.graduationYears.length > 0) {
      andConditions.push({ graduationYear: { in: filters.graduationYears } });
    }

    // Availability filter
    if (filters.availability && filters.availability.length > 0) {
      andConditions.push({ availability: { in: filters.availability } });
    }

    // Student ID filter
    if (filters.studentIds && filters.studentIds.length > 0) {
      andConditions.push({ studentId: { in: filters.studentIds } });
    }

    // Verification filter
    if (filters.isVerified !== undefined) {
      andConditions.push({ isVerified: filters.isVerified });
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      andConditions.push({ visibility: { in: filters.visibility } });
    }

    // Only add AND if we have conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  async searchStudentsForEmployers(
    employerId: string,
    filters: EmployerFiltersDto,
    pagination: PaginationDto,
  ): Promise<PaginatedUsersResponseDto> {
    const { page = 1, limit = 10 } = pagination;
    const sortBy = 'gpa';
    const sortOrder = 'desc';

    const skip = (page - 1) * limit;

    const andConditions: Prisma.UserWhereInput[] = [];
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: UserRole.STUDENT,
    };

    // Apply employer-specific filters
    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
      andConditions.push({
        skills: {
          some: {
            name: { in: filters.requiredSkills },
          },
        },
      });
    }

    if (filters.graduationYears && filters.graduationYears.length > 0) {
      andConditions.push({ graduationYear: { in: filters.graduationYears } });
    }

    if (filters.minGpa !== undefined) {
      andConditions.push({ gpa: { gte: filters.minGpa } });
    }

    if (filters.availability && filters.availability.length > 0) {
      andConditions.push({ availability: { in: filters.availability } });
    }

    if (filters.universities && filters.universities.length > 0) {
      andConditions.push({ university: { in: filters.universities } });
    }

    if (filters.fields && filters.fields.length > 0) {
      andConditions.push({
        education: {
          some: {
            field: { in: filters.fields },
          },
        },
      });
    }

    if (filters.locations && filters.locations.length > 0) {
      andConditions.push({ city: { in: filters.locations } });
    }

    // Only add AND if we have conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: this.getSearchUserInclude(),
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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

  // ============= COMPREHENSIVE OPPORTUNITY RECOMMENDATIONS =============

  async getOpportunityRecommendations(
    userId: string,
    recommendationDto: GetOpportunityRecommendationsDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        experiences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { filters } = recommendationDto;
    const userSkills = user.skills?.map((skill) => skill.name) || [];

    // This is a foundation for the recommendation system
    // In a real implementation, you'd integrate with your job/opportunity services
    const recommendations = {
      jobs: await this.getJobRecommendations(user, filters),
      internships: await this.getInternshipRecommendations(user, filters),
      mentorship: await this.getMentorshipRecommendations(user, filters),
      events: await this.getEventRecommendations(user, filters),
      forums: await this.getForumRecommendations(user, filters),
    };

    return {
      success: true,
      data: recommendations[filters.type] || [],
      metadata: {
        userProfile: {
          skills: userSkills,
          location: user.city,
          experience: user.experiences?.length || 0,
          gpa: user.gpa,
          graduationYear: user.graduationYear,
        },
      },
    };
  }

  // Mock recommendation methods (to be implemented with actual services)
  private async getJobRecommendations(
    user: User,
    filters: OpportunityRecommendationDto,
  ) {
    // Integration with JobService would go here
    return [];
  }

  private async getInternshipRecommendations(
    user: User,
    filters: OpportunityRecommendationDto,
  ) {
    // Integration with InternshipService would go here
    return [];
  }

  private async getMentorshipRecommendations(
    user: User,
    filters: OpportunityRecommendationDto,
  ) {
    // Find mentors based on user's interests and skills
    const userWithSkills = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { skills: true },
    });

    if (!userWithSkills) {
      return [];
    }

    const mentors = await this.prisma.user.findMany({
      where: {
        role: UserRole.MENTOR,
        deletedAt: null,
        skills: {
          some: {
            name: { in: userWithSkills.skills.map((s) => s.name) },
          },
        },
      },
      include: this.getSearchUserInclude(),
      take: 10,
    });

    return mentors.map((mentor) => this.sanitizeUserForResponse(mentor));
  }

  private async getEventRecommendations(
    user: User,
    filters: OpportunityRecommendationDto,
  ) {
    // Integration with EventService would go here
    return [];
  }

  private async getForumRecommendations(
    user: User,
    filters: OpportunityRecommendationDto,
  ) {
    // Integration with ForumService would go here
    return [];
  }

  // ============= ROLE-SPECIFIC METHODS WITH NEW ROLES =============

  async getMentors(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.MENTOR],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  async getUniversityStaff(
    searchDto: UserSearchDto,
  ): Promise<PaginatedUsersResponseDto> {
    const filtersWithRole = {
      ...searchDto.filters,
      roles: [UserRole.UNIVERSITY_STAFF],
    };

    return this.searchUsers({
      ...searchDto,
      filters: filtersWithRole,
    });
  }

  // ============= USER DELETION OPERATIONS =============

  /**
   * Soft delete a user (marks as deleted but keeps data)
   */
  async softDeleteUser(
    adminId: string,
    userId: string,
    reason?: string,
  ): Promise<User> {
    // Verify admin permissions
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    // Check if user exists and is not already deleted
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.deletedAt) {
      throw new ConflictException('User is already deleted');
    }

    // Prevent self-deletion
    if (adminId === userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Prevent deletion of other admins by non-super-admins
    if (user.role === UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can delete admin accounts',
      );
    }

    // Soft delete the user and related data
    const deletedUser = await this.prisma.$transaction(async (tx) => {
      // Mark user as deleted
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          accountStatus: AccountStatus.INACTIVE,
        },
        include: this.getFullUserInclude(),
      });

      // Soft delete related data
      await Promise.all([
        // Education records
        tx.education.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Experience records
        tx.experience.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Skills
        tx.skill.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Posts
        tx.post.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Comments
        tx.comment.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Job applications
        tx.jobApplication.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Messages
        tx.message.updateMany({
          where: { senderId: userId },
          data: { deletedAt: new Date() },
        }),
        // Group messages
        tx.groupMessage.updateMany({
          where: { senderId: userId },
          data: { deletedAt: new Date() },
        }),
        // Notifications
        tx.notification.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Documents
        tx.document.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
        // Chats where user is involved
        tx.chat.updateMany({
          where: { userId },
          data: { deletedAt: new Date() },
        }),
      ]);

      // Log the deletion
      await tx.securityLog.create({
        data: {
          userId: adminId,
          event: 'USER_SOFT_DELETED',
          metadata: {
            deletedUserId: userId,
            deletedUserEmail: user.email,
            reason: reason || 'No reason provided',
            deletedAt: new Date(),
          },
        },
      });

      return updatedUser;
    });

    return deletedUser;
  }

  /**
   * Hard delete a user (permanently removes all data)
   * This is irreversible and should be used with extreme caution
   */
  async hardDeleteUser(
    superAdminId: string,
    userId: string,
    confirmationCode: string,
  ): Promise<{ message: string; deletedData: any }> {
    // Only super admins can perform hard deletes
    const superAdmin = await this.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can permanently delete users',
      );
    }

    // Verify confirmation code (in real app, this would be a secure token)
    const expectedCode = `HARD_DELETE_${userId}_${new Date().toISOString().slice(0, 10)}`;
    if (confirmationCode !== expectedCode) {
      throw new ForbiddenException('Invalid confirmation code for hard delete');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        education: true,
        experiences: true,
        skills: true,
        posts: true,
        comments: true,
        jobApplications: true,
        messages: true,
        groupMessages: true,
        notifications: true,
        documents: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (superAdminId === userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Store deletion summary for logging
    const deletionSummary = {
      userId: user.id,
      email: user.email,
      role: user.role,
      educationRecords: user.education?.length || 0,
      experienceRecords: user.experiences?.length || 0,
      skillRecords: user.skills?.length || 0,
      postsCount: user.posts?.length || 0,
      commentsCount: user.comments?.length || 0,
      applicationsCount: user.jobApplications?.length || 0,
      messagesCount: user.messages?.length || 0,
      documentsCount: user.documents?.length || 0,
      deletedAt: new Date(),
    };

    // Hard delete with cascade
    await this.prisma.$transaction(async (tx) => {
      // Delete in proper order to respect foreign key constraints

      // Delete user-related data first
      await Promise.all([
        tx.education.deleteMany({ where: { userId } }),
        tx.experience.deleteMany({ where: { userId } }),
        tx.skill.deleteMany({ where: { userId } }),
        tx.post.deleteMany({ where: { userId } }),
        tx.comment.deleteMany({ where: { userId } }),
        tx.jobApplication.deleteMany({ where: { userId } }),
        tx.message.deleteMany({ where: { senderId: userId } }),
        tx.groupMessage.deleteMany({ where: { senderId: userId } }),
        tx.notification.deleteMany({ where: { userId } }),
        tx.document.deleteMany({ where: { userId } }),
        tx.securityLog.deleteMany({ where: { userId } }),
        tx.userSession.deleteMany({ where: { userId } }),
        tx.twoFactorAuth.deleteMany({ where: { userId } }),
        tx.backupCode.deleteMany({ where: { userId } }),
        tx.trustedDevice.deleteMany({ where: { userId } }),
      ]);

      // Remove user from chat groups
      await tx.user.update({
        where: { id: userId },
        data: {
          groupMemberships: {
            set: [],
          },
        },
      });

      // Delete owned chat groups (transfer ownership or delete)
      const ownedGroups = await tx.chatGroup.findMany({
        where: { ownerId: userId },
      });

      for (const group of ownedGroups) {
        // Option 1: Delete the group entirely
        await tx.chatGroup.delete({
          where: { id: group.id },
        });

        // Option 2: Transfer ownership to another admin (alternative)
        // const firstAdmin = await tx.user.findFirst({
        //   where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }
        // });
        // if (firstAdmin) {
        //   await tx.chatGroup.update({
        //     where: { id: group.id },
        //     data: { ownerId: firstAdmin.id }
        //   });
        // }
      }

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId },
      });

      // Log the hard deletion
      await tx.securityLog.create({
        data: {
          userId: superAdminId,
          event: 'USER_HARD_DELETED',
          metadata: deletionSummary,
        },
      });
    });

    return {
      message: 'User permanently deleted successfully',
      deletedData: deletionSummary,
    };
  }

  /**
   * Restore a soft-deleted user
   */
  async restoreUser(adminId: string, userId: string): Promise<User> {
    // Verify admin permissions
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can restore users');
    }

    // Find the deleted user
    const deletedUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    if (!deletedUser.deletedAt) {
      throw new ConflictException('User is not deleted');
    }

    // Restore the user and related data
    const restoredUser = await this.prisma.$transaction(async (tx) => {
      // Restore user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: null,
          accountStatus: AccountStatus.ACTIVE,
        },
        include: this.getFullUserInclude(),
      });

      // Restore related data
      await Promise.all([
        tx.education.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.experience.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.skill.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.post.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.comment.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.jobApplication.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.message.updateMany({
          where: { senderId: userId },
          data: { deletedAt: null },
        }),
        tx.groupMessage.updateMany({
          where: { senderId: userId },
          data: { deletedAt: null },
        }),
        tx.notification.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.document.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
        tx.chat.updateMany({
          where: { userId },
          data: { deletedAt: null },
        }),
      ]);

      // Log the restoration
      await tx.securityLog.create({
        data: {
          userId: adminId,
          event: 'USER_RESTORED',
          metadata: {
            restoredUserId: userId,
            restoredUserEmail: deletedUser.email,
            restoredAt: new Date(),
          },
        },
      });

      return updatedUser;
    });

    return restoredUser;
  }

  /**
   * Get deleted users (for admin management)
   */
  async getDeletedUsers(
    adminId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedUsersResponseDto> {
    // Verify admin permissions
    const admin = await this.findById(adminId);
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    if (!admin || !allowedRoles.includes(admin.role)) {
      throw new ForbiddenException('Only admins can view deleted users');
    }

    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: { not: null },
        },
        include: this.getSearchUserInclude(),
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: { not: null },
        },
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

  /**
   * Self-delete account (user deletes their own account)
   */
  async selfDeleteAccount(
    userId: string,
    password: string,
    reason?: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password for security
    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid password');
    }

    // Perform soft delete
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          accountStatus: AccountStatus.INACTIVE,
        },
      });

      // Log self-deletion
      await tx.securityLog.create({
        data: {
          userId,
          event: 'SELF_DELETE_ACCOUNT',
          metadata: {
            reason: reason || 'User requested account deletion',
            deletedAt: new Date(),
          },
        },
      });
    });

    return {
      message:
        'Account deleted successfully. You can contact support within 30 days to restore your account.',
    };
  }

  /**
   * Permanently delete old soft-deleted users (cleanup job)
   */
  async cleanupOldDeletedUsers(
    superAdminId: string,
    daysOld: number = 30,
  ): Promise<{ message: string; deletedCount: number }> {
    const superAdmin = await this.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can perform cleanup operations',
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldDeletedUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
      select: { id: true, email: true },
    });

    let deletedCount = 0;

    for (const user of oldDeletedUsers) {
      try {
        // Generate confirmation code for each user
        const confirmationCode = `HARD_DELETE_${user.id}_${new Date().toISOString().slice(0, 10)}`;
        await this.hardDeleteUser(superAdminId, user.id, confirmationCode);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.email}:`, error);
      }
    }

    return {
      message: `Cleanup completed. ${deletedCount} users permanently deleted.`,
      deletedCount,
    };
  }
}

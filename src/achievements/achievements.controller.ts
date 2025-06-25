import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Post,
  Request,
  HttpException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user achievements with progress',
  })
  @ApiResponse({
    status: 200,
    description: 'User achievements retrieved successfully',
  })
  @HttpCode(HttpStatus.OK)
  async getUserAchievements(@CurrentUser() user: any) {
    console.log(`🏆 Getting achievements for user: ${user.id}`);

    const achievements = await this.achievementsService.getUserAchievements(
      user.id,
    );

    console.log(
      `📊 Found ${achievements.length} achievements for user ${user.id}`,
    );

    return {
      success: true,
      data: achievements,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get user achievement statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'User achievement stats retrieved successfully',
  })
  @HttpCode(HttpStatus.OK)
  async getUserAchievementStats(@CurrentUser() user: any) {
    console.log(`📈 Getting achievement stats for user: ${user.id}`);

    const stats = await this.achievementsService.getUserAchievementStats(
      user.id,
    );

    console.log(`📊 Stats for user ${user.id}:`, {
      totalPoints: stats.totalPoints,
      achievementsEarned: stats.achievementsEarned,
      level: stats.level,
    });

    return {
      success: true,
      data: stats,
    };
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get achievements leaderboard',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of entries to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    console.log(`🏅 Getting leaderboard with limit: ${limit}`);

    const leaderboard = await this.achievementsService.getLeaderboard(limit);

    console.log(`📊 Leaderboard has ${leaderboard.length} entries`);

    return {
      success: true,
      data: leaderboard,
    };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  async createTestAchievement(@Request() req) {
    const userId = req.user.id;
    return this.achievementsService.createTestAchievement(userId);
  }
}

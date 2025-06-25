import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { ApplicationStatus } from '@prisma/client';

export interface TrainingMetrics {
  accuracy: number;
  loss: number;
  validationAccuracy: number;
  validationLoss: number;
  trainingTime: number;
  dataPoints: number;
  epochs: number;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  dropoutRate: number;
  hiddenUnits: number[];
}

@Injectable()
export class AiTrainerService {
  private readonly logger = new Logger(AiTrainerService.name);
  private readonly modelDir = path.join(__dirname, 'training', 'models');
  private readonly dataDir = path.join(__dirname, 'training', 'data');

  constructor(private readonly prisma: PrismaService) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [this.modelDir, this.dataDir];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Complete training pipeline: collect data, train model, and evaluate
   */
  async trainRecommendationModel(
    config?: Partial<TrainingConfig>,
  ): Promise<TrainingMetrics> {
    const startTime = Date.now();

    const trainingConfig: TrainingConfig = {
      epochs: 50,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      dropoutRate: 0.3,
      hiddenUnits: [128, 64, 32],
      ...config,
    };

    try {
      this.logger.log('🚀 Starting AI training pipeline...');

      // Step 1: Collect and prepare training data
      this.logger.log('📊 Collecting training data...');
      const trainingData = await this.collectTrainingData();

      if (trainingData.length < 10) {
        this.logger.warn(
          `⚠️ Low training data: ${trainingData.length} samples. Generating synthetic data...`,
        );
        const syntheticData = await this.generateSyntheticData(50);
        trainingData.push(...syntheticData);
      }

      // Step 2: Preprocess data and create feature vectors
      this.logger.log('🔄 Preprocessing data...');
      const { features, labels, metadata } = this.preprocessData(trainingData);

      // Step 3: Create and train the model
      this.logger.log('🧠 Creating and training model...');
      const model = this.createModel(features.shape[1], trainingConfig);

      // Step 4: Train the model
      const history = await this.trainModel(
        model,
        features,
        labels,
        trainingConfig,
      );

      // Step 5: Save model and metadata
      this.logger.log('💾 Saving model and metadata...');
      await this.saveModel(model, metadata);

      // Step 6: Calculate metrics
      const trainingTime = Date.now() - startTime;
      const finalHistory = history[history.length - 1] || {};
      const metrics: TrainingMetrics = {
        accuracy: finalHistory.acc || 0,
        loss: finalHistory.loss || 0,
        validationAccuracy: finalHistory.val_acc || 0,
        validationLoss: finalHistory.val_loss || 0,
        trainingTime,
        dataPoints: trainingData.length,
        epochs: trainingConfig.epochs,
      };

      // Step 7: Save training report
      await this.saveTrainingReport(metrics, trainingConfig);

      this.logger.log('✅ Training completed successfully!');
      this.logger.log(`📈 Final loss: ${metrics.loss.toFixed(4)}`);
      this.logger.log(`⏱️ Training time: ${(trainingTime / 1000).toFixed(2)}s`);

      return metrics;
    } catch (error) {
      this.logger.error('❌ Training failed:', error);
      throw error;
    }
  }

  /**
   * Collect training data from database
   */
  private async collectTrainingData(): Promise<any[]> {
    const applications = await this.prisma.jobApplication.findMany({
      include: {
        user: {
          include: {
            skills: true,
            experiences: true,
            education: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
        interviews: true,
      },
    });

    const trainingData: any[] = applications.map((app) => ({
      userProfile: this.extractUserProfile(app.user),
      job: this.extractJobProfile(app.job),
      outcome: {
        applied: true,
        interviewed: app.interviews.length > 0,
        hired: app.status === ApplicationStatus.ACCEPTED,
        engagement_score: this.calculateEngagementScore(
          true,
          app.interviews.length > 0,
          app.status === ApplicationStatus.ACCEPTED,
        ),
      },
    }));

    this.logger.log(
      `📊 Collected ${trainingData.length} training examples from applications`,
    );
    return trainingData;
  }

  /**
   * Generate synthetic training data when real data is insufficient
   */
  private async generateSyntheticData(count: number) {
    const jobs = await this.prisma.job.findMany({
      take: 10,
      include: { company: true },
    });

    const users = await this.prisma.user.findMany({
      take: 10,
      include: {
        skills: true,
        experiences: true,
        education: true,
      },
    });

    const syntheticData: any[] = [];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const job = jobs[Math.floor(Math.random() * jobs.length)];

      // Generate realistic engagement scores based on skill/experience match
      const skillMatch = this.calculateSyntheticSkillMatch(user, job);
      const engagementScore = Math.min(skillMatch + Math.random() * 0.3, 1.0);

      syntheticData.push({
        userProfile: this.extractUserProfile(user),
        job: this.extractJobProfile(job),
        outcome: {
          applied: engagementScore > 0.6,
          interviewed: engagementScore > 0.7,
          hired: engagementScore > 0.8,
          engagement_score: engagementScore,
        },
      });
    }

    this.logger.log(
      `🎲 Generated ${syntheticData.length} synthetic training examples`,
    );
    return syntheticData;
  }

  private calculateSyntheticSkillMatch(user: any, job: any): number {
    const userSkills = user.skills?.map((s: any) => s.name.toLowerCase()) || [];
    const jobRequirements =
      (job.requirements as string[])?.map((r: string) => r.toLowerCase()) || [];

    if (userSkills.length === 0 || jobRequirements.length === 0) return 0.3;

    const matches = userSkills.filter((skill) =>
      jobRequirements.some((req) => req.includes(skill) || skill.includes(req)),
    );

    return Math.min(
      matches.length / Math.max(userSkills.length, jobRequirements.length),
      1.0,
    );
  }

  private extractUserProfile(user: any) {
    return {
      skills: user.skills?.map((s: any) => s.name.toLowerCase()) || [],
      experience:
        user.experiences?.map((e: any) => ({
          title: e.title?.toLowerCase() || '',
          company: e.companyName || '',
          duration: this.calculateDuration(e.startDate, e.endDate),
        })) || [],
      education:
        user.education?.map((e: any) => ({
          degree: e.degree?.toLowerCase() || '',
          field: e.field?.toLowerCase() || '',
          grade: this.parseGrade(e.grade),
        })) || [],
      location: {
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
      },
    };
  }

  private extractJobProfile(job: any) {
    return {
      title: job.title?.toLowerCase() || '',
      description: job.description || '',
      requirements: (job.requirements as string[]) || [],
      type: job.type || '',
      location: job.location || '',
      industry: job.company?.industry || '',
      companySize: job.company?.size || '',
      experienceLevel: job.experienceLevel || 'entry',
    };
  }

  private calculateEngagementScore(
    applied: boolean,
    interviewed: boolean,
    hired: boolean,
  ): number {
    let score = 0;
    if (hired) score += 1.0;
    else if (interviewed) score += 0.8;
    else if (applied) score += 0.6;
    return score;
  }

  /**
   * Preprocess training data into feature vectors
   */
  private preprocessData(data: any[]) {
    // Build vocabularies
    const skillsVocab = new Set<string>();
    const titlesVocab = new Set<string>();
    const industriesVocab = new Set<string>();

    data.forEach((point) => {
      point.userProfile.skills.forEach((skill: string) =>
        skillsVocab.add(skill),
      );
      point.userProfile.experience.forEach((exp: any) =>
        titlesVocab.add(exp.title),
      );
      if (point.job.industry)
        industriesVocab.add(point.job.industry.toLowerCase());
    });

    const skillsList = Array.from(skillsVocab);
    const titlesList = Array.from(titlesVocab);
    const industriesList = Array.from(industriesVocab);

    // Create feature vectors
    const features = data.map((point) => {
      const featureVector: number[] = [];

      // Skills matching
      const skillsVector = new Array(Math.max(skillsList.length, 1)).fill(0);
      point.userProfile.skills.forEach((skill: string) => {
        const index = skillsList.indexOf(skill);
        if (index !== -1) skillsVector[index] = 1;
      });
      featureVector.push(...skillsVector);

      // Experience matching
      const experienceVector = new Array(Math.max(titlesList.length, 1)).fill(
        0,
      );
      point.userProfile.experience.forEach((exp: any) => {
        const index = titlesList.indexOf(exp.title);
        if (index !== -1) {
          experienceVector[index] = Math.min(exp.duration / 12, 5);
        }
      });
      featureVector.push(...experienceVector);

      // Education level
      const maxEducationLevel = Math.max(
        ...point.userProfile.education.map((edu: any) =>
          this.getEducationLevel(edu.degree),
        ),
        0,
      );
      featureVector.push(maxEducationLevel / 5);

      // Industry matching
      const industryVector = new Array(Math.max(industriesList.length, 1)).fill(
        0,
      );
      const industryIndex = industriesList.indexOf(
        point.job.industry.toLowerCase(),
      );
      if (industryIndex !== -1) industryVector[industryIndex] = 1;
      featureVector.push(...industryVector);

      // Additional features
      featureVector.push(
        Math.min(point.userProfile.experience.length / 10, 1),
        Math.min(point.userProfile.skills.length / 20, 1),
        Math.min(point.userProfile.education.length / 5, 1),
      );

      return featureVector;
    });

    // Ensure we have at least some features
    if (features.length === 0 || features[0].length === 0) {
      throw new Error('No features generated from training data');
    }

    const labels = data.map((point) => [point.outcome.engagement_score]);

    const metadata = {
      skillsList,
      titlesList,
      industriesList,
      featureSize: features[0].length,
      version: Date.now(),
    };

    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels),
      metadata,
    };
  }

  private createModel(
    inputSize: number,
    config: TrainingConfig,
  ): tf.Sequential {
    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        units: config.hiddenUnits[0],
        activation: 'relu',
        inputShape: [inputSize],
      }),
    );
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));

    for (let i = 1; i < config.hiddenUnits.length; i++) {
      model.add(
        tf.layers.dense({
          units: config.hiddenUnits[i],
          activation: 'relu',
        }),
      );
      model.add(tf.layers.dropout({ rate: config.dropoutRate / 2 }));
    }

    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }),
    );

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  private async trainModel(
    model: tf.Sequential,
    features: tf.Tensor2D,
    labels: tf.Tensor2D,
    config: TrainingConfig,
  ): Promise<any[]> {
    const history: any[] = [];

    const result = await model.fit(features, labels, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: config.validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          history.push(logs);
          if (epoch % 10 === 0) {
            this.logger.log(
              `Epoch ${epoch + 1}/${config.epochs} - ` +
                `Loss: ${logs?.loss.toFixed(4)}, ` +
                `MAE: ${logs?.mae?.toFixed(4)}`,
            );
          }
        },
      },
    });

    return history;
  }

  private async saveModel(model: tf.Sequential, metadata: any): Promise<void> {
    const modelPath = path.join(this.modelDir, 'recommendation-model');
    const metadataPath = path.join(this.modelDir, 'metadata.json');

    await model.save(`file://${modelPath}`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async saveTrainingReport(
    metrics: TrainingMetrics,
    config: TrainingConfig,
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      config,
      performance: {
        training_time_minutes: (metrics.trainingTime / 60000).toFixed(2),
        data_points: metrics.dataPoints,
        final_loss: metrics.loss.toFixed(4),
      },
    };

    const reportPath = path.join(
      this.dataDir,
      `training_report_${Date.now()}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  // Helper methods
  private calculateDuration(startDate: Date, endDate: Date | null): number {
    if (!startDate) return 0;
    const end = endDate || new Date();
    const diffMonths =
      (end.getFullYear() - startDate.getFullYear()) * 12 +
      (end.getMonth() - startDate.getMonth());
    return Math.max(0, diffMonths);
  }

  private parseGrade(grade: any): number {
    if (typeof grade === 'number') return grade;
    if (typeof grade === 'string') {
      const parsed = parseFloat(grade);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private getEducationLevel(degree: string): number {
    if (!degree) return 1;

    const degreeLevels: { [key: string]: number } = {
      'high school': 1,
      diploma: 1,
      associate: 2,
      bachelor: 3,
      master: 4,
      phd: 5,
      doctorate: 5,
    };

    const normalizedDegree = degree.toLowerCase();
    for (const [key, value] of Object.entries(degreeLevels)) {
      if (normalizedDegree.includes(key)) return value;
    }
    return 1;
  }
}

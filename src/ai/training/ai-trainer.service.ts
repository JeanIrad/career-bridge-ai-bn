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
  private readonly modelPath = path.join(
    __dirname,
    'models',
    'recommendation-model',
  );
  private readonly metadataPath = path.join(
    __dirname,
    'models',
    'metadata.json',
  );
  private readonly dataPath = path.join(__dirname, 'data');

  constructor(private readonly prisma: PrismaService) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [path.join(__dirname, 'models'), path.join(__dirname, 'data')];

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
      epochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      dropoutRate: 0.3,
      hiddenUnits: [256, 128, 64],
      ...config,
    };

    try {
      this.logger.log('🚀 Starting AI training pipeline...');

      // Step 1: Collect and prepare training data
      this.logger.log('📊 Collecting training data...');
      const trainingData = await this.collectTrainingData();

      if (trainingData.length < 50) {
        throw new Error(
          `Insufficient training data. Need at least 50 samples, got ${trainingData.length}`,
        );
      }

      // Step 2: Preprocess data and create feature vectors
      this.logger.log('🔄 Preprocessing data...');
      const { features, labels, metadata } =
        await this.preprocessData(trainingData);

      // Step 3: Create and train the model
      this.logger.log('🧠 Creating and training model...');
      const model = await this.createModel(features.shape[1], trainingConfig);

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
      const metrics: TrainingMetrics = {
        accuracy: history.acc?.[history.acc.length - 1] || 0,
        loss: history.loss[history.loss.length - 1],
        validationAccuracy: history.val_acc?.[history.val_acc.length - 1] || 0,
        validationLoss: history.val_loss?.[history.val_loss.length - 1] || 0,
        trainingTime,
        dataPoints: trainingData.length,
        epochs: trainingConfig.epochs,
      };

      // Step 7: Save training report
      await this.saveTrainingReport(metrics, trainingConfig);

      this.logger.log('✅ Training completed successfully!');
      this.logger.log(
        `📈 Final accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`,
      );
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
  private async collectTrainingData() {
    const applications = await this.prisma.jobApplication.findMany({
      include: {
        user: {
          include: {
            skills: true,
            experiences: {
              include: {
                company: true,
              },
            },
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

    // Also collect positive and negative examples from job views, saves, etc.
    // Note: jobView table doesn't exist in current schema, commenting out
    // const jobViews = await this.prisma.jobView.findMany({
    //   include: {
    //     user: {
    //       include: {
    //         skills: true,
    //         experiences: { include: { company: true } },
    //         education: true,
    //       },
    //     },
    //     job: {
    //       include: {
    //         company: true,
    //       },
    //     },
    //   },
    // });
    const jobViews: any[] = []; // Empty array as fallback

    const savedJobs = await this.prisma.savedJob.findMany({
      include: {
        user: {
          include: {
            skills: true,
            experiences: { include: { company: true } },
            education: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    // Create training data points
    const trainingData: any[] = [];

    // Add application data (high-quality signals)
    applications.forEach((app) => {
      trainingData.push({
        userProfile: this.extractUserProfile(app.user),
        job: this.extractJobProfile(app.job),
        outcome: {
          applied: true,
          interviewed: app.interviews.length > 0,
          hired: app.status === ApplicationStatus.ACCEPTED,
          saved: false,
          viewed: true,
          engagement_score: this.calculateEngagementScore(
            true,
            app.interviews.length > 0,
            app.status === ApplicationStatus.ACCEPTED,
          ),
        },
      });
    });

    // Add saved jobs data (medium-quality positive signals)
    savedJobs.forEach((saved) => {
      trainingData.push({
        userProfile: this.extractUserProfile(saved.user),
        job: this.extractJobProfile(saved.job),
        outcome: {
          applied: false,
          interviewed: false,
          hired: false,
          saved: true,
          viewed: true,
          engagement_score: this.calculateEngagementScore(
            false,
            false,
            false,
            true,
          ),
        },
      });
    });

    // Add viewed jobs data (low-quality signals)
    jobViews.forEach((view) => {
      trainingData.push({
        userProfile: this.extractUserProfile(view.user),
        job: this.extractJobProfile(view.job),
        outcome: {
          applied: false,
          interviewed: false,
          hired: false,
          saved: false,
          viewed: true,
          engagement_score: this.calculateEngagementScore(
            false,
            false,
            false,
            false,
            true,
          ),
        },
      });
    });

    // Generate negative examples (users who didn't interact with certain jobs)
    const negativeExamples = await this.generateNegativeExamples(
      trainingData.length * 0.3,
    );
    trainingData.push(...negativeExamples);

    this.logger.log(`📊 Collected ${trainingData.length} training examples`);
    return trainingData;
  }

  private extractUserProfile(user: any) {
    return {
      skills: user.skills?.map((s: any) => s.name.toLowerCase()) || [],
      experience:
        user.experiences?.map((e: any) => ({
          title: e.title.toLowerCase(),
          company: e.company?.name || e.companyName || '',
          duration: this.calculateDuration(e.startDate, e.endDate),
          skills: e.skills || [],
          level: e.level || 'entry',
        })) || [],
      education:
        user.education?.map((e: any) => ({
          degree: e.degree.toLowerCase(),
          field: e.field.toLowerCase(),
          grade: this.parseGrade(e.grade),
          institution: e.institution || '',
        })) || [],
      location: {
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
      },
      preferences: {
        jobTypes: user.preferredJobTypes || [],
        industries: user.preferredIndustries || [],
        locations: user.preferredLocations || [],
        salary: user.expectedSalary || null,
      },
    };
  }

  private extractJobProfile(job: any) {
    return {
      title: job.title.toLowerCase(),
      description: job.description || '',
      requirements: (job.requirements as string[]) || [],
      type: job.type,
      location: job.location,
      industry: job.company?.industry || '',
      companySize: job.company?.size || '',
      salary: job.salary || null,
      experience: job.experienceLevel || 'entry',
      skills: job.skills || [],
    };
  }

  private calculateEngagementScore(
    applied: boolean,
    interviewed: boolean,
    hired: boolean,
    saved: boolean = false,
    viewed: boolean = false,
  ): number {
    let score = 0;
    if (hired) score += 1.0;
    else if (interviewed) score += 0.8;
    else if (applied) score += 0.6;
    else if (saved) score += 0.4;
    else if (viewed) score += 0.2;
    return score;
  }

  private async generateNegativeExamples(count: number) {
    // Get random user-job pairs that haven't interacted
    const users = await this.prisma.user.findMany({
      take: Math.min(100, count),
      include: {
        skills: true,
        experiences: { include: { company: true } },
        education: true,
      },
    });

    const jobs = await this.prisma.job.findMany({
      take: Math.min(100, count),
      include: { company: true },
    });

    const negativeExamples: any[] = [];

    for (
      let i = 0;
      i < Math.min(count, (users.length * jobs.length) / 10);
      i++
    ) {
      const user = users[Math.floor(Math.random() * users.length)];
      const job = jobs[Math.floor(Math.random() * jobs.length)];

      // Check if this user-job pair already exists in our data
      const hasInteraction = await this.prisma.jobApplication.findFirst({
        where: { userId: user.id, jobId: job.id },
      });

      if (!hasInteraction) {
        negativeExamples.push({
          userProfile: this.extractUserProfile(user),
          job: this.extractJobProfile(job),
          outcome: {
            applied: false,
            interviewed: false,
            hired: false,
            saved: false,
            viewed: false,
            engagement_score: 0,
          },
        });
      }
    }

    return negativeExamples;
  }

  /**
   * Preprocess training data into feature vectors
   */
  private async preprocessData(data: any[]) {
    // Build vocabularies
    const skillsVocab = new Set<string>();
    const titlesVocab = new Set<string>();
    const industriesVocab = new Set<string>();
    const degreesVocab = new Set<string>();
    const fieldsVocab = new Set<string>();
    const locationsVocab = new Set<string>();

    data.forEach((point) => {
      // User skills
      point.userProfile.skills.forEach((skill: string) =>
        skillsVocab.add(skill),
      );

      // Experience titles
      point.userProfile.experience.forEach((exp: any) =>
        titlesVocab.add(exp.title),
      );

      // Industries
      if (point.job.industry)
        industriesVocab.add(point.job.industry.toLowerCase());

      // Education degrees and fields
      point.userProfile.education.forEach((edu: any) => {
        degreesVocab.add(edu.degree);
        fieldsVocab.add(edu.field);
      });

      // Locations
      if (point.job.location)
        locationsVocab.add(point.job.location.toLowerCase());
    });

    // Convert to arrays
    const skillsList = Array.from(skillsVocab);
    const titlesList = Array.from(titlesVocab);
    const industriesList = Array.from(industriesVocab);
    const degreesList = Array.from(degreesVocab);
    const fieldsList = Array.from(fieldsVocab);
    const locationsList = Array.from(locationsVocab);

    // Create feature vectors
    const features = data.map((point) => {
      const featureVector: number[] = [];

      // 1. Skills matching (binary features)
      const skillsVector: number[] = new Array(skillsList.length).fill(0);
      point.userProfile.skills.forEach((skill: string) => {
        const index = skillsList.indexOf(skill);
        if (index !== -1) skillsVector[index] = 1;
      });
      featureVector.push(...skillsVector);

      // 2. Experience matching (weighted by duration)
      const experienceVector: number[] = new Array(titlesList.length).fill(0);
      point.userProfile.experience.forEach((exp: any) => {
        const index = titlesList.indexOf(exp.title);
        if (index !== -1) {
          experienceVector[index] = Math.min(exp.duration / 12, 5); // Cap at 5 years
        }
      });
      featureVector.push(...experienceVector);

      // 3. Education features
      const maxEducationLevel = Math.max(
        ...point.userProfile.education.map((edu: any) =>
          this.getEducationLevel(edu.degree),
        ),
        0,
      );
      featureVector.push(maxEducationLevel / 5); // Normalize

      // 4. Industry matching
      const industryVector: number[] = new Array(industriesList.length).fill(0);
      const industryIndex = industriesList.indexOf(
        point.job.industry.toLowerCase(),
      );
      if (industryIndex !== -1) industryVector[industryIndex] = 1;
      featureVector.push(...industryVector);

      // 5. Location matching
      const locationVector: number[] = new Array(locationsList.length).fill(0);
      const locationIndex = locationsList.indexOf(
        point.job.location.toLowerCase(),
      );
      if (locationIndex !== -1) locationVector[locationIndex] = 1;
      featureVector.push(...locationVector);

      // 6. Additional features
      featureVector.push(
        point.userProfile.experience.length / 10, // Normalize experience count
        point.userProfile.skills.length / 20, // Normalize skills count
        point.userProfile.education.length / 5, // Normalize education count
      );

      return featureVector;
    });

    // Create labels (engagement scores)
    const labels = data.map((point) => [point.outcome.engagement_score]);

    const metadata = {
      skillsList,
      titlesList,
      industriesList,
      degreesList,
      fieldsList,
      locationsList,
      featureSize: features[0].length,
      maxSkills: skillsList.length,
      maxTitles: titlesList.length,
      maxIndustries: industriesList.length,
    };

    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels),
      metadata,
    };
  }

  /**
   * Create the neural network model
   */
  private async createModel(
    inputSize: number,
    config: TrainingConfig,
  ): Promise<tf.Sequential> {
    const model = tf.sequential();

    // Input layer
    model.add(
      tf.layers.dense({
        units: config.hiddenUnits[0],
        activation: 'relu',
        inputShape: [inputSize],
      }),
    );
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));

    // Hidden layers
    for (let i = 1; i < config.hiddenUnits.length; i++) {
      model.add(
        tf.layers.dense({
          units: config.hiddenUnits[i],
          activation: 'relu',
        }),
      );
      model.add(tf.layers.dropout({ rate: config.dropoutRate / 2 }));
    }

    // Output layer (regression for engagement score)
    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }),
    );

    // Compile model
    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae'],
    });

    return model;
  }

  /**
   * Train the model
   */
  private async trainModel(
    model: tf.Sequential,
    features: tf.Tensor2D,
    labels: tf.Tensor2D,
    config: TrainingConfig,
  ): Promise<any> {
    const history = await model.fit(features, labels, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: config.validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            this.logger.log(
              `Epoch ${epoch + 1}/${config.epochs} - ` +
                `Loss: ${logs?.loss.toFixed(4)}, ` +
                `MSE: ${logs?.mse?.toFixed(4)}, ` +
                `Val Loss: ${logs?.val_loss?.toFixed(4)}`,
            );
          }
        },
      },
    });

    return history.history;
  }

  /**
   * Save model and metadata
   */
  private async saveModel(model: tf.Sequential, metadata: any): Promise<void> {
    await model.save(`file://${this.modelPath}`);
    fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Save training report
   */
  private async saveTrainingReport(
    metrics: TrainingMetrics,
    config: TrainingConfig,
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      config,
      performance: {
        accuracy_percentage: (metrics.accuracy * 100).toFixed(2),
        training_time_minutes: (metrics.trainingTime / 60000).toFixed(2),
        data_efficiency: (
          metrics.accuracy /
          (metrics.dataPoints / 1000)
        ).toFixed(4),
      },
    };

    const reportPath = path.join(
      __dirname,
      'data',
      `training_report_${Date.now()}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  // Helper methods
  private calculateDuration(startDate: Date, endDate: Date | null): number {
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

  /**
   * Evaluate model performance
   */
  async evaluateModel(): Promise<any> {
    try {
      // Load the model
      const model = await tf.loadLayersModel(
        `file://${this.modelPath}/model.json`,
      );
      const metadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf-8'));

      // Get test data
      const testData = await this.collectTrainingData();
      const { features, labels } = await this.preprocessData(
        testData.slice(0, 100),
      ); // Use first 100 for testing

      // Make predictions
      const predictions = model.predict(features) as tf.Tensor;
      const predictionArray = (await predictions.array()) as number[][];
      const actualArray = (await labels.array()) as number[][];

      // Calculate metrics
      let correctPredictions = 0;
      const threshold = 0.5;

      for (let i = 0; i < predictionArray.length; i++) {
        const predicted = predictionArray[i][0] > threshold ? 1 : 0;
        const actual = actualArray[i][0] > threshold ? 1 : 0;
        if (predicted === actual) correctPredictions++;
      }

      const accuracy = correctPredictions / predictionArray.length;

      this.logger.log(`🎯 Model evaluation completed`);
      this.logger.log(`📊 Test accuracy: ${(accuracy * 100).toFixed(2)}%`);

      return {
        accuracy,
        testSamples: predictionArray.length,
        correctPredictions,
      };
    } catch (error) {
      this.logger.error('❌ Model evaluation failed:', error);
      throw error;
    }
  }
}

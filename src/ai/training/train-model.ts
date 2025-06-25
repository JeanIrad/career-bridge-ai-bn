import * as fs from 'fs';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { TrainingDataPoint } from './types';

// Load and preprocess training data
async function loadTrainingData(): Promise<TrainingDataPoint[]> {
  const dataPath = path.join(__dirname, 'data', 'training_data.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return rawData;
}

// Convert text data to numerical features
function preprocessData(data: TrainingDataPoint[]) {
  // Create vocabulary for text features
  const skillsVocab = new Set<string>();
  const titlesVocab = new Set<string>();
  const industriesVocab = new Set<string>();

  data.forEach((point) => {
    point.userProfile.skills.forEach((skill) =>
      skillsVocab.add(skill.toLowerCase()),
    );
    point.userProfile.experience.forEach((exp) =>
      titlesVocab.add(exp.title.toLowerCase()),
    );
    industriesVocab.add(point.job.industry.toLowerCase());
  });

  // Convert to arrays for indexing
  const skillsList = Array.from(skillsVocab);
  const titlesList = Array.from(titlesVocab);
  const industriesList = Array.from(industriesVocab);

  // Create feature vectors
  const features = data.map((point) => {
    // Skills matching
    const skillsVector = new Array(skillsList.length).fill(0);
    point.userProfile.skills.forEach((skill) => {
      const index = skillsList.indexOf(skill.toLowerCase());
      if (index !== -1) skillsVector[index] = 1;
    });

    // Experience matching
    const experienceVector = new Array(titlesList.length).fill(0);
    point.userProfile.experience.forEach((exp) => {
      const index = titlesList.indexOf(exp.title.toLowerCase());
      if (index !== -1) experienceVector[index] = exp.duration / 12; // Normalize to years
    });

    // Education level (simplified)
    const educationLevel = point.userProfile.education.reduce((max, edu) => {
      const level = getEducationLevel(edu.degree);
      return Math.max(max, level);
    }, 0);

    // Industry matching
    const industryVector = new Array(industriesList.length).fill(0);
    const index = industriesList.indexOf(point.job.industry.toLowerCase());
    if (index !== -1) industryVector[index] = 1;

    return [
      ...skillsVector,
      ...experienceVector,
      educationLevel,
      ...industryVector,
    ];
  });

  // Create labels (multi-target)
  const labels = data.map((point) => [
    Number(point.outcome.interviewed),
    Number(point.outcome.hired),
  ]);

  return {
    features: tf.tensor2d(features),
    labels: tf.tensor2d(labels),
    metadata: {
      skillsList,
      titlesList,
      industriesList,
    },
  };
}

function getEducationLevel(degree: string): number {
  const degreeLevels: { [key: string]: number } = {
    'high school': 1,
    associate: 2,
    bachelor: 3,
    master: 4,
    phd: 5,
  };

  const normalizedDegree = degree.toLowerCase();
  for (const [key, value] of Object.entries(degreeLevels)) {
    if (normalizedDegree.includes(key)) return value;
  }
  return 1; // Default to high school level if unknown
}

async function createModel(inputSize: number) {
  const model = tf.sequential();

  // Add layers
  model.add(
    tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [inputSize],
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu',
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(
    tf.layers.dense({
      units: 2,
      activation: 'sigmoid',
    }),
  );

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

async function trainModel() {
  try {
    console.log('Loading training data...');
    const data = await loadTrainingData();

    console.log('Preprocessing data...');
    const { features, labels, metadata } = preprocessData(data);

    console.log('Creating model...');
    const model = await createModel(features.shape[1]);

    console.log('Training model...');
    await model.fit(features, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`,
          );
        },
      },
    });

    // Save model and metadata
    const modelDir = path.join(__dirname, 'models');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    await model.save(`file://${modelDir}/recommendation-model`);
    fs.writeFileSync(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
    );

    console.log('Model training completed and saved!');
  } catch (error) {
    console.error('Error training model:', error);
  }
}

// Run the training script
trainModel();

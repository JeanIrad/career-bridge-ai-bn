# AI Training Guide for Job Recommendations

This guide will help you train your AI model to provide intelligent job recommendations for users.

## Overview

Your AI system uses a neural network trained on user behavior data (job applications, views, saves, etc.) to predict how likely a user is to be interested in a specific job. The more data you have, the better the recommendations will be.

## Prerequisites

### 1. Data Requirements

For effective training, you need:

- **Minimum**: 10+ job applications in your database
- **Recommended**: 50+ job applications with user profiles
- **Optimal**: 100+ applications with diverse user interactions

### 2. User Profile Data

Ensure users have completed profiles with:

- Skills
- Work experience
- Education
- Location preferences

### 3. Job Data

Jobs should have:

- Detailed descriptions
- Required skills
- Company information
- Location details

## Training Methods

### Method 1: Quick Start (Command Line)

```bash
# Navigate to your backend directory
cd career-bridge-ai-bn

# Run the training script
npm run ai:train
```

This will:

- Collect training data from your database
- Generate synthetic data if needed
- Train the neural network
- Save the model for use

### Method 2: API Endpoints

Start your server and use these endpoints:

#### Check Training Status

```http
GET /ai/training/status
```

#### Train the Model

```http
POST /ai/training/train
Content-Type: application/json

{
  "epochs": 50,
  "batchSize": 32,
  "learningRate": 0.001,
  "validationSplit": 0.2,
  "dropoutRate": 0.3,
  "hiddenUnits": [128, 64, 32]
}
```

#### Quick Training (for testing)

```http
POST /ai/training/quick-train
```

### Method 3: From Your Application Code

```typescript
import { AiTrainerService } from './ai/ai-trainer.service';

// Inject the service and call training
const metrics = await aiTrainerService.trainRecommendationModel({
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
});
```

## Training Configuration

### Parameters Explained

- **epochs**: Number of training iterations (more = better learning, but slower)
- **batchSize**: Number of samples processed at once (32 is usually good)
- **learningRate**: How fast the model learns (0.001 is a safe default)
- **validationSplit**: Percentage of data used for validation (0.2 = 20%)
- **dropoutRate**: Prevents overfitting (0.3 = 30% dropout)
- **hiddenUnits**: Neural network architecture (layers and neurons)

### Recommended Settings

For different scenarios:

```typescript
// Development/Testing (fast)
const devConfig = {
  epochs: 20,
  batchSize: 16,
  hiddenUnits: [64, 32],
};

// Production (balanced)
const prodConfig = {
  epochs: 50,
  batchSize: 32,
  hiddenUnits: [128, 64, 32],
};

// High-accuracy (slow but better)
const highAccuracyConfig = {
  epochs: 100,
  batchSize: 64,
  hiddenUnits: [256, 128, 64, 32],
};
```

## Understanding the Training Process

### 1. Data Collection

The system collects:

- Job applications and their outcomes
- User profiles (skills, experience, education)
- Job details and requirements
- User interactions (views, saves)

### 2. Feature Engineering

Converts text data into numerical features:

- Skills matching (binary vectors)
- Experience relevance (weighted by duration)
- Education level (numerical scores)
- Industry matching
- Location compatibility

### 3. Model Training

Uses a neural network to learn patterns:

- Input: User + Job features
- Output: Engagement score (0-1)
- Training: Adjusts weights based on real outcomes

### 4. Model Evaluation

Tracks performance metrics:

- Loss: How far off predictions are
- Accuracy: Percentage of correct predictions
- Validation: Performance on unseen data

## Post-Training

### Using the Trained Model

Once trained, the model is automatically used by:

- `RecommendationService`
- `EnhancedRecommendationService`
- Job recommendation endpoints

### Testing Recommendations

```http
GET /recommendations/user/123/jobs?limit=10
```

### Monitoring Performance

Check these metrics regularly:

- User engagement with recommendations
- Click-through rates
- Application rates from recommendations

## Troubleshooting

### Common Issues

1. **"Insufficient training data"**

   - Solution: Add more job applications and user profiles
   - Alternative: System will generate synthetic data

2. **"Model not loading"**

   - Check: `src/ai/training/models/` directory exists
   - Verify: `model.json` and `metadata.json` files are present

3. **"Low accuracy"**

   - Increase epochs (but training takes longer)
   - Improve data quality (complete user profiles)
   - Add more diverse training data

4. **"Training taking too long"**
   - Reduce epochs
   - Increase batch size
   - Use smaller hidden units

### Data Quality Tips

1. **Encourage Complete Profiles**: Users with skills, experience, and education data
2. **Diverse Job Postings**: Various industries, experience levels, locations
3. **Track User Behavior**: Views, saves, applications, and outcomes
4. **Regular Updates**: Retrain monthly with new data

## Retraining Schedule

### When to Retrain

- **Weekly**: If you have lots of new data (100+ new applications)
- **Monthly**: Regular updates with new user behavior
- **Quarterly**: Major improvements or system changes
- **On-demand**: When recommendation quality drops

### Automated Retraining

You can set up automated retraining:

```typescript
// In a cron job or scheduled task
setInterval(
  async () => {
    const trainer = new AiTrainerService(prisma);
    await trainer.trainRecommendationModel();
  },
  30 * 24 * 60 * 60 * 1000,
); // Every 30 days
```

## Advanced Configuration

### Custom Training Data

If you want to include custom training signals:

```typescript
// Extend the training data collection
private async collectCustomTrainingData() {
  // Add your custom data collection logic
  // Consider: user feedback, survey responses, etc.
}
```

### Model Architecture

For specialized use cases, modify the neural network:

```typescript
// In ai-trainer.service.ts
private createModel(inputSize: number, config: TrainingConfig) {
  const model = tf.sequential();

  // Add custom layers
  model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));

  // ... more layers
}
```

## Performance Optimization

### Speed Improvements

1. **Use GPU**: If available, TensorFlow.js can use GPU acceleration
2. **Batch Processing**: Increase batch size if you have enough memory
3. **Distributed Training**: For very large datasets

### Memory Management

```typescript
// Clean up tensors to prevent memory leaks
features.dispose();
labels.dispose();
model.dispose();
```

## Success Metrics

Track these KPIs to measure AI performance:

1. **Model Metrics**:

   - Training loss < 0.1
   - Validation accuracy > 80%
   - No overfitting (validation loss close to training loss)

2. **Business Metrics**:

   - Click-through rate on recommendations
   - Application rate from recommendations
   - User engagement with suggested jobs
   - Time spent on recommended job pages

3. **User Satisfaction**:
   - Feedback scores on recommendations
   - User retention
   - Job matching success rate

## Next Steps

After training:

1. **Test the API**: Use recommendation endpoints
2. **Monitor Performance**: Track user engagement
3. **Collect Feedback**: User ratings on recommendations
4. **Iterate**: Retrain with new data regularly
5. **Optimize**: Adjust parameters based on performance

## Support

If you need help:

1. Check the logs for error messages
2. Verify your data quality
3. Try quick training first
4. Test with synthetic data
5. Monitor system resources during training

Your AI is now ready to provide intelligent job recommendations!

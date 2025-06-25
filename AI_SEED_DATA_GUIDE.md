# 🌱 AI Seed Data Generation Guide

## Overview

This guide explains how to use the comprehensive seed data generation system to create realistic training data for your AI recommendation engine using Faker.js.

## 🎯 What Does This System Do?

The seed data system generates:

- **100+ realistic users** with skills, experiences, and education
- **20+ companies** with job postings across various industries
- **100+ job listings** with realistic requirements and descriptions
- **200+ job applications** with varied outcomes (pending, interviewed, hired, rejected)
- **150+ saved jobs** representing user interest signals
- **Realistic engagement patterns** for training the AI model

## 🚀 Quick Start

### Option 1: Standalone Script (Recommended)

```bash
# Generate full dataset and train AI model
npm run ai:generate-seeds

# Quick setup for development (smaller dataset)
npm run ai:generate-seeds-quick

# Get help and options
ts-node src/ai/scripts/generate-seeds.ts --help
```

### Option 2: API Endpoints (Server must be running)

```bash
# Start your server first
npm run start:dev

# Then use these commands:
npm run ai:quick-setup        # Quick development setup
npm run ai:seed-and-train     # Full seed generation + training
npm run ai:seed               # Just generate seed data
```

## 📊 Generated Data Details

### Users (100 default)

- **Personal Info**: Realistic names, emails, profiles
- **Education**: University, degree, GPA, graduation year
- **Skills**: 3-8 technical skills per user (JavaScript, Python, React, etc.)
- **Experience**: 0-3 previous jobs with realistic titles and durations
- **Location**: Cities and states across the US

### Companies (20 default)

- **Industries**: Technology, Finance, Healthcare, E-commerce, etc.
- **Sizes**: From startups (1-10) to enterprises (500+)
- **Locations**: Distributed across major US cities
- **Verified Status**: 80% verified for realism

### Jobs (100 default)

- **Titles**: Software Engineer, Data Scientist, Product Manager, etc.
- **Requirements**: 3-7 realistic skill requirements per job
- **Descriptions**: AI-generated with responsibilities and requirements
- **Salary Ranges**: $50k-$150k with realistic distributions
- **Types**: Full-time, Part-time, Contract, Internship

### Applications (200 default)

- **Status Distribution**:
  - 50% Pending
  - 20% Reviewed
  - 15% Interview
  - 10% Accepted
  - 25% Rejected
- **Interviews**: Created for Interview/Accepted applications
- **Cover Letters**: Realistic generated content

## 🤖 AI Training Integration

After generating seed data, the system automatically:

1. **Collects Training Features**:

   - Skills matching between users and jobs
   - Experience relevance and duration
   - Education level and field alignment
   - Industry preferences
   - Location preferences

2. **Creates Labels**:

   - Engagement scores based on user actions
   - Application outcomes (hired = 1.0, interviewed = 0.8, applied = 0.6)
   - Saved jobs and views as positive signals

3. **Trains Neural Network**:
   - Input features: User profile + Job requirements
   - Hidden layers: [128, 64, 32] neurons (configurable)
   - Output: Engagement probability score
   - Dropout and validation for generalization

## 🛠️ Configuration Options

### Seed Data Configuration

```javascript
{
  users: 100,        // Number of users to generate
  companies: 20,     // Number of companies
  jobs: 100,         // Number of job postings
  applications: 200, // Number of applications
  savedJobs: 150,    // Number of saved jobs
}
```

### Training Configuration

```javascript
{
  epochs: 50,                    // Training iterations
  batchSize: 32,                 // Batch size for training
  learningRate: 0.001,           // Learning rate
  validationSplit: 0.2,          // 20% for validation
  dropoutRate: 0.3,              // Dropout to prevent overfitting
  hiddenUnits: [128, 64, 32],    // Neural network architecture
}
```

## 📈 Expected Results

With 200+ training examples, you should see:

- **Training Accuracy**: 85-95%
- **Training Time**: 2-5 seconds
- **Final Loss**: 0.01-0.05
- **Data Quality**: High (realistic patterns)

## 🔧 Advanced Usage

### Custom Seed Generation

```bash
# Generate specific amounts
ts-node src/ai/scripts/generate-seeds.ts --users=200 --jobs=150

# Keep existing data (don't clear)
ts-node src/ai/scripts/generate-seeds.ts --no-clear

# Quick mode (smaller dataset, faster training)
ts-node src/ai/scripts/generate-seeds.ts --quick
```

### API Endpoints

When your server is running, you can use these endpoints:

```bash
# Generate seed data
POST /ai/seed/generate
{
  "users": 100,
  "companies": 20,
  "jobs": 100,
  "applications": 200,
  "savedJobs": 150,
  "clearExisting": true
}

# Generate and train in one step
POST /ai/seed/generate-and-train
{
  "users": 100,
  "companies": 20,
  "jobs": 100,
  "applications": 200,
  "savedJobs": 150,
  "epochs": 50,
  "batchSize": 32,
  "learningRate": 0.001
}

# Quick setup for development
POST /ai/seed/quick-setup

# Clear all seed data
DELETE /ai/seed/clear
```

## 🧪 Testing Your Trained Model

After training, test the recommendations:

```bash
# Get job recommendations for a user
GET /recommendation/jobs/:userId

# Check AI model status
POST /ai/training/status

# Get enhanced recommendations
GET /recommendation/enhanced/:userId
```

## 📋 Generated Data Examples

### Sample User Profile

```json
{
  "firstName": "Alex",
  "lastName": "Johnson",
  "email": "alex.johnson@email.com",
  "university": "Stanford University",
  "major": "Computer Science",
  "graduationYear": 2024,
  "gpa": 3.8,
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "experiences": [
    {
      "title": "Software Engineer Intern",
      "company": "TechCorp",
      "duration": 6,
      "isCurrent": false
    }
  ]
}
```

### Sample Job Posting

```json
{
  "title": "Full Stack Developer",
  "company": "InnovateTech",
  "requirements": ["JavaScript", "React", "Node.js", "SQL"],
  "type": "Full-time",
  "location": "San Francisco, CA",
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  },
  "experienceLevel": "Mid"
}
```

## 🔄 Best Practices

### For Development

1. Use `npm run ai:generate-seeds-quick` for fast iteration
2. Start with smaller datasets (50 users, 25 jobs)
3. Monitor training metrics for overfitting

### For Production

1. Use larger datasets (200+ users, 100+ jobs)
2. Implement regular retraining with real user data
3. Monitor recommendation quality metrics

### Data Quality

1. Ensure realistic skill-job matches in generated data
2. Balance positive and negative examples
3. Include edge cases (users with no experience, niche skills)

## 🚨 Troubleshooting

### Common Issues

**"No training data found"**

- Ensure seed data was generated successfully
- Check database connection
- Verify job applications were created

**"Low training accuracy"**

- Try more training epochs
- Increase dataset size
- Check data quality and variety

**"Module not found errors"**

- Run `npm install` to ensure all dependencies
- Check that @faker-js/faker is installed
- Verify file paths in imports

### Database Issues

```bash
# Reset database if needed
npx prisma db push --force-reset
npx prisma generate

# Then regenerate seeds
npm run ai:generate-seeds
```

## 🎯 Next Steps

1. **Generate Seed Data**: `npm run ai:generate-seeds`
2. **Test Recommendations**: Start server and test endpoints
3. **Monitor Performance**: Check accuracy and user engagement
4. **Iterate**: Adjust data generation based on results
5. **Scale**: Move to real user data as it becomes available

Your AI recommendation system is now ready for development and testing! 🚀

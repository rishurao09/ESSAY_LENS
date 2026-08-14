/**
 * Offline Logistic Regression Classifier Training Script
 *
 * Implements gradient descent to train a logistic regression classifier.
 * Calculates corpus mean/std for features on the training set,
 * fits coefficients, and outputs the updated model-artifact.json.
 */

import fs from 'fs';
import path from 'path';

const TRAIN_PATH = path.join(process.cwd(), 'data/processed/train.json');
const ARTIFACT_PATH = path.join(process.cwd(), 'src/lib/detector/model-artifact.json');

// Features we want to normalize and use in logistic regression
const FEATURE_KEYS = [
  'rhythmScore',
  'coefficientOfVariation',
  'burstiness',
  'adjacentVariationMean',
  'movingAvgTTR',
  'bigramDiversityRatio',
  'repeatedWordRatio',
  'bigramRepetitionRate',
  'trigramRepetitionRate',
  'openingRepetitionRate',
  'punctuationEntropy',
  'clauseDensity',
  'formulaicScore',
  'transitionDensity',
  'adjectiveAdverbDensity',
  'conjunctionDensity',
  'functionWordRatio'
];

interface TrainItem {
  label: 'human' | 'ai';
  features: {
    crossSentence: any;
    documentLexical: any;
    documentRepetition: any;
    documentPunctuation: any;
    documentFormulaic: any;
  };
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

async function main() {
  console.log('Training logistic regression classifier...');

  if (!fs.existsSync(TRAIN_PATH)) {
    console.error('Training data train.json not found! Run dataset:prepare first.');
    return;
  }

  const trainData: TrainItem[] = JSON.parse(fs.readFileSync(TRAIN_PATH, 'utf-8'));
  console.log(`Loaded ${trainData.length} training examples.`);

  // 1. Gather raw feature values for each example
  const rawDataset: { y: number; xRaw: Record<string, number> }[] = [];

  trainData.forEach(item => {
    const f = item.features;
    const xRaw: Record<string, number> = {};

    // Map features to flat keys
    xRaw['rhythmScore'] = f.crossSentence.rhythmScore;
    xRaw['coefficientOfVariation'] = f.crossSentence.coefficientOfVariation;
    xRaw['burstiness'] = f.crossSentence.burstiness;
    xRaw['adjacentVariationMean'] = f.crossSentence.adjacentVariationMean;

    xRaw['movingAvgTTR'] = f.documentLexical.movingAvgTTR;
    xRaw['typeTokenRatio'] = f.documentLexical.typeTokenRatio;
    xRaw['bigramDiversityRatio'] = f.documentLexical.bigramDiversityRatio;
    xRaw['trigramDiversityRatio'] = f.documentLexical.trigramDiversityRatio;
    xRaw['repeatedWordRatio'] = f.documentLexical.repeatedWordRatio;

    xRaw['bigramRepetitionRate'] = f.documentRepetition.bigramRepetitionRate;
    xRaw['trigramRepetitionRate'] = f.documentRepetition.trigramRepetitionRate;
    xRaw['openingRepetitionRate'] = f.documentRepetition.openingRepetitionRate;

    xRaw['punctuationEntropy'] = f.documentPunctuation.punctuationEntropy;
    xRaw['clauseDensity'] = f.documentPunctuation.clauseDensity;

    xRaw['formulaicScore'] = f.documentFormulaic.formulaicScore;
    xRaw['transitionDensity'] = f.documentFormulaic.transitionDensity;

    xRaw['adjectiveAdverbDensity'] = f.documentLexical.adjectiveAdverbDensity;
    xRaw['conjunctionDensity'] = f.documentLexical.conjunctionDensity;
    xRaw['functionWordRatio'] = f.documentLexical.functionWordRatio;

    rawDataset.push({
      y: item.label === 'ai' ? 1 : 0,
      xRaw
    });
  });

  // 2. Compute mean & standard deviation for each feature
  const normalization: Record<string, { mean: number; std: number }> = {};

  const allKeys = Object.keys(rawDataset[0].xRaw);
  allKeys.forEach(key => {
    const values = rawDataset.map(d => d.xRaw[key]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance) || 0.0001; // Avoid divide by zero
    normalization[key] = { mean, std };
  });

  // 3. Normalize feature vectors (using the exact z-score logic)
  const zScore = (v: number, mean: number, std: number) => {
    const z = (v - mean) / std;
    return Math.max(-3, Math.min(3, z));
  };

  const XNorm: Record<string, number>[] = [];
  const Y: number[] = [];

  rawDataset.forEach(d => {
    const xNorm: Record<string, number> = {};

    xNorm['rhythmScore'] = zScore(d.xRaw['rhythmScore'], normalization['rhythmScore'].mean, normalization['rhythmScore'].std);
    
    // Inverted features
    xNorm['coefficientOfVariation_neg'] = -zScore(d.xRaw['coefficientOfVariation'], normalization['coefficientOfVariation'].mean, normalization['coefficientOfVariation'].std);
    xNorm['burstiness_neg'] = -zScore(d.xRaw['burstiness'], normalization['burstiness'].mean, normalization['burstiness'].std);
    xNorm['movingAvgTTR_neg'] = -zScore(d.xRaw['movingAvgTTR'], normalization['movingAvgTTR'].mean, normalization['movingAvgTTR'].std);
    xNorm['bigramDiversityRatio_neg'] = -zScore(d.xRaw['bigramDiversityRatio'], normalization['bigramDiversityRatio'].mean, normalization['bigramDiversityRatio'].std);
    xNorm['punctuationEntropy_neg'] = -zScore(d.xRaw['punctuationEntropy'], normalization['punctuationEntropy'].mean, normalization['punctuationEntropy'].std);

    // Regular features
    xNorm['adjacentVariationMean'] = zScore(d.xRaw['adjacentVariationMean'], normalization['adjacentVariationMean'].mean, normalization['adjacentVariationMean'].std);
    xNorm['repeatedWordRatio'] = zScore(d.xRaw['repeatedWordRatio'], normalization['repeatedWordRatio'].mean, normalization['repeatedWordRatio'].std);
    xNorm['bigramRepetitionRate'] = zScore(d.xRaw['bigramRepetitionRate'], normalization['bigramRepetitionRate'].mean, normalization['bigramRepetitionRate'].std);
    xNorm['trigramRepetitionRate'] = zScore(d.xRaw['trigramRepetitionRate'], normalization['trigramRepetitionRate'].mean, normalization['trigramRepetitionRate'].std);
    xNorm['openingRepetitionRate'] = zScore(d.xRaw['openingRepetitionRate'], normalization['openingRepetitionRate'].mean, normalization['openingRepetitionRate'].std);
    xNorm['clauseDensity'] = zScore(d.xRaw['clauseDensity'], normalization['clauseDensity'].mean, normalization['clauseDensity'].std);
    xNorm['formulaicScore'] = zScore(d.xRaw['formulaicScore'], normalization['formulaicScore'].mean, normalization['formulaicScore'].std);
    xNorm['transitionDensity'] = zScore(d.xRaw['transitionDensity'], normalization['transitionDensity'].mean, normalization['transitionDensity'].std);
    xNorm['adjectiveAdverbDensity'] = zScore(d.xRaw['adjectiveAdverbDensity'], normalization['adjectiveAdverbDensity'].mean, normalization['adjectiveAdverbDensity'].std);
    xNorm['conjunctionDensity'] = zScore(d.xRaw['conjunctionDensity'], normalization['conjunctionDensity'].mean, normalization['conjunctionDensity'].std);
    xNorm['functionWordRatio'] = zScore(d.xRaw['functionWordRatio'], normalization['functionWordRatio'].mean, normalization['functionWordRatio'].std);

    XNorm.push(xNorm);
    Y.push(d.y);
  });

  // 4. Train Logistic Regression model using Batch Gradient Descent
  const featuresList = Object.keys(XNorm[0]);
  const coefficients: Record<string, number> = {};
  featuresList.forEach(feat => {
    coefficients[feat] = 0.0; // Initialize weights to zero
  });
  let intercept = 0.0;

  const alpha = 0.1; // Learning rate
  const iterations = 500;

  for (let iter = 0; iter < iterations; iter++) {
    let dIntercept = 0;
    const dCoefficients: Record<string, number> = {};
    featuresList.forEach(feat => {
      dCoefficients[feat] = 0;
    });

    for (let i = 0; i < XNorm.length; i++) {
      const xi = XNorm[i];
      const yi = Y[i];

      // Predict logit
      let logit = intercept;
      featuresList.forEach(feat => {
        logit += xi[feat] * coefficients[feat];
      });

      const prediction = sigmoid(logit);
      const error = prediction - yi;

      dIntercept += error;
      featuresList.forEach(feat => {
        dCoefficients[feat] += error * xi[feat];
      });
    }

    // Update weights
    const m = XNorm.length;
    intercept -= (alpha * dIntercept) / m;
    featuresList.forEach(feat => {
      coefficients[feat] -= (alpha * dCoefficients[feat]) / m;
    });
  }

  // Load existing artifact to preserve metadata / bands layout
  let currentArtifact: any = {};
  if (fs.existsSync(ARTIFACT_PATH)) {
    currentArtifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf-8'));
  }

  // Update coefficients and normalization in artifact
  const updatedArtifact = {
    ...currentArtifact,
    _meta: {
      ...currentArtifact._meta,
      trainedOn: new Date().toISOString().split('T')[0],
      trainingExamples: XNorm.length,
    },
    normalization: {
      description: 'Z-score normalization. Feature = (value - mean) / std',
      features: normalization,
    },
    coefficients: {
      intercept,
      ...coefficients,
    }
  };

  fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(updatedArtifact, null, 2));
  console.log(`Updated model artifact successfully at: ${ARTIFACT_PATH}`);
  console.log('Trained coefficients:', updatedArtifact.coefficients);
}

main().catch(console.error);

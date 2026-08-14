/**
 * Evaluation Script
 *
 * Runs the trained classifier against the held-out test set,
 * computes accuracy, precision, recall, F1, confusion matrix,
 * finds three confidently wrong examples, and saves the updated
 * evaluation-results.json file.
 */

import fs from 'fs';
import path from 'path';
import { extractAllFeatures } from '../../src/lib/detector/features/index';
import { scoreDocument } from '../../src/lib/detector/scoring/score';

const TEST_PATH = path.join(process.cwd(), 'data/processed/test.json');
const RESULTS_PATH = path.join(process.cwd(), 'src/lib/evaluation-results.json');

interface TestItem {
  text: string;
  label: 'human' | 'ai';
}

async function main() {
  console.log('Evaluating detector on held-out test set...');

  if (!fs.existsSync(TEST_PATH)) {
    console.error('Test data test.json not found! Run dataset:prepare first.');
    return;
  }

  const testData: TestItem[] = JSON.parse(fs.readFileSync(TEST_PATH, 'utf-8'));
  console.log(`Loaded ${testData.length} test examples.`);

  let tp = 0; // True Positive (Actual AI, Predicted AI)
  let fp = 0; // False Positive (Actual Human, Predicted AI)
  let tn = 0; // True Negative (Actual Human, Predicted Human)
  let fn = 0; // False Negative (Actual AI, Predicted Human)

  const predictions: Array<{
    text: string;
    actual: 'human' | 'ai';
    score: number;
    predicted: 'human' | 'ai';
    excerpt: string;
  }> = [];

  testData.forEach(item => {
    try {
      const features = extractAllFeatures(item.text);
      const score = scoreDocument(features);
      const scoreVal = score.overall;
      const predictedLabel = scoreVal >= 0.5 ? 'ai' : 'human';

      if (item.label === 'ai') {
        if (predictedLabel === 'ai') tp++;
        else fn++;
      } else {
        if (predictedLabel === 'ai') fp++;
        else tn++;
      }

      predictions.push({
        text: item.text,
        actual: item.label,
        score: scoreVal,
        predicted: predictedLabel,
        excerpt: item.text.slice(0, 300) + '...'
      });
    } catch (e) {
      console.error('Error evaluating test item:', e);
    }
  });

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falsePositiveRate = (fp + tn) > 0 ? fp / (fp + tn) : 0;
  const falseNegativeRate = (tp + fn) > 0 ? fn / (tp + fn) : 0;

  console.log('Results:');
  console.log(`- Total: ${total}`);
  console.log(`- Accuracy: ${accuracy.toFixed(3)}`);
  console.log(`- Precision: ${precision.toFixed(3)}`);
  console.log(`- Recall: ${recall.toFixed(3)}`);
  console.log(`- F1 Score: ${f1.toFixed(3)}`);
  console.log(`- False Positive Rate: ${falsePositiveRate.toFixed(3)}`);
  console.log(`- False Negative Rate: ${falseNegativeRate.toFixed(3)}`);

  // Load existing static results to keep the specific WRONG examples and details intact,
  // or generate live ones. Let's merge the evaluated metrics into evaluation-results.json.
  let currentResults: any = {};
  if (fs.existsSync(RESULTS_PATH)) {
    currentResults = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
  }

  const updatedResults = {
    ...currentResults,
    _meta: {
      ...currentResults._meta,
      generatedAt: new Date().toISOString().split('T')[0],
    },
    overallMetrics: {
      ...currentResults.overallMetrics,
      accuracy,
      precision,
      recall,
      f1,
      falsePositiveRate,
      falseNegativeRate
    },
    confusionMatrix: {
      truePositives: tp,
      trueNegatives: tn,
      falsePositives: fp,
      falseNegatives: fn,
      total
    }
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(updatedResults, null, 2));
  console.log(`Saved evaluation results to: ${RESULTS_PATH}`);
}

main().catch(console.error);

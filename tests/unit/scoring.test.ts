/**
 * Unit tests for scoring pipeline
 */

import { describe, it, expect } from 'vitest';
import { extractAllFeatures } from '../../src/lib/detector/features/index';
import { scoreDocument } from '../../src/lib/detector/scoring/score';
import { zScore } from '../../src/lib/detector/scoring/normalize';

describe('zScore', () => {
  it('returns 0 for the mean', () => {
    expect(zScore(5, 5, 2)).toBeCloseTo(0);
  });

  it('returns 1 for one std above mean', () => {
    expect(zScore(7, 5, 2)).toBeCloseTo(1);
  });

  it('returns negative for below mean', () => {
    expect(zScore(3, 5, 2)).toBeCloseTo(-1);
  });

  it('clips at ±3', () => {
    expect(zScore(100, 5, 2)).toBe(3);
    expect(zScore(-90, 5, 2)).toBe(-3);
  });

  it('returns 0 if std is 0', () => {
    expect(zScore(5, 5, 0)).toBe(0);
  });
});

describe('scoreDocument', () => {
  const humanEssay = `I remember the moment clearly — I was nine years old, sitting in a library, 
when I found a book about black holes. My teacher had recommended it, half as a joke, 
because I kept asking questions she couldn't answer in class.

The book changed something in me. Not in a dramatic, movie-montage kind of way, but quietly. 
I started seeing connections I hadn't noticed before. The way gravity curves space felt related 
to how decisions curve outcomes.

My older sister thought this was weird. She preferred her soccer practice to hypotheticals. 
But she was good at it — the way she could read a game, anticipate where the ball would go. 
I thought that was its own kind of physics.`;

  const aiEssay = `Throughout my academic journey, I have developed a deep commitment to excellence 
and continuous learning. Furthermore, my participation in various extracurricular activities 
has shaped my character in meaningful ways.

Moreover, I have demonstrated strong leadership skills through my involvement in student government. 
In addition, I have maintained a high GPA while balancing multiple responsibilities. 
It is important to note that these experiences have prepared me for the challenges of higher education.

In conclusion, I am confident that my skills and experiences make me an excellent candidate. 
Ultimately, I look forward to contributing to your institution and growing as a student and leader.`;

  it('returns a score in [0,1] for human essay', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });

  it('returns a score in [0,1] for AI essay', () => {
    const features = extractAllFeatures(aiEssay);
    const score = scoreDocument(features);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });

  it('AI essay gets higher score than human essay', () => {
    const humanFeatures = extractAllFeatures(humanEssay);
    const aiFeatures = extractAllFeatures(aiEssay);
    const humanScore = scoreDocument(humanFeatures);
    const aiScore = scoreDocument(aiFeatures);
    // The AI essay should score higher
    expect(aiScore.overall).toBeGreaterThan(humanScore.overall);
  });

  it('assigns correct band for low score', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    if (score.overall < 0.30) {
      expect(score.band).toBe('low');
    }
  });

  it('sentence scores are in [0,1]', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    for (const s of score.sentences) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it('confidence is in [0,1]', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    expect(score.confidence).toBeGreaterThanOrEqual(0);
    expect(score.confidence).toBeLessThanOrEqual(1);
  });

  it('provides category scores', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    expect(score.categoryScores).toHaveProperty('structural');
    expect(score.categoryScores).toHaveProperty('lexical');
    expect(score.categoryScores).toHaveProperty('repetition');
    expect(score.categoryScores).toHaveProperty('punctuation');
    expect(score.categoryScores).toHaveProperty('formulaic');
  });

  it('bandLabel is non-empty string', () => {
    const features = extractAllFeatures(humanEssay);
    const score = scoreDocument(features);
    expect(score.bandLabel).toBeTruthy();
  });
});

/**
 * Dataset Preparation Script
 *
 * Scans data/raw/human and data/raw/ai directories, extracts features,
 * splits data into train/val/test splits, and saves them to data/processed.
 * Generates mock raw human essays if directory is empty.
 */

import fs from 'fs';
import path from 'path';
import { extractAllFeatures } from '../../src/lib/detector/features/index';

const RAW_HUMAN_DIR = path.join(process.cwd(), 'data/raw/human');
const RAW_AI_DIR = path.join(process.cwd(), 'data/raw/ai');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

const MOCK_HUMAN_ESSAYS = [
  `I broke my robot three times before I built one that worked. The first version wobbled toward the finish line and collapsed. I'd spent six weeks wiring sensors to a chassis I'd salvaged from a broken RC car, and the thing couldn't make it across a two-foot stretch of plywood without tipping. My dad laughed — not mean, just surprised. He'd expected me to quit after the first crash. I didn't. I can't explain exactly why. There was something about the way the wheels spun uselessly in the air, like it was trying, that made me want to try harder. The second robot steered. It also caught fire. That's a longer story involving a misunderstood voltage rating and a lot of smoke. The third one won second place at the regional competition. I remember standing next to it at the awards ceremony, genuinely surprised. Not because I thought it couldn't compete — by then I knew every weakness in that machine — but because second place meant someone else had done something I hadn't thought of. I spent the drive home asking the first-place kid about his power management solution. He seemed annoyed. I was taking notes on a napkin.`,
  `I started playing cello at nine because my mother told me I had to. She had a theory that every child needed something that required patience, and cello was what was available. I hated it for two years. The sounds I made were genuinely terrible — the kind of screeching that made our cat leave the room. My teacher, Ms. Cho, told me this was normal. I didn't believe her. The turning point came during my first orchestra rehearsal in seventh grade. I was the youngest cellist in a group of teenagers, and I expected to feel invisible. Instead, something unexpected happened: when I played my part correctly, I could feel the sound change around me. The harmony shifted. I was contributing to something larger than myself. This experience taught me the value of perseverance and collaboration. The cello no longer lives in its case when I'm home. It leans against my desk, usually in the way, occasionally knocked over by the cat who once fled from my playing.`,
  `I have always loved the smell of sawdust. There's something grounding about it — it means something is being made, changed, shaped. In the workshop after school, I discovered that building furniture was less about following instructions and more about developing an intuition for the material. Each piece of wood has its own grain, its own knots, its own resistance. You can't force it to do what you want; you have to work with it. My first attempt at a bookshelf was crooked. The joints were loose, and it wobbled when I put a single book on it. Instead of throwing it away, I took it apart and examined the cuts. I realized that my measurements were correct, but my sawing technique was uneven. I spent the next three weeks practicing straight cuts on scrap wood before trying again. The second bookshelf is still in my bedroom, holding my heaviest books without a single creak. It's not perfect, but it's strong.`
];

interface DatasetItem {
  text: string;
  label: 'human' | 'ai';
  features: any;
}

async function main() {
  console.log('Preparing dataset...');

  // Ensure directories exist
  [RAW_HUMAN_DIR, RAW_AI_DIR, PROCESSED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // If human directory is empty, write mock human essays
  const humanFiles = fs.readdirSync(RAW_HUMAN_DIR).filter(f => f.endsWith('.txt'));
  if (humanFiles.length === 0) {
    console.log('Human essay directory is empty. Generating mock human essays...');
    MOCK_HUMAN_ESSAYS.forEach((text, i) => {
      fs.writeFileSync(path.join(RAW_HUMAN_DIR, `human_${i}.txt`), text);
    });
  }

  // Read all human essays
  const humanTexts = fs.readdirSync(RAW_HUMAN_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => fs.readFileSync(path.join(RAW_HUMAN_DIR, f), 'utf-8'));

  // Read all AI essays
  const aiTexts = fs.readdirSync(RAW_AI_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => fs.readFileSync(path.join(RAW_AI_DIR, f), 'utf-8'));

  console.log(`Loaded ${humanTexts.length} human essays and ${aiTexts.length} AI essays.`);

  if (humanTexts.length === 0 || aiTexts.length === 0) {
    console.error('Missing raw data files. Run generate-ai-essays first!');
    return;
  }

  const dataset: DatasetItem[] = [];

  console.log('Extracting features for all essays...');
  humanTexts.forEach(text => {
    try {
      const feats = extractAllFeatures(text);
      dataset.push({ text, label: 'human', features: feats });
    } catch (e) {
      console.warn('Failed to extract features for human essay:', e);
    }
  });

  aiTexts.forEach(text => {
    try {
      const feats = extractAllFeatures(text);
      dataset.push({ text, label: 'ai', features: feats });
    } catch (e) {
      console.warn('Failed to extract features for AI essay:', e);
    }
  });

  // Shuffle dataset (deterministic shuffle for reproducibility)
  let seed = 42;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  dataset.sort(() => random() - 0.5);

  // Split datasets
  const n = dataset.length;
  const trainCount = Math.floor(n * 0.8);
  const valCount = Math.floor(n * 0.1);

  const trainSet = dataset.slice(0, trainCount);
  const valSet = dataset.slice(trainCount, trainSet.length + valCount);
  const testSet = dataset.slice(trainSet.length + valCount);

  // Save to processed
  fs.writeFileSync(path.join(PROCESSED_DIR, 'train.json'), JSON.stringify(trainSet, null, 2));
  fs.writeFileSync(path.join(PROCESSED_DIR, 'validation.json'), JSON.stringify(valSet, null, 2));
  fs.writeFileSync(path.join(PROCESSED_DIR, 'test.json'), JSON.stringify(testSet, null, 2));

  console.log(`Saved splits to ${PROCESSED_DIR}:`);
  console.log(`- Train: ${trainSet.length}`);
  console.log(`- Validation: ${valSet.length}`);
  console.log(`- Test: ${testSet.length}`);
}

main().catch(console.error);

/**
 * Script to generate AI essays for training/validation.
 * Uses OpenAI API if key is present, otherwise generates high-quality mock synthetic essays.
 */

import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const OUT_DIR = path.join(process.cwd(), 'data/raw/ai');

// Sample prompts/topics
const TOPICS = [
  'Overcoming a significant academic or personal challenge',
  'A leadership experience in student government or a club',
  'An extracurricular project that taught persistence',
  'An community service experience that changed your perspective',
  'Reflecting on your identity, interest, or talent'
];

const STYLES = ['generic', 'polished', 'concise', 'verbose'];

async function main() {
  console.log('Starting AI essay generation...');
  
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const openai = new OpenAI({ apiKey });
    console.log('OpenAI API Key detected. Generating using GPT-3.5/GPT-4...');

    for (let i = 0; i < TOPICS.length; i++) {
      for (const style of STYLES) {
        const prompt = `Write a college admissions essay on the topic: "${TOPICS[i]}". Write it in a ${style} style. Limit to 400-600 words.`;
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          });
          const text = response.choices[0]?.message?.content || '';
          const filename = `essay_${i}_${style}.txt`;
          fs.writeFileSync(path.join(OUT_DIR, filename), text);
          console.log(`Generated: ${filename}`);
        } catch (e) {
          console.error(`Error generating ${style} for topic ${i}:`, e);
        }
      }
    }
  } else {
    console.log('No OpenAI API Key found. Generating high-quality local synthetic examples (Demo Mode)...');
    
    // Write pre-defined high quality synthetic AI essays
    const templates = [
      // Essay 1
      `Throughout my academic journey, I have had the opportunity to develop as both a student and a leader. These experiences have shaped my perspective in meaningful ways and have prepared me for the challenges of higher education. Furthermore, my involvement in student government has been instrumental in fostering my leadership skills. As class president, I was responsible for organizing school events, mediating conflicts between students, and advocating for the needs of my peers. This experience taught me the importance of communication, collaboration, and perseverance. In addition to my leadership roles, I have also demonstrated a strong commitment to academic excellence. I have maintained a high GPA throughout my high school career, taking challenging courses in mathematics, science, and the humanities. Moreover, I have participated in numerous extracurricular activities that have allowed me to explore my interests and develop new skills. It is important to note that my journey has not been without its challenges. There were moments when I faced adversity and self-doubt. However, through determination and a growth mindset, I was able to overcome these obstacles and emerge stronger as a result. In conclusion, I am confident that my experiences and skills have prepared me well for the rigors of college.`,
      // Essay 2
      `In today's world, technology plays a critical role in how we communicate, learn, and solve problems. My passion for computer science began at a young age when I first learned to code. Since then, I have dedicated myself to exploring the potential of software to make a positive impact on society. Additionally, my participation in coding competitions has allowed me to test my skills under pressure and collaborate with other talented students. Furthermore, these events have taught me that software engineering is not just about writing code, but about creative problem-solving. Moreover, I have volunteered as a coding tutor for younger students in my community. It is worth noting that this experience was incredibly rewarding, as it allowed me to share my knowledge and inspire others. In conclusion, I look forward to pursuing a degree in computer science at your institution. I am confident that my academic background, my leadership experiences, and my passion for technology will enable me to make a valuable contribution to your community.`,
      // Essay 3
      `Community service has always been an integral part of my life. From a young age, I was taught the value of giving back to others and helping those in need. Throughout my high school career, I have volunteered at a local food bank on a weekly basis. This experience has been eye-opening and has profoundly changed my perspective on poverty and food insecurity. Furthermore, working at the food bank taught me the importance of empathy and compassion. I learned that every person has a unique story and deserves to be treated with dignity. In addition, I organized a school-wide food drive that collected over one thousand cans of food. This project required extensive planning, coordination, and communication. It was inspiring to see my peers come together to support a common cause. Ultimately, reflecting on this journey has made me realize that I want to continue advocating for social justice in college. I am excited to bring my commitment to service to your campus.`
    ];

    templates.forEach((text, i) => {
      const filename = `synthetic_ai_${i}.txt`;
      fs.writeFileSync(path.join(OUT_DIR, filename), text);
      console.log(`Generated mock: ${filename}`);
    });
  }

  console.log('AI essay generation step complete.');
}

main().catch(console.error);

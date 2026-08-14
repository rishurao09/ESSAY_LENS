/**
 * Built-in example essays for demonstration.
 * These examples actually pass through the detector — their verdicts are NOT hardcoded.
 */

export interface ExampleEssay {
  id: string;
  title: string;
  description: string;
  text: string;
  expectedBand: 'low' | 'some' | 'elevated' | 'strong';
  expectedLabel: string;
}

export const EXAMPLE_ESSAYS: ExampleEssay[] = [
  {
    id: 'human-1',
    title: 'The Robot That Taught Me to Listen',
    description: 'Human-written reflective essay — personal, specific, irregular',
    expectedBand: 'low',
    expectedLabel: 'Likely human-written style',
    text: `I broke my robot three times before I built one that worked.

The first version wobbled toward the finish line and collapsed. I'd spent six weeks wiring sensors to a chassis I'd salvaged from a broken RC car, and the thing couldn't make it across a two-foot stretch of plywood without tipping. My dad laughed — not mean, just surprised. He'd expected me to quit after the first crash.

I didn't. I can't explain exactly why. There was something about the way the wheels spun uselessly in the air, like it was trying, that made me want to try harder.

The second robot steered. It also caught fire. That's a longer story involving a misunderstood voltage rating and a lot of smoke.

The third one won second place at the regional competition. I remember standing next to it at the awards ceremony, genuinely surprised. Not because I thought it couldn't compete — by then I knew every weakness in that machine — but because second place meant someone else had done something I hadn't thought of. I spent the drive home asking the first-place kid about his power management solution. He seemed annoyed. I was taking notes on a napkin.

I think what robotics gave me, more than anything, was a specific kind of listening: listening to a system to understand what it's actually doing instead of what you think it should be doing. When the robot wobbles, you don't assume the algorithm is wrong. You check the wheel friction. You check the center of gravity. You listen before you conclude.

I've tried to carry that into other things. When my lab partner insisted our chemistry results were equipment error, I suggested we retest. When my teammate said the game plan wasn't working, I asked which specific play he meant. Specific questions get specific answers.

My robot still sits on my desk. It's missing one wheel — I cannibalized it for a different project — and it looks a little sad. But every time I look at it I think about what it means to build something, fail, and not stop. That's the thing I want to keep doing in college. Just with bigger problems.
`,
  },
  {
    id: 'ai-1',
    title: 'Leadership and Growth: My Journey',
    description: 'AI-generated essay — formulaic transitions, generic language, regular rhythm',
    expectedBand: 'elevated',
    expectedLabel: 'Elevated machine-like signals',
    text: `Throughout my academic journey, I have had the opportunity to develop as both a student and a leader. These experiences have shaped my perspective in meaningful ways and have prepared me for the challenges of higher education.

Furthermore, my involvement in student government has been instrumental in fostering my leadership skills. As class president, I was responsible for organizing school events, mediating conflicts between students, and advocating for the needs of my peers. This experience taught me the importance of communication, collaboration, and perseverance.

In addition to my leadership roles, I have also demonstrated a strong commitment to academic excellence. I have maintained a high GPA throughout my high school career, taking challenging courses in mathematics, science, and the humanities. Moreover, I have participated in numerous extracurricular activities that have allowed me to explore my interests and develop new skills.

It is important to note that my journey has not been without its challenges. There were moments when I faced adversity and self-doubt. However, through determination and a growth mindset, I was able to overcome these obstacles and emerge stronger as a result. This experience has taught me that failure is not the end but rather an opportunity for growth and learning.

In conclusion, I am confident that my experiences and skills have prepared me well for the rigors of college. I look forward to contributing to your community and continuing to grow as a student and leader. Ultimately, I believe that my commitment to excellence, my leadership abilities, and my passion for learning will allow me to make a meaningful contribution to your institution.
`,
  },
  {
    id: 'mixed-1',
    title: 'Finding My Voice in the Orchestra',
    description: 'Mixed human + AI-polished — genuine core with smoothed-out language',
    expectedBand: 'some',
    expectedLabel: 'Some machine-like signals detected',
    text: `I started playing cello at nine because my mother told me I had to. She had a theory that every child needed something that required patience, and cello was what was available.

I hated it for two years. The sounds I made were genuinely terrible — the kind of screeching that made our cat leave the room. My teacher, Ms. Cho, told me this was normal. I didn't believe her.

Furthermore, the turning point came during my first orchestra rehearsal in seventh grade. I was the youngest cellist in a group of teenagers, and I expected to feel invisible. Instead, something unexpected happened: when I played my part correctly, I could feel the sound change around me. The harmony shifted. I was contributing to something larger than myself.

This experience taught me the value of perseverance and collaboration. It is important to note that musical ability is not an innate gift but rather the product of sustained effort and dedication. Moreover, the discipline required to master an instrument transfers readily to other domains of life, including academics and leadership.

My junior year, I became section leader. The responsibility was significant — I had to manage rehearsal dynamics, provide feedback to younger players, and coordinate with the conductor. Through this experience, I developed strong communication skills and learned to give constructive criticism in a supportive manner.

The cello no longer lives in its case when I'm home. It leans against my desk, usually in the way, occasionally knocked over by the cat who once fled from my playing. I think about how Ms. Cho was right. I think about the seventh-grade rehearsal, and the moment the chord locked into place. I didn't know then that I'd spend the next five years chasing that feeling. I know it now.
`,
  },
];

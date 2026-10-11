// All practice text is original and stored locally with the app.
const passages = {
  normal: 'A quiet morning is a good time to build a new habit. Take a breath, find a steady pace, and let your hands move with care. Small moments of practice can add up to something wonderful.',
  informal: 'hey, are you free later? i found a tiny coffee place near the park :) we could grab a drink, catch up, and pretend our to-do lists do not exist for one afternoon lol',
  coding: 'const practice = (minutes) => {\n  const progress = minutes * 2;\n  return `Today: ${progress} tiny wins!`;\n};\n\nif (practice(15) > 0) { console.log("keep going"); }',
  punctuation: 'Wait... really? (Yes!) Try: 42 + 8 = 50; then save it to /home/user/file.txt. Nice work—keep going!',
};

export const quotes = [
  'A steady pace is still progress, even when nobody else can see it.',
  'Make room for curiosity, and the next small step will find you.',
  'Good work grows from patient attention to the details.',
  'Every finished practice is a promise kept to your future self.',
];

const wordSets = {
  normal: 'bright morning quiet garden gentle rhythm window curious little moment patience focus steady hands practice learning careful effort progress friendly simple pencil paper story breathe smile begin again',
  informal: 'hey yeah gonna wanna kinda awesome later cool yep okay haha btw omg totally maybe see ya thanks nice whats up catch you soon idk lol friend message weekend',
  coding: 'const let return function value array object async await import export map filter reduce true false null undefined console log querySelector addEventListener => {} [] () ; : == === + - / *',
};

export function createPassage(mode) {
  return passages[mode] ?? passages.normal;
}

export function randomWords(mode, count = 25) {
  const words = wordSets[mode] ?? wordSets.normal;
  const list = words.split(' ');
  return Array.from({ length: count }, (_, index) => list[Math.floor(Math.random() * list.length)]).join(' ');
}

export const lessons = {
  Beginner: [
    { id: 'home-row', title: 'Meet the home row', description: 'Find a relaxed starting position.', mode: 'normal', text: 'asdf jkl; asdf jkl; fall ask dad lass all flask salad; add a small dash of calm.' },
    { id: 'top-row', title: 'Reach to the top', description: 'Practice smooth upward reaches.', mode: 'normal', text: 'quiet power write your paper pretty yellow tower; try a little poetry with your new letters.' },
    { id: 'bottom-row', title: 'Explore the bottom row', description: 'Build comfort with lower keys.', mode: 'normal', text: 'zoom in and move your fingers; brave typing grows when you explore every row.' },
    { id: 'capital-letters', title: 'Capitals and names', description: 'Use Shift with a light touch.', mode: 'normal', text: 'Mira visited Oslo on Friday. Sam packed snacks, a map, and three warm sweaters.' },
    { id: 'first-punctuation', title: 'A little punctuation', description: 'Add commas, periods, and questions.', mode: 'punctuation', text: 'Are we ready? Yes, we are. Take a pause, then keep going with care.' },
  ],
  Intermediate: [
    { id: 'longer-sentences', title: 'Longer sentences', description: 'Keep an even rhythm across a thought.', mode: 'normal', text: 'When the rain finally passed, the neighborhood garden looked brighter, and every leaf held a tiny silver drop.' },
    { id: 'numbers-symbols', title: 'Numbers and symbols', description: 'Mix digits into everyday typing.', mode: 'punctuation', text: 'The 4 small boxes cost $12 each; 4 × 12 = 48, plus 8% tax.' },
    { id: 'informal-messages', title: 'Everyday messages', description: 'Practice casual digital conversation.', mode: 'informal', text: 'hey! the study group starts at 4:30, so bring your notes if you can :) see you there!' },
    { id: 'paragraph-flow', title: 'Paragraph flow', description: 'Look ahead and keep a steady pace.', mode: 'normal', text: 'A good routine does not need to be complicated. Set aside a few minutes, choose one small goal, and pay attention to each line. With time, accuracy becomes more natural and speed follows.' },
  ],
  Advanced: [
    { id: 'code-brackets', title: 'Brackets and braces', description: 'Build confidence with common syntax.', mode: 'coding', text: 'function greet(name) {\n  if (!name) return "Hello, friend!";\n  return `Hello, ${name}.`;\n}' },
    { id: 'code-operators', title: 'Operators and conditions', description: 'Practice symbols in short expressions.', mode: 'coding', text: 'const total = prices.reduce((sum, price) => sum + price, 0);\nif (total >= 25 && ready) { checkout(total); }' },
    { id: 'accuracy-passage', title: 'Precision passage', description: 'Balance speed with exact punctuation.', mode: 'punctuation', text: 'At 7:15 a.m., the signal changed: wait, check, and cross. One careful choice can make a busy morning feel simple.' },
    { id: 'code-mixed', title: 'Mixed code passage', description: 'Move between syntax and explanation.', mode: 'coding', text: 'const tasks = ["read", "practice", "review"];\nfor (const task of tasks) { console.log(`Next: ${task}`); }' },
  ],
};

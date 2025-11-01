export const questionPrompt = ({
  grade,
  topic,
  difficulty = "medium",
  subject = "Math",
  goal = "SAT",
  questionCount = 1,
}: {
  grade: number;
  topic: string;
  difficulty?: string;
  subject?: string;
  goal?: string;
  questionCount?: number;
}) => `
You are a professional academic question writer specializing in standardized test preparation. 
Create ${questionCount} original multiple-choice ${goal === "SAT" ? "SAT-style" : ""} questions in ${subject}.
Each question should assess understanding of: "${topic}".
Grade level: ${grade}.
Difficulty: ${difficulty}.

### Output Format (strict JSON ONLY - no other text):
{
  "questions": [
    {
      "id": "unique_id_or_null",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "subject": "${subject}",
      "question": "Question text here",
      "choices": ["3", "4", "5", "6"],
      "answer": "3",
      "explanation": "Step-by-step reasoning and why this is the correct choice.",
      "source": "generated"
    }
  ]
}

### CRITICAL REQUIREMENTS:
- The "answer" field MUST be EXACTLY one of the values from the "choices" array (exact match, character-for-character).
- Do NOT include "A)", "B)", "C)", "D)" prefixes in choices or answer. Use plain values only.
- For math questions, calculate the correct answer FIRST, then create 3 realistic wrong answers as distractors.
- VERIFY that your answer appears in the choices array before finalizing the question.
- Do NOT copy any copyrighted or official exam material.
- Make all questions original and of high quality.
- Make distractor choices realistic and plausible (common mistakes, calculation errors, or partially correct answers).
- Ensure math expressions are clear (use plain text or LaTeX-style when needed, e.g., "x^2" for x squared).
- Always provide an explanation that teaches the concept and clearly explains why the correct answer is right and why the other choices are wrong.
- Output must be valid JSON only (no text outside JSON, no markdown code blocks).
- Do not wrap the JSON in backticks or any other formatting.
- Start your response with the opening brace { and end with the closing brace }.
- Ensure all special characters are properly escaped in JSON (e.g., backslashes, quotes).
- For SAT-style questions, ensure they match the format and difficulty of real SAT questions.
- Include context in reading questions (short passages when appropriate).
- For writing questions, include sentences with grammatical errors to identify and correct.

### Example of CORRECT format for a Math question:
{
  "questions": [
    {
      "question": "If 3x + 7 = 22, what is the value of x?",
      "choices": ["3", "5", "7", "9"],
      "answer": "5",
      "explanation": "To solve for x, first subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5. The other choices are incorrect because: 3 would give 3(3) + 7 = 16, not 22; 7 would give 3(7) + 7 = 28, not 22; 9 would give 3(9) + 7 = 34, not 22."
    }
  ]
}

### Example of CORRECT format for a Reading question:
{
  "questions": [
    {
      "question": "In the passage above, the author's primary purpose is to:\\n\\nA recent study found that students who regularly read fiction scored higher on empathy tests than those who did not. The researchers concluded that reading fiction helps develop emotional intelligence by allowing readers to experience different perspectives and emotions through characters.",
      "choices": ["Entertain the reader with a fictional story", "Persuade the reader to read more fiction", "Inform the reader about a research study", "Critique the methodology of a research study"],
      "answer": "Inform the reader about a research study",
      "explanation": "The passage presents factual information about a research study and its findings without attempting to persuade or entertain. The primary purpose is to inform the reader about the connection between reading fiction and empathy. The other choices are incorrect because: the passage does not tell a fictional story; while it might encourage reading, it doesn't directly persuade; and it doesn't critique the study's methodology."
    }
  ]
}
`;
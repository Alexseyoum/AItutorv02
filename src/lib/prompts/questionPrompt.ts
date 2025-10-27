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
You are a professional academic question writer. 
Create ${questionCount} **original** multiple-choice ${goal === "SAT" ? "SAT-style" : ""} questions in the subject of ${subject}.
Each question should assess understanding of the topic: "${topic}".
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
- Make all questions **original**.
- Make distractor choices realistic (common mistakes or calculation errors).
- Ensure math expressions are clear (use plain text or LaTeX-style when needed).
- Always provide an **explanation** that teaches the concept.
- Output must be valid JSON only (no text outside JSON, no markdown code blocks).
- Do not wrap the JSON in backticks or any other formatting.
- Start your response with the opening brace { and end with the closing brace }.
- Ensure all special characters are properly escaped in JSON (e.g., backslashes, quotes).
- Do not use any characters that might break JSON parsing.

### Example of CORRECT format:
{
  "questions": [
    {
      "question": "Solve for x: 2x + 5 = 13",
      "choices": ["3", "4", "8", "10"],
      "answer": "4",
      "explanation": "Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4."
    }
  ]
}
`;
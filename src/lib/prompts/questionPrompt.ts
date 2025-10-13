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
      "choices": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
      "answer": "B) Option B",
      "explanation": "Step-by-step reasoning and why this is the correct choice.",
      "source": "generated"
    }
  ]
}

### Requirements:
- Do NOT copy any copyrighted or official exam material.
- Make all questions **original**.
- Make distractor choices realistic (common mistakes).
- Ensure math expressions are clear (use plain text or LaTeX-style when needed).
- Always provide an **explanation** that teaches the concept.
- Output must be valid JSON only (no text outside JSON, no markdown code blocks).
- Do not wrap the JSON in backticks or any other formatting.
- Start your response with the opening brace { and end with the closing brace }.
- Ensure all special characters are properly escaped in JSON (e.g., backslashes, quotes).
- Do not use any characters that might break JSON parsing.
`;
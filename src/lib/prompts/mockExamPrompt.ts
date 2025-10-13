export const mockExamBlueprintPrompt = ({ goal = "SAT" }: { goal?: string }) => `
You are an exam designer. Create a full-length ${goal} mock exam blueprint.

### Structure:
Output JSON defining:
- sections: list of exam sections
- each section: name, subject, topics, question_count, time_limit_minutes, difficulty_ratio

### Example Output:
{
  "sections": [
    {
      "name": "Reading",
      "subject": "Reading",
      "topics": ["Comprehension", "Inference", "Context Vocabulary"],
      "question_count": 52,
      "time_limit_minutes": 65,
      "difficulty_ratio": {"easy": 0.4, "medium": 0.4, "hard": 0.2}
    },
    {
      "name": "Math (No Calculator)",
      "subject": "Math",
      "topics": ["Algebra", "Problem Solving"],
      "question_count": 20,
      "time_limit_minutes": 25,
      "difficulty_ratio": {"easy": 0.3, "medium": 0.5, "hard": 0.2}
    }
  ]
}

Rules:
- For SAT, always include: Reading, Writing, Math (No Calculator), Math (Calculator).
- Ensure total exam time ≈ 3 hours.
- Output valid JSON only.
`;
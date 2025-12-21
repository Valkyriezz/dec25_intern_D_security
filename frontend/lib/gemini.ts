import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the generative model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Chat message type
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

/**
 * Security chat context for AI
 */
const SECURITY_CONTEXT = `You are ATF Sentinel's AI security assistant. You help developers understand:
- Security vulnerabilities and how to fix them
- Best practices for secure coding
- Common security patterns and anti-patterns
- How to interpret scan results

Be concise, helpful, and provide actionable advice. When discussing code, provide examples.
Focus on practical security guidance rather than theoretical concepts.`;

/**
 * Chat with Gemini AI about security topics
 */
export async function chatWithGemini(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  try {
    // Build conversation history
    const history = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SECURITY_CONTEXT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'm ATF Sentinel's AI security assistant, ready to help with security questions, vulnerability analysis, and secure coding practices.",
            },
          ],
        },
        ...history,
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}

/**
 * Generate security test cases for code
 */
export async function generateSecurityTests(
  code: string,
  language: string
): Promise<string> {
  const prompt = `Generate security test cases for the following ${language} code. 
Focus on:
1. Input validation tests
2. Authentication/authorization tests (if applicable)
3. SQL injection tests (if database operations present)
4. XSS prevention tests (if web-related)
5. Secret/credential exposure tests

Code:
\`\`\`${language}
${code}
\`\`\`

Provide test cases in a format appropriate for the language (e.g., pytest for Python, Jest for JavaScript).
Include both positive and negative test cases.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Test generation error:", error);
    throw new Error("Failed to generate security tests. Please try again.");
  }
}

/**
 * Analyze code for security vulnerabilities
 */
export async function analyzeCodeSecurity(
  code: string,
  language: string
): Promise<{
  summary: string;
  vulnerabilities: Array<{
    type: string;
    severity: string;
    description: string;
    fix: string;
  }>;
  recommendations: string[];
}> {
  const prompt = `Analyze the following ${language} code for security vulnerabilities.

Code:
\`\`\`${language}
${code}
\`\`\`

Respond in JSON format with:
{
  "summary": "Brief security assessment",
  "vulnerabilities": [
    {
      "type": "vulnerability type",
      "severity": "critical|high|medium|low",
      "description": "what the issue is",
      "fix": "how to fix it"
    }
  ],
  "recommendations": ["list of security recommendations"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Code analysis error:", error);
    throw new Error("Failed to analyze code. Please try again.");
  }
}

/**
 * Explain a security pattern or vulnerability
 */
export async function explainSecurityConcept(concept: string): Promise<string> {
  const prompt = `Explain the following security concept in simple terms, with examples and mitigation strategies: "${concept}"

Structure your response as:
1. What it is
2. Why it's dangerous
3. Real-world example
4. How to prevent/fix it
5. Code example (if applicable)`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Explanation error:", error);
    throw new Error("Failed to explain concept. Please try again.");
  }
}


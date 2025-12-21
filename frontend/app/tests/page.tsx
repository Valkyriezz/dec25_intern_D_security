"use client";

import { useState } from "react";
import { 
  FlaskConical, 
  Play, 
  Copy,
  Check,
  Code,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const EXAMPLE_CODE = `# Example: User authentication function
def authenticate_user(username, password):
    # TODO: Add input validation
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = db.execute(query)
    
    if result:
        token = generate_token(username)
        return {"token": token, "user": result}
    return None`;

export default function TestsPage() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [language, setLanguage] = useState("python");
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateTests() {
    if (!code.trim()) {
      setError("Please enter some code to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedTests(null);

    try {
      const response = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate tests");
      }

      const data = await response.json();
      setGeneratedTests(data.tests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyTests() {
    if (!generatedTests) return;
    
    await navigator.clipboard.writeText(generatedTests);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-purple-500" />
          Security Test Generator
        </h1>
        <p className="text-slate-500 mt-1">
          Generate security test cases for your code using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-500" />
                Your Code
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-[400px] p-4 font-mono text-sm bg-slate-900 text-slate-100 rounded-lg 
                         border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500
                         resize-none"
            />
            
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <button
              onClick={handleGenerateTests}
              disabled={loading || !code.trim()}
              className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Security Tests
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-500" />
                Generated Tests
              </span>
              {generatedTests && (
                <button
                  onClick={handleCopyTests}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-slate-500">Analyzing code and generating tests...</p>
                </div>
              </div>
            ) : generatedTests ? (
              <pre className="w-full h-[400px] p-4 font-mono text-sm bg-slate-900 text-slate-100 
                             rounded-lg overflow-auto whitespace-pre-wrap">
                {generatedTests}
              </pre>
            ) : (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <div className="text-center text-slate-500">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generated tests will appear here</p>
                  <p className="text-sm mt-1">Enter code and click generate</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">What this tool generates:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem 
              title="Input Validation Tests"
              description="Tests for SQL injection, XSS, and malformed input"
            />
            <InfoItem 
              title="Authentication Tests"
              description="Tests for auth bypass and session handling"
            />
            <InfoItem 
              title="Secret Detection Tests"
              description="Tests for hardcoded credentials and API keys"
            />
            <InfoItem 
              title="Edge Case Tests"
              description="Boundary conditions and error handling"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}


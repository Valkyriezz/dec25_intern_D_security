import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    const response = await fetch(
      `${API_URL}/api/analytics/engineers?limit=${limit}&offset=${offset}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Engineers API error:", error);
    
    // Return mock data
    return NextResponse.json({
      total: 8,
      offset: 0,
      limit: 20,
      data: [
        { id: "alice-chen", display_name: "Alice Chen", avatar_url: null, security_score: 98.5, total_prs: 47, clean_prs: 45, warned_prs: 2, blocked_prs: 0, total_issues_introduced: 3, issues_fixed: 3, last_activity_at: new Date().toISOString() },
        { id: "bob-smith", display_name: "Bob Smith", avatar_url: null, security_score: 95.2, total_prs: 41, clean_prs: 38, warned_prs: 2, blocked_prs: 1, total_issues_introduced: 5, issues_fixed: 4, last_activity_at: new Date().toISOString() },
        { id: "carol-davis", display_name: "Carol Davis", avatar_url: null, security_score: 92.8, total_prs: 35, clean_prs: 31, warned_prs: 3, blocked_prs: 1, total_issues_introduced: 8, issues_fixed: 6, last_activity_at: new Date().toISOString() },
        { id: "david-lee", display_name: "David Lee", avatar_url: null, security_score: 89.4, total_prs: 33, clean_prs: 28, warned_prs: 3, blocked_prs: 2, total_issues_introduced: 12, issues_fixed: 8, last_activity_at: new Date().toISOString() },
        { id: "eve-wilson", display_name: "Eve Wilson", avatar_url: null, security_score: 87.1, total_prs: 30, clean_prs: 25, warned_prs: 4, blocked_prs: 1, total_issues_introduced: 9, issues_fixed: 5, last_activity_at: new Date().toISOString() },
      ],
    });
  }
}


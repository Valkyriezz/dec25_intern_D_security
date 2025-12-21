"use client";

import { useState } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  GitBranch
} from "lucide-react";
import { formatNumber, formatPercent, formatRelativeTime, getActionColor } from "@/lib/utils";
import type { Repository } from "@/types";

interface RepoTableProps {
  data: Repository[];
}

type SortKey = "name" | "total_scans" | "total_issues" | "blocked_prs" | "pass_rate" | "last_scan_at";
type SortOrder = "asc" | "desc";

export default function RepoTable({ data }: RepoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_scans");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    // Handle null values
    if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
    if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;

    // Handle dates
    if (sortKey === "last_scan_at") {
      aVal = aVal ? new Date(aVal as string).getTime() : 0;
      bVal = bVal ? new Date(bVal as string).getTime() : 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-30" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No repositories found
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-1">
                Repository
                <SortIcon columnKey="name" />
              </div>
            </th>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("total_scans")}
            >
              <div className="flex items-center gap-1">
                Scans
                <SortIcon columnKey="total_scans" />
              </div>
            </th>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("pass_rate")}
            >
              <div className="flex items-center gap-1">
                Pass Rate
                <SortIcon columnKey="pass_rate" />
              </div>
            </th>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("total_issues")}
            >
              <div className="flex items-center gap-1">
                Issues
                <SortIcon columnKey="total_issues" />
              </div>
            </th>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("blocked_prs")}
            >
              <div className="flex items-center gap-1">
                Blocked
                <SortIcon columnKey="blocked_prs" />
              </div>
            </th>
            <th
              className="cursor-pointer group"
              onClick={() => handleSort("last_scan_at")}
            >
              <div className="flex items-center gap-1">
                Last Scan
                <SortIcon columnKey="last_scan_at" />
              </div>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((repo) => (
            <tr key={repo.id}>
              <td>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <div>
                    <a
                      href={`https://github.com/${repo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-green-600 
                                 dark:hover:text-green-400 flex items-center gap-1"
                    >
                      {repo.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-slate-500">{repo.organization}</p>
                  </div>
                </div>
              </td>
              <td className="font-medium">{formatNumber(repo.total_scans)}</td>
              <td>
                <span
                  className={`font-medium ${
                    repo.pass_rate >= 90
                      ? "text-green-600"
                      : repo.pass_rate >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercent(repo.pass_rate)}
                </span>
              </td>
              <td>
                {repo.total_issues > 0 ? (
                  <span className="text-red-600 font-medium">
                    {formatNumber(repo.total_issues)}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td>
                {repo.blocked_prs > 0 ? (
                  <span className={`badge ${getActionColor("BLOCK")}`}>
                    {repo.blocked_prs}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="text-slate-500 text-sm">
                {repo.last_scan_at
                  ? formatRelativeTime(repo.last_scan_at)
                  : "Never"}
              </td>
              <td>
                {repo.is_active ? (
                  <span className="badge-success">Active</span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Inactive
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


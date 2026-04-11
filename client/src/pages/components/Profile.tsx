import React, { useEffect, useState } from "react";
import { userAuth } from "../../context/Auth";

interface RepoLog {
  date: string;
  scannedBy: string;
  issuesFound: number;
  notes: string;
}

interface RepoData {
  repoName: string;
  branch: string;
  lastScanned: string;
  isVerified: boolean;
  logs: RepoLog[];
}

interface ProfileData {
  name: string;
  email: string;
  number: string;
  employeeId: string;
  repos: RepoData[];
}

const Profile: React.FC = () => {
  const { user, refreshUser } = userAuth()

  // Refresh user on mount
  useEffect(() => {
    refreshUser?.();
  }, [refreshUser]);

  // Dummy profile data
  const initialProfile: ProfileData = {
    name: user?.name || "Kiran Rathod",
    email: user?.email || "employee@example.com",
    number: user?.number || "9876543210",
    employeeId: user?.empId || "EMP12345",
    repos: [
      {
        repoName: "frontend-app",
        branch: "main",
        lastScanned: "2025-10-03",
        isVerified: true,
        logs: [
          { date: "2025-10-03", scannedBy: "Kiran", issuesFound: 0, notes: "All clean" },
          { date: "2025-09-28", scannedBy: "Kiran", issuesFound: 2, notes: "Minor issues" },
        ],
      },
      {
        repoName: "backend-service",
        branch: "develop",
        lastScanned: "2025-09-28",
        isVerified: false,
        logs: [
          { date: "2025-09-28", scannedBy: "Kiran", issuesFound: 5, notes: "Secrets found" },
        ],
      },
      {
        repoName: "infra-config",
        branch: "master",
        lastScanned: "2025-09-20",
        isVerified: true,
        logs: [
          { date: "2025-09-20", scannedBy: "Kiran", issuesFound: 0, notes: "Clean" },
        ],
      },
      {
        repoName: "mobile-app",
        branch: "release",
        lastScanned: "2025-09-15",
        isVerified: false,
        logs: [
          { date: "2025-09-15", scannedBy: "Kiran", issuesFound: 3, notes: "Warnings" },
        ],
      },
    ],
  };

  const [profile] = useState<ProfileData>(initialProfile);

  const totalRepos = profile.repos.length;
  const verifiedRepos = profile.repos.filter((r) => r.isVerified).length;
  const unverifiedRepos = totalRepos - verifiedRepos;

  return (
    <div className="bg-gray-100 p-4 min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-8 bg-gradient-to-r from-gray-600 to-gray-600 text-white">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src="https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0="
              alt="Employee Avatar"
              className="h-28 w-28 rounded-full border-4 border-white shadow-lg"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-sm font-bold">{profile.employeeId}</h1>
            <p className="text-blue-100">{profile.email}</p>
            <p className="text-blue-100">{profile.number}</p>
          </div>

          {/* Verification */}
          <div className="mt-4 md:mt-0">
            {verifiedRepos === totalRepos ? (
              <span className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold shadow-md">
                ✅ All Repos Verified
              </span>
            ) : (
              <span className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold shadow-md">
                ⚠️ Some Repos Need Attention
              </span>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-gray-50">
          <div className="rounded-lg bg-blue-100 p-5 text-center shadow">
            <p className="text-sm text-blue-700">Total Repositories</p>
            <p className="text-3xl font-bold text-blue-900">{totalRepos}</p>
          </div>
          <div className="rounded-lg bg-green-100 p-5 text-center shadow">
            <p className="text-sm text-green-700">Verified Repositories</p>
            <p className="text-3xl font-bold text-green-900">{verifiedRepos}</p>
          </div>
          <div className="rounded-lg bg-red-100 p-5 text-center shadow">
            <p className="text-sm text-red-700">Unverified Repositories</p>
            <p className="text-3xl font-bold text-red-900">{unverifiedRepos}</p>
          </div>
        </div>

        {/* Repositories Table */}
        <div className="p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Repositories</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100 text-left text-sm uppercase text-gray-600">
                  <th className="p-3">Repository</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Last Scanned</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Logs</th>
                </tr>
              </thead>
              <tbody>
                {profile.repos.map((repo, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-800">{repo.repoName}</td>
                    <td className="p-3 text-gray-600">{repo.branch}</td>
                    <td className="p-3 text-gray-600">{repo.lastScanned}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                          repo.isVerified ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                      >
                        {repo.isVerified ? "Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td className="p-3">
                      <ul className="text-xs list-disc list-inside space-y-1">
                        {repo.logs.map((log, idx) => (
                          <li key={idx}>
                            {log.date} - {log.scannedBy} - Issues: {log.issuesFound} - {log.notes}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

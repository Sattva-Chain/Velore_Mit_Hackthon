"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAuth } from "../../../context/Auth";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Eye, EyeOff, Mail, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  password: string;
  emailSent: boolean;
}

const CARD = "rounded-lg border border-zinc-800 bg-zinc-900/70 p-5";
const PANEL = "rounded-lg border border-zinc-800 bg-zinc-900/70 overflow-hidden";

const ManageEmploy: React.FC = () => {
  const { company } = userAuth()!;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const COMPANY_DOMAINS = ["gmail.com", "vit.edu"];

  useEffect(() => {
    fetchMyEmployees();
  }, [company?._id]);

  const fetchMyEmployees = async () => {
    if (!company?._id) return;
    try {
      const { data } = await axios.post("http://localhost:3000/api/getmyemp", { id: company._id });
      if (data.success && Array.isArray(data.datas)) {
        setEmployees(
          data.datas.map((emp: any) => ({
            id: emp._id,
            name: emp.name || "Employee",
            role: emp.role,
            email: emp.email,
            password: emp.password,
            emailSent: true,
          }))
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch employees.");
    }
  };

  const toggleCredentials = (id: string) => {
    setVisibleIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return false;
    const domain = email.split("@")[1];
    return COMPANY_DOMAINS.includes(domain);
  };

  const addEmployeeToList = () => {
    if (!newEmail.trim() || !newPassword.trim() || !role) {
      toast.error("Please fill in email, password, and role.");
      return;
    }
    if (!validateEmail(newEmail)) {
      toast.error(`Email must be valid and from allowed domains: ${COMPANY_DOMAINS.join(", ")}`);
      return;
    }

    setEmployees((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        name: "New Employee (Pending)",
        role,
        email: newEmail,
        password: newPassword,
        emailSent: false,
      },
    ]);
    setNewEmail("");
    setNewPassword("");
    setRole("");
    toast.success("Employee prepared. Create the account to send credentials.");
  };

  const createEmployeeAccount = async (tempId: string) => {
    const employee = employees.find((item) => item.id === tempId);
    if (!employee) return;

    setLoadingIds((prev) => [...prev, tempId]);
    try {
      const { data } = await axios.post("http://localhost:3000/api/createEmpy", {
        employeeEmail: employee.email,
        employeePassword: employee.password,
        employeeRole: employee.role,
        id: company?._id,
      });

      if (data.success) {
        toast.success("Account created and email sent.");
        setEmployees((prev) =>
          prev.map((item) => (item.id === tempId ? { ...item, emailSent: true, name: "Employee" } : item))
        );
      } else {
        toast.error(data.message || "Failed to create account.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Server error.");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== tempId));
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const { data } = await axios.post(`http://localhost:3000/api/deletetheProduct/${id}`);
      if (data.success) {
        toast.success("Employee deleted successfully.");
        setEmployees((prev) => prev.filter((employee) => employee.id !== id));
      } else {
        toast.error("Failed to delete employee.");
      }
    } catch {
      toast.error("Server error while deleting employee.");
    }
  };

  const stats = useMemo(() => {
    const pending = employees.filter((employee) => !employee.emailSent).length;
    return {
      total: employees.length,
      active: employees.length - pending,
      pending,
    };
  }, [employees]);

  return (
    <div className="w-full flex flex-col gap-8 text-zinc-200 pb-4">
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: "#18181b", color: "#fff", border: "1px solid #27272a" } }}
      />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Team Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Provision employees, review pending accounts, and jump into individual activity logs.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total members", value: stats.total, icon: UserCog, tone: "text-blue-300" },
          { label: "Active", value: stats.active, icon: ShieldCheck, tone: "text-emerald-300" },
          { label: "Pending", value: stats.pending, icon: Mail, tone: "text-orange-300" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={CARD}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{item.label}</p>
                <Icon className={`w-4 h-4 ${item.tone}`} />
              </div>
              <div className={`text-3xl font-semibold tabular-nums ${item.tone}`}>{item.value}</div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-blue-300" />
            <h2 className="text-sm font-semibold text-zinc-100">Provision employee</h2>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Employee email address"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <select
              onChange={(event) => setRole(event.target.value)}
              value={role}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
            >
              <option value="" disabled>
                Select department role
              </option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Mobile App Developer">Mobile App Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Product Manager">Product Manager</option>
            </select>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400 leading-6">
              Legacy employee provisioning stays unchanged behind the scenes. This screen only aligns the UX with the rest of the dashboard.
            </div>

            <button
              type="button"
              onClick={addEmployeeToList}
              className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add employee
            </button>
          </div>
        </div>

        <div className={PANEL}>
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Employee roster</h2>
              <p className="text-xs text-zinc-500 mt-1">Pending accounts and active members are shown in one table.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full border border-zinc-700 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
              {employees.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/30">
                <tr>
                  {["Member", "Role", "Email", "Actions"].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-zinc-500">
                      No employees found. Provision a new employee to get started.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-4 text-sm text-zinc-200">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <UserCog className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            {!employee.emailSent && (
                              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{employee.role}</td>
                      <td className="px-5 py-4 text-sm text-zinc-400 font-mono">{employee.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCredentials(employee.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
                          >
                            {visibleIds.includes(employee.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {visibleIds.includes(employee.id) ? "Hide creds" : "Show creds"}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`employedLogs/${employee.id}`)}
                            className="px-3 py-2 rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-medium"
                          >
                            View logs
                          </button>

                          {!employee.emailSent ? (
                            <button
                              type="button"
                              onClick={() => createEmployeeAccount(employee.id)}
                              disabled={loadingIds.includes(employee.id)}
                              className="px-3 py-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 text-xs font-medium min-w-[108px]"
                            >
                              {loadingIds.includes(employee.id) ? "Creating..." : "Create account"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => deleteEmployee(employee.id)}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-medium min-w-[108px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {visibleIds.length > 0 && (
        <section className={CARD}>
          <h2 className="text-sm font-semibold text-zinc-100 mb-4">Revealed credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees
              .filter((employee) => visibleIds.includes(employee.id))
              .map((employee) => (
                <div key={employee.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-2">User</p>
                  <p className="text-sm text-zinc-200 font-mono break-all">{employee.email}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 mt-4 mb-2">Password</p>
                  <p className="text-sm text-blue-300 font-mono break-all">{employee.password}</p>
                  <span className="inline-flex mt-4 px-2.5 py-1 rounded-full border border-zinc-700 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                    {employee.role}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ManageEmploy;

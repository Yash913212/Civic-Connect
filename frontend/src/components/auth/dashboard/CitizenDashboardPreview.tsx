import { motion, Variants } from "framer-motion";
import { LineChart, Line, PieChart, Pie, ResponsiveContainer, Cell } from "recharts";
import { User } from "lucide-react";
import { roleColors, roleDetails } from "@/config/roles";

export const citizenVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, filter: "blur(10px) brightness(1.5)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.1, filter: "blur(10px) brightness(1.5)", transition: { duration: 0.3 } },
};

const kpis = [
  { label: "Total Submitted", value: "12" },
  { label: "Active", value: "3" },
  { label: "Resolved", value: "9" },
  { label: "Nearby Issues", value: "24" },
];

const lineData = [
  { name: "Mon", value: 40 },
  { name: "Tue", value: 30 },
  { name: "Wed", value: 45 },
  { name: "Thu", value: 50 },
  { name: "Fri", value: 35 },
];

export function CitizenDashboardPreview() {
  const color = roleColors.CITIZEN.hex;
  return (
    <motion.div
      variants={citizenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-2xl aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-6"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors.CITIZEN.bg}`}>
          <User size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">{roleDetails.CITIZEN.title} Dashboard</h3>
          <p className="text-sm text-white/50">{roleDetails.CITIZEN.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{kpi.label}</span>
            <span className="text-2xl font-bold text-white">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
          <span className="text-sm font-medium text-white/80 mb-4">Monthly Complaint Trend</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
          <span className="text-sm font-medium text-white/80 mb-4">Resolution Progress</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: 75 }, { value: 25 }]} innerRadius={35} outerRadius={45} dataKey="value" stroke="none">
                  <Cell fill={color} />
                  <Cell fill={`${color}20`} />
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={16} fontWeight="bold">75%</text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

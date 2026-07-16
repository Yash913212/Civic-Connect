import { motion, Variants } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Briefcase } from "lucide-react";
import { roleColors, roleDetails } from "@/config/roles";

export const officerVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
};

const kpis = [
  { label: "Assigned Cases", value: "8" },
  { label: "In Progress", value: "2" },
  { label: "Completed", value: "6" },
  { label: "Avg Res Time", value: "2.1d" },
];

const kanbanData = [
  { name: "Task 1", progress: 80, remaining: 20 },
  { name: "Task 2", progress: 40, remaining: 60 },
  { name: "Task 3", progress: 100, remaining: 0 },
];

export function OfficerDashboardPreview() {
  const color = roleColors.OFFICER.hex;
  return (
    <motion.div
      variants={officerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-2xl aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-6"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors.OFFICER.bg}`}>
          <Briefcase size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">{roleDetails.OFFICER.title} Dashboard</h3>
          <p className="text-sm text-white/50">{roleDetails.OFFICER.description}</p>
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
          <span className="text-sm font-medium text-white/80 mb-4">Officer Workload</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={kanbanData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={10} axisLine={false} tickLine={false} />
                <Bar dataKey="progress" stackId="a" fill={color} radius={[4, 0, 0, 4]} barSize={12} />
                <Bar dataKey="remaining" stackId="a" fill={`${color}30`} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
          <span className="text-sm font-medium text-white/80 mb-4">Resolution Performance</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: 80 }, { value: 20 }]} startAngle={180} endAngle={0} innerRadius={40} outerRadius={50} dataKey="value" stroke="none">
                  <Cell fill={color} />
                  <Cell fill={`${color}20`} />
                </Pie>
                <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={16} fontWeight="bold">Good</text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

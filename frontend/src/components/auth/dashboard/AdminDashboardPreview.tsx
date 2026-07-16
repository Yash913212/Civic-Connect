import { motion, Variants } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, ResponsiveContainer, Cell } from "recharts";
import { Shield } from "lucide-react";
import { roleColors, roleDetails } from "@/config/roles";

export const adminVariants: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
  exit: { opacity: 0, x: -100, transition: { duration: 0.3 } },
};

const kpis = [
  { label: "Total Departments", value: "14" },
  { label: "Active Officers", value: "142" },
  { label: "Pending Escalations", value: "8" },
  { label: "Dept Efficiency", value: "94%" },
];

const barData = [
  { name: "Dep A", value: 400 },
  { name: "Dep B", value: 300 },
  { name: "Dep C", value: 200 },
];

const pieData = [
  { name: "Roads", value: 400 },
  { name: "Water", value: 300 },
  { name: "Power", value: 300 },
];

export function AdminDashboardPreview() {
  const color = roleColors.ADMIN.hex;
  const pieColors = [color, "#F87171", "#34D399", "#60A5FA"];
  return (
    <motion.div
      variants={adminVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-2xl aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-6"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors.ADMIN.bg}`}>
          <Shield size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">{roleDetails.ADMIN.title} Dashboard</h3>
          <p className="text-sm text-white/50">{roleDetails.ADMIN.description}</p>
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
          <span className="text-sm font-medium text-white/80 mb-4">Department Performance</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
          <span className="text-sm font-medium text-white/80 mb-4">Category Distribution</span>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={20} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

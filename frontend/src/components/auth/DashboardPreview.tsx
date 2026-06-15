"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { User, Shield, Briefcase, Activity } from "lucide-react";

type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';

interface DashboardPreviewProps {
  role: Role;
}

export function DashboardPreview({ role }: DashboardPreviewProps) {
  return (
    <div className="relative w-full h-full p-8 flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          variants={getVariants(role)}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-2xl aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors[role].bg}`}>
                {roleIcons[role]}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">{roleDetails[role].title} Dashboard</h3>
                <p className="text-sm text-white/50">{roleDetails[role].description}</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleData[role].kpis.map((kpi, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{kpi.label}</span>
                <span className="text-2xl font-bold text-white">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
              <span className="text-sm font-medium text-white/80 mb-4">{roleData[role].chart1Title}</span>
              <div className="flex-1 min-h-[120px]">
                {renderChart1(role)}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
              <span className="text-sm font-medium text-white/80 mb-4">{roleData[role].chart2Title}</span>
              <div className="flex-1 min-h-[120px]">
                {renderChart2(role)}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const getVariants = (role: Role): Variants => {
  switch (role) {
    case 'CITIZEN':
      return {
        initial: { opacity: 0, scale: 0.9, filter: "blur(10px) brightness(1.5)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.1, filter: "blur(10px) brightness(1.5)", transition: { duration: 0.3 } }
      };
    case 'OFFICER':
      return {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } },
        exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } }
      };
    case 'ADMIN':
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
        exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
      };
  }
};

const roleColors = {
  CITIZEN: { bg: 'bg-blue-500/20 text-blue-500', hex: '#3B82F6' },
  OFFICER: { bg: 'bg-green-500/20 text-green-500', hex: '#22C55E' },
  ADMIN: { bg: 'bg-purple-500/20 text-purple-500', hex: '#A855F7' },
};

const roleIcons = {
  CITIZEN: <User size={20} />,
  OFFICER: <Briefcase size={20} />,
  ADMIN: <Shield size={20} />,
};

const roleDetails = {
  CITIZEN: { title: 'Citizen', description: 'Civic Reporting & Tracking' },
  OFFICER: { title: 'Officer', description: 'Field Operations Management' },
  ADMIN: { title: 'Admin', description: 'Governance Analytics' },
};

const mockLineData = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 50 },
  { name: 'Fri', value: 35 },
];

const mockPieData = [
  { name: 'Roads', value: 400 },
  { name: 'Water', value: 300 },
  { name: 'Power', value: 300 },
];

const mockBarData = [
  { name: 'Dep A', value: 400 },
  { name: 'Dep B', value: 300 },
  { name: 'Dep C', value: 200 },
];

const roleData = {
  CITIZEN: {
    kpis: [{ label: 'Total Submitted', value: '12' }, { label: 'Active', value: '3' }, { label: 'Resolved', value: '9' }, { label: 'Nearby Issues', value: '24' }],
    chart1Title: 'Monthly Complaint Trend',
    chart2Title: 'Resolution Progress',
  },
  OFFICER: {
    kpis: [{ label: 'Assigned Cases', value: '8' }, { label: 'In Progress', value: '2' }, { label: 'Completed', value: '6' }, { label: 'Avg Res Time', value: '2.1d' }],
    chart1Title: 'Officer Workload',
    chart2Title: 'Resolution Performance',
  },
  ADMIN: {
    kpis: [{ label: 'Total Departments', value: '14' }, { label: 'Active Officers', value: '142' }, { label: 'Pending Escalations', value: '8' }, { label: 'Dept Efficiency', value: '94%' }],
    chart1Title: 'Department Performance',
    chart2Title: 'Category Distribution',
  },
};

const renderChart1 = (role: Role) => {
  const color = roleColors[role].hex;
  
  if (role === 'CITIZEN') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockLineData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  
  if (role === 'OFFICER') {
    const kanbanData = [
      { name: 'Task 1', progress: 80, remaining: 20 },
      { name: 'Task 2', progress: 40, remaining: 60 },
      { name: 'Task 3', progress: 100, remaining: 0 },
    ];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={kanbanData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={10} axisLine={false} tickLine={false} />
          <Bar dataKey="progress" stackId="a" fill={color} radius={[4, 0, 0, 4]} barSize={12} />
          <Bar dataKey="remaining" stackId="a" fill={`${color}30`} radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  if (role === 'ADMIN') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mockBarData}>
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
};

const renderChart2 = (role: Role) => {
  const color = roleColors[role].hex;
  
  if (role === 'CITIZEN') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[{ value: 75 }, { value: 25 }]} innerRadius={35} outerRadius={45} dataKey="value" stroke="none">
            <Cell fill={color} />
            <Cell fill={`${color}20`} />
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={16} fontWeight="bold">75%</text>
        </PieChart>
      </ResponsiveContainer>
    );
  }
  
  if (role === 'OFFICER') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[{ value: 80 }, { value: 20 }]} startAngle={180} endAngle={0} innerRadius={40} outerRadius={50} dataKey="value" stroke="none">
            <Cell fill={color} />
            <Cell fill={`${color}20`} />
          </Pie>
          <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={16} fontWeight="bold">Good</text>
        </PieChart>
      </ResponsiveContainer>
    );
  }
  
  if (role === 'ADMIN') {
    const pieColors = [color, '#F87171', '#34D399', '#60A5FA'];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={mockPieData} innerRadius={20} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
            {mockPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }
};

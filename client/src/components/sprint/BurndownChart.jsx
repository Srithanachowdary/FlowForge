import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const BurndownChart = ({ sprint, tasks }) => {
  // Generate mock dates/points if sprint dates are missing or invalid
  const generateData = () => {
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const durationDays = 14; // Default 2 week sprint
    const data = [];

    // Simulate burndown calculations
    let pointsRemaining = totalPoints;

    for (let day = 0; day <= durationDays; day++) {
      const idealRemaining = Math.max(0, totalPoints - (totalPoints / durationDays) * day);
      
      // Gradually burn points for actual
      if (day > 0 && day <= 10) {
        // Random burn points for simulation
        const burnChance = Math.random() > 0.4;
        if (burnChance && pointsRemaining > 0) {
          pointsRemaining -= Math.floor(Math.random() * (totalPoints / 4));
          if (pointsRemaining < 0) pointsRemaining = 0;
        }
      } else if (day > 10) {
        // Complete the rest
        pointsRemaining = Math.max(0, pointsRemaining - (pointsRemaining / (durationDays - day + 1)));
      }

      data.push({
        day: `Day ${day}`,
        Ideal: Math.round(idealRemaining),
        Actual: day <= 8 ? Math.round(pointsRemaining) : undefined // Only plot actual up to current day (simulated Day 8)
      });
    }

    return data;
  };

  const chartData = generateData();

  return (
    <div className="w-full h-72 bg-dark-bg/40 border border-dark-border rounded-xl p-4 glass-panel">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Sprint Burndown (Story Points)
      </h4>
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
            <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: 10 }} />
            <YAxis stroke="#6b7280" style={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#11131e",
                borderColor: "#1e2235",
                color: "#f3f4f6",
                borderRadius: "8px",
                fontSize: "12px"
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Area
              type="monotone"
              dataKey="Ideal"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIdeal)"
              name="Ideal Burndown"
            />
            <Area
              type="monotone"
              dataKey="Actual"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual Burndown"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BurndownChart;

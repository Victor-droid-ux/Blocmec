//components/dashboard/states-chart.tsx

"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export function StatesChart() {
  // Chart data
  const data = {
    labels: ["CA", "NY", "TX", "FL"],
    datasets: [
      {
        label: "Top",
        data: [65, 55, 45, 35],
        backgroundColor: "#2c5f5f",
        barPercentage: 0.8,
      },
      {
        label: "Middle",
        data: [60, 50, 40, 30],
        backgroundColor: "#e07a5f",
        barPercentage: 0.8,
      },
      {
        label: "Bottom",
        data: [120, 90, 70, 50],
        backgroundColor: "#3abab4",
        barPercentage: 0.8,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        stacked: true,
        max: 260,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          callback: (value) => (value === 0 ? "0" : value),
          stepSize: 65,
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}

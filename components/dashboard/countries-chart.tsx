"use client"

import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

export function CountriesChart() {
  // Chart data
  const data = {
    labels: ["300", "300", "400"],
    datasets: [
      {
        data: [300, 300, 400],
        backgroundColor: ["#3abab4", "#3abab4", "#3abab4"],
        borderWidth: 0,
      },
    ],
  }

  // Chart options
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "0%",
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          color: "#3abab4",
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  }

  return (
    <div className="h-[300px] w-full">
      <Doughnut data={data} options={options} />
    </div>
  )
}

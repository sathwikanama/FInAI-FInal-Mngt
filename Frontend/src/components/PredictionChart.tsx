import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

interface PredictionChartProps {
  historicalData?: {
    month: string;
    amount: number;
  }[];
  predictedValue: number;
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  historicalData = [],
  predictedValue
}) => {

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Not enough historical data to display chart.
      </div>
    );
  }

  const labels = [
    ...historicalData.map(item => item.month),
    "Next Month"
  ];

  const values = [
    ...historicalData.map(item => item.amount),
    predictedValue
  ];

  const data = {
    labels,
    datasets: [
      {
        label: "Expense Trend",
        data: values,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.15)",
        tension: 0.4,
        pointRadius: (ctx: any) =>
          ctx.dataIndex === values.length - 1 ? 7 : 4,
        pointBackgroundColor: (ctx: any) =>
          ctx.dataIndex === values.length - 1
            ? "#ef4444"
            : "#2563eb"
      }
    ]
  };

  return (
    <div>

      {/* 🔥 Simple Visual Explanation */}
      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          <span>Past Monthly Spending</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span>Next Month Prediction</span>
        </div>
      </div>

      <Line data={data} />

    </div>
  );
};

export default PredictionChart;
interface Props {
  current: number;
  goal: number;
}

export default function ProgressBar({ current, goal }: Props) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Campaign Progress</h2>
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-8">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-8 rounded-full flex items-center justify-center"
              style={{ width: `${percentage}%` }}
            >
              <span className="text-white font-semibold">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-semibold">
            ${current.toLocaleString()} raised
          </span>
          <span className="text-gray-600">Goal: ${goal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../../utils/api';

// TODO: Replace with a real API call to an endpoint like /api/users/performance-history/
const mockPerformanceData = [
  { date: '2025-06-01', profit: 4000 },
  { date: '2025-06-05', profit: 4200 },
  { date: '2025-06-10', profit: 4500 },
  { date: '2025-06-15', profit: 4400 },
  { date: '2025-06-20', profit: 4800 },
  { date: '2025-06-25', profit: 5100 },
  { date: '2025-06-30', profit: 5500 },
  { date: '2025-07-05', profit: 5800 },
];

export const PerformanceChart: React.FC = () => {
  const [data, setData] = useState(mockPerformanceData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, you would fetch this data from the API.
    // For now, we use mock data.
    // try {
    //   setLoading(true);
    //   const performanceData = await apiService.getPerformanceHistory();
    //   setData(performanceData);
    // } catch (error) {
    //   console.error("Failed to fetch performance data:", error);
    // } finally {
    //   setLoading(false);
    // }
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-400">Loading performance chart...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="date" stroke="#8884d8" />
            <YAxis stroke="#8884d8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                borderColor: 'rgba(255, 255, 255, 0.2)' 
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#82ca9d" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
       <div className="text-center text-gray-500 mt-4 text-sm">
        Note: This chart currently uses mock data. A new API endpoint (`GET /api/users/performance-history/`) is required for real data.
      </div>
    </Card>
  );
};
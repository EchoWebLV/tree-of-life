import { useState } from 'react';
import { Bot } from './types';

interface AutonomousSettingsProps {
  bot: Bot;
  onUpdate: () => void;
}

export default function AutonomousSettings({ bot, onUpdate }: AutonomousSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [frequency, setFrequency] = useState(Math.max(1, bot.tweetFrequencyMinutes / 60));
  const [isAutonomous, setIsAutonomous] = useState(bot.isAutonomous);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bots/${bot.id}/autonomous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAutonomous,
          tweetFrequencyMinutes: Math.max(60, Math.round(frequency * 60)), // Ensure minimum 60 minutes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating autonomous settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Autonomous Life Settings</h3>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isAutonomous}
          onChange={(e) => setIsAutonomous(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          id="autonomous-toggle"
        />
        <label htmlFor="autonomous-toggle" className="text-sm">
          Enable Autonomous Mode
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">
          Tweet Frequency (hours)
        </label>
        <input
          type="number"
          min="1"
          max="24"
          step="0.5"
          value={frequency}
          onChange={(e) => setFrequency(Math.max(1, Number(e.target.value)))}
          className="w-full px-3 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={!isAutonomous}
        />
        <p className="text-xs text-gray-400">
          Bot will tweet every {frequency.toFixed(1)} hours ({Math.round(frequency * 60)} minutes) ±5 minutes for natural behavior
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Updating...' : 'Save Settings'}
      </button>
    </div>
  );
} 
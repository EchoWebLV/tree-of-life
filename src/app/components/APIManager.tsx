import { useState, useEffect } from 'react';

interface APIManagerProps {
  botId: string;
}

interface APISettings {
  crypto: boolean;
  news: boolean;
  weather: boolean;
  exchange: boolean;
}

export default function APIManager({ botId }: APIManagerProps) {
  const [settings, setSettings] = useState<APISettings>({
    crypto: true,
    news: true,
    weather: true,
    exchange: true
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/bot-settings/${botId}`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data.apiSettings || {
            crypto: true,
            news: true,
            weather: true,
            exchange: true
          });
        }
      } catch (error) {
        console.error('Error loading API settings:', error);
      }
    };

    loadSettings();
  }, [botId]);

  const handleToggle = async (api: keyof APISettings) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    // Update state optimistically
    const newSettings = {
      ...settings,
      [api]: !settings[api]
    };
    setSettings(newSettings);

    try {
      const response = await fetch(`/api/bot-settings/${botId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiSettings: newSettings
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Revert on failure
        setSettings(settings);
        console.error('Failed to update settings:', {
          status: response.status,
          data: data,
          botId: botId,
          newSettings: newSettings
        });
      }
    } catch (error) {
      // Revert on error
      setSettings(settings);
      console.error('Error updating API settings:', {
        error: error instanceof Error ? error.message : error,
        botId: botId,
        newSettings: newSettings
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">API Integrations</h3>
      <div className="space-y-3">
        {Object.entries(settings).map(([api, enabled]) => (
          <div key={api} className="flex items-center">
            <input
              type="checkbox"
              id={`api-${api}`}
              checked={enabled}
              onChange={() => handleToggle(api as keyof APISettings)}
              disabled={isUpdating}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            />
            <label 
              htmlFor={`api-${api}`} 
              className={`ml-2 text-sm text-white cursor-pointer ${isUpdating ? 'opacity-50' : ''}`}
            >
              {api === 'crypto' && 'Cryptocurrency Prices'}
              {api === 'news' && 'News Updates'}
              {api === 'weather' && 'Weather Information'}
              {api === 'exchange' && 'Exchange Rates'}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
} 
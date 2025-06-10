'use client';

import { useEffect, useState } from 'react';

interface Device {
  name: string;
  localIp: string;
  mac: string;
  isAlive?: boolean;
  responseTime?: number;
  lastChecked?: string;
}

const REFRESH_INTERVAL = 1000 * 60;

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeviceStatus = async (showRefreshing = true) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const response = await fetch('/api/devices/health');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        setLoading(false);
      } else {
        console.error('Health check failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching device status:', error);
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  const manualRefresh = () => {
    fetchDeviceStatus(true);
  };

  const wakeDevice = async (mac: string, ip: string) => {
    try {
      const response = await fetch('/api/devices/wake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mac, ip }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setTimeout(() => fetchDeviceStatus(true), 5000);
      } else {
        alert('Failed to send Wake-on-LAN packet');
      }
    } catch (error) {
      console.error('Error sending Wake-on-LAN:', error);
      alert('Error sending Wake-on-LAN packet');
    }
  };

  useEffect(() => {
    fetchDeviceStatus();
    const interval = setInterval(() => fetchDeviceStatus(), REFRESH_INTERVAL); // Changed to 30 seconds for better performance
    return () => clearInterval(interval);
  }, []);

  const formatLastChecked = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Local Device Monitor
          </h1>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Health
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading devices...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 text-center flex items-center justify-center gap-2">
              {refreshing && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400"></div>
              )}
              Auto-refresh every {REFRESH_INTERVAL / 1000} seconds
              {refreshing && <span className="text-blue-600 dark:text-blue-400 font-medium">Checking...</span>}
            </div>
            <div className="grid gap-4">
              {devices.map((device) => (
                <div
                  key={device.mac}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {device.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {device.localIp}
                    </p>
                    {device.responseTime && device.isAlive && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Response time: {device.responseTime}ms
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last checked: {formatLastChecked(device.lastChecked || '')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          device.isAlive
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          device.isAlive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {device.isAlive ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {!device.isAlive && (
                      <button
                        onClick={() => wakeDevice(device.mac, device.localIp)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Wake Up
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
import { NextResponse } from 'next/server';
import ping from 'ping';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const devicesPath = path.join(process.cwd(), 'public', 'devices.json');
    const devicesData = await fs.readFile(devicesPath, 'utf-8');
    const devices = JSON.parse(devicesData);

    const healthChecks = await Promise.all(
      devices.map(async (device: { name: string; localIp: string; mac: string }) => {
        const result = await ping.promise.probe(device.localIp, {
          timeout: 2,
          min_reply: 1
        });

        console.log("result for ", device.name, result);

        return {
          ...device,
          isAlive: result.alive,
          responseTime: result.time,
          lastChecked: new Date().toISOString()
        };
      })
    );

    return NextResponse.json(healthChecks);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    );
  }
}
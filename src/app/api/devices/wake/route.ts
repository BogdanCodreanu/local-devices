import { NextResponse } from 'next/server';
import wol from 'wake_on_lan';

export async function POST(request: Request) {
  try {
    const { mac, ip } = await request.json();

    if (!mac) {
      return NextResponse.json(
        { error: 'MAC address is required' },
        { status: 400 }
      );
    }

    const options = ip ? { address: ip } : {};

    return new Promise((resolve) => {
      wol.wake(mac, options, (error: Error | null) => {
        if (error) {
          console.error('Wake-on-LAN error:', error);
          resolve(
            NextResponse.json(
              { error: 'Failed to send Wake-on-LAN packet' },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json({
              success: true,
              message: `Wake-on-LAN packet sent to ${mac}`
            })
          );
        }
      });
    });
  } catch (error) {
    console.error('Wake-on-LAN error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
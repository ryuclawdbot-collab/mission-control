import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/gateway/restart - Restart the OpenClaw gateway
export async function POST() {
  try {
    // Execute gateway restart command
    // This assumes openclaw CLI is available in PATH
    const { stdout, stderr } = await execAsync('openclaw gateway restart', {
      timeout: 30000, // 30 second timeout
    });

    console.log('Gateway restart stdout:', stdout);
    if (stderr) {
      console.error('Gateway restart stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Gateway restart initiated',
      output: stdout,
    });
  } catch (error: unknown) {
    console.error('Failed to restart gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to restart gateway',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

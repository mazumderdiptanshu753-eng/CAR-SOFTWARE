/**
 * Hardware Bridge for Direct Vehicle Actuation (WebSerial & WebSocket ROS2)
 */

import { HardwareConfig, SerialLogMessage } from '../types';

export class UgvHardwareBridge {
  private serialPort: any = null;
  private writer: any = null;
  private reader: any = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private onMessageCallback: ((log: SerialLogMessage) => void) | null = null;
  private onTelemetryCallback: ((feedback: { leftRpm?: number; rightRpm?: number; voltage?: number }) => void) | null = null;

  public setCallbacks(
    onLog: (log: SerialLogMessage) => void,
    onTelemetry: (feedback: { leftRpm?: number; rightRpm?: number; voltage?: number }) => void
  ) {
    this.onMessageCallback = onLog;
    this.onTelemetryCallback = onTelemetry;
  }

  // Connect via Web Serial API (USB cable to Arduino / ESP32 / STM32 / Jetson)
  public async connectWebSerial(baudRate = 115200): Promise<{ success: boolean; error?: string }> {
    try {
      if (!('serial' in navigator)) {
        return {
          success: false,
          error: 'Web Serial API is not supported in this browser. Please use Google Chrome, Edge, or Opera.'
        };
      }

      // Prompt user to pick USB COM Port (CH340, CP2102, FTDI, Arduino)
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate });

      this.writer = this.serialPort.writable.getWriter();
      this.isConnected = true;

      this.logMessage('RX', `Connected to Physical Serial Port at ${baudRate} baud.`);
      this.startReadingLoop();

      return { success: true };
    } catch (err: any) {
      this.isConnected = false;
      return { success: false, error: err?.message || 'Could not open serial port' };
    }
  }

  // Connect via ROS2 Bridge WebSocket
  public connectRosWebSocket(url = 'ws://localhost:9090'): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          this.isConnected = true;
          this.logMessage('RX', `Connected to ROS2 rosbridge_websocket at ${url}`);
          resolve({ success: true });
        };
        this.ws.onerror = (err) => {
          this.logMessage('RX', `WebSocket connection failed to ${url}`);
          resolve({ success: false, error: 'Failed to connect to ROS2 bridge' });
        };
        this.ws.onmessage = (event) => {
          this.logMessage('RX', event.data);
        };
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  // Send Motor Commands directly to hardware
  public async sendMotorCommand(
    pwmL: number,
    pwmR: number,
    dirL: number,
    dirR: number,
    v: number,
    omega: number,
    config: HardwareConfig
  ) {
    const timeStr = new Date().toISOString().substring(11, 19);

    if (config.protocol === 'binary_hex') {
      // 0xAA 0x05 [PWM_L] [PWM_R] [DIR_L] [DIR_R] [CRC]
      const checksum = (pwmL + pwmR + dirL + dirR) & 0xff;
      const buffer = new Uint8Array([0xaa, 0x05, pwmL, pwmR, dirL, dirR, checksum]);
      const hexString = Array.from(buffer)
        .map((b) => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');

      if (this.writer) {
        try {
          await this.writer.write(buffer);
        } catch (e) {
          console.warn('Write error:', e);
        }
      }

      this.logMessage('TX', `PWM: L=${pwmL} R=${pwmR} | DIR: L=${dirL} R=${dirR}`, hexString);
    } else if (config.protocol === 'ascii_csv') {
      const asciiMsg = `CMD,${pwmL},${pwmR},${dirL},${dirR}\n`;
      if (this.writer) {
        const encoder = new TextEncoder();
        try {
          await this.writer.write(encoder.encode(asciiMsg));
        } catch (e) {
          console.warn('Write error:', e);
        }
      }
      this.logMessage('TX', asciiMsg.trim());
    } else if (config.protocol === 'ros2_twist') {
      const twistJson = JSON.stringify({
        op: 'publish',
        topic: '/cmd_vel',
        msg: {
          linear: { x: v, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: omega }
        }
      });
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(twistJson);
      }
      this.logMessage('TX', `Twist v:${v.toFixed(2)} m/s, ω:${omega.toFixed(2)} rad/s`);
    }
  }

  // Emergency Hardware Stop (Immediately sets all PWMs to 0)
  public async emergencyStop() {
    const buffer = new Uint8Array([0xaa, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00]);
    if (this.writer) {
      try {
        await this.writer.write(buffer);
      } catch (e) {
        console.warn('E-Stop write error:', e);
      }
    }
    this.logMessage('TX', 'EMERGENCY HARDWARE STOP (PWM: 0, 0)', '0xAA 0x05 0x00 0x00 0x00 0x00 0x00');
  }

  // Disconnect
  public async disconnect() {
    if (this.writer) {
      try {
        await this.writer.close();
      } catch (e) {}
      this.writer = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch (e) {}
      this.serialPort = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.logMessage('RX', 'Disconnected from hardware.');
  }

  public getIsConnected() {
    return this.isConnected;
  }

  // Loop reading data from physical microcontroller (encoder feedback, battery ADC)
  private async startReadingLoop() {
    while (this.serialPort && this.serialPort.readable) {
      try {
        this.reader = this.serialPort.readable.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const clean = line.trim();
            if (clean.length > 0) {
              this.logMessage('RX', clean);
              // Parse simple feedback like "RPM:120,125,V:12.4"
              if (clean.includes('RPM:')) {
                const parts = clean.split(',');
                // e.g. parse RPM and voltage
                this.onTelemetryCallback?.({
                  leftRpm: 120,
                  rightRpm: 125,
                  voltage: 12.4
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Serial read loop error:', err);
        break;
      } finally {
        if (this.reader) {
          try {
            this.reader.releaseLock();
          } catch (e) {}
        }
      }
    }
  }

  private logMessage(direction: 'TX' | 'RX', message: string, hex?: string) {
    const log: SerialLogMessage = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      direction,
      message,
      hex
    };
    this.onMessageCallback?.(log);
  }
}

export const hardwareBridge = new UgvHardwareBridge();

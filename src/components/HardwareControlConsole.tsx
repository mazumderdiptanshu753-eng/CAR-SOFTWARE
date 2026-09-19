import React, { useState, useEffect, useRef } from 'react';
import { Language, MotorTelemetry, HardwareConfig, SerialLogMessage } from '../types';
import { hardwareBridge } from '../utils/hardwareBridge';
import { translations } from '../data/translations';
import {
  Zap,
  Usb,
  Radio,
  Power,
  ShieldAlert,
  RotateCcw,
  Sliders,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface HardwareControlConsoleProps {
  language: Language;
  telemetry: MotorTelemetry;
  isRunning: boolean;
  onEmergencyStop: () => void;
  theme?: 'light' | 'dark';
}

export const HardwareControlConsole: React.FC<HardwareControlConsoleProps> = ({
  language,
  telemetry,
  isRunning,
  onEmergencyStop,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';

  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [connectionType, setConnectionType] = useState<'webserial' | 'websocket_ros2' | 'simulated'>('webserial');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [protocol, setProtocol] = useState<'binary_hex' | 'ascii_csv' | 'ros2_twist'>('binary_hex');
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:9090');
  const [logs, setLogs] = useState<SerialLogMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Jog Controls
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [leftManualPwm, setLeftManualPwm] = useState<number>(0);
  const [rightManualPwm, setRightManualPwm] = useState<number>(0);
  const [leftDir, setLeftDir] = useState<number>(1);
  const [rightDir, setRightDir] = useState<number>(1);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Set hardware bridge callbacks
  useEffect(() => {
    hardwareBridge.setCallbacks(
      (log) => {
        setLogs((prev) => [...prev.slice(-100), log]);
      },
      (feedback) => {
        // Feedback from physical hardware encoders / battery
      }
    );
  }, []);

  // When autonomous run is active, stream motor telemetry to connected hardware
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !manualMode) {
      const config: HardwareConfig = {
        portType: connectionType === 'websocket_ros2' ? 'websocket_ros2' : 'webserial',
        baudRate,
        protocol,
        ipAddress: wsUrl,
        autoStream: true,
        invertLeftMotor: false,
        invertRightMotor: false
      };

      const dirL = telemetry.leftPwm > 0 ? 1 : 0;
      const dirR = telemetry.rightPwm > 0 ? 1 : 0;

      hardwareBridge.sendMotorCommand(
        telemetry.leftPwm,
        telemetry.rightPwm,
        dirL,
        dirR,
        telemetry.linearVelocityCmd,
        telemetry.angularVelocityCmd,
        config
      );
    }
  }, [telemetry, connectionState, manualMode, protocol, connectionType, baudRate, wsUrl]);

  // Connect Physical USB Serial
  const handleConnectUsb = async () => {
    setErrorMessage(null);
    setConnectionState('CONNECTING');

    if (connectionType === 'simulated') {
      setTimeout(() => {
        setConnectionState('CONNECTED');
        setLogs((prev) => [
          ...prev,
          {
            id: `init-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            direction: 'RX',
            message: 'Connected to Virtual UGV Motor Controller (/dev/ttyUSB0 Loopback OK)'
          }
        ]);
      }, 500);
      return;
    }

    if (connectionType === 'websocket_ros2') {
      const res = await hardwareBridge.connectRosWebSocket(wsUrl);
      if (res.success) {
        setConnectionState('CONNECTED');
      } else {
        setConnectionState('DISCONNECTED');
        setErrorMessage(res.error || 'Failed to connect to ROS2 bridge');
      }
      return;
    }

    // Web Serial
    const res = await hardwareBridge.connectWebSerial(baudRate);
    if (res.success) {
      setConnectionState('CONNECTED');
    } else {
      setConnectionState('DISCONNECTED');
      setErrorMessage(res.error || 'Connection failed');
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    await hardwareBridge.disconnect();
    setConnectionState('DISCONNECTED');
  };

  // Emergency E-Stop
  const handleTriggerEStop = async () => {
    await hardwareBridge.emergencyStop();
    setLeftManualPwm(0);
    setRightManualPwm(0);
    onEmergencyStop();
  };

  // Send Manual Jog Command
  const handleSendManual = () => {
    const config: HardwareConfig = {
      portType: connectionType === 'websocket_ros2' ? 'websocket_ros2' : 'webserial',
      baudRate,
      protocol,
      ipAddress: wsUrl,
      autoStream: true,
      invertLeftMotor: false,
      invertRightMotor: false
    };

    hardwareBridge.sendMotorCommand(
      leftManualPwm,
      rightManualPwm,
      leftDir,
      rightDir,
      (leftManualPwm + rightManualPwm) / 510,
      0,
      config
    );
  };

  return (
    <div className={`rounded-xl border p-4 md:p-6 shadow-xs flex flex-col gap-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md'
    }`}>
      {/* Header */}
      <div className={`border-b pb-4 flex flex-wrap items-center justify-between gap-4 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${
            isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'
          }`}>
            <Usb className="w-4 h-4" />
            <span>REAL HARDWARE INTERFACE & MOTOR ACTUATION ENGINE</span>
          </div>
          <h2 className={`text-xl md:text-2xl font-bold font-bengali ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'bn' ? 'গাড়ির আসল হার্ডওয়্যার কন্ট্রোল ও সিরিয়াল ইন্টারফেস' : 'Physical UGV Hardware Control & Serial Actuator'}
          </h2>
          <p className={`text-xs font-bengali mt-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {language === 'bn'
              ? 'এই সফটওয়্যারটি ব্রাউজার থেকে সরাসরি USB কেবল, Serial Port (WebSerial) অথবা ROS2 ব্রিজের মাধ্যমে গাড়ির মোটর ড্রাইভার ও চাকা নিয়ন্ত্রণ করে।'
              : 'Directly drives real vehicle hardware actuators (Arduino, ESP32, Cytron, Sabertooth) via W3C WebSerial or ROS2 WebSocket.'}
          </p>
        </div>

        {/* Emergency E-Stop Button */}
        <button
          id="btn-hardware-estop"
          onClick={handleTriggerEStop}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-900/30 border border-rose-400 font-bengali transition-all cursor-pointer"
        >
          <Power className="w-5 h-5 animate-pulse" />
          <span>{language === 'bn' ? 'ইমার্জেন্সি হার্ডওয়্যার ই-স্টপ (E-STOP)' : 'EMERGENCY HARDWARE STOP'}</span>
        </button>
      </div>

      {/* Connection Settings Bar */}
      <div className={`rounded-xl border p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        {/* Connection Type */}
        <div>
          <label className={`block text-2xs font-mono mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Interface Connection:
          </label>
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value as any)}
            disabled={connectionState === 'CONNECTED'}
            className={`w-full rounded-lg px-3 py-2 text-xs font-mono border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="webserial">USB Serial / COM Port (WebSerial)</option>
            <option value="websocket_ros2">ROS2 rosbridge_websocket (ws://)</option>
            <option value="simulated">Hardware Loopback Test (Virtual COM)</option>
          </select>
        </div>

        {/* Baud Rate / IP */}
        {connectionType === 'webserial' || connectionType === 'simulated' ? (
          <div>
            <label className={`block text-2xs font-mono mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Baud Rate:
            </label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={connectionState === 'CONNECTED'}
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value={115200}>115200 Baud (Standard Jetson/Arduino)</option>
              <option value={57600}>57600 Baud</option>
              <option value={9600}>9600 Baud</option>
            </select>
          </div>
        ) : (
          <div>
            <label className={`block text-2xs font-mono mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              ROS2 Bridge WebSocket URL:
            </label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              disabled={connectionState === 'CONNECTED'}
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            />
          </div>
        )}

        {/* Packet Protocol */}
        <div>
          <label className={`block text-2xs font-mono mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Wire Protocol:
          </label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as any)}
            className={`w-full rounded-lg px-3 py-2 text-xs font-mono border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="binary_hex">Binary Frame (0xAA 0x05 PWM DIR CRC)</option>
            <option value="ascii_csv">ASCII CSV (CMD,PWM_L,PWM_R\n)</option>
            <option value="ros2_twist">ROS2 Twist (/cmd_vel JSON)</option>
          </select>
        </div>

        {/* Connect / Disconnect Button */}
        <div>
          {connectionState === 'CONNECTED' ? (
            <button
              onClick={handleDisconnect}
              className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Power className="w-4 h-4" />
              <span>Disconnect Hardware</span>
            </button>
          ) : (
            <button
              onClick={handleConnectUsb}
              disabled={connectionState === 'CONNECTING'}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-bengali flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Usb className="w-4 h-4" />
              <span>
                {connectionState === 'CONNECTING'
                  ? (language === 'bn' ? 'সংযোগ হচ্ছে...' : 'Connecting...')
                  : (language === 'bn' ? 'হার্ডওয়্যারের সাথে কানেক্ট করুন' : 'Connect UGV Hardware')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className={`border rounded-lg p-3 text-xs font-bengali flex items-center gap-2 ${
          isLight
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-rose-950/80 border-rose-700 text-rose-300'
        }`}>
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Motor Actuation Live Signals & Calibration (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`rounded-xl border p-4 flex flex-col gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className={`flex items-center gap-2 font-bengali text-sm font-semibold ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <Sliders className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>{language === 'bn' ? 'মোটর ড্রাইভার ড্রাইভ আউটপুট' : 'Motor Driver Actuation Signals'}</span>
              </div>
              <div className="flex items-center gap-2 text-2xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Mode:</span>
                <button
                  onClick={() => setManualMode(false)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    !manualMode
                      ? 'bg-emerald-600 text-white font-bold'
                      : isLight
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Autonomous Drive
                </button>
                <button
                  onClick={() => setManualMode(true)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    manualMode
                      ? 'bg-amber-600 text-white font-bold'
                      : isLight
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Manual Jog
                </button>
              </div>
            </div>

            {/* If Autonomous Mode: Show live mirrored values */}
            {!manualMode ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg border text-xs font-bengali leading-relaxed flex items-center gap-3 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span>
                    {language === 'bn'
                      ? 'স্বয়ংক্রিয় মোড সক্রিয়: পারসেপশন এআই ও এসএলএএম অ্যালগরিদম গাড়িকে বাধা থেকে বাঁচিয়ে রিয়েল-টাইমে এই সিগন্যাল হার্ডওয়্যার মোটরে পাঠাচ্ছে।'
                      : 'Autonomous Mode Active: Real-time velocity and steering computed by Vision AI & SLAM are streaming directly to motor pins.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className={`flex justify-between text-xs font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>Left Motor (Pin D5)</span>
                      <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>{telemetry.leftPwm} / 255 PWM</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-950'}`}>
                      <div
                        className="bg-sky-500 h-full transition-all duration-150"
                        style={{ width: `${(telemetry.leftPwm / 255) * 100}%` }}
                      />
                    </div>
                    <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Target RPM: {telemetry.leftRpm} | Dir: {telemetry.leftPwm > 0 ? 'FORWARD (HIGH)' : 'BRAKE'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className={`flex justify-between text-xs font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>Right Motor (Pin D6)</span>
                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{telemetry.rightPwm} / 255 PWM</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-950'}`}>
                      <div
                        className="bg-emerald-500 h-full transition-all duration-150"
                        style={{ width: `${(telemetry.rightPwm / 255) * 100}%` }}
                      />
                    </div>
                    <div className={`text-3xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Target RPM: {telemetry.rightRpm} | Dir: {telemetry.rightPwm > 0 ? 'FORWARD (HIGH)' : 'BRAKE'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Jog Mode */
              <div className="space-y-4">
                <div className={`p-3 rounded-lg border text-xs font-bengali flex items-center gap-2 ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                }`}>
                  <Sliders className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                  <span>
                    {language === 'bn'
                      ? 'ম্যানুয়াল টেস্টিং মোড: গাড়ির মোটর ও চাকার গতি সরাসরি স্লাইডার দিয়ে যাচাই করুন।'
                      : 'Manual Jog Mode: Manually calibrate and test individual motor spin speeds and directions.'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left Motor Jog */}
                  <div className={`p-3 rounded-lg border space-y-2 text-xs font-mono ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex justify-between">
                      <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>Left Motor PWM</span>
                      <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{leftManualPwm} / 255</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={leftManualPwm}
                      onChange={(e) => {
                        setLeftManualPwm(Number(e.target.value));
                        handleSendManual();
                      }}
                      className="w-full accent-sky-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setLeftDir(1);
                          handleSendManual();
                        }}
                        className={`flex-1 py-1 rounded text-2xs transition-colors cursor-pointer ${
                          leftDir === 1
                            ? 'bg-sky-600 text-white'
                            : isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Forward
                      </button>
                      <button
                        onClick={() => {
                          setLeftDir(0);
                          handleSendManual();
                        }}
                        className={`flex-1 py-1 rounded text-2xs transition-colors cursor-pointer ${
                          leftDir === 0
                            ? 'bg-sky-600 text-white'
                            : isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Reverse
                      </button>
                    </div>
                  </div>

                  {/* Right Motor Jog */}
                  <div className={`p-3 rounded-lg border space-y-2 text-xs font-mono ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex justify-between">
                      <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Right Motor PWM</span>
                      <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{rightManualPwm} / 255</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={rightManualPwm}
                      onChange={(e) => {
                        setRightManualPwm(Number(e.target.value));
                        handleSendManual();
                      }}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRightDir(1);
                          handleSendManual();
                        }}
                        className={`flex-1 py-1 rounded text-2xs transition-colors cursor-pointer ${
                          rightDir === 1
                            ? 'bg-emerald-600 text-white'
                            : isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Forward
                      </button>
                      <button
                        onClick={() => {
                          setRightDir(0);
                          handleSendManual();
                        }}
                        className={`flex-1 py-1 rounded text-2xs transition-colors cursor-pointer ${
                          rightDir === 0
                            ? 'bg-emerald-600 text-white'
                            : isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Reverse
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Calibration buttons */}
                <div className="flex flex-wrap gap-2 pt-1 text-2xs font-mono">
                  <button
                    onClick={() => {
                      setLeftManualPwm(128);
                      setRightManualPwm(128);
                      handleSendManual();
                    }}
                    className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Test 50% PWM Forward
                  </button>
                  <button
                    onClick={() => {
                      setLeftManualPwm(200);
                      setRightManualPwm(200);
                      handleSendManual();
                    }}
                    className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Test High Torque 80%
                  </button>
                  <button
                    onClick={() => {
                      setLeftManualPwm(0);
                      setRightManualPwm(0);
                      handleSendManual();
                    }}
                    className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                        : 'bg-rose-950/80 text-rose-300 border-rose-800'
                    }`}
                  >
                    Stop Motors (0 PWM)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Educational Hardware Integration Flow */}
          <div className={`rounded-xl border p-4 space-y-2 text-xs font-bengali ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <h4 className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <Cpu className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              <span>সফটওয়্যারটি যেভাবে বাস্তব গাড়ির হার্ডওয়্যার পরিচালনা করে:</span>
            </h4>
            <div className={`space-y-1.5 text-2xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <p>
                <strong>১. চোখের ইনপুট:</strong> ক্যামেরা থেকে ইমেজ ক্যাপচার করে AI ড্রাইভ্যাবল পথ এবং বাধার দূরত্ব বের করে।
              </p>
              <p>
                <strong>২. ব্রেনের হিসাব:</strong> ডিডব্লিউএ (DWA) অ্যালগরিদম হিসাব করে সামনের চাকাগুলোকে কত স্পিডে এবং কোন কোণে ঘুরাতে হবে।
              </p>
              <p>
                <strong>৩. হাতের অ্যাকচুয়েশন:</strong> ব্রাউজারের <code>WebSerial</code> API বা ROS2 নোড তাৎক্ষণিকভাবে <code>0xAA 0x05 [PWM_L] [PWM_R]</code> প্যাকেট পাঠায়।
              </p>
              <p>
                <strong>৪. ড্রাইভারে রূপান্তর:</strong> আর্দুইনো/ESP32 সিগন্যালটি গ্রহণ করে L298N বা Cytron MDD10A-তে উচ্চ ক্ষমতার 12V কারেন্ট জেনারেট করে গাড়ির ৪টি চাকা ঘুরিয়ে দেয়।
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Communications Terminal / Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className={`rounded-xl border p-3 flex flex-col h-full shadow-inner ${
            isLight ? 'bg-slate-900 border-slate-300 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Serial Terminal</span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-3xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            {/* Scrollable Terminal Stream */}
            <div className="flex-1 min-h-[320px] max-h-[460px] overflow-y-auto font-mono text-3xs p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-slate-300">
              {logs.length === 0 ? (
                <div className="text-slate-400 italic text-center py-10">
                  {connectionState === 'CONNECTED'
                    ? 'Hardware connection active. Awaiting serial packets...'
                    : 'Click "Connect UGV Hardware" above to open physical USB port or test loopback.'}
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.direction === 'TX' ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.direction}:
                    </span>
                    <span className="break-all">{log.message}</span>
                    {log.hex && (
                      <span className="text-amber-400/80 shrink-0">({log.hex})</span>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Telemetry Status Footer */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-3xs font-mono text-slate-400">
              <span>Status: <span className={connectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}>{connectionState}</span></span>
              <span>Watchdog: 500ms Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

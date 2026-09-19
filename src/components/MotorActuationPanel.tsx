import React from 'react';
import { MotorTelemetry, Language, Theme } from '../types';
import { translations } from '../data/translations';
import { Disc3, Gauge, Zap, Terminal, Activity, ArrowRightLeft, Usb } from 'lucide-react';

interface MotorActuationPanelProps {
  telemetry: MotorTelemetry;
  language: Language;
  onOpenHardwareControl?: () => void;
  theme?: Theme;
}

export const MotorActuationPanel: React.FC<MotorActuationPanelProps> = ({
  telemetry,
  language,
  onOpenHardwareControl,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';

  // Hex formatted serial packet
  const lHex = telemetry.leftPwm.toString(16).padStart(2, '0').toUpperCase();
  const rHex = telemetry.rightPwm.toString(16).padStart(2, '0').toUpperCase();
  const dirL = telemetry.leftPwm > 0 ? '01' : '00';
  const dirR = telemetry.rightPwm > 0 ? '01' : '00';
  const checksum = ((telemetry.leftPwm + telemetry.rightPwm) & 0xff).toString(16).padStart(2, '0').toUpperCase();
  const serialFrame = `0xAA 0x05 ${lHex} ${rHex} ${dirL} ${dirR} 0x${checksum}`;

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-3 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${
            isLight ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
          }`}>
            <Disc3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`font-semibold text-sm font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {t.handModuleTitle}
            </h3>
            <p className={`text-2xs font-bengali ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.handModuleSub}
            </p>
          </div>
        </div>

        {/* Battery and Bus Voltage */}
        <div className="flex items-center gap-2 text-2xs font-mono">
          {onOpenHardwareControl && (
            <button
              onClick={onOpenHardwareControl}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-amber-950/80 border-amber-800/80 text-amber-300 hover:bg-amber-900'
              }`}
              title="Open Physical Hardware Interface"
            >
              <Usb className="w-3 h-3" />
              <span>Hardware Link</span>
            </button>
          )}
          <span className={`px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
          }`}>
            {telemetry.voltage}V LiFePO4
          </span>
          <span className={`px-2 py-0.5 rounded ${
            isLight
              ? 'bg-slate-100 text-slate-700 border border-slate-200'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {telemetry.currentAmp}A Load
          </span>
        </div>
      </div>

      {/* Wheel Motor Gauges (Left vs Right) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Motor Card */}
        <div className={`border rounded-lg p-2.5 flex flex-col gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold font-bengali">
            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <Disc3 className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              {t.leftMotor}
            </span>
            <span className={`font-mono text-2xs ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>CH-1 (PWM)</span>
          </div>

          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{telemetry.leftPwm}</span>
              <span className={`text-3xs ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>/ 255 PWM</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>{telemetry.leftRpm}</span>
              <span className={`text-3xs ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RPM</span>
            </div>
          </div>

          {/* PWM Level Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <div
              className="bg-sky-500 h-full transition-all duration-100"
              style={{ width: `${(telemetry.leftPwm / 255) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Motor Card */}
        <div className={`border rounded-lg p-2.5 flex flex-col gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold font-bengali">
            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              <Disc3 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              {t.rightMotor}
            </span>
            <span className={`font-mono text-2xs ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>CH-2 (PWM)</span>
          </div>

          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{telemetry.rightPwm}</span>
              <span className={`text-3xs ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>/ 255 PWM</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{telemetry.rightRpm}</span>
              <span className={`text-3xs ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RPM</span>
            </div>
          </div>

          {/* PWM Level Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <div
              className="bg-emerald-500 h-full transition-all duration-100"
              style={{ width: `${(telemetry.rightPwm / 255) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-time ROS2 cmd_vel & Microcontroller Serial Stream */}
      <div className={`rounded-lg border p-2.5 font-mono text-2xs space-y-1.5 ${
        isLight
          ? 'bg-slate-900 text-slate-100 border-slate-700 shadow-xs'
          : 'bg-slate-950 text-slate-200 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
          <span className="flex items-center gap-1 text-amber-400">
            <Terminal className="w-3 h-3" />
            <span>ROS2 /cmd_vel & Serial UART Packet</span>
          </span>
          <span className="text-3xs text-emerald-400">115200 Baud</span>
        </div>

        <div className="text-slate-300 flex items-center justify-between">
          <span>geometry_msgs/Twist:</span>
          <span className="text-sky-300">v: {telemetry.linearVelocityCmd} m/s | ω: {telemetry.angularVelocityCmd} rad/s</span>
        </div>

        <div className="text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">UART Payload:</span>
          <span className="text-emerald-400 font-semibold">{serialFrame}</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Theme } from '../types';
import { Cpu, Disc3, Eye, Zap, Shield, CheckCircle2, Sliders } from 'lucide-react';

interface HardwareWiringGuideProps {
  theme?: Theme;
}

export const HardwareWiringGuide: React.FC<HardwareWiringGuideProps> = ({
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'schematic' | 'bill_of_materials' | 'pinouts'>('schematic');

  return (
    <div className={`rounded-xl border p-4 md:p-6 shadow-xs flex flex-col gap-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md'
    }`}>
      {/* Header */}
      <div className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${
          isLight ? 'text-amber-700 font-semibold' : 'text-amber-400'
        }`}>
          <Zap className="w-4 h-4" />
          <span>UGV ELECTRICAL & EMBEDDED HARDWARE ARCHITECTURE</span>
        </div>
        <h2 className={`text-xl md:text-2xl font-bold font-bengali ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          {'UGV Hardware Connections & Wiring Schematic'}
        </h2>
        <p className={`text-sm mt-2 font-bengali leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {'Complete physical schematic connecting Single Board Computer, Vision Camera, Motor Driver, Encoders, and Battery.'}
        </p>
      </div>

      {/* Sub tabs */}
      <div className={`flex flex-wrap gap-2 border-b pb-2 text-xs ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <button
          onClick={() => setActiveTab('schematic')}
          className={`px-3 py-1.5 rounded-lg font-medium font-bengali transition-colors cursor-pointer ${
            activeTab === 'schematic'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {'Electrical Wiring Diagram'}
        </button>
        <button
          onClick={() => setActiveTab('bill_of_materials')}
          className={`px-3 py-1.5 rounded-lg font-medium font-bengali transition-colors cursor-pointer ${
            activeTab === 'bill_of_materials'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {'Bill of Materials (BOM)'}
        </button>
        <button
          onClick={() => setActiveTab('pinouts')}
          className={`px-3 py-1.5 rounded-lg font-medium font-bengali transition-colors cursor-pointer ${
            activeTab === 'pinouts'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {'Pinouts & Serial Protocols'}
        </button>
      </div>

      {/* Tab 1: Schematic */}
      {activeTab === 'schematic' && (
        <div className={`rounded-xl border p-4 md:p-6 flex flex-col gap-6 shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <h4 className={`text-sm font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {'Hardware Block Connections'}
          </h4>

          {/* Graphical representation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Vision & Computing */}
            <div className={`border rounded-xl p-4 flex flex-col gap-3 shadow-xs ${
              isLight ? 'bg-white border-sky-300' : 'bg-slate-900 border-sky-600/40'
            }`}>
              <div className={`flex items-center gap-2 font-bold border-b pb-2 ${
                isLight ? 'text-sky-800 border-slate-200' : 'text-sky-400 border-slate-800'
              }`}>
                <Eye className="w-4 h-4" />
                <span>1. VISION & SBC</span>
              </div>
              <div className="space-y-2 text-2xs">
                <div className={`p-2 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>NVIDIA Jetson / RPi 5</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• USB 3.0: 1080p 60fps Camera</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• UART /dev/ttyTHS1 to MCU</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Powered via 5V 4A Buck</div>
                </div>
                <div className={`p-2 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>Wide Angle Camera</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Low latency UVC stream</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Mounted at 0.35m height, 15° downward pitch</div>
                </div>
              </div>
            </div>

            {/* Microcontroller Bridge */}
            <div className={`border rounded-xl p-4 flex flex-col gap-3 shadow-xs ${
              isLight ? 'bg-white border-purple-300' : 'bg-slate-900 border-purple-600/40'
            }`}>
              <div className={`flex items-center gap-2 font-bold border-b pb-2 ${
                isLight ? 'text-purple-800 border-slate-200' : 'text-purple-400 border-slate-800'
              }`}>
                <Cpu className="w-4 h-4" />
                <span>2. LOW-LEVEL MCU</span>
              </div>
              <div className="space-y-2 text-2xs">
                <div className={`p-2 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Arduino Nano / ESP32</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Pin D5, D6: PWM Left & Right</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Pin D7, D8: DIR Left & Right</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Pin D2, D3: Encoder Interrupts</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Watchdog: Auto-stop if serial silent &gt; 500ms</div>
                </div>
              </div>
            </div>

            {/* Power & Motors */}
            <div className={`border rounded-xl p-4 flex flex-col gap-3 shadow-xs ${
              isLight ? 'bg-white border-amber-300' : 'bg-slate-900 border-amber-600/40'
            }`}>
              <div className={`flex items-center gap-2 font-bold border-b pb-2 ${
                isLight ? 'text-amber-800 border-slate-200' : 'text-amber-400 border-slate-800'
              }`}>
                <Disc3 className="w-4 h-4" />
                <span>3. MOTOR ACTUATION</span>
              </div>
              <div className="space-y-2 text-2xs">
                <div className={`p-2 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Dual H-Bridge Driver</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Cytron MDD10A (10A continuous)</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• 12V LiFePO4 direct feed</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Output to High-Torque DC Motors</div>
                </div>
                <div className={`p-2 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>DC Motors with Encoders</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• 12V 300 RPM Planetary Gear</div>
                  <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>• Hall sensor feedback for odometry</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bill of Materials */}
      {activeTab === 'bill_of_materials' && (
        <div className={`rounded-xl border p-4 md:p-6 shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-300 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                  <th className="py-2.5 px-3">Component</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Recommended Spec</th>
                  <th className="py-2.5 px-3">Interface</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-300'}`}>
                <tr>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>Main SBC</td>
                  <td className="py-2.5 px-3">AI Vision & SLAM Brain</td>
                  <td className="py-2.5 px-3">NVIDIA Jetson Nano / Raspberry Pi 5</td>
                  <td className={`py-2.5 px-3 text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>USB 3.0, UART</td>
                </tr>
                <tr>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Camera Module</td>
                  <td className="py-2.5 px-3">Vision Sensor (Eyes)</td>
                  <td className="py-2.5 px-3">120° FOV Wide Angle USB / RealSense D435</td>
                  <td className={`py-2.5 px-3 text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>USB 3.0 / CSI</td>
                </tr>
                <tr>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>Motor Driver</td>
                  <td className="py-2.5 px-3">H-Bridge Current Amplification</td>
                  <td className="py-2.5 px-3">Cytron MDD10A / L298N (10A - 20A)</td>
                  <td className={`py-2.5 px-3 text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PWM + DIR pins</td>
                </tr>
                <tr>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Gear Motors</td>
                  <td className="py-2.5 px-3">Locomotion Actuators</td>
                  <td className="py-2.5 px-3">12V DC Planetary Gear (250-300 RPM) with Encoders</td>
                  <td className={`py-2.5 px-3 text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Motor Terminals & Hall Pulse</td>
                </tr>
                <tr>
                  <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>Power Battery</td>
                  <td className="py-2.5 px-3">Energy Supply</td>
                  <td className="py-2.5 px-3">12V 6000mAh LiFePO4 + 5V 4A DC-DC Buck</td>
                  <td className={`py-2.5 px-3 text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>XT60 with 20A Fuse</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pinouts */}
      {activeTab === 'pinouts' && (
        <div className={`rounded-xl border p-4 md:p-6 space-y-4 text-xs font-mono shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <h4 className={`font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {'MCU Pin Mapping & Serial Specs'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`border rounded-lg p-3 space-y-1 text-2xs shadow-xs ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className={`font-bold mb-2 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Arduino / MCU GPIO Pins</div>
              <div>• D5 ➔ Left Motor PWM (0-255)</div>
              <div>• D6 ➔ Right Motor PWM (0-255)</div>
              <div>• D7 ➔ Left Motor Direction (HIGH=Forward, LOW=Reverse)</div>
              <div>• D8 ➔ Right Motor Direction (HIGH=Forward, LOW=Reverse)</div>
              <div>• D2 (INT0) ➔ Left Wheel Encoder Channel A</div>
              <div>• D3 (INT1) ➔ Right Wheel Encoder Channel A</div>
            </div>

            <div className={`border rounded-lg p-3 space-y-1 text-2xs shadow-xs ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className={`font-bold mb-2 ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>Serial Packet Structure (115200 Baud)</div>
              <div>[Byte 0]: 0xAA (Header Start)</div>
              <div>[Byte 1]: Length (0x05)</div>
              <div>[Byte 2]: Left PWM (0x00 to 0xFF)</div>
              <div>[Byte 3]: Right PWM (0x00 to 0xFF)</div>
              <div>[Byte 4]: Left DIR (0x01 = Fwd, 0x00 = Rev)</div>
              <div>[Byte 5]: Right DIR (0x01 = Fwd, 0x00 = Rev)</div>
              <div>[Byte 6]: CRC8 Checksum</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

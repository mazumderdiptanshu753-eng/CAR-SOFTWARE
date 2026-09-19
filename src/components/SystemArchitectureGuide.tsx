import React, { useState } from 'react';
import { Language, Theme } from '../types';
import { translations } from '../data/translations';
import { Eye, Brain, Disc3, ShieldCheck, CheckCircle2, ChevronRight, Cpu, Layers, Target, Compass, Zap } from 'lucide-react';

interface SystemArchitectureGuideProps {
  language: Language;
  theme?: Theme;
}

export const SystemArchitectureGuide: React.FC<SystemArchitectureGuideProps> = ({
  language,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';
  const [activeSection, setActiveSection] = useState<'overview' | 'challenges' | 'pipeline' | 'evaluation'>('overview');

  return (
    <div className={`rounded-xl border p-4 md:p-6 shadow-xs flex flex-col gap-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md'
    }`}>
      {/* Header Banner */}
      <div className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${
          isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'
        }`}>
          <Cpu className="w-4 h-4" />
          <span>UGV AUTONOMOUS FLIGHT & GROUND STACK BLUEPRINT</span>
        </div>
        <h2 className={`text-xl md:text-2xl font-bold font-bengali ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          {t.archOverview}
        </h2>
        <p className={`text-sm mt-2 font-bengali leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {t.archOverviewBody}
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`flex flex-wrap gap-2 border-b pb-2 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-bengali transition-colors cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'bn' ? 'কোর ৩টি মডিউল (চোখ, ব্রেন, হাত)' : 'Core 3 Biological Modules'}
        </button>

        <button
          onClick={() => setActiveSection('challenges')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-bengali transition-colors cursor-pointer ${
            activeSection === 'challenges'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'bn' ? 'প্রধান ৩টি চ্যালেঞ্জ ও সমাধান' : '3 Key Challenges & Solutions'}
        </button>

        <button
          onClick={() => setActiveSection('pipeline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-bengali transition-colors cursor-pointer ${
            activeSection === 'pipeline'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'bn' ? 'সিস্টেম ডেটাফ্লো পাইপলাইন' : 'Dataflow Architecture'}
        </button>

        <button
          onClick={() => setActiveSection('evaluation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-bengali transition-colors cursor-pointer ${
            activeSection === 'evaluation'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'bn' ? 'সফলতার মাপকাঠি (Success Criteria)' : 'Evaluation & Success Metrics'}
        </button>
      </div>

      {/* Section 1: The 3 Core Modules (চোখ, ব্রেন, হাত) */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Eye Card */}
          <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors shadow-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 hover:border-emerald-500'
              : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-emerald-100 border border-emerald-300 text-emerald-700' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
            }`}>
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-3xs font-mono uppercase tracking-wider ${
                isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'
              }`}>
                Perception Module
              </span>
              <h3 className={`text-base font-bold font-bengali mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {t.eyeModuleTitle}
              </h3>
            </div>
            <p className={`text-xs font-bengali leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {t.perceptionBody}
            </p>
            <div className={`mt-auto pt-2 border-t text-2xs font-mono space-y-1 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              <div>• Sensors: Monocular USB / Stereo RealSense</div>
              <div>• Algorithm: FastSCNN / MobileNetV3</div>
              <div>• Output: Safe Corridor Mask, Obstacle Bounding Boxes</div>
            </div>
          </div>

          {/* Brain Card */}
          <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors shadow-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 hover:border-purple-500'
              : 'bg-slate-950/80 border-slate-800 hover:border-purple-500/50'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-purple-100 border border-purple-300 text-purple-700' : 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
            }`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-3xs font-mono uppercase tracking-wider ${
                isLight ? 'text-purple-700 font-bold' : 'text-purple-400'
              }`}>
                Localization & Planning
              </span>
              <h3 className={`text-base font-bold font-bengali mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {t.brainModuleTitle}
              </h3>
            </div>
            <p className={`text-xs font-bengali leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {t.slamBody}
            </p>
            <div className={`mt-auto pt-2 border-t text-2xs font-mono space-y-1 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              <div>• State: [X, Y, θ] Visual Odometry</div>
              <div>• Planner: Global A* + Local DWA</div>
              <div>• Output: Target Velocity [v, ω] commands</div>
            </div>
          </div>

          {/* Hand Card */}
          <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors shadow-xs ${
            isLight
              ? 'bg-slate-50 border-slate-200 hover:border-amber-500'
              : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
            }`}>
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-3xs font-mono uppercase tracking-wider ${
                isLight ? 'text-amber-800 font-bold' : 'text-amber-400'
              }`}>
                Actuation & Hardware
              </span>
              <h3 className={`text-base font-bold font-bengali mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {t.handModuleTitle}
              </h3>
            </div>
            <p className={`text-xs font-bengali leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {t.motorBody}
            </p>
            <div className={`mt-auto pt-2 border-t text-2xs font-mono space-y-1 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              <div>• Hardware: Cytron MDD10A / L298N / Sabertooth</div>
              <div>• Kinematics: Differential Drive v_L, v_R</div>
              <div>• Output: Left/Right PWM (0-255) & RPM control</div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 3 Key Challenges & Solutions */}
      {activeSection === 'challenges' && (
        <div className="space-y-4">
          {/* Challenge 1 */}
          <div className={`rounded-xl border p-4 shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isLight ? 'bg-sky-100 border border-sky-300 text-sky-800' : 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
              }`}>
                <span className="font-bold font-mono">1</span>
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.challenge1Title} (পাথ ডিটেকশন ও সেগমেন্টেশন)
                </h4>
                <p className={`text-xs font-bengali mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.challenge1Desc}
                </p>
                <div className={`mt-3 border rounded-lg p-3 text-xs space-y-2 ${
                  isLight ? 'bg-white border-slate-200 text-slate-700 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-semibold font-bengali ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                    {language === 'bn' ? 'প্রস্তাবিত এআই আর্কিটেকচার:' : 'Recommended Vision AI Architecture:'}
                  </div>
                  <ul className={`list-disc list-inside space-y-1 font-mono text-2xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>FastSCNN / BiSeNet:</strong> 30+ FPS real-time semantic segmentation on Jetson Nano / Raspberry Pi 5.</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Lightweight YOLOv8-Nano:</strong> Real-time bounding box detection for positive hazards (rocks, tree trunks, bushes).</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Negative Obstacle Detection:</strong> Texture variance and optical disparity drop for pits, ditches, and drop-offs.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge 2 */}
          <div className={`rounded-xl border p-4 shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isLight ? 'bg-purple-100 border border-purple-300 text-purple-800' : 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
              }`}>
                <span className="font-bold font-mono">2</span>
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.challenge2Title} (জিপিএস-বিহীন ভিজ্যুয়াল লোকালাইজেশন)
                </h4>
                <p className={`text-xs font-bengali mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.challenge2Desc}
                </p>
                <div className={`mt-3 border rounded-lg p-3 text-xs space-y-2 ${
                  isLight ? 'bg-white border-slate-200 text-slate-700 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-semibold font-bengali ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                    {language === 'bn' ? 'এসএলএএম ও ওডোমেট্রি সমাধান:' : 'Visual Odometry / SLAM Implementation:'}
                  </div>
                  <ul className={`list-disc list-inside space-y-1 font-mono text-2xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Feature Extraction:</strong> FAST / ORB corner detector with Lucas-Kanade optical flow feature tracking.</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Scale Estimation:</strong> Camera mounting height ($h = 0.35$m) and ground plane constraint or wheel encoder fusion.</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Drift Mitigation:</strong> Keyframe bundle adjustment and topological landmark revisit recognition (Loop Closure).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge 3 */}
          <div className={`rounded-xl border p-4 shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isLight ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}>
                <span className="font-bold font-mono">3</span>
              </div>
              <div className="flex-1">
                <h4 className={`text-base font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.challenge3Title} (কলিশন অ্যাভয়েডেন্স ও মোটর ড্রাইভার)
                </h4>
                <p className={`text-xs font-bengali mt-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {t.challenge3Desc}
                </p>
                <div className={`mt-3 border rounded-lg p-3 text-xs space-y-2 ${
                  isLight ? 'bg-white border-slate-200 text-slate-700 shadow-xs' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className={`font-semibold font-bengali ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    {language === 'bn' ? 'অ্যালগরিদম ও মোটর কন্ট্রোল কৌশল:' : 'Path Planning & Actuation Details:'}
                  </div>
                  <ul className={`list-disc list-inside space-y-1 font-mono text-2xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Dynamic Window Approach (DWA):</strong> Explores $(v, \omega)$ velocity space, scoring candidate arcs for clearance, goal progress, and speed.</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Differential Drive Kinematics:</strong> v_L = v - (ω · L / 2), v_R = v + (ω · L / 2).</li>
                    <li><strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Safety Watchdog:</strong> Instant dynamic brake command if forward time-to-collision drops below 0.8 seconds.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Dataflow Pipeline Diagram */}
      {activeSection === 'pipeline' && (
        <div className={`rounded-xl border p-4 md:p-6 flex flex-col gap-4 shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <h3 className={`text-base font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {language === 'bn' ? 'রোবট কন্ট্রোল সিস্টেম ডেটাফ্লো চার্ট' : 'End-to-End System Dataflow Architecture'}
          </h3>

          {/* Visual Step-by-Step Chain */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className={`border rounded-lg p-3 flex flex-col gap-2 relative shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-2xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>STAGE 01: SENSE</span>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>ক্যামেরা ইনপুট</h5>
              <p className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                বাম্পার ক্যামেরা থেকে প্রতি সেকেন্ডে ৩০টি ফ্রেম (1280×720 RGB) ক্যাশ মেমরিতে লোড হয়।
              </p>
            </div>

            {/* Step 2 */}
            <div className={`border rounded-lg p-3 flex flex-col gap-2 relative shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-2xs font-mono font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>STAGE 02: PERCEIVE</span>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>এআই পারসেপশন</h5>
              <p className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                রাস্তা শনাক্তকরণ ও সামনে থাকা বড় পাথর, খাদ বা গাছের অবস্থান ও দূরত্ব মেজার করা হয়।
              </p>
            </div>

            {/* Step 3 */}
            <div className={`border rounded-lg p-3 flex flex-col gap-2 relative shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-2xs font-mono font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>STAGE 03: PLAN</span>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>এসএলএএম ও প্ল্যানার</h5>
              <p className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                জিপিএস ছাড়াই বর্তমান স্থানাঙ্ক এবং গন্তব্য অনুযায়ী নিরাপদ স্টিয়ারিং কোণ ও বেগ হিসাব করে।
              </p>
            </div>

            {/* Step 4 */}
            <div className={`border rounded-lg p-3 flex flex-col gap-2 relative shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`text-2xs font-mono font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>STAGE 04: ACTUATE</span>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>মোটর ড্রাইভার</h5>
              <p className={`text-2xs font-bengali ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                মাইক্রোকন্ট্রোলারে PWM সিগন্যাল পাঠিয়ে চাকা ঘুরিয়ে রোবটকে গন্তব্যের দিকে এগিয়ে নেয়।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Evaluation & Success Criteria */}
      {activeSection === 'evaluation' && (
        <div className={`rounded-xl border p-4 md:p-6 flex flex-col gap-4 shadow-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <h3 className={`text-base font-bold font-bengali flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CheckCircle2 className={`w-5 h-5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>{language === 'bn' ? 'প্রজেক্টের চূড়ান্ত সফলতার মাপকাঠি' : 'Final Evaluation & Success Metrics'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className={`border rounded-lg p-3.5 space-y-1.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>১. ১০০% জিপিএস-মুক্ত স্বয়ংক্রিয়তা</h5>
              <p className={`font-bengali text-2xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                কোনো ধরনের জিপিএস বা এক্সটার্নাল রিমোট কন্ট্রোল ছাড়াই রোবট শুধু ক্যামেরা দেখে পয়েন্ট 'এ' থেকে পয়েন্ট 'বি'-তে পৌঁছাবে।
              </p>
            </div>

            <div className={`border rounded-lg p-3.5 space-y-1.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>২. শূন্য সংঘর্ষের নিশ্চয়তা (Zero Collision)</h5>
              <p className={`font-bengali text-2xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                হঠাৎ রাস্তায় পাথর পড়লে বা গভীর খাদ থাকলে গাড়িটি সঙ্গে সঙ্গে গতি কমিয়ে সুরক্ষিত নতুন রুট ধরে বাধা এড়াবে।
              </p>
            </div>

            <div className={`border rounded-lg p-3.5 space-y-1.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>৩. আলোর তারতম্যে কার্যকর স্থায়িত্ব</h5>
              <p className={`font-bengali text-2xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                প্রখর রোদ, গাছের ছায়া বা সন্ধ্যার স্বল্প আলোতেও পারসেপশন মডেল যাতে পথ চিনতে ভুল না করে।
              </p>
            </div>

            <div className={`border rounded-lg p-3.5 space-y-1.5 shadow-xs ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h5 className={`font-bold font-bengali ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>৪. ন্যূনতম ড্রিফট ও ট্র্যাকিং নির্ভুলতা</h5>
              <p className={`font-bengali text-2xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                ভিজ্যুয়াল ওডোমেট্রি ড্রিফট মোট দূরত্বের ২% এর নিচে ধরে রেখে গন্তব্য স্থানাঙ্কে সফলভাবে পার্কিং সম্পন্ন করা।
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

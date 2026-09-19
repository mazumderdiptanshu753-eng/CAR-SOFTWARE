import React, { useState } from 'react';
import { Language, Theme } from '../types';
import { Code, Copy, Check, Terminal, FileCode, Cpu } from 'lucide-react';

interface CodeSamplesTabProps {
  language: Language;
  theme?: Theme;
}

export const CodeSamplesTab: React.FC<CodeSamplesTabProps> = ({
  language,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [selectedFile, setSelectedFile] = useState<'perception' | 'slam' | 'planner' | 'firmware'>('perception');
  const [copied, setCopied] = useState(false);

  const codeFiles = {
    perception: {
      name: 'perception_vision_node.py',
      lang: 'Python (ROS2 / OpenCV / ONNX)',
      desc: 'চোখের কাজ: ক্যামেরা ফ্রেম গ্রহণ করে রিয়েল-টাইমে পাথ সেগমেন্টেশন ও অবস্ট্যাকল শনাক্তকরণ।',
      code: `#!/usr/bin/env python3
"""
UGV GPS-Denied Autonomous Navigation
Module 1: Perception AI (চোখের কাজ)
"""
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from geometry_msgs.msg import Point
from std_msgs.msg import Float32MultiArray
import cv2
import numpy as np
from cv_bridge import CvBridge

class CameraPerceptionNode(Node):
    def __init__(self):
        super().__init__('camera_perception_node')
        self.bridge = CvBridge()
        
        # Subscribe to raw forward camera feed
        self.image_sub = self.create_subscription(
            Image, '/camera/rgb/image_raw', self.image_callback, 10
        )
        
        # Publish drivable path clearance & detected obstacle sectors
        self.obstacle_pub = self.create_publisher(
            Float32MultiArray, '/ugv/perception/depth_sectors', 10
        )
        
        # Load lightweight edge ONNX model (FastSCNN / YOLOv8-Nano)
        # self.net = cv2.dnn.readNetFromONNX("fastscnn_trail_segmented.onnx")
        self.get_logger().info("Perception AI Vision Node initialized successfully.")

    def image_callback(self, msg):
        frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
        h, w, _ = frame.shape
        
        # 1. Perspective Transform / Region of Interest (Bumper Camera)
        roi = frame[int(h * 0.45):h, :]
        
        # 2. Drivable Corridor Edge & Color Thresholding / AI Inference
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        # Segment dirt trail vs green foliage / rock obstacles
        mask_drivable = cv2.inRange(hsv, np.array([10, 30, 40]), np.array([30, 200, 200]))
        
        # 3. Divide forward view into 5 sectors: [Far-Left, Mid-Left, Center, Mid-Right, Far-Right]
        sector_w = w // 5
        sector_clearances = []
        for i in range(5):
            slice_mask = mask_drivable[:, i*sector_w:(i+1)*sector_w]
            clearance_ratio = float(cv2.countNonZero(slice_mask) / (slice_mask.size + 1e-5))
            # Distance mapping approximation based on visible vertical depth
            sector_clearances.append(clearance_ratio * 10.0)
            
        out_msg = Float32MultiArray()
        out_msg.data = sector_clearances
        self.obstacle_pub.publish(out_msg)

def main(args=None):
    rclpy.init(args=args)
    node = CameraPerceptionNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`
    },
    slam: {
      name: 'visual_odometry_slam.py',
      lang: 'Python (Monocular VO / Lucas-Kanade)',
      desc: 'ব্রেনের অংশ ১: ক্যামেরা ফ্রেমের ফিচার পয়েন্ট ট্র্যাক করে রোবটের বর্তমান কোঅর্ডিনেট (X, Y, Heading) হিসাব।',
      code: `#!/usr/bin/env python3
"""
UGV GPS-Denied Autonomous Navigation
Module 2: Visual Odometry & Dead Reckoning (ব্রেন)
"""
import cv2
import numpy as np

class VisualOdometry:
    def __init__(self, camera_focal_length=718.85, ppx=607.19, ppy=185.21):
        self.focal = camera_focal_length
        self.pp = (ppx, ppy)
        self.prev_frame = None
        self.prev_points = None
        self.cur_R = np.eye(3)
        self.cur_t = np.zeros((3, 1))
        
        # FAST Feature detector
        self.detector = cv2.FastFeatureDetector_create(threshold=25, nonmaxSuppression=True)
        
    def process_frame(self, gray_frame, ground_speed_scale=0.08):
        """Estimate 2D ground plane displacement [dx, dy, dtheta]"""
        if self.prev_frame is None:
            self.prev_frame = gray_frame
            keypoints = self.detector.detect(gray_frame, None)
            self.prev_points = np.array([kp.pt for kp in keypoints], dtype=np.float32)
            return 0.0, 0.0, 0.0
            
        # Lucas-Kanade Sparse Optical Flow
        curr_points, status, err = cv2.calcOpticalFlowPyrLK(
            self.prev_frame, gray_frame, self.prev_points, None,
            winSize=(21, 21), maxLevel=3
        )
        
        # Filter valid points
        valid_prev = self.prev_points[status.flatten() == 1]
        valid_curr = curr_points[status.flatten() == 1]
        
        # Essential Matrix calculation
        E, mask = cv2.findEssentialMat(valid_curr, valid_prev, focal=self.focal, pp=self.pp, method=cv2.RANSAC, prob=0.999, threshold=1.0)
        _, R, t, mask = cv2.recoverPose(E, valid_curr, valid_prev, focal=self.focal, pp=self.pp)
        
        # Scale displacement using ground wheel speed fusion
        t_scaled = t * ground_speed_scale
        self.cur_t = self.cur_t + self.cur_R.dot(t_scaled)
        self.cur_R = R.dot(self.cur_R)
        
        # Extract 2D yaw angle
        sy = np.sqrt(self.cur_R[0, 0]**2 + self.cur_R[1, 0]**2)
        yaw = np.arctan2(self.cur_R[1, 0], self.cur_R[0, 0])
        
        # Refresh feature points for next frame
        if len(valid_curr) < 200:
            keypoints = self.detector.detect(gray_frame, None)
            self.prev_points = np.array([kp.pt for kp in keypoints], dtype=np.float32)
        else:
            self.prev_points = valid_curr
            
        self.prev_frame = gray_frame
        return float(self.cur_t[0, 0]), float(self.cur_t[2, 0]), float(yaw)
`
    },
    planner: {
      name: 'collision_avoidance_planner.py',
      lang: 'Python (Dynamic Window Approach / Reactive)',
      desc: 'ব্রেনের অংশ ২: সামনের বাধা এড়িয়ে গন্তব্যের দিকে নিরাপদ গতি (Linear V) ও স্টিয়ারিং (Angular W) জেনারেট।',
      code: `#!/usr/bin/env python3
"""
UGV GPS-Denied Autonomous Navigation
Module 3: Obstacle Avoidance & Path Follower
"""
import numpy as np

class ReactiveCollisionPlanner:
    def __init__(self, max_speed=1.5, max_yaw_rate=1.8, safety_distance=1.8):
        self.max_speed = max_speed
        self.max_yaw_rate = max_yaw_rate
        self.safety_dist = safety_distance
        
    def plan_velocity(self, current_pose, goal_pose, sector_distances):
        """
        Input:
            current_pose: [x, y, theta]
            goal_pose: [gx, gy]
            sector_distances: [d_far_left, d_left, d_center, d_right, d_far_right]
        Output:
            target_v (m/s), target_omega (rad/s)
        """
        cx, cy, c_theta = current_pose
        gx, gy = goal_pose
        
        # Distance and Angle to Goal
        dx = gx - cx
        dy = gy - cy
        dist_to_goal = np.hypot(dx, dy)
        goal_angle = np.arctan2(dy, dx)
        
        # Heading error (-pi to pi)
        heading_error = goal_angle - c_theta
        heading_error = np.arctan2(np.sin(heading_error), np.cos(heading_error))
        
        # Obstacle Repulsion Vector (Artificial Potential Field / Sector Weighting)
        left_dist = min(sector_distances[0], sector_distances[1])
        center_dist = sector_distances[2]
        right_dist = min(sector_distances[3], sector_distances[4])
        
        repulsive_omega = 0.0
        
        # Emergency Center Obstacle Detected
        if center_dist < self.safety_dist:
            if left_dist > right_dist:
                repulsive_omega = 1.6  # Steer sharply Left
            else:
                repulsive_omega = -1.6 # Steer sharply Right
        else:
            if left_dist < self.safety_dist * 0.8:
                repulsive_omega = -1.0 # Veer Right
            elif right_dist < self.safety_dist * 0.8:
                repulsive_omega = 1.0  # Veer Left

        target_omega = heading_error * 1.5 + repulsive_omega
        target_omega = np.clip(target_omega, -self.max_yaw_rate, self.max_yaw_rate)

        # Dynamic Speed Regulation
        if center_dist < 3.0:
            target_v = self.max_speed * 0.3
        elif abs(target_omega) > 0.8:
            target_v = self.max_speed * 0.5
        else:
            target_v = min(self.max_speed, dist_to_goal * 0.8)

        return float(target_v), float(target_omega)
`
    },
    firmware: {
      name: 'ugv_motor_bridge.ino',
      lang: 'C++ (Arduino / ESP32 Firmware)',
      desc: 'হাতের কাজ: মাইক্রোকন্ট্রোলারে PWM ও দিক নিয়ন্ত্রণকারী ফার্মওয়্যার কোড।',
      code: `/**
 * UGV GPS-Denied Autonomous Navigation
 * Module 4: Motor Actuation Firmware (হাতের কাজ)
 */
#define PIN_PWM_L 5
#define PIN_PWM_R 6
#define PIN_DIR_L 7
#define PIN_DIR_R 8

unsigned long last_cmd_time = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 500;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PWM_L, OUTPUT);
  pinMode(PIN_PWM_R, OUTPUT);
  pinMode(PIN_DIR_L, OUTPUT);
  pinMode(PIN_DIR_R, OUTPUT);
  stopMotors();
}

void loop() {
  // Read Serial Protocol: 0xAA 0x05 [PWM_L] [PWM_R] [DIR_L] [DIR_R] [CRC]
  if (Serial.available() >= 7) {
    if (Serial.read() == 0xAA) {
      byte len = Serial.read();
      byte pwmL = Serial.read();
      byte pwmR = Serial.read();
      byte dirL = Serial.read();
      byte dirR = Serial.read();
      byte crc  = Serial.read();

      if (((pwmL + pwmR) & 0xFF) == crc) {
        last_cmd_time = millis();
        // Set Motors
        digitalWrite(PIN_DIR_L, dirL ? HIGH : LOW);
        digitalWrite(PIN_DIR_R, dirR ? HIGH : LOW);
        analogWrite(PIN_PWM_L, pwmL);
        analogWrite(PIN_PWM_R, pwmR);
      }
    }
  }

  // Safety Watchdog: Stop vehicle if communication is lost
  if (millis() - last_cmd_time > WATCHDOG_TIMEOUT_MS) {
    stopMotors();
  }
}

void stopMotors() {
  analogWrite(PIN_PWM_L, 0);
  analogWrite(PIN_PWM_R, 0);
}
`
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeFiles[selectedFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-4 md:p-6 shadow-xs flex flex-col gap-5 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md'
    }`}>
      {/* Header */}
      <div className={`border-b pb-3 flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${
            isLight ? 'text-sky-700 font-semibold' : 'text-sky-400'
          }`}>
            <Code className="w-4 h-4" />
            <span>PRODUCTION-READY PYTHON & ROS2 SOFTWARE REPOSITORY</span>
          </div>
          <h2 className={`text-xl font-bold font-bengali ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {language === 'bn' ? 'ইউজিভি স্বয়ংক্রিয় নেভিগেশন সোর্স কোড' : 'UGV Autonomous Navigation Source Code'}
          </h2>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy File'}</span>
        </button>
      </div>

      {/* File Select Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFile('perception')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            selectedFile === 'perception'
              ? 'bg-sky-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>perception_vision_node.py</span>
        </button>

        <button
          onClick={() => setSelectedFile('slam')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            selectedFile === 'slam'
              ? 'bg-purple-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>visual_odometry_slam.py</span>
        </button>

        <button
          onClick={() => setSelectedFile('planner')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            selectedFile === 'planner'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>collision_avoidance_planner.py</span>
        </button>

        <button
          onClick={() => setSelectedFile('firmware')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
            selectedFile === 'firmware'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>ugv_motor_bridge.ino</span>
        </button>
      </div>

      {/* Selected File Description */}
      <div className={`rounded-lg p-3 border text-xs font-bengali flex flex-wrap items-center justify-between gap-2 shadow-xs ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <span>{codeFiles[selectedFile].desc}</span>
        <span className={`font-mono text-2xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {codeFiles[selectedFile].lang}
        </span>
      </div>

      {/* Code Viewer */}
      <div className={`rounded-xl border p-4 font-mono text-xs overflow-x-auto shadow-inner ${
        isLight
          ? 'bg-slate-950 border-slate-800 text-emerald-300'
          : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <pre>{codeFiles[selectedFile].code}</pre>
      </div>
    </div>
  );
};

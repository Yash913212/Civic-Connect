"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { authService } from "@/auth/authService";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import WarpTransition from "./WarpTransition";
import { Lock, Shield, Key, Activity, Loader2, Eye, EyeOff, User, Briefcase, Check } from "lucide-react";
import { toast } from "sonner";
import { showTextLoading, showSystemStatus } from "@/components/ui/CustomToasts";
import confetti from "canvas-confetti";
import { ThemeToggle } from "@/components/ThemeToggle";

import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false, // This controls the direction
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean; // This prop determines the direction
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}> {/* Removed bg-white */}
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={
            opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
          }
          // Pass reverse state and speed via string flags in the empty shader prop
          shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  );
};


interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "", // This shader string will now contain the animation logic
  center = ["x", "y"],
}) => {
  // ... uniforms calculation remains the same for colors, opacities, etc.
  const uniforms = React.useMemo(() => {
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0, // Convert boolean to number (1 or 0)
        type: "uniform1i", // Use 1i for bool in WebGL1/GLSL100, or just bool for GLSL300+ if supported
      },
    };
  }, [colors, opacities, totalSize, dotSize, shader]); // Add shader to dependencies

  return (
    <Shader
      // The main animation logic is now built *outside* the shader prop
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse; // Changed from bool to int

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x")
          ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
          : ""
        }
            ${center.includes("y")
          ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
          : ""
        }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2); // Used for initial opacity random pick and color
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            // --- Animation Timing Logic ---
            float animation_speed_factor = 0.5; // Extract speed from shader string
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            // Calculate timing offset for Intro (from center)
            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

            // Calculate timing offset for Outro (from edges)
            // Max distance from center to a corner of the grid
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);


            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                 // Outro logic: opacity starts high, goes to 0 when time passes offset
                 opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                 // Clamp for fade-out transition
                 opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                 // Intro logic: opacity starts 0, goes to base opacity when time passes offset
                 opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                 // Clamp for fade-in transition
                 opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }


            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a; // Premultiply alpha
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};


class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("WebGL context lost or failed to initialize, using CSS background fallback.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 opacity-40 pointer-events-none" />
        )
      );
    }
    return this.props.children;
  }
}

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.elapsedTime;

    const material: any = ref.current.material;
    if (material?.uniforms?.u_time) {
      material.uniforms.u_time.value = timestamp;
    }
  });

  const getUniforms = () => {
    const preparedUniforms: any = {};

    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];

      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value as number[]),
            type: "3f",
          };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((v: number[]) =>
              new THREE.Vector3().fromArray(v)
            ),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value as number[]),
            type: "2f",
          };
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
          break;
      }
    }

    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    }; // Initialize u_resolution
    return preparedUniforms;
  };

  // Shader material
  const material = useMemo(() => {
    const materialObject = new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });

    return materialObject;
  }, [size.width, size.height, source]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  const [hasWebGLError, setHasWebGLError] = useState(false);

  if (hasWebGLError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 opacity-40 pointer-events-none" />
    );
  }

  return (
    <WebGLErrorBoundary fallback={<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 opacity-40 pointer-events-none" />}>
      <div className="absolute inset-0 h-full w-full">
        <Canvas
          gl={{
            powerPreference: "low-power",
            antialias: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl }) => {
            const canvasEl = gl.domElement;
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              setHasWebGLError(true);
            };
            canvasEl.addEventListener("webglcontextlost", handleContextLost, false);
          }}
        >
          <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const defaultTextColor = 'text-gray-300';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-sm';

  return (
    <Link href={href} className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
        <span className={defaultTextColor}>{children}</span>
        <span className={hoverTextColor}>{children}</span>
      </div>
    </Link>
  );
};

interface MiniNavbarProps {
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
}

function MiniNavbar({ isSignUp, setIsSignUp }: MiniNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <div className="relative h-8 w-8 sm:h-10 sm:w-10 group-hover:scale-105 transition-transform duration-300 bg-white rounded-lg overflow-hidden flex items-center justify-center">
      <img src="/logo.png" alt="Nagara Netra Logo" className="object-contain w-full h-full p-0.5" />
    </div>
  );

  const navLinksData = [
    { label: 'Manifesto', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Discover', href: '#' },
  ];

  const loginButtonElement = (
    <button
      onClick={() => {
        setIsSignUp(false);
        setIsOpen(false);
      }}
      className={`px-4 py-2 sm:px-3 text-xs sm:text-sm border rounded-full transition-all duration-300 w-full sm:w-auto ${!isSignUp
        ? "border-teal-500 bg-teal-500/10 text-teal-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:text-white"
        }`}
    >
      LogIn
    </button>
  );

  const signupButtonElement = (
    <div className="relative group w-full sm:w-auto">
      {isSignUp && (
        <div className="absolute inset-0 -m-1 rounded-full
                       hidden sm:block
                       bg-teal-500
                       opacity-20 filter blur-md pointer-events-none"></div>
      )}
      <button
        onClick={() => {
          setIsSignUp(true);
          setIsOpen(false);
        }}
        className={`relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 w-full sm:w-auto ${isSignUp
          ? "text-black bg-gradient-to-br from-teal-400 to-teal-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          : "text-black bg-gradient-to-br from-gray-100 to-gray-300 hover:from-gray-200 hover:to-gray-400"
          }`}
      >
        Signup
      </button>
    </div>
  );

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       pl-6 pr-6 py-3 backdrop-blur-sm
                       ${headerShapeClass}
                       border border-[#333] bg-[#1f1f1f57]
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-[border-radius] duration-0 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          {logoElement}
          <span className="text-base font-bold font-heading text-white tracking-wider group-hover:text-teal-400 transition-colors">
            Nagara Netra
          </span>
        </Link>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.label} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {loginButtonElement}
          {signupButtonElement}
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <Link key={link.label} href={link.href} className="text-gray-300 hover:text-white transition-colors w-full text-center">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {loginButtonElement}
          {signupButtonElement}
        </div>
      </div>
    </header>
  );
}

type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';

const roleInfo = {
  CITIZEN: {
    title: "Citizen Portal",
    desc: "Report and Track Civic Issues",
    canSignup: true,
    noSignupMsg: "",
    color: [[59, 130, 246]],
    icon: <User size={14} />,
    accent: "rgba(59,130,246,",
    badge: "🌐 Public Portal",
    pillBg: "rgba(59,130,246,0.2)",
    pillBorder: "rgba(59,130,246,0.45)",
    pillGlow: "rgba(59,130,246,0.35)",
    progressColor: "#3b82f6",
    accentText: "text-emerald-400",
  },
  OFFICER: {
    title: "Officer Portal",
    desc: "Manage Assigned Complaints",
    canSignup: false,
    noSignupMsg: "Officer accounts are created by Administrators.",
    color: [[34, 197, 94]],
    icon: <Briefcase size={14} />,
    accent: "rgba(34,197,94,",
    badge: "🛡️ Officer Gateway",
    pillBg: "rgba(34,197,94,0.2)",
    pillBorder: "rgba(34,197,94,0.45)",
    pillGlow: "rgba(34,197,94,0.35)",
    progressColor: "#22c55e",
    accentText: "text-emerald-400",
  },
  ADMIN: {
    title: "Admin Portal",
    desc: "Manage Departments and Operations",
    canSignup: false,
    noSignupMsg: "Administrative accounts are managed by System.",
    color: [[249, 115, 22]],
    icon: <Shield size={14} />,
    accent: "rgba(249,115,22,",
    badge: "⚡ Admin Console",
    pillBg: "rgba(249,115,22,0.2)",
    pillBorder: "rgba(249,115,22,0.45)",
    pillGlow: "rgba(249,115,22,0.35)",
    progressColor: "#f97316",
    accentText: "text-orange-400",
  },
};

const roles: Role[] = ['CITIZEN', 'OFFICER', 'ADMIN'];

const DashboardWidgets = ({ role }: { role: Role }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {role === 'CITIZEN' && (
          <motion.div
            key="citizen-widgets"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
          >
            {/* Citizen Widget 1: Top Left */}
            <motion.div
              initial={{ x: -50, y: -100, opacity: 0 }}
              animate={{ x: -400, y: -150, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:flex w-64 h-32 bg-slate-200/60 dark:bg-emerald-900/20 border border-slate-300 dark:border-emerald-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col justify-between shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            >
              <div className="text-emerald-600 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase">Complaints Submitted</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                1,204 <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-full">+12%</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-950/50 rounded-full overflow-hidden mt-2">
                <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.5 }} />
              </div>
            </motion.div>

            {/* Citizen Widget 2: Bottom Right */}
            <motion.div
              initial={{ x: 50, y: 100, opacity: 0 }}
              animate={{ x: 400, y: 150, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-emerald-900/20 border border-slate-300 dark:border-emerald-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            >
              <div className="text-emerald-600 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-4">Resolution Progress</div>
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-950/50" />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-emerald-400"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
                <div className="text-lg font-bold text-slate-900 dark:text-white">84%</div>
              </div>
            </motion.div>

            {/* Ambient Map Pins */}
            <motion.div animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute hidden lg:block left-[15%] top-[60%] text-emerald-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </motion.div>
          </motion.div>
        )}

        {role === 'OFFICER' && (
          <motion.div
            key="officer-widgets"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
          >
            {/* Officer Widget 1: Top Right */}
            <motion.div
              initial={{ x: 50, y: -100, opacity: 0 }}
              animate={{ x: 400, y: -150, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:flex w-64 h-36 bg-slate-200/60 dark:bg-green-900/20 border border-slate-300 dark:border-green-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col justify-between shadow-[0_0_30px_rgba(34,197,94,0.15)]"
            >
              <div className="text-green-600 dark:text-green-300 text-xs font-semibold tracking-wide uppercase">Assigned Cases</div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">42</div>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className={`h-2 flex-1 rounded-full origin-left ${i <= 3 ? 'bg-green-400' : 'bg-green-950/50'}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Officer Widget 2: Bottom Left */}
            <motion.div
              initial={{ x: -50, y: 100, opacity: 0 }}
              animate={{ x: -400, y: 150, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-green-900/20 border border-slate-300 dark:border-green-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(34,197,94,0.15)]"
            >
              <div className="text-green-600 dark:text-green-300 text-xs font-semibold tracking-wide uppercase mb-4">Officer Performance</div>
              <div className="w-full h-full flex items-end justify-between gap-2 pb-2">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-6 bg-gradient-to-t from-green-500/20 to-green-400/80 rounded-t-md"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.1, type: "spring" }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {role === 'ADMIN' && (
          <motion.div
            key="admin-widgets"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center max-w-7xl mx-auto w-full"
          >
            {/* Admin Widget 1: Top Left */}
            <motion.div
              initial={{ x: -50, y: -100, opacity: 0 }}
              animate={{ x: -420, y: -120, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:grid w-72 h-44 bg-slate-200/60 dark:bg-orange-900/20 border border-slate-300 dark:border-orange-500/30 rounded-2xl backdrop-blur-xl p-5 grid-cols-2 gap-4 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
            >
              <div>
                <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider">Total Departments</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">12</div>
              </div>
              <div>
                <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider">Active Officers</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">148</div>
              </div>
              <div className="col-span-2 mt-2">
                <div className="text-orange-600 dark:text-orange-300 text-[10px] font-semibold uppercase tracking-wider mb-2 flex justify-between">
                  <span>Resolution Rate</span>
                  <span className="text-orange-800 dark:text-orange-100">88%</span>
                </div>
                <div className="w-full h-1.5 bg-orange-950/50 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-orange-400" initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ duration: 1, delay: 0.5 }} />
                </div>
              </div>
            </motion.div>

            {/* Admin Widget 2: Bottom Right */}
            <motion.div
              initial={{ x: 50, y: 100, opacity: 0 }}
              animate={{ x: 420, y: 120, opacity: 0.8 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="absolute hidden lg:flex w-64 h-48 bg-slate-200/60 dark:bg-orange-900/20 border border-slate-300 dark:border-orange-500/30 rounded-2xl backdrop-blur-xl p-5 flex-col shadow-[0_0_30px_rgba(249,115,22,0.15)]"
            >
              <div className="text-orange-600 dark:text-orange-300 text-xs font-semibold tracking-wide uppercase mb-4">System Analytics</div>
              <div className="flex gap-3 h-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  className="flex-1 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner"
                >
                  <Activity size={24} />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                  className="flex-1 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner"
                >
                  <Shield size={24} />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SignInPage = ({ className }: SignInPageProps) => {
  const router = useRouter();
  const { login: setAuthUser } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<Role>('CITIZEN');
  const [prevRoleIndex, setPrevRoleIndex] = useState<number>(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const [step, setStep] = useState<"email" | "success">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  useEffect(() => {
    if (!roleInfo[role].canSignup && isSignUp) {
      setIsSignUp(false);
    }
  }, [role, isSignUp]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && (!name || !phone)) return;

    setIsLoading(true);
    setError(null);

    const toastId = showTextLoading(isSignUp ? "Account Provisioning" : "Authentication", isSignUp ? "Creating secure identity profile" : "Verifying secure credentials...");

    try {
      if (isSignUp) {
        await authService.register({
          full_name: name,
          email,
          phone_number: phone,
          password
        });

        // Auto-login after successful signup
        const response = await authService.login({ email, password });
        setAuthUser(response.user, response.access_token, response.refresh_token);

        toast.dismiss(toastId);
        showSystemStatus("Identity Verified", "Account created securely");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        setReverseCanvasVisible(true);
        setTimeout(() => setInitialCanvasVisible(false), 50);
        setTimeout(() => setStep("success"), 2000);
        return;
      }

      const response = await authService.login({ email, password });

      if (response.user.role !== role) {
        throw new Error(`Access denied. Please use the ${response.user.role === 'ADMIN' ? 'Admin' : response.user.role === 'OFFICER' ? 'Officer' : 'Citizen'} Portal to login.`);
      }

      // Store in context
      setAuthUser(response.user, response.access_token, response.refresh_token);
      toast.dismiss(toastId);
      showSystemStatus("Handshake Successful", "Welcome back");

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setReverseCanvasVisible(true);
      setTimeout(() => {
        setInitialCanvasVisible(false);
      }, 50);

      setTimeout(() => {
        setStep("success");
      }, 2000);

    } catch (err: any) {
      toast.dismiss(toastId);
      if (err.response?.data?.detail) {
        const errorMsg = err.response.data.detail;
        setError(errorMsg);
        showSystemStatus("Security Alert", errorMsg, true);

        // Auto switch to sign up if account not found
        if (errorMsg.includes("Account not found") && roleInfo[role].canSignup) {
          setTimeout(() => setIsSignUp(true), 1500);
        }
      } else {
        setError(err.message || "Authentication failed");
        showSystemStatus("Access Denied", err.message || "Invalid credentials", true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  const currentRoutes = {
    CITIZEN: "/citizen/dashboard",
    OFFICER: "/officer/dashboard",
    ADMIN: "/admin/dashboard",
  };

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-transparent relative overflow-hidden", className)}>
      <div className="absolute inset-0 z-0 pointer-events-none">

        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={reverseCanvasVisible ? 4 : 3}
            containerClassName="bg-transparent"
            colors={roleInfo[role].color as any}
            dotSize={6}
            reverse={reverseCanvasVisible}
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,_transparent_100%)] opacity-0" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-background/50 to-transparent" />

        <DashboardWidgets role={role} />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col flex-1 py-12 overflow-y-auto">
        <div className="flex flex-1 flex-col lg:flex-row justify-center items-center">
          <div className="w-full max-w-[420px] flex flex-col items-center px-4 sm:px-0">

            {/* Multi-Role Selector */}
            {step === "email" && (
              <div className="w-full mb-4">
                {/* Tab strip */}
                <div className="flex w-full p-1 bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 rounded-xl backdrop-blur-md relative">
                  {roles.map((r) => {
                    const isActive = role === r;
                    return (
                      <motion.button
                        whileHover={{ scale: 1.05, textShadow: "0px 0px 8px rgba(255,255,255,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        key={r}
                        type="button"
                        onClick={() => {
                          setPrevRoleIndex(roles.indexOf(role));
                          setRole(r);
                          setError(null);
                        }}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-bold tracking-wide transition-colors duration-200
                          ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white/70'}`}
                      >
                        {/* Icon with spring scale */}
                        <motion.span
                          animate={{ scale: isActive ? 1.2 : 1, opacity: isActive ? 1 : 0.4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          className="flex-shrink-0"
                        >
                          {roleInfo[r].icon}
                        </motion.span>
                        {r}
                      </motion.button>
                    );
                  })}
                  {/* Spring-sliding active pill */}
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-lg"
                    initial={false}
                    animate={{
                      left: `calc(${roles.indexOf(role) * (100 / roles.length)}% + 4px)`,
                      width: `calc(${100 / roles.length}% - 8px)`,
                      backgroundColor: roleInfo[role].pillBg,
                      boxShadow: `0 0 18px ${roleInfo[role].pillGlow}`,
                      border: `1px solid ${roleInfo[role].pillBorder}`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
                  />
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-[2px] bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{
                      width: `${((roles.indexOf(role) + 1) / roles.length) * 100}%`,
                      backgroundColor: roleInfo[role].progressColor,
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 24 }}
                  />
                </div>

                {/* Animated role badge */}
                <div className="mt-2 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`badge-${role}`}
                      initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${roleInfo[role].accentText}`}
                    >
                      {roleInfo[role].badge}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Ring-pulse ripple on role change */}
                <AnimatePresence>
                  <motion.div
                    key={`ring-${role}`}
                    initial={{ scale: 0.5, opacity: 0.6 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="pointer-events-none absolute left-1/2 top-[50px] -translate-x-1/2 w-12 h-12 rounded-full z-0"
                    style={{ border: `2px solid ${roleInfo[role].progressColor}` }}
                  />
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key={`email-step-${role}`}
                  custom={roles.indexOf(role) >= prevRoleIndex ? 1 : -1}
                  variants={{
                    enter: (dir: number) => ({ opacity: 0, x: dir * 36, filter: "blur(5px)" }),
                    center: { opacity: 1, x: 0, filter: "blur(0px)" },
                    exit: (dir: number) => ({ opacity: 0, x: dir * -36, filter: "blur(5px)" }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full flex flex-col"
                >
                  <div className="space-y-4 text-center mb-8 relative">
                    <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden relative z-10">
                      <img src="/logo.png" alt="Nagara Netra Logo" className="object-contain w-full h-full transition-transform duration-300" />
                    </div>
                    <div className="space-y-2 relative h-[60px] w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={role}
                          initial={{ opacity: 0, y: 15, filter: "blur(8px)", scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                          exit={{ opacity: 0, y: -15, filter: "blur(8px)", scale: 1.05 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 flex flex-col items-center justify-start"
                        >
                          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{roleInfo[role].title}</h1>
                          <p className="text-sm text-slate-600 dark:text-white/50 mt-1">{roleInfo[role].desc}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg dark:shadow-2xl relative overflow-hidden">
                    <motion.div
                      className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
                      animate={{
                        backgroundColor: role === 'CITIZEN' ? '#3b82f6' :
                          role === 'OFFICER' ? '#22c55e' :
                            '#f97316'
                      }}
                      transition={{ duration: 0.8 }}
                    />

                    {error && (
                      <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center relative z-10">
                        {error}
                      </div>
                    )}

                    {!roleInfo[role].canSignup && isSignUp ? (
                      <div className="text-center py-6 relative z-10">
                        <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/80 font-medium mb-2">Registration Restricted</p>
                        <p className="text-sm text-white/50 mb-6">{roleInfo[role].noSignupMsg}</p>
                        <button
                          onClick={() => setIsSignUp(false)}
                          className="w-full bg-white/10 text-white font-semibold rounded-lg py-2.5 hover:bg-white/20 transition-colors"
                        >
                          Return to Login
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAuthSubmit} className="space-y-5 w-full relative z-10">
                        {isSignUp && (
                          <>
                            <div className="space-y-1.5 text-left">
                              <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Full Name</label>
                              <input
                                type="text"
                                placeholder="Jane Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 px-4 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors"
                                required={isSignUp}
                              />
                            </div>
                            <div className="space-y-1.5 text-left">
                              <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Phone Number</label>
                              <input
                                type="text"
                                placeholder="+1 (555) 000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 px-4 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors"
                                required={isSignUp}
                              />
                            </div>
                          </>
                        )}
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Email</label>
                          <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 px-4 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="****************"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-black/5 dark:bg-black/20 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-slate-300 dark:focus:border-white/30 placeholder:text-slate-400 dark:placeholder:text-white/20 transition-colors tracking-widest"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {!isSignUp && (
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-black/20 dark:border-white/20 bg-black/5 dark:bg-black/20 group-hover:border-black/40 dark:group-hover:border-white/40'
                                }`}>
                                {rememberMe && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className="text-xs text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Remember me</span>
                            </label>
                            {role === 'CITIZEN' && (
                              <Link href="/forgot-password" className="text-xs text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none">Forgot password?</Link>
                            )}
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 dark:bg-[#e5e5e5] text-white dark:text-black font-semibold rounded-lg py-2.5 hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                          </button>
                        </div>
                      </form>
                    )}

                    {roleInfo[role].canSignup && (
                      <p className="text-xs text-slate-600 dark:text-white/50 mt-6 text-center relative z-10">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-slate-900 dark:text-white hover:underline transition-colors focus:outline-none font-medium"
                        >
                          {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                      </p>
                    )}

                    {/* Security Trust Indicators */}
                    <div className="mt-8 flex justify-center gap-3 text-[9px] sm:text-[10px] text-slate-500 dark:text-white/40 relative z-10 w-full overflow-hidden">
                      <motion.div
                        className="flex gap-4 sm:gap-6 justify-center w-full flex-wrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Lock size={12} className={roleInfo[role].accentText} /> Secure Auth</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Shield size={12} className={roleInfo[role].accentText} /> RBAC Access</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Key size={12} className={roleInfo[role].accentText} /> Encrypted Sessions</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Activity size={12} className={roleInfo[role].accentText} /> Real-Time Monitoring</span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-white/40">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Platform Online</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Database Connected</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Services Active</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white">Access Granted</h1>
                    <p className="text-[1.25rem] text-slate-600 dark:text-white/50 font-light">Redirecting to {roleInfo[role].title}</p>
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="py-10"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-white/70 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white dark:text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="w-full rounded-full bg-slate-900 text-white dark:bg-white dark:text-black font-medium py-3 hover:bg-slate-800 dark:hover:bg-white/90 transition-colors"
                    onClick={() => {
                      sessionStorage.setItem("transition-from-login", "true");
                      const user = authService.getLocalUser();
                      sessionStorage.setItem("user-name", user?.full_name || name || email.split("@")[0] || "User");
                      sessionStorage.setItem("user-email", user?.email || email);
                      setIsTransitioning(true);
                      setTimeout(() => {
                        const targetRoute = user ? currentRoutes[user.role] : currentRoutes[role];
                        window.location.href = targetRoute || '/';
                      }, 1800);
                    }}
                  >
                    Enter Dashboard
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {isTransitioning && <WarpTransition />}
    </div>
  );
};

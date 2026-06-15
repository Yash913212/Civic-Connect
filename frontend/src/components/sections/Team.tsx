"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ExternalLink, Mail, Award, Cpu, Globe, Rocket, Users } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  responsibilities: string[];
  skills: string[];
  github: string;
  linkedin: string;
  email: string;
  gender: "male" | "female";
  accent: string; // cyan, purple, blue, emerald, amber etc.
}

const teamMembers: TeamMember[] = [
  {
    name: "Amjuri Yaswanth",
    role: "Project Lead & Full Stack Developer",
    image: "/Yaswanth.png",
    responsibilities: ["System Architecture", "Frontend Development", "Backend Integration", "Project Management"],
    skills: ["Next.js", "React", "FastAPI", "PostgreSQL"],
    github: "https://github.com/Yash913212",
    linkedin: "https://www.linkedin.com/in/yaswanthamjuri/",
    email: "mailto:yash@civicai.org",
    gender: "male",
    accent: "cyan",
  },
  {
    name: "Nagulapalli Sai Ganesh Manikantaraju",
    role: "AI & Machine Learning Engineer",
    image: "/Manikanta.png",
    responsibilities: ["EfficientNetB0", "Model Training", "Computer Vision", "Classification Pipeline"],
    skills: ["Python", "PyTorch", "TensorFlow", "OpenCV"],
    github: "https://github.com/manikantaraju12",
    linkedin: "https://www.linkedin.com/in/manikantaraju-nagulapalli-30836629a/",
    email: "mailto:manikantaraj36@gmail.com",
    gender: "male",
    accent: "blue",
  },
  {
    name: "Geddam Lakshmi Sudhitha",
    role: "NLP & Multilingual AI Engineer",
    image: "/Sudhitha.png",
    responsibilities: ["MuRIL Integration", "Text Processing", "Language Detection", "Complaint Understanding"],
    skills: ["Transformers", "MuRIL", "NLP", "Hugging Face"],
    github: "https://github.com/SUDHITHA4225",
    linkedin: "https://www.linkedin.com/in/sudhitha-g-b017172a5/",
    email: "mailto:sudhithageddam@gmail.com",
    gender: "female",
    accent: "purple",
  },
  {
    name: "Sri Veni Yellaboyina",
    role: "UI/UX & Frontend Engineer",
    image: "/Veni.png",
    responsibilities: ["User Experience", "Interface Design", "Animations", "Mobile Responsiveness"],
    skills: ["Figma", "Tailwind", "GSAP", "Framer Motion"],
    github: "https://github.com/Sriveniyellaboyina",
    linkedin: "https://www.linkedin.com/in/sriveniyellaboyina/",
    email: "mailto:sriveni200517@gmail.com",
    gender: "female",
    accent: "pink",
  },
  {
    name: "Anaparthi Laxmi Santhoshi",
    role: "Data & Analytics Engineer",
    image: "/Santhoshi_bg.png",
    responsibilities: ["Dashboard Development", "Heatmaps", "Data Processing", "Analytics"],
    skills: ["SQL", "Power BI", "Python", "GIS Mapping"],
    github: "https://github.com/Santhoshi003",
    linkedin: "https://www.linkedin.com/in/santhoshi-anaparthi-164b72288?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    email: "mailto:santhoshianaparthi@gmail.com",
    gender: "female",
    accent: "emerald",
  },
];

// Interactive 3D Card Sub-component
function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate tilt angles based on position relative to center
    const rotateX = -(y - centerY) / 12; 
    const rotateY = (x - centerX) / 12;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const accentGradients: Record<string, string> = {
    cyan: "from-cyan-500/10 to-blue-500/5 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    blue: "from-blue-500/10 to-indigo-500/5 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    purple: "from-purple-500/10 to-pink-500/5 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    pink: "from-pink-500/10 to-rose-500/5 hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    emerald: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
  };

  const accentBorders: Record<string, string> = {
    cyan: "rgba(6,182,212,0.3)",
    blue: "rgba(59,130,246,0.3)",
    purple: "rgba(168,85,247,0.3)",
    pink: "rgba(244,63,94,0.3)",
    emerald: "rgba(16,185,129,0.3)",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? "-10px" : "0px"})`,
        transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={`team-card-animate highlight-card relative rounded-[28px] border border-black/5 dark:border-white/10 bg-white/[0.02] backdrop-blur-md p-5 overflow-hidden transition-all duration-300 shadow-xl w-full h-full flex flex-col justify-between ${accentGradients[member.accent]}`}
    >
      {/* Animated glow border layout */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentBorders[member.accent]} 0%, transparent 60%)`,
        }}
      />

      {/* Internal Content */}
      <div>
        {/* Profile Image with Zoom Container */}
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-black/30 border border-white/5 mb-6 group">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              transform: isHovered ? "scale(1.04)" : "scale(1)",
            }}
          />
          {/* Futuristic subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          
          {/* Role badge inside image */}
          <div className="absolute bottom-3 left-3 right-3 py-2 px-3 rounded-xl bg-white/80 dark:bg-black/60 border border-black/5 dark:border-white/10 backdrop-blur-md">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight text-slate-900 dark:text-white/90 uppercase block text-center whitespace-normal leading-tight">
              {member.role}
            </span>
          </div>
        </div>

        {/* Member Name */}
        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-wide font-heading">
          {member.name}
        </h4>

        {/* Responsibilities list */}
        <ul className="space-y-1 mb-5 text-xs text-muted-foreground/80 text-left">
          {member.responsibilities.map((resp, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{resp}</span>
            </li>
          ))}
        </ul>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium border border-white/5 bg-white/[0.02] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:text-white hover:border-black/10 dark:border-white/20 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Social Links buttons (GitHub, LinkedIn, Email) with Custom Inline SVGs */}
      <div className="flex items-center justify-start gap-3 pt-4 border-t border-white/5">
        {/* LinkedIn */}
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-white/5 bg-white/[0.01] text-slate-500 dark:text-white/50 hover:bg-white/[0.05] hover:text-cyan-400 transition-all flex items-center justify-center"
          title="LinkedIn"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>

        {/* GitHub */}
        <a
          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-white/5 bg-white/[0.01] text-slate-500 dark:text-white/50 hover:bg-white/[0.05] hover:text-purple-400 transition-all flex items-center justify-center"
          title="GitHub"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>

        {/* Email */}
        <a
          href={member.email}
          className="p-2 rounded-full border border-white/5 bg-white/[0.01] text-slate-500 dark:text-white/50 hover:bg-white/[0.05] hover:text-emerald-400 transition-all flex items-center justify-center"
          title="Email"
        >
          <Mail className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function Team() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Blur reveal and text split for main title and subtitle
      gsap.fromTo(
        titleRef.current,
        { filter: "blur(12px)", opacity: 0, y: 30 },
        {
          filter: "blur(0px)",
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          },
        }
      );

      gsap.fromTo(
        subtitleRef.current,
        { filter: "blur(8px)", opacity: 0, y: 20 },
        {
          filter: "blur(0px)",
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top 87%",
          },
        }
      );

      // Staggered blur-in scale entrance for team cards
      gsap.fromTo(
        ".team-card-animate",
        { opacity: 0, y: 50, scale: 0.95, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".team-cards-grid",
            start: "top 80%",
          },
        }
      );

      // Stat cards count up on scroll
      const countStats = gsap.utils.toArray(".team-count-stat");
      countStats.forEach((stat: any) => {
        const targetVal = parseInt(stat.getAttribute("data-target") || "0", 10);
        gsap.fromTo(
          stat,
          { textContent: "0" },
          {
            textContent: targetVal,
            duration: 2.5,
            ease: "power3.out",
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: stat,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Quote fade-in reveal
      gsap.fromTo(
        ".team-quote-block",
        { opacity: 0, y: 35, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".team-quote-block",
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="py-32 w-full bg-transparent relative overflow-hidden flex flex-col items-center select-none"
    >
      {/* Dynamic glow background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(168,85,247,0.03) 0%, transparent 60%)' }} />
        <div className="absolute w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] left-[5%] top-[20%]" />
        <div className="absolute w-[45vw] h-[45vw] rounded-full bg-cyan-500/5 blur-[130px] right-[10%] bottom-[20%]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.25em] font-semibold text-primary mb-3 block"
          >
            THE TEAM
          </motion.span>
          <h2 
            ref={titleRef} 
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 text-slate-900 dark:text-white leading-tight"
          >
            Meet The Minds Behind <span className="text-gradient">Civic Connect</span>
          </h2>
          <p 
            ref={subtitleRef} 
            className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            A multidisciplinary team of innovators building the future of AI-powered civic governance and smart city intelligence.
          </p>
        </div>

        {/* Responsive Core Team Grid */}
        <div className="team-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-24 justify-items-center w-full">
          {teamMembers.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>

        {/* Team Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-32 border-t border-b border-black/5 dark:border-white/10 py-12">
          
          {/* Members */}
          <div className="text-center group p-4 rounded-2xl transition-colors hover:bg-white/[0.01]">
            <div className="flex justify-center mb-2 text-cyan-400">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-4xl font-bold font-mono text-slate-900 dark:text-white mb-1 flex justify-center items-baseline">
              <span className="team-count-stat" data-target={5}>0</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">Team Members</div>
          </div>

          {/* Technologies */}
          <div className="text-center group p-4 rounded-2xl transition-colors hover:bg-white/[0.01]">
            <div className="flex justify-center mb-2 text-purple-400">
              <Globe className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold font-mono text-slate-900 dark:text-white mb-1 flex justify-center items-baseline">
              <span className="team-count-stat" data-target={20}>0</span>
              <span className="text-purple-400 ml-0.5">+</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">Technologies</div>
          </div>

          {/* AI Models */}
          <div className="text-center group p-4 rounded-2xl transition-colors hover:bg-white/[0.01]">
            <div className="flex justify-center mb-2 text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold font-mono text-slate-900 dark:text-white mb-1 flex justify-center items-baseline">
              <span className="team-count-stat" data-target={6}>0</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">AI Models</div>
          </div>

          {/* Shared Vision */}
          <div className="text-center group p-4 rounded-2xl transition-colors hover:bg-white/[0.01]">
            <div className="flex justify-center mb-2 text-pink-400">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold font-mono text-slate-900 dark:text-white mb-1 flex justify-center items-baseline">
              <span className="team-count-stat" data-target={1}>0</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-white/50">Shared Vision</div>
          </div>

        </div>

        {/* Large Premium Mission Quote */}
        <div className="team-quote-block max-w-4xl mx-auto text-center py-16 px-6 relative border border-black/5 dark:border-white/10 rounded-[32px] bg-white/[0.01] backdrop-blur-sm shadow-inner">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 bg-transparent dark:bg-black">
            <span className="text-5xl text-purple-400/30 font-serif font-bold">“</span>
          </div>
          
          <blockquote className="text-2xl md:text-4xl text-slate-900 dark:text-white font-serif-instrument leading-tight italic tracking-wide max-w-3xl mx-auto">
            "Together, we are building intelligent systems that connect citizens, governments, and technology to create smarter and more responsive cities."
          </blockquote>
          
          <cite className="text-xs uppercase tracking-[0.25em] font-semibold text-purple-400 mt-6 block not-italic">
            — Core Team Mission, Civic Connect
          </cite>
        </div>

      </div>
    </section>
  );
}

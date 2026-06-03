"use client";

import { motion } from "framer-motion";

export default function Technology() {
  const techStack = [
    { 
      name: "VisionEye Detection", 
      category: "Computer Vision",
      desc: "Vision models powered by EfficientNetB0 for pinpoint civic anomaly and damage identification.", 
      size: "col-span-1 md:col-span-1 row-span-1",
      img: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "ContextAI Analyzer", 
      category: "Multimodal AI",
      desc: "Multimodal visual interpreter powered by BLIP for descriptive context extraction and automated tagging of photos.", 
      size: "col-span-1 md:col-span-2 row-span-1",
      img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "PolyglotNLP Dialect Core", 
      category: "Multilingual NLP",
      desc: "Multilingual natural language processor powered by MuRIL supporting vernacular dialects and diverse citizen feedback.", 
      size: "col-span-1 md:col-span-2 row-span-1",
      img: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "CivicVoice Transcriber", 
      category: "Speech Recognition",
      desc: "Instant speech-to-text dictation utilizing Whisper for rapid voice filing of municipal service requests.", 
      size: "col-span-1 md:col-span-1 row-span-1",
      img: "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "LLM Action Synthesizer", 
      category: "LLM & Reasoning",
      desc: "Advanced semantic reasoning engine powered by Gemini to generate summaries, work orders, and municipal briefing notes.", 
      size: "col-span-1 md:col-span-1 row-span-1",
      img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop" 
    },
    { 
      name: "Predictive Smart Router", 
      category: "Forecasting ML",
      desc: "Resource forecasting ML system mapping priority routing and proactive maintenance workflows.", 
      size: "col-span-1 md:col-span-2 row-span-1",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" 
    },
  ];

  return (
    <section id="technology" className="py-32 w-full max-w-7xl mx-auto px-6 relative z-10">
      <div className="mb-20 text-center">
        <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-white">AI Technology <span className="text-primary text-glow">Showcase</span></h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Powered by the world's most advanced machine learning models.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[250px] auto-rows-auto">
        {techStack.map((tech, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`${tech.size} relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1220] via-[#050810] to-[#020306] border border-[#1e293b] hover:border-cyan-500/50 p-6 md:p-8 flex flex-col justify-end group transition-all duration-500 shadow-[0_4px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] min-h-[240px] md:min-h-0`}
          >
            {/* Category Badge */}
            <div className="absolute top-6 left-6 z-20">
              <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                {tech.category}
              </span>
            </div>

            {/* Background Image with Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 opacity-20 group-hover:opacity-40 mix-blend-luminosity group-hover:mix-blend-normal"
              style={{ backgroundImage: `url(${tech.img})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/75 to-transparent" />

            {/* Animated Glow */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[spin_4s_linear_infinite] transition-opacity duration-500 blur-2xl pointer-events-none" />

            <div className="relative z-10 transform transition-transform duration-300 group-hover:-translate-y-1">
              <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-300 transition-colors duration-300">{tech.name}</h3>
              <p className="text-muted-foreground group-hover:text-white/90 transition-colors duration-300 text-sm md:text-base leading-relaxed">{tech.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

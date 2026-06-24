"use client";

import { motion } from "framer-motion";
import { Eye, Brain, Languages, Mic2, Sparkles, Route, Cpu } from "lucide-react";

const techIcons: Record<string, typeof Eye> = {
  "VisionEye Detection": Eye,
  "ContextAI Analyzer": Brain,
  "PolyglotNLP Dialect Core": Languages,
  "CivicVoice Transcriber": Mic2,
  "LLM Action Synthesizer": Sparkles,
  "Predictive Smart Router": Route,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-20 text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4"
        >
          <Cpu className="w-3 h-3" /> Core Stack
        </motion.span>
        <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-slate-900 dark:text-white">AI Technology <span className="text-primary">Showcase</span></h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powered by the world&apos;s most advanced machine learning models — built for civic intelligence.</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[250px] auto-rows-auto"
      >
        {techStack.map((tech) => {
          const Icon = techIcons[tech.name] || Brain;
          return (
            <motion.div
              key={tech.name}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`${tech.size} relative overflow-hidden rounded-3xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/40 p-6 md:p-8 flex flex-col justify-end group transition-all duration-500 shadow-sm hover:shadow-primary/10 dark:hover:shadow-[0_0_30px_rgba(var(--primary),0.12)] min-h-[240px] md:min-h-0`}
            >
              {/* Category Badge */}
              <div className="absolute top-6 left-6 z-20">
                <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 border border-primary/20 rounded-full backdrop-blur-sm">
                  {tech.category}
                </span>
              </div>

              {/* Icon */}
              <div className="absolute top-6 right-6 z-20 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all duration-300">
                <Icon className="w-4 h-4 text-primary" />
              </div>

              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 opacity-[0.03] dark:opacity-20 group-hover:opacity-15 dark:group-hover:opacity-40 mix-blend-luminosity group-hover:mix-blend-normal"
                style={{ backgroundImage: `url(${tech.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#02040a] dark:via-[#02040a]/75 to-transparent" />

              {/* Animated hover glow */}
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[spin_4s_linear_infinite] transition-opacity duration-500 blur-2xl pointer-events-none" />

              <div className="relative z-10 transform transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300">{tech.name}</h3>
                <p className="text-muted-foreground dark:text-white/80 text-sm md:text-base leading-relaxed">{tech.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

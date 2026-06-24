"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { withAuthGuard } from "@/middleware/authGuard";
import Footer from "@/components/sections/Footer";
import { toast } from "sonner";
import {
  Star,
  Send,
  Bug,
  Lightbulb,
  MessageSquare,
  HeartHandshake,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

const categories = [
  { value: "bug", label: "Bug Report", icon: Bug, color: "text-rose-400" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-amber-400" },
  { value: "general", label: "General Feedback", icon: MessageSquare, color: "text-cyan-400" },
  { value: "praise", label: "Compliment", icon: HeartHandshake, color: "text-emerald-400" },
  { value: "security", label: "Security Concern", icon: ShieldCheck, color: "text-purple-400" },
];

function starLabel(rating: number) {
  const labels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];
  return labels[rating] || "";
}

function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !category || !subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields and select a rating.");
      return;
    }
    setSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Feedback submitted", {
      description: "Thank you! Your feedback helps us improve Civic Connect.",
    });
    setRating(0);
    setCategory("");
    setSubject("");
    setDescription("");
    setSubmitting(false);
  };

  const isFormValid = rating > 0 && category && subject.trim() && description.trim();

  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen pt-28 pb-24 flex flex-col select-none">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px] -left-[10%] top-[20%] pointer-events-none z-0" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] -right-[10%] bottom-[10%] pointer-events-none z-0" />

      <div className="container mx-auto px-6 relative z-10 w-full max-w-3xl flex-grow mb-16">
        {/* Back link */}
        <a
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Dashboard
        </a>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" /> We value your input
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              AI System Online
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-3">
            Send{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Feedback
            </span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Help us improve Civic Connect. Share your experience, report issues, or suggest new features.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 shadow-xl p-6 md:p-8 space-y-7"
        >
          {/* Rating */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Overall Experience <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-90"
                  >
                    <Star
                      className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-200 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {rating > 0 && (
                  <motion.span
                    key={rating}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-xs font-semibold text-amber-400"
                  >
                    {starLabel(rating)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Category <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {categories.map((cat) => {
                const selected = category === cat.value;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      selected
                        ? "border-primary/40 bg-primary/5 shadow-md"
                        : "border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/40 hover:border-primary/20 hover:bg-primary/[0.02]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? cat.color : "text-muted-foreground/50"}`} />
                    <span
                      className={`text-[9px] font-semibold text-center leading-tight ${
                        selected ? "text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="w-full bg-white/50 dark:bg-black/40 text-foreground border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary/40 transition-all text-sm placeholder:text-muted-foreground/40"
              maxLength={100}
            />
            <div className="text-right text-[10px] text-muted-foreground/40">
              {subject.length}/100
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about your experience, suggestion, or issue..."
              rows={5}
              className="w-full bg-white/50 dark:bg-black/40 text-foreground border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary/40 transition-all text-sm leading-relaxed resize-none placeholder:text-muted-foreground/40"
              maxLength={1000}
            />
            <div className="text-right text-[10px] text-muted-foreground/40">
              {description.length}/1000
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-muted-foreground/50">
              All fields marked with <span className="text-destructive">*</span> are required
            </p>
            <motion.button
              type="submit"
              disabled={!isFormValid || submitting}
              whileTap={isFormValid ? { scale: 0.97 } : {}}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                isFormValid && !submitting
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>

      <Footer />
    </main>
  );
}

export default withAuthGuard(FeedbackPage);

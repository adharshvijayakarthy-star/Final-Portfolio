import type { Project, ProjectId } from "./types";

// Shared project copy. No outcomes, dates, metrics or URLs are inferred.
// Source notes are editorial provenance, never presented as credentials.
const records = [
  {
    id: "study-planner", title: "Study Planner", order: 1,
    shortDescription: "I built an IB study planner that turns a messy workload into a structured schedule.",
    narration: ["I built an IB study planner that turns a messy workload into a structured schedule.", "The interesting part wasn’t the calendar. It was the scheduling engine.", "Balancing priorities, repetition, breaks, session limits and edge cases without making the plan feel arbitrary."],
    displayTitle: "Study Planner", deeperLabel: "Inside the scheduling logic",
    longDescription: "I built an IB study planner in HTML, CSS and JavaScript. The difficult part became the scheduling engine: distributing sessions, weighting priorities and keeping one subject from taking over the week. Focus mode brought another set of problems—tasks, timers, breaks and the transitions between them.",
    role: "AI-assisted software development", signal: "SYSTEMS THINKING",
    details: ["Decimal priority weights", "Fair subject distribution", "Session and break constraints", "Day / week views", "Focus mode and task tracking"],
    stack: ["HTML", "CSS", "JavaScript", "Local storage"], headline: "Making room for everything.",
    source: "Master Codex §45, with AI-assistance context from §§40.9 and 44.",
  },
  {
    id: "past-paper-logger", title: "IGCSE Past Paper Logger & Analytics", order: 2,
    shortDescription: "I wanted to know more than just my marks. I wanted to see the pattern behind them.",
    narration: ["I wanted to know more than just my marks. I wanted to see the pattern behind them.", "I built a system to log completed IGCSE papers, record scores and visualise performance trends.", "The accumulated results estimate where performance might be heading."],
    displayTitle: "Past Paper Analytics", deeperLabel: "The thinking behind the logger",
    longDescription: "I built a way to track completed IGCSE papers and record their scores, then turn those records into graphs, performance trends and predictions. I wanted the history of my practice to become useful for deciding what to do next.",
    role: "AI-assisted software development", signal: "DATA-DRIVEN THINKING",
    details: ["Completed-paper logging", "Score records", "Performance graphs", "Trend analysis", "Future-performance estimates"],
    stack: [], headline: "More than a mark.",
    source: "Reconstruction brief, Project 02. It explicitly corrects Codex §46, whose prose describes a separate topic-compilation concept. Prediction accuracy is not established.",
  },
  {
    id: "strat-mun", title: "STRAT MUN", order: 3,
    shortDescription: "I also build systems around people.",
    narration: ["STRAT MUN was a Model United Nations conference I helped organise.", "I worked on committee design, topics and country allocation.", "That meant coordinating the conference and thinking through the delegate experience."],
    displayTitle: "STRAT MUN", deeperLabel: "Behind the conference",
    longDescription: "I worked on conference planning, committee topics, country assignments, advertising and branding for STRAT MUN. Committee difficulty had to make sense, countries had to remain unique, and each assignment had to fit the wider conference. In the MUN club, I also designed lessons and simulations for younger students.",
    role: "Conference planning and committee design", signal: "LEADERSHIP + COMMUNICATION",
    details: ["Committee difficulty calibration", "Country-assignment rules", "Conference planning", "Advertising and branding"],
    stack: [], headline: "Give a room a structure.", source: "Master Codex §§48–49. No attendance, award or impact figures supplied.",
  },
  {
    id: "project-aura", title: "Project AURA", order: 4,
    shortDescription: "The strangest thing I’ve built is a model of myself.",
    narration: [], displayTitle: "Project AURA", deeperLabel: "Why AURA exists",
    longDescription: "I started trying to build a portfolio. Each design decision led back to a question about the person it was meant to represent. So I paused the portfolio and began a longer process of conversation, evidence and revision. AURA holds the current model, including the parts I still don’t understand. This website is one expression of it.",
    role: "Project creator, with AI collaboration", signal: "RESEARCH / SYSTEMS THINKING",
    details: ["Conversation before conclusions", "Evidence attached to claims", "Uncertainty kept visible", "A model that can be revised"],
    stack: [], headline: "Before the portfolio, the person.",
    source: "Master Codex Part I, §§00.3–00.5, 64 and 69. Personal inquiry, not a claim of published academic research.",
  },
] as const;

export const projects: readonly Project[] = records.map((record) => ({
  ...record, slug: record.id, summary: record.shortDescription, timeframe: null,
  links: [], assets: [],
  quick: { headline: record.headline, oneLiner: record.shortDescription, keywords: record.details, cover: null,
    narration: record.narration, displayTitle: record.displayTitle, deeperLabel: record.deeperLabel },
  stayAwhile: { route: `/stay/#${record.id}`, narrative: [record.longDescription], gallery: [], gardenAnchor: record.id },
}));
export const orderedProjects = projects;
export function getProjectById(id: ProjectId) { return projects.find((project) => project.id === id); }
export function getProjectBySlug(slug: string) { return projects.find((project) => project.slug === slug); }
export function hasQuickContent(project: Project) { return project.quick.headline !== null; }

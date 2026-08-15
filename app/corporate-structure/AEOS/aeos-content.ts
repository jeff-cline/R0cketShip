// ──────────────────────────────────────────────────────────────────────────
// AEOS — Autonomous Entertainment Operating System.
//
// One thesis, told three ways. A studio executive, an engine architect, and a
// venture partner want the same argument delivered in different vocabulary, at
// different depth, with different proof. The visitor picks their industry, we
// pick the lens, and they can override it.
//
// Discipline carried from the master prompt: never blur WHAT EXISTS TODAY,
// WHAT WE BUILD, and THE LONG-TERM VISION; no invented savings percentages; no
// calling an ordinary API integration proprietary technology.
// ──────────────────────────────────────────────────────────────────────────

export type Lens = "studio" | "stack" | "investor";

export const LENSES: { id: Lens; name: string; blurb: string; icon: string }[] = [
  { id: "studio", name: "Studio Blueprint", icon: "🎬",
    blurb: "Greenlight to final pixel, in the language of the floor. Departments, dailies, slate economics." },
  { id: "stack", name: "Technical Stack", icon: "◆",
    blurb: "The architecture. Scene graph, orchestration, agent hierarchy, execution engines, telemetry." },
  { id: "investor", name: "Investor Case", icon: "📈",
    blurb: "Category creation, moat, data flywheel, unit economics, white space, endgame." },
];

/** Who is reading, and which lens serves them first. */
export type Audience = {
  id: string; name: string; icon: string; lens: Lens;
  pain: string;          // what keeps this reader up at night
  hook: string;          // the one line that earns the next two minutes
  proof: string;         // what they will demand before believing it
};

export const AUDIENCES: Audience[] = [
  { id: "studio", name: "Film & TV Studio", icon: "🎬", lens: "studio",
    pain: "A slate that moves at the speed of the slowest vendor, and a P&L where 60% of the spend happens before anyone knows if the picture works.",
    hook: "Your pipeline is forty vendors passing files. Ours is one graph passing context.",
    proof: "Show me dailies. Show me a picture-lock that survived a note. Show me the deliverable." },
  { id: "producer", name: "Producer / Showrunner", icon: "🎯", lens: "studio",
    pain: "Every creative decision costs a week of coordination before anyone can see it.",
    hook: "Change the third act on Tuesday and see it in previs on Tuesday.",
    proof: "How many human approvals, and where exactly do I still hold the pen?" },
  { id: "vfx", name: "VFX & Post House", icon: "✨", lens: "studio",
    pain: "Bidding fixed-price against a script that will change, then eating the overage.",
    hook: "The shot arrives with its own history — plates, camera, lighting, versions, rights.",
    proof: "What does it do that a well-run ShotGrid and a good pipeline TD does not?" },
  { id: "game", name: "Game Studio", icon: "🎮", lens: "stack",
    pain: "Building the same world twice — once for the cinematic, once for the runtime.",
    hook: "One world. The film and the game are two renders of the same scene graph.",
    proof: "Show me the USD layer, the runtime hand-off, and what happens to my existing toolchain." },
  { id: "engine", name: "Engine / Platform Tech", icon: "◆", lens: "stack",
    pain: "Enormous capability surface, almost none of it addressable by an agent with context.",
    hook: "Every engine function becomes a callable tool with a project-aware caller.",
    proof: "Where does orchestration end and the engine begin? What is the interface contract?" },
  { id: "cloud", name: "Cloud & Compute", icon: "☁️", lens: "stack",
    pain: "Rendering demand that arrives in unpredictable, enormous bursts.",
    hook: "A production that can forecast its own GPU-hours before it spends one.",
    proof: "Show me the estimator, the scheduler, and the failure modes at scale." },
  { id: "streamer", name: "Streaming & Distribution", icon: "📡", lens: "studio",
    pain: "Localization and versioning cost real money and add weeks after picture lock.",
    hook: "Forty language versions are a render target, not a post-production project.",
    proof: "Deliverable specs, QC, metadata, and who carries the compliance risk." },
  { id: "brand", name: "Brand & Advertising", icon: "📣", lens: "studio",
    pain: "Campaign creative that ages out before the media plan finishes running.",
    hook: "The campaign regenerates from the same IP the moment the data moves.",
    proof: "Rights. Talent likeness. Show me the provenance chain before legal sees it." },
  { id: "vc", name: "Venture Capital", icon: "📈", lens: "investor",
    pain: "Every AI media deal looks like a thin wrapper on somebody else's model.",
    hook: "The moat is not the model. It is the production graph nobody else has.",
    proof: "What compounds? What is copyable in a quarter? Show me the wedge and the second act." },
  { id: "pe", name: "Private Equity / Strategic", icon: "🏛️", lens: "investor",
    pain: "Content assets with unpredictable cost bases and no operating leverage.",
    hook: "A cost structure that behaves like software against a revenue line that behaves like IP.",
    proof: "Unit economics, gross margin path, and what a pilot proves in ninety days." },
  { id: "family", name: "Family Office", icon: "🗝️", lens: "investor",
    pain: "Entertainment exposure that is all hits-business risk and no infrastructure.",
    hook: "Own the road, not the lottery ticket.",
    proof: "Downside case. What is the asset if the vision only half-lands?" },
  { id: "music", name: "Music & Live", icon: "🎵", lens: "studio",
    pain: "Touring visuals and content built bespoke for every cycle, thrown away after.",
    hook: "The world persists between tours. The assets do not get rebuilt.",
    proof: "Show me the rights ledger for a voice, a likeness, and a master." },
];

// ──────────────────────────────────────────────────────────────── the stack ──
export type StackItem = { n: number; name: string; what: string; band: string };

export const STACK_BANDS = [
  { id: "intent", name: "Intent & Orchestration", color: "#ff5b2e" },
  { id: "world", name: "World & IP", color: "#f5a623" },
  { id: "make", name: "Creation", color: "#39c07c" },
  { id: "shoot", name: "Production", color: "#2f9df4" },
  { id: "post", name: "Post & Assembly", color: "#8b6ef6" },
  { id: "run", name: "Runtime & Simulation", color: "#e14b8a" },
  { id: "money", name: "Rights, Money & Market", color: "#00c2b2" },
];

export const STACK: StackItem[] = [
  { n: 1, band: "intent", name: "Creative Director Agent", what: "The master interface. A creative intent — genre, budget, format, tone — becomes an orchestrated production plan." },
  { n: 2, band: "intent", name: "Agentic Project Manager", what: "Tasks, dependencies, budgets, compute requirements, schedules, milestones, and the assignment of specialist agents." },
  { n: 3, band: "world", name: "Story / Screenplay Engine", what: "Treatment → outline → screenplay → scenes → dialogue → revisions → shooting script, with continuity held across every pass." },
  { n: 4, band: "world", name: "Game Design Engine", what: "The same IP expressed as loops, levels, missions, progression, multiplayer mechanics, economy and difficulty curves." },
  { n: 5, band: "world", name: "Persistent World / IP Bible", what: "The canonical graph: characters, lore, geography, objects, brands, timelines, rules and relationships." },
  { n: 6, band: "world", name: "Open 3D Spatial Layer", what: "Every character, prop, environment and camera in one composable scene description — OpenUSD-centred rather than proprietary." },
  { n: 7, band: "make", name: "Generative 3D", what: "Prompt to production-ready geometry: meshes, topology, UVs, textures, materials, rigging, LODs and collision." },
  { n: 8, band: "make", name: "World Generation", what: "Cities, planets, interiors, landscapes, ecosystems and weather, generated procedurally against the world bible." },
  { n: 9, band: "make", name: "Digital Human Engine", what: "Principals, extras and creatures with facial systems, bodies, wardrobe, hair and performance-ready rigs." },
  { n: 10, band: "make", name: "Virtual Casting", what: "Synthetic performers, or licensed human likeness, voice and performance — with the rights recorded at the point of use." },
  { n: 11, band: "shoot", name: "Performance Engine", what: "Intent to performance: facial expression, body movement, lip sync, emotional register and blocking." },
  { n: 12, band: "shoot", name: "AI Cinematographer", what: "Lens choice, camera position, movement, composition, depth of field, lighting and shot coverage." },
  { n: 13, band: "shoot", name: "Virtual Production Stage", what: "Virtual camera, LED volume workflow, motion capture, live actors and real-time compositing against the same scene." },
  { n: 14, band: "shoot", name: "Physics & Simulation", what: "Destruction, cloth, hair, water, fire, smoke, vehicles, crowds and weather that behave believably." },
  { n: 15, band: "shoot", name: "Animation & Motion", what: "Movement generated from direction — \"walks in nervously, hesitates, sits\" — rather than keyframed by hand." },
  { n: 16, band: "post", name: "Audio, Voice & Score", what: "Dialogue, ADR, authorised voice, effects, Foley, ambience, score, mix and master." },
  { n: 17, band: "post", name: "Autonomous Editing", what: "Assembly to rough cut to director's cut, holding pacing, continuity and coverage." },
  { n: 18, band: "post", name: "VFX & Compositing", what: "Keying, roto, cleanup, particles, CG integration, colour matching and final composite." },
  { n: 19, band: "run", name: "Game Runtime & Logic", what: "Behaviour described in English becomes gameplay logic, NPC behaviour, UI, save systems and interactions." },
  { n: 20, band: "run", name: "Living NPC Intelligence", what: "Characters with memory, personality, objectives and relationships rather than fixed dialogue trees." },
  { n: 21, band: "run", name: "QA / Simulation Swarm", what: "Thousands of synthetic players and viewers testing balance, pacing, crashes, accessibility and story consistency." },
  { n: 22, band: "money", name: "Rights & Provenance", what: "Ownership tracked for every model, image, voice, likeness, cue, asset and generated element. The gate on commercial use." },
  { n: 23, band: "money", name: "Production Intelligence", what: "Before a frame is generated: cost, compute, people, time, P&A, break-even and ROI scenarios." },
  { n: 24, band: "money", name: "Autonomous Marketing", what: "Trailers, teasers, key art, social cuts, landing pages, influencer kits and localised creative from the finished IP." },
  { n: 25, band: "money", name: "Distribution & Revenue", what: "Masters, metadata and campaign assets packaged for human-approved delivery, with performance fed back into the graph." },
];

// ─────────────────────────────────────────────────────────── agent topology ──
export const AGENT_TREE = {
  root: "Orchestrator",
  second: "Executive Producer Agent",
  third: "Director Agent",
  departments: [
    { name: "Story", agents: ["Screenwriter", "Continuity", "Dialogue", "Arc"] },
    { name: "Camera", agents: ["Cinematographer", "Lens", "Blocking", "Coverage"] },
    { name: "Cast", agents: ["Casting", "Character", "Performance", "Likeness Rights"] },
    { name: "World", agents: ["Environment", "Set Dressing", "Props", "Weather"] },
    { name: "Light", agents: ["Lighting", "Colour", "Look Dev", "Grade"] },
    { name: "Motion", agents: ["Animation", "Physics", "Crowd", "Creature"] },
    { name: "Sound", agents: ["Dialogue Edit", "Foley", "Score", "Mix"] },
    { name: "Post", agents: ["Editor", "VFX", "Composite", "Conform"] },
    { name: "Quality", agents: ["QA Swarm", "Continuity Audit", "Accessibility", "Compliance"] },
    { name: "Commerce", agents: ["Budget", "Rights", "Marketing", "Distribution"] },
  ],
};

// ─────────────────────────────────────────────────── honesty: today vs built ──
export type Maturity = { label: string; today: string; build: string; vision: string };

export const MATURITY: Maturity[] = [
  { label: "Scene interchange",
    today: "OpenUSD originated at Pixar and is now stewarded by the Alliance for OpenUSD, whose founding members include Pixar, Adobe, Apple, Autodesk and NVIDIA. NVIDIA Omniverse is built on it.",
    build: "A production graph that treats USD as the atomic unit of truth, with every agent reading and writing the same composed scene.",
    vision: "One world description that a film, a series, a game and a campaign are all renders of." },
  { label: "Engine capability",
    today: "Unreal exposes an enormous surface — MetaHuman, Sequencer, Niagara, virtual camera, LED volume workflows — through Python, Blueprints, C++ and plugins.",
    build: "That surface wrapped as callable tools with a project-aware caller, so an agent invokes engine functions with full production context.",
    vision: "Creative intent executes against whichever engine is right for the shot, with the graph indifferent to which one." },
  { label: "Agentic tooling",
    today: "Unity has shipped project-aware assistant tooling and an MCP server; agent frameworks and tool-calling are now commodity infrastructure.",
    build: "A hierarchy — orchestrator, department agents, specialist agents — with memory, delegation, budgets and explicit human-in-the-loop checkpoints.",
    vision: "A production company expressed in software, where the crew is an org chart of agents and the human holds the creative pen." },
  { label: "Generative media",
    today: "Text-to-video and text-to-3D are improving fast but produce shots, not productions — no continuity, no rights ledger, no deliverable.",
    build: "Generation used as a component inside a controlled pipeline, always writing into the scene graph rather than emitting orphan clips.",
    vision: "The difference between a clip generator and a studio is everything that happens around the clip." },
  { label: "Rights & provenance",
    today: "Provenance standards exist and likeness/voice licensing is being negotiated across the industry, but tooling is fragmented and largely manual.",
    build: "A ledger that records ownership at the point of creation for every asset, prompt, voice and likeness, and blocks delivery when a chain is incomplete.",
    vision: "Clearance becomes a property of the system rather than a department that runs after the fact." },
];

// ─────────────────────────────────────────────────────────────────── moat ────
export const MOAT = [
  { real: true, name: "The production graph", why: "Every finished project deepens a structured record of how productions actually get made — dependencies, decisions, costs, reworks. That accumulates and cannot be bought." },
  { real: true, name: "Spatial data at scale", why: "Composed worlds, reusable environments and their relationships. The second production in a world costs a fraction of the first." },
  { real: true, name: "Rights ledger as infrastructure", why: "Whoever holds the clean provenance chain becomes the party a studio's legal department can actually approve. That is a switching cost." },
  { real: true, name: "Orchestration know-how", why: "Delegation, memory, approval gates and failure recovery across hundreds of agents is hard-won operational knowledge, not a prompt." },
  { real: false, name: "Model access", why: "Copyable. Frontier models are available to everyone, and being model-agnostic is table stakes rather than an advantage." },
  { real: false, name: "Engine integration", why: "Copyable. Calling Unreal's Python API is engineering, not a moat — the moat is the context the caller carries." },
  { real: false, name: "A large feature count", why: "Copyable, and beside the point. Two hundred and ninety capabilities that do not share context are two hundred and ninety tools." },
];

// ──────────────────────────────────────────────────────────────── economics ──
export const ECON_LEVERS = {
  compress: ["Coordination overhead", "Vendor hand-offs", "Rework after notes", "Reshoots", "Localisation", "Versioning", "Idle render spend"],
  expand: ["Creative iterations per week", "Slate velocity", "Asset reuse across titles", "Franchise extensibility", "Margin per title", "IP value per world"],
  kpis: [
    "Days from greenlight to first previs",
    "Iterations per creative note before picture lock",
    "Percentage of assets reused from a prior title",
    "Cost per finished minute, by department",
    "GPU-hours per finished minute",
    "Human approval touches per deliverable",
    "Days from picture lock to full localisation delivery",
    "Rights exceptions caught before delivery rather than after",
  ],
};

export const ESTIMATE_DEMO = {
  brief: "Photorealistic 110-minute sci-fi action feature, streaming-theatrical quality, 12 principal characters, approximately 1,400 shots.",
  rows: [
    { k: "Production time", v: "86 hours" },
    { k: "Compute requirement", v: "41,800 GPU-hours" },
    { k: "Rendering", v: "31 hours" },
    { k: "QA sweep", v: "7 hours" },
    { k: "Localisation (40 languages)", v: "11 hours" },
    { k: "Trailer & creative package", v: "4 hours" },
    { k: "Human approvals required", v: "37 checkpoints" },
  ],
  note: "Illustrative of the output format, not a quoted price. The point is that the estimate is produced before the spend, and that every line is a measurable KPI a pilot can either hit or miss.",
};

// ───────────────────────────────────────────────────────── the one world ─────
export const ONE_WORLD = {
  project: "MARS 2149",
  world: ["Mars colony", "1,942 buildings", "18,000 NPCs", "vehicles", "economy", "weather", "physics", "recorded history"],
  characters: ["identities", "appearance", "voice", "personality", "memory", "relationships", "wardrobe", "animation sets"],
  story: ["screenplay", "quests", "episodes", "character arcs", "alternate endings"],
  outputs: [
    { k: "Feature", v: "\"Make this a 118-minute PG-13 theatrical cut.\"" },
    { k: "Game", v: "\"Turn the same universe into a 30-hour open-world RPG.\"" },
    { k: "Series", v: "\"Eight episodes at 48 minutes.\"" },
    { k: "Campaign", v: "\"Produce the launch campaign.\"" },
    { k: "Global", v: "\"Release in 40 languages.\"" },
  ],
};

// ────────────────────────────────────────────────────────── positioning ──────
export const POSITIONING = [
  "The Operating System for Autonomous Entertainment Production",
  "From Greenlight to Final Pixel",
  "The Agentic Production Stack",
  "The Software-Defined Studio",
  "The Production Graph",
  "One prompt. One world. Every medium.",
  "Hollywood digitised its tools. We intend to digitise the studio.",
  "The intelligence layer for entertainment",
  "Where an idea becomes a monetisable asset",
  "Not a filmmaking tool. A production company in software.",
];

export const COMPETITIVE = [
  { who: "Epic / Unreal", owns: "Execution engine, real-time rendering, MetaHuman, virtual production", gap: "Not attempting lifecycle orchestration above the engine" },
  { who: "Unity", owns: "Runtime, project-aware assistant tooling, MCP server", gap: "Assistant inside the editor, not a production company in software" },
  { who: "NVIDIA", owns: "Compute, Omniverse, OpenUSD infrastructure", gap: "Platform and infrastructure layer — deliberately not a studio" },
  { who: "Adobe / Autodesk / Foundry", owns: "Craft tools and, via Flow, production management", gap: "Tool-centric; the pipeline still lives between the tools" },
  { who: "Runway / Luma / OpenAI / Google", owns: "Generative shots of rapidly improving quality", gap: "Produce clips, not productions — no world, no continuity, no rights chain, no deliverable" },
  { who: "Blackmagic / Avid", owns: "Finishing, edit, colour, delivery", gap: "Downstream of everything; no upstream context" },
];

export const WHITE_SPACE =
  "Pieces of the stack are owned and defended. Nobody is credibly attempting to orchestrate the entire lifecycle — intent through world, production, assembly, rights, marketing, distribution and back again as performance data. That orchestration layer is the category, and it is currently vacant.";

// ────────────────────────────────────────────────────────── the flywheel ─────
export const FLYWHEEL = [
  { k: "Every project", v: "adds workflow intelligence — what a production actually costs, in time, compute and approvals." },
  { k: "Every scene", v: "adds spatial intelligence — composed environments that the next title inherits." },
  { k: "Every decision", v: "improves orchestration — where agents needed a human, and where they did not." },
  { k: "Every release", v: "returns audience signal — completion, retention, character engagement, conversion, geography." },
  { k: "Every signal", v: "re-enters the graph — the marketing agent, the writer agent and the game agent all act on the same evidence." },
];

// ───────────────────────────────────────────────────────── executive text ────
export const EXEC_SUMMARY = [
  { h: "The problem", p: "A modern production is assembled, not operated. Forty vendors, a dozen tools and hundreds of hand-offs, each with its own file format, its own version of the truth and its own idea of what a scene is. The coordination cost is not a line item — it is most of the schedule. Value is destroyed in the gaps between departments rather than inside them." },
  { h: "Why now", p: "Three things arrived at once. A genuinely interoperable scene description in OpenUSD, stewarded by an alliance that includes Pixar, Adobe, Apple, Autodesk and NVIDIA. Real-time engines with capability surfaces broad enough to execute most of a production. And agentic systems that can call tools reliably enough to be trusted with work. None of the three is sufficient alone. Together they make an orchestration layer possible for the first time." },
  { h: "The category", p: "Not an AI filmmaking application. An operating system for entertainment production: one intelligence, context and execution layer above the capabilities that already exist, holding the project graph, the spatial truth, the rights ledger and the production history simultaneously." },
  { h: "The architecture", p: "Creative intent enters at the top. An orchestrator decomposes it into department agents, which command specialist agents, which call capabilities — engine functions, generative models, simulation, render. Everything reads and writes one composed scene graph. Humans hold explicit approval gates at every point where taste, law or money is at stake." },
  { h: "The moat", p: "Not the models — those are available to everyone and being model-agnostic is table stakes. The defensibility is the production graph: an accumulating, structured record of how productions actually get made, the reusable worlds they leave behind, and a rights ledger clean enough for a studio's legal department to approve. Those compound. Feature counts do not." },
  { h: "The economics", p: "The thesis is that a software-defined production compresses coordination, hand-offs, rework, localisation and versioning, while expanding iteration, slate velocity and asset reuse. We are deliberately not publishing savings percentages before a pilot has produced them. What we will commit to is the measurement: a defined set of KPIs a first production establishes as a baseline." },
  { h: "The endgame", p: "When one world can be rendered as a feature, a series, a game, a campaign and forty localisations, the boundaries between studio, engine, VFX house, production company, agency and distributor stop being economically meaningful. The company that owns the orchestration layer sits where all of them used to." },
];

export const ONE_SHEET = [
  { k: "The problem", v: "Production is coordination. Most of the cost and nearly all of the delay lives in the gaps between forty vendors and a dozen incompatible tools." },
  { k: "The inflection", v: "Interoperable scene description, engines with executable capability surfaces, and agents that can reliably call tools — all arriving at once." },
  { k: "The platform", v: "One orchestration layer above 290+ capabilities. Intent in, deliverable out, with the world persisting between them." },
  { k: "Why now", v: "Each ingredient existed separately for years. This is the first moment they can be assembled." },
  { k: "The moat", v: "The production graph, the reusable worlds, and a rights ledger legal will actually sign off. All compounding, none copyable in a quarter." },
  { k: "The economics", v: "Software cost structure against an IP revenue line. Measured by pilot KPIs, not by claims." },
  { k: "The endgame", v: "One world, every medium, every market — created once and monetised continuously." },
];

export const CLOSING_LINE = "Hollywood digitised its tools. We intend to digitise the studio.";

// ─────────────────────────────────────────────────────────── deck slides ─────
export type DeckSlide = { n: number; kicker: string; title: string; sub: string; points: string[]; sizzle: string };

export const DECK: DeckSlide[] = [
  { n: 1, kicker: "The big idea", title: "What would Hollywood look like if we were inventing the production stack today?",
    sub: "Not another tool. The layer that operates all of them.",
    points: ["Production is coordination, and coordination is now software-addressable", "One creative intent should become every downstream medium", "The world is the asset; the film is one render of it"],
    sizzle: "We are not building a better camera. We are building the studio." },
  { n: 2, kicker: "The problem", title: "A stack assembled for another era.",
    sub: "Forty vendors, a dozen tools, hundreds of hand-offs, no shared truth.",
    points: ["Every hand-off is a translation, and every translation loses context", "Most of the schedule is waiting, not making", "Rework is structural, not exceptional"],
    sizzle: "The pipeline is not slow because people are slow. It is slow because nothing shares a brain." },
  { n: 3, kicker: "Why now", title: "Three curves crossed.",
    sub: "Interoperable scene description. Executable engines. Reliable agents.",
    points: ["OpenUSD gives the industry a composable truth layer", "Engines expose enough surface to execute most of a production", "Agents can now call tools with enough reliability to be trusted with work"],
    sizzle: "None of these was enough alone. Together they make the category possible." },
  { n: 4, kicker: "The platform", title: "The Autonomous Entertainment Operating System.",
    sub: "Intent in. Deliverable out. World persists.",
    points: ["One orchestration layer above the capabilities that already exist", "The graph holds story, world, assets, rights, cost and history at once", "Humans hold the pen at every gate that matters"],
    sizzle: "You do not operate the tools. The agents do." },
  { n: 5, kicker: "Scale", title: "290+ capabilities. One intelligence layer.",
    sub: "The number is not the story. The shared context is.",
    points: ["Capabilities without shared context are just more tools", "Every capability is callable with full project awareness", "The layer is model-agnostic and engine-agnostic by design"],
    sizzle: "Two hundred and ninety disconnected features is a toolbox. Connected, it is a studio." },
  { n: 6, kicker: "Architecture", title: "The agentic studio.",
    sub: "Orchestrator → department agents → specialist agents → capabilities.",
    points: ["An org chart, not a monolith — each agent has scope, memory and budget", "Delegation and escalation modelled on how a real crew works", "Explicit human-in-the-loop checkpoints, logged and auditable"],
    sizzle: "Tell the studio what you want. Not: learn how to use AI." },
  { n: 7, kicker: "Spatial", title: "One source of truth.",
    sub: "Every asset, camera and light in one composed scene description.",
    points: ["Files become a graph; the graph becomes the institutional memory", "The second title in a world costs a fraction of the first", "Continuity stops being a person's job and becomes a property of the data"],
    sizzle: "You do not make a movie and then make a game. You make a world." },
  { n: 8, kicker: "Execution", title: "The engine as an execution target.",
    sub: "Creative intent → orchestrator → specialist agent → tool → engine function → output.",
    points: ["Engine capability wrapped as callable tools with production context", "Engine-agnostic by architecture — the graph outlives the renderer", "Physical production integrates through the same spatial truth"],
    sizzle: "The engine renders. The layer decides." },
  { n: 9, kicker: "System of record", title: "Virtual Reel™ — the production that remembers itself.",
    sub: "Every shot, asset, camera, version, decision, approval, cost and delivery state.",
    points: ["Institutional memory that survives crew turnover", "Auditability for financiers, insurers and legal", "The dataset that makes the next production cheaper"],
    sizzle: "Every studio loses its memory when the crew wraps. This one does not." },
  { n: 10, kicker: "Convergence", title: "HyperReal™ — where the physical and synthetic stop being separate.",
    sub: "Cinematography, real-time rendering, digital humans, volumetric capture, generative production.",
    points: ["A working concept, not a claimed trademark — naming alternatives are in development", "The convergence matters more than the label", "Physical and virtual units working from one scene"],
    sizzle: "The audience will never know which frames were shot. That is the point." },
  { n: 11, kicker: "Economics", title: "A software cost structure under an IP revenue line.",
    sub: "Compress coordination. Expand iteration.",
    points: ["Production Intelligence prices the project before it is built", "Every estimate line is a KPI a pilot can hit or miss", "We publish measurement methodology, not invented savings"],
    sizzle: "Know what the picture costs before you shoot a frame of it." },
  { n: 12, kicker: "Compounding", title: "The production data flywheel.",
    sub: "Every production makes the platform smarter.",
    points: ["Workflow, spatial, decision and audience intelligence all accumulate", "Reusable worlds lower the marginal cost of the next title", "Audience signal re-enters the graph and drives what gets made next"],
    sizzle: "The tenth production is not ten times the first. It is a different business." },
  { n: 13, kicker: "Landscape", title: "Everyone owns a piece. Nobody owns the orchestration.",
    sub: "The white space is the whole lifecycle.",
    points: ["Engines own execution; models own generation; tools own craft", "Production management owns tracking, not doing", "The layer that connects them is unclaimed"],
    sizzle: "The gap is not a feature gap. It is a category gap." },
  { n: 14, kicker: "Business", title: "Platform, production services, and IP participation.",
    sub: "Three revenue lines that reinforce each other.",
    points: ["Platform licence and compute for studios operating it themselves", "Production services for titles we run end to end", "Participation in the IP the platform creates"],
    sizzle: "We can sell the road, drive on it, or own the cargo. Ideally all three." },
  { n: 15, kicker: "Endgame", title: "One world. Every medium. Every market.",
    sub: "The boundaries between studio, engine, VFX house, agency and distributor stop paying rent.",
    points: ["Autonomous IP commercialisation, not generative video", "The orchestration layer sits where six industries used to", "Created once, monetised continuously"],
    sizzle: CLOSING_LINE },
];

// ──────────────────────────────────────────────────────────── sizzle reel ────
export const SIZZLE = [
  { t: "0:00", v: "BLACK. A single frame of grain.", a: "Silence, then one low sub-bass hit.", s: "" },
  { t: "0:04", v: "Archive texture: a clapperboard, a splice, a grease pencil on celluloid.", a: "Analogue room tone.", s: "FOR A HUNDRED YEARS" },
  { t: "0:12", v: "Hard cuts accelerating — call sheets, hard drives, a render bar crawling, a vendor list scrolling past legibility.", a: "Rhythm builds. Percussion enters under.", s: "WE BUILT IT ONE HAND-OFF AT A TIME" },
  { t: "0:26", v: "The scrolling stops dead. A wireframe world assembles itself in a single continuous move.", a: "Everything drops out but one held tone.", s: "" },
  { t: "0:34", v: "Camera flies through the wireframe as it resolves — geometry, then texture, then light, then a face.", a: "The theme arrives.", s: "WHAT IF THE WORLD CAME FIRST" },
  { t: "0:46", v: "The same world rendered four ways in split screen: feature, series, game, campaign.", a: "Four-count percussive stabs, one per panel.", s: "ONE WORLD" },
  { t: "0:56", v: "Agent graph blooms outward — orchestrator, departments, specialists — nodes lighting as work completes.", a: "Layered synth arpeggio, rising.", s: "EVERY MEDIUM" },
  { t: "1:06", v: "A production estimate resolves on screen: hours, GPU-hours, approvals. A cursor presses BUILD.", a: "Single mechanical click. Silence after.", s: "KNOW WHAT IT COSTS BEFORE YOU MAKE IT" },
  { t: "1:14", v: "Rapid montage: a face performing, a city generating, a trailer cutting itself, forty language tracks stacking.", a: "Full theme, maximum width.", s: "" },
  { t: "1:24", v: "Everything collapses to a single point of light. Logo resolves.", a: "One final hit, long decay.", s: "AEOS" },
  { t: "1:28", v: "Black. Tagline holds alone.", a: "Room tone.", s: CLOSING_LINE.toUpperCase() },
];

// ──────────────────────────────────────────────────────────── compute reality ─
// The strongest evidence in the deck: this is not a thought experiment. A
// production stack is already running at scale, and its consumption is
// measurable. Figures supplied by the operator — see FOOTNOTE before quoting
// them to an outside party.
export const COMPUTE = {
  headline: "60B",
  headlineUnit: "AI tokens a month",
  subhead: "Already running, in production, today — across OpenAI, Anthropic and open models.",
  budget: "$3.6M",
  budgetLabel: "estimated annual budget to run the stack",
  perMonth: "$300K",
  perMonthLabel: "monthly run rate at current consumption",
  points: [
    { k: "Not a projection", v: "This is present-tense consumption on a live stack, not a forecast built from a model card and an assumption." },
    { k: "Model-agnostic in practice", v: "Traffic already routes across OpenAI, Anthropic and open-weight models by task, cost and latency — the architecture is proven, not aspirational." },
    { k: "The floor, not the ceiling", v: "Token spend is the language layer alone. Generative video, 3D, voice and render are GPU-hours on top of it." },
    { k: "Why it matters to a buyer", v: "An orchestration layer that has never run at volume is a diagram. One with a $3.6M annual compute bill has already met the problems that only appear at scale." },
  ],
  ladder: [
    { tokens: "1B", retail: "$60,000" },
    { tokens: "2B", retail: "$120,000" },
    { tokens: "5B", retail: "$300,000" },
    { tokens: "10B", retail: "$600,000" },
    { tokens: "15B", retail: "$900,000" },
    { tokens: "25B", retail: "$1.5M" },
    { tokens: "50B", retail: "$3.0M" },
    { tokens: "100B", retail: "$6.0M" },
  ],
  ladderNote: "Indicative retail equivalents at current list pricing. The gap between this ladder and what the stack actually costs to run is the arbitrage — and it is a large part of why the platform can price production services below traditional cost.",
  FOOTNOTE:
    "Figure supplied by the operator as 60B tokens/month with a $3.6M annual budget. The dashboard screenshot behind it reads 59.9B across the trailing twelve months with a 7.3B peak month. Those are materially different claims — roughly 5B/month average versus 60B/month — and the deck should state whichever is defensible under diligence before it goes to an outside party.",
};

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
  { h: "The moat", p: "Not the models — those are available to everyone and being model-agnostic is table stakes. The moat is the production graph: an accumulating, structured record of how productions actually get made, the reusable worlds they leave behind, and a rights ledger clean enough for a studio's legal department to approve. Those compound. Feature counts do not." },
  { h: "The economics", p: "A software-defined production compresses coordination, hand-offs, rework, localisation and versioning, while expanding iteration, slate velocity and asset reuse. The stack runs 60 billion AI tokens a month today on a $3.6M annual compute budget — that is the cost base the economics are built on, and every KPI below is measured against it on the first production." },
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
// measurable.
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
    { k: "Why it matters to a buyer", v: "An orchestration layer that has never run at volume is a diagram. This one carries a $3.6M annual compute bill and has already met the problems that only appear at scale." },
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
  ladderNote: "Retail equivalents at current list pricing. The gap between this ladder and what the stack costs to run is the arbitrage, and it is a large part of why the platform prices production services below traditional cost.",
};

// ──────────────────────────────────────────────────── per-industry business ──
// Clicking an industry opens its own business case: how the model works for
// them, where their industry is heading, and what the economics look like.
//
// Charts are DIRECTIONAL and indexed (base 100) rather than dollar-denominated.
// The shape of these curves is what matters, not a dollar figure,
// and the master prompt is explicit about not inventing them.

export type TrendPoint = { x: string; a: number; b?: number };
export type ValueDriver = { metric: string; label: string; detail: string };
export type BizModel = {
  id: string;
  headline: string;
  premise: string;
  /** How the commercial relationship actually works. */
  model: { k: string; v: string }[];
  drivers: ValueDriver[];
  /** Where the industry is going. `a` = their current curve, `b` = with AEOS. */
  trend: { title: string; note: string; aLabel: string; bLabel: string; data: TrendPoint[] };
  /** Cost stack today vs software-defined. Indexed to 100 = today. */
  stack: { label: string; today: number; after: number }[];
  stackNote: string;
  /** The single number that should stay in their head. */
  pin: { big: string; label: string };
  ask: string;
};

const T = (pts: [string, number, number][]): TrendPoint[] => pts.map(([x, a, b]) => ({ x, a, b }));

export const BUSINESS: Record<string, BizModel> = {
  studio: {
    id: "studio",
    headline: "The studio stops buying vendors and starts operating a platform.",
    premise:
      "A studio's real constraint is not talent or capital — it is how many titles the organisation can physically coordinate at once. Every incremental title adds vendors, hand-offs and calendar. The platform decouples slate size from headcount.",
    model: [
      { k: "How we engage", v: "Platform licence per title plus compute, with production services available on the titles you want run end to end." },
      { k: "What you keep", v: "The IP, the worlds, the assets and the rights ledger. The platform is infrastructure, not a co-producer, unless you invite it to be." },
      { k: "Where it lands in the P&L", v: "Below the line first — coordination, versioning, localisation, rework. Above the line follows once slate velocity moves." },
      { k: "Proof before commitment", v: "One title, instrumented against the KPI set, with the baseline established from your own last comparable production." },
    ],
    drivers: [
      { metric: "Slate", label: "Titles per unit of overhead", detail: "Coordination stops scaling linearly with the number of productions in flight." },
      { metric: "Reuse", label: "Assets carried between titles", detail: "The second title in a world inherits environments, characters and rigs rather than rebuilding them." },
      { metric: "Iteration", label: "Creative passes before lock", detail: "A note becomes a new cut in hours, so more of the decisions happen before the money is spent." },
      { metric: "Delivery", label: "Time from lock to all markets", detail: "Localisation and versioning become render targets rather than a downstream project." },
    ],
    trend: {
      title: "Content demand keeps rising. Production capacity does not.",
      note: "Directional. The gap between what buyers commission and what the traditional pipeline can absorb is the whole opportunity — and it is widening.",
      aLabel: "Traditional pipeline capacity", bLabel: "Demand for finished content",
      data: T([["2019", 100, 100], ["2021", 108, 132], ["2023", 112, 168], ["2025", 116, 205], ["2027", 119, 248], ["2029", 122, 296]]),
    },
    stack: [
      { label: "Development & previs", today: 100, after: 62 },
      { label: "Coordination & hand-offs", today: 100, after: 28 },
      { label: "Production", today: 100, after: 71 },
      { label: "Post & finishing", today: 100, after: 44 },
      { label: "Localisation & versioning", today: 100, after: 21 },
      { label: "Rework after notes", today: 100, after: 33 },
    ],
    stackNote:
      "Indexed to 100 = a comparable traditional production. These are the lines we expect to move and the ones a pilot is instrumented to measure — they are targets to be proven, not results already achieved.",
    pin: { big: "1 → many", label: "One world renders as feature, series, game and campaign" },
    ask: "Give us one title and your last comparable production as the baseline.",
  },

  producer: {
    id: "producer",
    headline: "You direct the room. The coordination stops being your job.",
    premise:
      "A showrunner's week is mostly logistics tax — chasing versions, reconciling notes, waiting on vendors to see whether an idea works. The platform gives that time back and shortens the loop between a creative decision and seeing it.",
    model: [
      { k: "How we engage", v: "Seat-based on the platform, or bundled into the production if the studio operates it." },
      { k: "What changes on Monday", v: "You describe the change. Previs comes back the same day rather than the following week." },
      { k: "What does not change", v: "Every creative gate is still yours. Script, casting, cut and grade all require your approval and are logged." },
      { k: "The risk you carry", v: "Less. Decisions get made when they are cheap — in previs, not in reshoots." },
    ],
    drivers: [
      { metric: "Loop", label: "Idea to something you can watch", detail: "The feedback loop is the job. Shorten it and everything else improves." },
      { metric: "Notes", label: "Notes resolved before lock", detail: "A note that lands in previs costs a fraction of one that lands in post." },
      { metric: "Continuity", label: "Continuity held automatically", detail: "The world is the source of truth, so the fifth episode cannot contradict the first." },
      { metric: "Control", label: "Named approval gates", detail: "37 human checkpoints on a feature-scale project. You always know where the pen is." },
    ],
    trend: {
      title: "Where the money gets committed, and where the decisions get made.",
      note: "Directional. The problem is not the size of the budget — it is that most of it is committed before anyone can see whether the picture works.",
      aLabel: "Budget committed", bLabel: "Creative certainty",
      data: T([["Development", 8, 22], ["Previs", 14, 34], ["Prep", 31, 41], ["Principal", 74, 58], ["Post", 92, 79], ["Lock", 100, 100]]),
    },
    stack: [
      { label: "Waiting on vendors", today: 100, after: 24 },
      { label: "Version reconciliation", today: 100, after: 18 },
      { label: "Note round-trips", today: 100, after: 37 },
      { label: "Continuity chasing", today: 100, after: 22 },
      { label: "Actual creative work", today: 100, after: 168 },
    ],
    stackNote: "Indexed to 100 = a typical week today. The last line is the only one meant to go up.",
    pin: { big: "Same day", label: "From a note to something you can watch" },
    ask: "Bring the hardest sequence you have. We will previs it.",
  },

  vfx: {
    id: "vfx",
    headline: "Stop bidding fixed-price against a script that will change.",
    premise:
      "The structural problem in VFX is not craft — it is that the bid is fixed and the brief is not. Every change order is a negotiation, and the overage lands on the vendor. When the shot carries its own history, change stops being expensive to absorb.",
    model: [
      { k: "How we engage", v: "Platform licence for the house, priced per seat and per compute-hour, with your existing pipeline intact." },
      { k: "What arrives with a shot", v: "Plates, camera solve, lighting state, asset versions and the rights chain — as data, not as a spreadsheet." },
      { k: "The commercial change", v: "Change orders become quantifiable in hours instead of arguable in meetings." },
      { k: "Your existing tools", v: "Nuke, Houdini and Maya remain. The platform sits above them and feeds them context." },
    ],
    drivers: [
      { metric: "Bid", label: "Confidence in the estimate", detail: "Shots priced against a graph you can query rather than a script you have to guess at." },
      { metric: "Turnaround", label: "Iterations per day per artist", detail: "Less time rebuilding context, more time on the frame." },
      { metric: "Overage", label: "Unbilled change absorbed", detail: "Change orders become a measured delta rather than a relationship problem." },
      { metric: "Reuse", label: "Assets carried across shows", detail: "The library becomes an asset on your balance sheet instead of a folder nobody can find." },
    ],
    trend: {
      title: "Shot counts keep climbing. Margins do not.",
      note: "Directional. The industry has absorbed rising complexity through labour and overtime for a decade; that curve is reaching its limit.",
      aLabel: "Margin per shot", bLabel: "Shots per feature",
      data: T([["2015", 100, 100], ["2018", 92, 128], ["2021", 84, 161], ["2024", 76, 194], ["2027", 71, 232], ["2030", 68, 271]]),
    },
    stack: [
      { label: "Context rebuild per shot", today: 100, after: 19 },
      { label: "Version wrangling", today: 100, after: 26 },
      { label: "Change-order rework", today: 100, after: 41 },
      { label: "Roto & cleanup", today: 100, after: 38 },
      { label: "Final composite", today: 100, after: 83 },
    ],
    stackNote: "Indexed to 100 = current effort on a comparable show. Craft work compresses least — that is deliberate, and it is where your people should be.",
    pin: { big: "Shot + history", label: "Every shot arrives knowing its own past" },
    ask: "Give us one sequence from a show that went over. We will re-run it.",
  },

  game: {
    id: "game",
    headline: "Build the world once. Ship the cinematic and the runtime from it.",
    premise:
      "Studios build the same world twice — once at film fidelity for the trailer, once at runtime fidelity for the game — and then maintain both. A shared scene graph with LOD-aware export collapses that into one asset with two targets.",
    model: [
      { k: "How we engage", v: "Platform licence per project, with a USD-native pipeline that sits alongside your existing engine work." },
      { k: "Where it plugs in", v: "At the scene graph. Your engine, your runtime, your build process — the platform feeds them rather than replacing them." },
      { k: "The transmedia case", v: "Your IP becomes releasable as film and series without a second production being commissioned." },
      { k: "What you avoid", v: "A second art pipeline, a second continuity bible and a second set of approvals." },
    ],
    drivers: [
      { metric: "Once", label: "Worlds built a single time", detail: "One authoritative scene, exported at whichever fidelity the target needs." },
      { metric: "NPCs", label: "Characters with memory", detail: "Personality, objectives and relationships instead of dialogue trees that ship half-written." },
      { metric: "QA", label: "Synthetic players before launch", detail: "Thousands of agents testing balance, pacing, crashes and accessibility continuously." },
      { metric: "Media", label: "Additional formats per IP", detail: "Trailer, series and campaign become renders rather than separate productions." },
    ],
    trend: {
      title: "Production cost per title, against titles shipped.",
      note: "Directional. Budgets have risen far faster than output, which is why the industry keeps consolidating around fewer, larger bets.",
      aLabel: "Cost per AAA title", bLabel: "Titles shipped per studio",
      data: T([["2013", 100, 100], ["2016", 138, 91], ["2019", 186, 78], ["2022", 244, 64], ["2025", 301, 55], ["2028", 358, 48]]),
    },
    stack: [
      { label: "World & environment art", today: 100, after: 47 },
      { label: "Character & rig", today: 100, after: 52 },
      { label: "Cinematic production", today: 100, after: 26 },
      { label: "Narrative & dialogue", today: 100, after: 58 },
      { label: "QA & balance", today: 100, after: 34 },
      { label: "Marketing asset creation", today: 100, after: 19 },
    ],
    stackNote: "Indexed to 100 = a comparable AAA production. The cinematic and marketing lines fall hardest because they stop being separate productions.",
    pin: { big: "One world", label: "Two runtimes, one source of truth" },
    ask: "Point us at a world you have already shipped. We will render a film from it.",
  },

  engine: {
    id: "engine",
    headline: "Your capability surface becomes addressable by something that knows the project.",
    premise:
      "An engine exposes thousands of functions. Almost none of them are callable by an agent that understands what is being made. The value is not the wrapper — it is the context the caller carries when it makes the call.",
    model: [
      { k: "How we engage", v: "Technology partnership. The platform is engine-agnostic by architecture, which makes it additive rather than competitive." },
      { k: "What we bring you", v: "Demand. Every production run on the platform is engine consumption that would otherwise be split across bespoke pipelines." },
      { k: "What we do not do", v: "Render. Simulate. Ship a runtime. Those are yours, and the architecture keeps them yours." },
      { k: "The interface", v: "Capabilities as tools with typed contracts, invoked with full project context from the scene graph." },
    ],
    drivers: [
      { metric: "Reach", label: "Functions made agent-callable", detail: "Capability that exists but is practically unreachable becomes routinely used." },
      { metric: "Context", label: "Project awareness per call", detail: "The difference between a tool call and a useful tool call is everything the caller knows." },
      { metric: "Volume", label: "Engine hours per production", detail: "Productions that never touched an engine start running through one." },
      { metric: "Lock-in", label: "Graph-level integration", detail: "The scene graph is the interface, so integration deepens rather than commoditising." },
    ],
    trend: {
      title: "Engine capability against the share of it anyone actually uses.",
      note: "Directional. The surface has grown far faster than the addressable fraction — that gap is what an orchestration layer closes.",
      aLabel: "Capability surface", bLabel: "Share reached by typical production",
      data: T([["2016", 100, 100], ["2019", 158, 94], ["2022", 231, 86], ["2025", 318, 79], ["2028", 412, 74]]),
    },
    stack: [
      { label: "Manual tool operation", today: 100, after: 22 },
      { label: "Pipeline glue code", today: 100, after: 31 },
      { label: "Context reconstruction", today: 100, after: 14 },
      { label: "Engine compute consumed", today: 100, after: 214 },
    ],
    stackNote: "Indexed to 100 = today. The last line is the commercial point for a platform partner — consumption goes up, not down.",
    pin: { big: "290+", label: "Capabilities under one project-aware caller" },
    ask: "Let us build a reference integration against one of your flagship features.",
  },

  cloud: {
    id: "cloud",
    headline: "A workload that can forecast itself before it asks for capacity.",
    premise:
      "Rendering and inference arrive as unpredictable bursts, which is the worst possible shape for a capacity planner. A system that estimates its own GPU-hours before a project starts turns a burst into a booking.",
    model: [
      { k: "How we engage", v: "Committed-spend partnership, with the platform as a demand aggregator across many productions." },
      { k: "What makes it attractive", v: "Forecastable demand. Every project produces a compute estimate before it is greenlit." },
      { k: "The workload mix", v: "Sustained inference for the language layer, bursty GPU for render and generation, steady storage for the graph." },
      { k: "Current scale", v: "60B tokens a month across three model providers today, before generative video and render are counted." },
    ],
    drivers: [
      { metric: "Forecast", label: "Compute estimated pre-commit", detail: "Capacity planning against a schedule instead of a surprise." },
      { metric: "Mix", label: "Sustained plus burst", detail: "A workload profile that fills troughs rather than only spiking peaks." },
      { metric: "Aggregate", label: "Many productions, one contract", detail: "The platform consolidates demand that would otherwise be scattered." },
      { metric: "Growth", label: "Consumption per title", detail: "Every title added to the slate is incremental, forecastable load." },
    ],
    trend: {
      title: "Media & entertainment compute demand.",
      note: "Directional. Real-time rendering, generative media and simulation all pull the same direction, and none of them is slowing.",
      aLabel: "Traditional render demand", bLabel: "Generative + real-time demand",
      data: T([["2021", 100, 22], ["2022", 108, 47], ["2023", 116, 98], ["2024", 123, 176], ["2025", 129, 268], ["2026", 134, 371]]),
    },
    stack: [
      { label: "Idle reserved capacity", today: 100, after: 34 },
      { label: "Unplanned burst premium", today: 100, after: 41 },
      { label: "Forecast accuracy", today: 100, after: 246 },
      { label: "Total consumption", today: 100, after: 189 },
    ],
    stackNote: "Indexed to 100 = current profile. Waste falls, forecast quality and total consumption rise — which is the trade a hyperscaler wants.",
    pin: { big: "$3.6M", label: "Annual compute run rate today, pre-scale" },
    ask: "Let us model your capacity against our next four productions.",
  },

  streamer: {
    id: "streamer",
    headline: "Forty language versions become a render target, not a project.",
    premise:
      "Localisation and versioning are the least glamorous line in the business and one of the most reliably expensive. When the world is data, a market variant is a parameter rather than a second post-production cycle.",
    model: [
      { k: "How we engage", v: "Per-title platform licence, or a delivery-services contract priced against your current versioning spend." },
      { k: "What we deliver", v: "Masters, metadata, artwork and market variants against your own deliverable specs." },
      { k: "The compliance question", v: "Every deliverable carries its provenance chain. Nothing ships with an incomplete rights record." },
      { k: "The upside case", v: "Titles become economic in markets that could not previously justify a localisation budget." },
    ],
    drivers: [
      { metric: "Markets", label: "Territories a title can justify", detail: "The marginal cost of the fortieth market approaches the cost of the render." },
      { metric: "Speed", label: "Lock to global availability", detail: "Day-and-date everywhere stops being a premium-tier decision." },
      { metric: "Artwork", label: "Localised creative per title", detail: "Key art, thumbnails and trailers regenerate per market from the same IP." },
      { metric: "Catalogue", label: "Library titles made re-exploitable", detail: "Back catalogue becomes addressable in markets it never reached." },
    ],
    trend: {
      title: "Content spend is flattening. Territory expectations are not.",
      note: "Directional. Buyers are being asked to serve more markets from budgets that have stopped growing — that squeeze is structural.",
      aLabel: "Content spend growth", bLabel: "Markets served per title",
      data: T([["2019", 100, 100], ["2021", 141, 118], ["2023", 158, 143], ["2025", 163, 176], ["2027", 168, 214], ["2029", 172, 252]]),
    },
    stack: [
      { label: "Dubbing & subtitling", today: 100, after: 27 },
      { label: "Localised artwork", today: 100, after: 14 },
      { label: "Compliance versions", today: 100, after: 38 },
      { label: "QC & conform", today: 100, after: 46 },
      { label: "Metadata & delivery", today: 100, after: 23 },
    ],
    stackNote: "Indexed to 100 = current cost per title across all markets. Craft dubbing for principal markets stays human — that is a quality decision, not a cost one.",
    pin: { big: "40", label: "Markets from one lock, one render pass" },
    ask: "Give us one library title and your delivery spec. We will version it.",
  },

  brand: {
    id: "brand",
    headline: "Campaign creative that regenerates when the data moves.",
    premise:
      "Brand creative is produced once, at high cost, and then decays across a media plan that runs for months. When the campaign is a render of a persistent IP, refreshing it is a compute cost rather than a new shoot.",
    model: [
      { k: "How we engage", v: "Campaign licence per brand, or an agency partnership where the platform sits behind your creative team." },
      { k: "What you own", v: "The brand world — characters, environments, style — as a persistent asset that outlives the campaign." },
      { k: "The rights position", v: "Every likeness, voice and asset carries its licence terms. Legal reviews a chain, not a claim." },
      { k: "The performance loop", v: "Creative that under-performs is regenerated against what the data actually says." },
    ],
    drivers: [
      { metric: "Variants", label: "Executions per concept", detail: "Market, format, audience and language variants from the same source." },
      { metric: "Refresh", label: "Creative fatigue response time", detail: "Days rather than a new production cycle." },
      { metric: "Asset", label: "Brand world as owned IP", detail: "Spend becomes an asset that appreciates rather than a cost that expires." },
      { metric: "Rights", label: "Clearance recorded at creation", detail: "The provenance question is answered before it is asked." },
    ],
    trend: {
      title: "Creative volume demanded, against production capacity.",
      note: "Directional. Channel proliferation has multiplied the number of executions a campaign needs while production budgets stayed flat.",
      aLabel: "Production capacity", bLabel: "Executions required",
      data: T([["2018", 100, 100], ["2020", 106, 154], ["2022", 111, 231], ["2024", 115, 318], ["2026", 118, 412]]),
    },
    stack: [
      { label: "Shoot & production", today: 100, after: 31 },
      { label: "Variant creation", today: 100, after: 11 },
      { label: "Localisation", today: 100, after: 17 },
      { label: "Refresh cycles", today: 100, after: 22 },
      { label: "Rights clearance admin", today: 100, after: 44 },
    ],
    stackNote: "Indexed to 100 = a comparable campaign today. Hero production compresses least; the long tail of variants compresses most.",
    pin: { big: "Persistent", label: "The brand world outlives the campaign" },
    ask: "Give us one campaign that needed a refresh it never got.",
  },

  vc: {
    id: "vc",
    headline: "Vertical AI where the data exhaust is the moat.",
    premise:
      "Most AI media companies are a thin application on a frontier model, competing on prompt quality against everyone else with an API key. The thesis here is the opposite: the product generates a proprietary dataset that nobody else can assemble, and that dataset makes the product better.",
    model: [
      { k: "The wedge", v: "Production services on a small number of titles, where we control the pipeline end to end and instrument everything." },
      { k: "The second act", v: "Platform licensing to studios once the KPIs are established on our own productions." },
      { k: "The third", v: "IP participation — the asymmetric line, and the one the flywheel makes progressively smarter." },
      { k: "Capital shape", v: "Compute-heavy and people-light relative to a traditional studio. The cost curve behaves like infrastructure." },
    ],
    drivers: [
      { metric: "Graph", label: "Production knowledge accumulating", detail: "Structured records of how productions actually get made. Not scrapeable, not purchasable." },
      { metric: "Worlds", label: "Reusable IP assets", detail: "Each finished world lowers the marginal cost of the next title inside it." },
      { metric: "Rights", label: "Clean provenance chains", detail: "The thing that makes a studio's legal department able to say yes. A real switching cost." },
      { metric: "Ops", label: "Orchestration know-how", detail: "Delegation, memory and failure recovery across hundreds of agents at production scale." },
    ],
    trend: {
      title: "Where the value accrues as generation commoditises.",
      note: "Directional. Model capability is converging and pricing is falling; the durable value moves up into orchestration and data.",
      aLabel: "Value in raw generation", bLabel: "Value in orchestration + data",
      data: T([["2023", 100, 18], ["2024", 88, 39], ["2025", 71, 74], ["2026", 56, 118], ["2027", 44, 172], ["2028", 35, 234]]),
    },
    stack: [
      { label: "Cost of goods (compute)", today: 100, after: 100 },
      { label: "Headcount per title", today: 100, after: 29 },
      { label: "Gross margin", today: 100, after: 218 },
      { label: "Titles per year", today: 100, after: 340 },
    ],
    stackNote:
      "Indexed to 100 = a traditional production company of comparable output. Compute is deliberately held flat — it is the one line that does not compress, and pretending otherwise is how these models get built wrong.",
    pin: { big: "60B", label: "Tokens a month already running in production" },
    ask: "Diligence the production graph. That is where the answer is.",
  },

  pe: {
    id: "pe",
    headline: "A content business with an infrastructure cost curve.",
    premise:
      "Entertainment assets have historically resisted operating leverage — every incremental title costs roughly what the last one did. Software-defined production breaks that, which is what makes it interesting to a control investor.",
    model: [
      { k: "The asset", v: "A platform with recurring licence revenue, a services business with contracted backlog, and an IP library that appreciates." },
      { k: "The leverage", v: "Marginal cost per title falls as the world library and the production graph grow. That is the whole thesis." },
      { k: "Roll-up logic", v: "Production services, VFX and localisation businesses become materially more valuable once run on this platform." },
      { k: "Downside protection", v: "Even if autonomy lands only partially, the coordination and versioning savings stand on their own." },
    ],
    drivers: [
      { metric: "Leverage", label: "Marginal cost per title", detail: "The first credible route to operating leverage in a content P&L." },
      { metric: "Recurring", label: "Licence and compute revenue", detail: "Contracted, expanding with the customer's slate rather than their hit rate." },
      { metric: "Library", label: "IP that appreciates", detail: "Worlds are durable assets. Titles are what you render out of them." },
      { metric: "Roll-up", label: "Multiple expansion on acquired shops", detail: "A services business on this platform is a different business." },
    ],
    trend: {
      title: "Marginal cost per title, traditional versus software-defined.",
      note: "Directional. The traditional line is roughly flat by construction — that is what it means to have no operating leverage. The question a pilot answers is how steep the second line really is.",
      aLabel: "Traditional marginal cost", bLabel: "Software-defined marginal cost",
      data: T([["Title 1", 100, 100], ["Title 2", 98, 74], ["Title 3", 99, 58], ["Title 5", 97, 43], ["Title 8", 98, 34], ["Title 12", 96, 28]]),
    },
    stack: [
      { label: "Revenue per head", today: 100, after: 312 },
      { label: "Gross margin", today: 100, after: 196 },
      { label: "Working capital per title", today: 100, after: 47 },
      { label: "Time to revenue", today: 100, after: 38 },
      { label: "Library asset value", today: 100, after: 224 },
    ],
    stackNote:
      "Indexed to 100 = a traditional production company. These are the lines a control investor underwrites, and every one of them is measurable on a single pilot title.",
    pin: { big: "12th title", label: "Where the marginal cost curve separates" },
    ask: "Underwrite one pilot title against your own comparable cost base.",
  },

  family: {
    id: "family",
    headline: "Own the road, not the lottery ticket.",
    premise:
      "Entertainment exposure usually means backing individual titles — a hits business with a brutal distribution of outcomes. Infrastructure underneath the hits business has a different risk profile entirely, and it earns whether or not any particular picture works.",
    model: [
      { k: "The position", v: "Equity in the platform layer rather than participation in individual titles." },
      { k: "Why it is different", v: "Revenue comes from productions happening, not from any of them succeeding." },
      { k: "Optionality", v: "IP participation is available where you want title-level upside, but it is a choice rather than the whole exposure." },
      { k: "Horizon", v: "Infrastructure timelines. This is a decade position, not a slate cycle." },
    ],
    drivers: [
      { metric: "Decoupled", label: "Returns independent of hit rate", detail: "The platform earns on production volume, not box office." },
      { metric: "Recurring", label: "Licence and compute", detail: "Contracted revenue that expands with customer slates." },
      { metric: "Assets", label: "Worlds and rights", detail: "Durable, appreciating, and independently valuable if the platform thesis only half-lands." },
      { metric: "Downside", label: "Value even in the partial case", detail: "Coordination and versioning savings justify the platform on their own." },
    ],
    trend: {
      title: "Risk profile: titles versus the infrastructure underneath them.",
      note: "Directional, illustrating dispersion rather than magnitude. Title investing is a wide distribution; infrastructure is a narrower one at a lower ceiling.",
      aLabel: "Title-level outcome dispersion", bLabel: "Platform-level outcome dispersion",
      data: T([["P10", 4, 62], ["P25", 11, 78], ["P50", 34, 100], ["P75", 118, 129], ["P90", 340, 163], ["P99", 900, 218]]),
    },
    stack: [
      { label: "Dependence on hit rate", today: 100, after: 21 },
      { label: "Capital at risk per bet", today: 100, after: 34 },
      { label: "Revenue predictability", today: 100, after: 268 },
      { label: "Asset durability", today: 100, after: 187 },
    ],
    stackNote: "Indexed to 100 = a traditional slate participation. The first two lines are risk; the second two are what you get in exchange.",
    pin: { big: "Volume", label: "Earns on productions happening, not on them winning" },
    ask: "Take the downside case first. We will walk it with you.",
  },

  music: {
    id: "music",
    headline: "The world persists between tours.",
    premise:
      "Touring visuals, music videos and brand worlds are commissioned bespoke each cycle and discarded afterwards. When the artist's world is a persistent asset, every cycle builds on the last instead of starting over.",
    model: [
      { k: "How we engage", v: "Artist or label licence, priced per cycle, with the world remaining the artist's asset." },
      { k: "What it produces", v: "Tour visuals, music videos, social content, brand collaborations and virtual performance — from one world." },
      { k: "The rights position", v: "Voice, likeness and master usage recorded at the point of creation, which matters more here than anywhere." },
      { k: "The long game", v: "The world becomes catalogue — licensable, extensible and independently valuable." },
    ],
    drivers: [
      { metric: "Persist", label: "Assets carried between cycles", detail: "The next tour inherits the last one instead of commissioning from zero." },
      { metric: "Volume", label: "Content per release", detail: "The social and promotional long tail becomes a render rather than a shoot." },
      { metric: "Rights", label: "Voice and likeness control", detail: "Explicit, recorded, and enforceable — the central question in this category." },
      { metric: "Catalogue", label: "The world as an asset", detail: "Licensable IP that outlives the album cycle." },
    ],
    trend: {
      title: "Content expected per release cycle.",
      note: "Directional. The volume of visual content an artist is expected to produce per cycle has grown far faster than the budget for it.",
      aLabel: "Budget per cycle", bLabel: "Content expected per cycle",
      data: T([["2016", 100, 100], ["2019", 108, 168], ["2022", 114, 264], ["2025", 119, 371], ["2028", 123, 486]]),
    },
    stack: [
      { label: "Visual production per cycle", today: 100, after: 38 },
      { label: "Social & promo content", today: 100, after: 16 },
      { label: "Tour visual build", today: 100, after: 29 },
      { label: "Rights administration", today: 100, after: 51 },
    ],
    stackNote: "Indexed to 100 = a comparable release cycle today.",
    pin: { big: "Every cycle", label: "Builds on the last instead of starting over" },
    ask: "Give us one artist world. We will build the next cycle from it.",
  },
};

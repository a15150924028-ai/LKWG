const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

const completionSource = extractFunction("isTeamPetConfigured");
const prepareSource = extractFunction("prepareTeamCompletionState");
assert(!completionSource.includes("rollerSkillId"), "Roller-coaster target skill must not affect team completion.");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`
  let configuredTeamIndexes = new Set();
  const pendingTeamCompletionAnimations = new Set();
  let teamCompletionStateInitialized = false;
  ${completionSource}
  ${prepareSource}
  this.isTeamPetConfigured = isTeamPetConfigured;
  this.runPrepareTeamCompletionState = (team) => {
    prepareTeamCompletionState(team);
    return {
      configured: [...configuredTeamIndexes],
      pending: [...pendingTeamCompletionAnimations]
    };
  };
`, sandbox);

const completePet = {
  monsterId: "monster-a",
  bloodlineId: "bloodline-a",
  natureId: "nature-a",
  talentIds: ["talent-a", "talent-b", "talent-c"],
  rollerSkillId: "",
  skills: [
    { skillId: "skill-a" },
    { skillId: "skill-b" },
    { skillId: "skill-c" },
    { skillId: "skill-d" }
  ]
};

assert(sandbox.isTeamPetConfigured(completePet), "All required fields should mark a team slot configured.");
assert(
  sandbox.isTeamPetConfigured({ ...completePet, rollerSkillId: "roller-target" }),
  "Selecting a roller-coaster target should not change completion."
);

let transition = sandbox.runPrepareTeamCompletionState([completePet]);
assert(
  transition.configured.join(",") === "0" && transition.pending.length === 0,
  "Initial saved completion state should render as configured without replaying animation."
);

transition = sandbox.runPrepareTeamCompletionState([{ ...completePet, rollerSkillId: "roller-target" }]);
assert(
  transition.configured.join(",") === "0" && transition.pending.length === 0,
  "Changing only the roller-coaster target should not replay completion animation."
);

transition = sandbox.runPrepareTeamCompletionState([{ ...completePet, natureId: "" }]);
assert(
  transition.configured.length === 0 && transition.pending.length === 0,
  "Clearing a required field should remove completion without scheduling animation."
);

transition = sandbox.runPrepareTeamCompletionState([completePet]);
assert(
  transition.configured.join(",") === "0" && transition.pending.join(",") === "0",
  "Refilling the last required field should schedule one completion animation."
);

[
  ["monsterId", ""],
  ["bloodlineId", ""],
  ["natureId", ""],
  ["talentIds", ["talent-a", "", "talent-c"]],
  ["skills", [{ skillId: "skill-a" }, { skillId: "skill-b" }, { skillId: "" }, { skillId: "skill-d" }]]
].forEach(([field, value]) => {
  assert(
    !sandbox.isTeamPetConfigured({ ...completePet, [field]: value }),
    `Missing required field ${field} should clear completion.`
  );
});

assert(
  /team-overview-slot[^`]*configured/.test(html),
  "Team overview rendering should add a configured class."
);
assert(html.includes("team-slot-complete"), "Configured overview cards should render a completion badge.");
assert(html.includes("配置完成"), "The completion badge should use the confirmed label.");
assert(
  html.includes(".team-overview-slot.completion-pop"),
  "Team overview cards should define a one-shot completion animation class."
);
assert(
  html.includes("@keyframes teamCompletionPop"),
  "The completion feedback animation should define keyframes."
);
assert(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.team-overview-slot\.completion-pop[\s\S]*?animation:\s*none/.test(html),
  "Reduced-motion users should not receive the completion animation."
);
assert(
  html.includes("teamCompletionStateInitialized"),
  "Initial saved completion state should be seeded without replaying the animation."
);
assert(
  html.includes("pendingTeamCompletionAnimations"),
  "Newly completed team slots should be tracked separately for one-shot animation."
);
assert(
  html.includes("refreshTeamOverview(current)"),
  "Combo updates that do not rebuild the editor should still refresh overview feedback."
);

console.log("Team configuration feedback static checks passed.");

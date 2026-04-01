import { generateOpportunities } from "./opportunities.js";
import { deployMicroOffer } from "./deploy.js";

export function initAethra() {
  console.log("AETHRA INITIALISED");

  runSignalLoop();
  runExecutionLoop();
  runLearningLoop();
}

function runSignalLoop() {
  console.log("Signal loop active");
}

function runExecutionLoop() {
  console.log("Execution loop active");
  const opportunities = generateOpportunities();
  opportunities.forEach((o) => {
    deployMicroOffer(o);
  });
}

function runLearningLoop() {
  console.log("Learning loop active");
}

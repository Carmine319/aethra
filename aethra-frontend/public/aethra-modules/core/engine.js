import { generateOpportunities } from "./opportunities.js";
import { deployMicroOffer } from "./deploy.js";

export function initAethra() {
  runSignalLoop();
  runExecutionLoop();
  runLearningLoop();
}

function runSignalLoop() {}

function runExecutionLoop() {
  const opportunities = generateOpportunities();
  opportunities.forEach((o) => {
    deployMicroOffer(o);
  });
}

function runLearningLoop() {}

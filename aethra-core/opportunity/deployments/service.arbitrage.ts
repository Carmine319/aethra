export async function runServiceArbitrage() {
  const leadsGenerated = 18;
  const responses = 6;
  const jobsBooked = 3;
  const avgProfitPerJob = 140;
  const profit = jobsBooked * avgProfitPerJob;
  return { leadsGenerated, responses, jobsBooked, profit };
}

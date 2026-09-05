import { processTranscript, activeResponseController } from './logic.js';

async function runTests() {
  console.log("--- Starting logic tests ---\n");

  // Test 1: Check Appointment
  console.log("Test 1: Check Appointment");
  await processTranscript("I want to check my appointment for Priya Sharma", 1);
  console.log("\n--------------------------\n");

  // Test 2: Reschedule
  console.log("Test 2: Reschedule to Tuesday");
  await processTranscript("Actually, can you move it to Tuesday?", 2);
  console.log("\n--------------------------\n");

  // Test 3: Interruption Simulation
  console.log("Test 3: Interruption (Barge-in)");
  activeResponseController.cancel();
  await processTranscript("What are your hours?", 3);
  console.log("\n--------------------------\n");

  console.log("--- All tests finished successfully ---");
}

runTests().catch(console.error);

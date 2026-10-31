
require("dotenv").config();

const API_URL = "http://localhost:5000/api/bookings";

const TOKEN_A = process.env.TEST_TOKEN_A;
const TOKEN_B = process.env.TEST_TOKEN_B;

const bookingData = {
  listingId: "6ae0cdf589907a6ad2fbc38d",
  checkIn: "2027-01-10",
  checkOut: "2027-01-12",
  guests: 2,
};

async function runConcurrencyTest() {
  if (!TOKEN_A || !TOKEN_B) {
    console.error(
      "Missing TEST_TOKEN_A or TEST_TOKEN_B in your .env file."
    );
    process.exit(1);
  }

  console.log("Starting concurrency test...");
  console.log("Sending 10 requests for identical dates.");

  const requests = Array.from({ length: 10 }, (_, index) => {
    const token = index % 2 === 0 ? TOKEN_A : TOKEN_B;

    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    })
      .then(async (response) => ({
        request: index + 1,
        status: response.status,
        body: await response.json(),
      }))
      .catch((error) => ({
        request: index + 1,
        status: "NETWORK_ERROR",
        body: { message: error.message },
      }));
  });

  const results = await Promise.all(requests);

  console.log("\n--- INDIVIDUAL RESULTS ---");

  results.forEach((result) => {
    console.log(
      `Request ${result.request}: HTTP ${result.status} - ${result.body.message || "No message"}`
    );
  });

  const successful = results.filter(
    (result) => result.status === 201
  );

  const conflicts = results.filter(
    (result) => result.status === 409
  );

  const unexpected = results.filter(
    (result) => result.status !== 201 && result.status !== 409
  );

  console.log("\n--- SUMMARY ---");
  console.log("Successful bookings:", successful.length);
  console.log("Conflict responses:", conflicts.length);
  console.log("Unexpected responses:", unexpected.length);

  if (successful.length === 1 && conflicts.length === 9) {
    console.log(
      "\nPASS: Exactly one booking was created."
    );
  } else {
    console.log(
      "\nFAIL: The result did not match the expected outcome."
    );
  }
}

runConcurrencyTest();

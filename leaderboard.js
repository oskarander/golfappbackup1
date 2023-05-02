// Check if the database is not already defined
if (typeof database === "undefined") {
  // TODO: Replace with your own Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDlZ-1x8gQgfTT0MsAIREtu1e6OQ4Rtg1Q",
    authDomain: "golfpicker-e033a.firebaseapp.com",
    databaseURL: "https://golfpicker-e033a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "golfpicker-e033a",
    storageBucket: "golfpicker-e033a.appspot.com",
    messagingSenderId: "572092058630",
    appId: "1:572092058630:web:8464cdecfc9d50dcec8787"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var database = firebase.database();
}

const app = document.getElementById("app");
let participants = [];
let golfers = [];

const url = "https://golf-leaderboard-data.p.rapidapi.com/leaderboard/474";
const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "5bafd4ae9fmsh7104b6d78f98516p1b2e71jsn9b72b95b1cfc",
    "X-RapidAPI-Host": "golf-leaderboard-data.p.rapidapi.com",
  },
};

// Process golfer positions from RapidAPI response
const processGolferPositions = (leaderboard) => {
  const golfers = [];

  leaderboard.forEach((golferData) => {
    golfers.push({
      id: String(golferData.player_id), // Convert the ID to a string
      name: `${golferData.first_name} ${golferData.last_name}`,
      position: golferData.position !== 0 ? golferData.position : null,
    });
  });

  return golfers;
};


// Fetch participants and golfers from the Firebase database
const fetchData = async () => {
  const participantsSnapshot = await database.ref("participants").once("value");
  participants = Object.values(participantsSnapshot.val()) || [];

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    // Check if the leaderboard exists in the result and pass it to processGolferPositions
    if (result.results && result.results.leaderboard) {
      golfers = processGolferPositions(result.results.leaderboard);
      console.log("RapidAPI golfers:", golfers);
console.log("Firebase participants:", participants);

    } else {
      console.error("leaderboard not found in the RapidAPI response");
    }
  } catch (error) {
    console.error(error);
  }

  renderLeaderboard();
};


const renderLeaderboard = () => {
  // Calculate the scores and total points for each participant
  participants.forEach((participant) => {
    participant.score = 0;
    if (participant.selectedGolfers) {
      participant.selectedGolfers.forEach((golferId) => {
        const golfer = golfers.find((g) => String(g.id) === golferId);
        if (golfer && golfer.position) {
          participant.score += golfer.position;
        }
      });
    }
    participant.totalPoints = participant.score;
  });

  // Sort participants by score
  participants.sort((a, b) => a.score - b.score);

   // Render the leaderboard
app.innerHTML = `
<table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Participant</th>
      <th>Total Points</th>
      <th>Chosen Golfers</th>
    </tr>
  </thead>
  <tbody>
    ${participants
      .map((participant, index) => {
        const golfersList = (participant.selectedGolfers || []) // Add default value of empty array
          .map((golferId) => {
            const golfer = golfers.find((g) => g.id === golferId);
            return golfer ? golfer.name : `Unknown (ID: ${golferId})`;
          })
          .join(", ");
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${participant.name}</td>
            <td>${participant.totalPoints}</td>
            <td>${golfersList}</td>
          </tr>
        `;
      })
      .join("")}
  </tbody>
</table>
`;

};

// Initialize the leaderboard
fetchData();


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
const database = firebase.database();

const app = document.getElementById("app");
let activeParticipantIndex = 0;
let participants = [];
let golfers = [];

const fetchData = () => {
  // Listen for changes in the 'participants' node
  database.ref("participants").on('value', (snapshot) => {
    participants = Object.values(snapshot.val()) || [];
    renderApp();
  });

  // Listen for changes in the 'golfers' node
  database.ref("golfers").on('value', (snapshot) => {
    golfers = Object.values(snapshot.val()) || [];
    renderApp();
  });
};

const renderApp = () => {
  app.innerHTML = `
    <div class="participants">
      ${participants.map((participant, index) => `
        <div class="participant-item ${index === activeParticipantIndex ? "active" : ""}">
          <h3>${participant.name}</h3>
          <ul>
          ${(participant.selectedGolfers || []).map(golferId => {
            const golfer = golfers.find(g => g.id === Number(golferId));
            return `<li data-participant-index="${index}" data-golfer-id="${golferId}">${golfer.name} (${golfer.world_ranking})</li>`;
          }).join("")}
          </ul>
          <div class="winner-prediction">
            <h4>Winning Golfer Prediction:</h4>
            <p data-participant-index="${index}" data-golfer-id="${participant.winningGolfer}">${
              participant.winningGolfer ? (() => {
                const golfer = golfers.find(g => g.id === Number(participant.winningGolfer));
                return `${golfer.name} (${golfer.world_ranking})`;
              })() : "Not selected"}</p>
          </div>
        </div>
      `).join("")}
    </div>
    ${golfers.map(golfer => `
    <button class="golfer-item" data-id="${golfer.id}">
    ${golfer.name} (${golfer.world_ranking
    })
    </button>
  `).join("")}
    </div>
  `;

  // Attach event listeners to golfer buttons
  const golferButtons = app.querySelectorAll(".golfer-item");
  golferButtons.forEach(button => {
    button.addEventListener("click", selectGolfer);
  });

// Attach event listeners to golfer list items
const golferListItems = app.querySelectorAll(".participant-item.active li");
golferListItems.forEach(listItem => {
  listItem.addEventListener("click", removeGolfer);
});

    // Attach event listeners to winning golfer prediction text
    const winnerPredictionText = app.querySelectorAll(".participant-item.active .winner-prediction p");
    winnerPredictionText.forEach(predictionText => {
      predictionText.addEventListener("click", removeWinningGolferPrediction);
    });
  
    // Attach event listeners to participant divs
    const participantDivs = app.querySelectorAll(".participant-item");
    participantDivs.forEach((participantDiv, index) => {
      participantDiv.addEventListener("click", () => {
        activeParticipantIndex = index;
        renderApp();
      });
    });
  };
  
  // Select a golfer for the active participant
  const selectGolfer = (e) => {
    const golferId = e.target.dataset.id;
    const activeParticipant = participants[activeParticipantIndex];
  
    if (!activeParticipant.selectedGolfers) {
      activeParticipant.selectedGolfers = [];
    }
  
    const golferAlreadyPicked = activeParticipant.selectedGolfers.includes(golferId);
  
    if (!golferAlreadyPicked && activeParticipant.selectedGolfers.length < 2) {
      activeParticipant.selectedGolfers.push(golferId);
      database.ref(`participants/${activeParticipantIndex}`).set(activeParticipant);
    } else if (activeParticipant.selectedGolfers.length === 2) {
      if (activeParticipant.winningGolfer === golferId) {
        activeParticipant.winningGolfer = null;
      } else {
        activeParticipant.winningGolfer = golferId;
      }
      database.ref(`participants/${activeParticipantIndex}`).set(activeParticipant);
    }
    renderApp();
  };
  
  // Remove a golfer from the active participant
  const removeGolfer = (e) => {
    const participantIndex = parseInt(e.target.dataset.participantIndex, 10);
    const golferId = e.target.dataset.golferId;
  
    const participant = participants[participantIndex];
  
    if (participant.selectedGolfers) {
      participant.selectedGolfers = participant.selectedGolfers.filter(id => id !== golferId);
      database.ref(`participants/${participantIndex}`).set(participant);
      renderApp();
    }
  };
  
  // Remove a winning golfer prediction from the active participant
  const removeWinningGolferPrediction = (e) => {
    const participantIndex = parseInt(e.target.dataset.participantIndex, 10);
  
    const participant = participants[participantIndex];
  
    if (participant.winningGolfer) {
      participant.winningGolfer = null;
      database.ref(`participants/${participantIndex}`).set(participant);
      renderApp();
    }
  };
  
  // Initialize the app
  fetchData();
  

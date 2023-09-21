// Create a WebSocket connection
const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=36560');

// Function to send a ping message to the server
function sendPing() {
  if (connection.readyState === WebSocket.OPEN) {
    connection.send('{"ping": 1}');
  }
}

// Set up event listeners
connection.addEventListener('open', () => {
  console.log('WebSocket connection established');
  // Send a ping every 1 second after the connection is established
  setInterval(sendPing, 1000);
});

let subscribedIndex = null; // Variable to keep track of the currently subscribed index
const maxTicksLength = 5000; // Maximum number of ticks to keep

// Array to store the tick history
const tickHistory = [];

// Function to update the even and odd bars based on the current tick history
function updateBars(numTicks) {
  const evenBar = document.querySelector('.even-bar');
  const oddBar = document.querySelector('.odd-bar');

  // Calculate the number of even and odd ticks within the specified number of ticks
  let evenTicks = 0;
  let oddTicks = 0;

  const startIndex = Math.max(tickHistory.length - numTicks, 0);
  const endIndex = tickHistory.length;

  for (let i = startIndex; i < endIndex; i++) {
    const lastDigit = Math.abs(tickHistory[i] % 10); // Get the last digit of the tick

    if (lastDigit % 2 === 0) {
      evenTicks++;
    } else {
      oddTicks++;
    }
  }

  // Calculate the percentage values
  const totalTicks = evenTicks + oddTicks;
  const evenPercentage = (evenTicks / totalTicks) * 100;
  const oddPercentage = (oddTicks / totalTicks) * 100;

  // Update the height of the bars
  evenBar.style.height = evenPercentage + '%';
  oddBar.style.height = oddPercentage + '%';

  // Update the percentage display
  const evenPercentageElement = document.querySelector('.even-percentage');
  const oddPercentageElement = document.querySelector('.odd-percentage');

  evenPercentageElement.textContent = evenPercentage.toFixed(2) + '%';
  oddPercentageElement.textContent = oddPercentage.toFixed(2) + '%';
}

// Handle incoming tick data
connection.addEventListener('message', (event) => {
  const tickData = JSON.parse(event.data);
  if (subscribedIndex && tickData.tick && tickData.tick.symbol === subscribedIndex) {
    const lastDigit = Math.abs(Math.floor(tickData.tick.quote * 10) % 10);

    tickHistory.push(lastDigit);

    // Keep the tick history length within the maximum limit
    if (tickHistory.length > maxTicksLength) {
      tickHistory.shift();
    }

    // Update the bars based on the specified number of ticks
    const numTicksInput = document.getElementById('num-ticks-input');
    const numTicks = parseInt(numTicksInput.value, 10);
    updateBars(numTicks);
  }
});

// Function to subscribe to tick data for a specific index
function subscribeTicks(index) {
  if (connection.readyState === WebSocket.OPEN) {
    // Unsubscribe from the previously subscribed index
    if (subscribedIndex) {
      connection.send(`{"forget_all": "${subscribedIndex}"}`);
      tickHistory.length = 0; // Clear the tick history
    }

    // Subscribe to the new index
    connection.send(`{"ticks": "${index}"}`);
    subscribedIndex = index;
  }
}

// Set up event listener for index select dropdown
const indexSelect = document.getElementById('index-select');
indexSelect.addEventListener('change', (event) => {
  const selectedIndex = event.target.value;
  subscribeTicks(selectedIndex);
});

// Set up event listener for number of ticks input
const numTicksInput = document.getElementById('num-ticks-input');
numTicksInput.addEventListener('input', () => {
  const numTicks = parseInt(numTicksInput.value, 10);
  updateBars(numTicks);
});

// Initial subscription when the page loads
const initialSelectedIndex = indexSelect.value;
subscribeTicks(initialSelectedIndex);

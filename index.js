require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]});

// Bot token from environment variables for security
const TOKEN = process.env.DISCORD_TOKEN;

// Listahan ng mga members sa tamang order
const members = [
  "Ate Mary Jean Nueva",
  "Genesis Hilis",
  "Caleb Hilis",
  "Kate Datuin",
  "Leonel Valle",
  "Joey Sangil",
  "Jabez Salvano",
  "Christine Segismundo",
  "Micahella Tuscano",
  "July Sangil",
  "Ella Segismundo"
];

// Members who are only eligible for Opening Prayer (starting July 2025)
const openingPrayerOnlyMembers = [
  "Steven Corpin",
  "Justine Sangil",
  "James Hilis",
  "Kyle Tuscano"
];

// Tracking ng last assignments from April 2025
const lastMonthAssignments = {
  "April 25": {
    "Presider": "Ate Mary Jean Nueva",
    "Devotion Leader": "Caleb Hilis",
    "Opening Prayer": "Jabez Salvano",
    "Closing Prayer": "Ella Segismundo"
  }
};

// Mga posisyon na kailangan i-rotate
const positions = ["Presider", "Devotion Leader", "Opening Prayer", "Closing Prayer"];

// Last devotion leader from April - start point
let globalDevotionLeaderIndex = members.indexOf("Caleb Hilis");

// Storage for generated schedules so they remain the same when requested again
const scheduleCache = {};

// Predefined schedule for May 2025 - this will be our starting point
const may2025Schedule = `Hello, Good day! This is the schedule for our CG every Friday night throughout **May 2025**.

2
Presider: July Sangil
Devotion Leader: Kate Datuin
Opening Prayer: Joey Sangil
Closing Prayer: Genesis Hilis
————————————————

9
Presider: Jabez Salvano
Devotion Leader: Leonel Valle
Opening Prayer: Caleb Hilis
Closing Prayer: Ate Mary Jean Nueva
————————————————

16
Presider: Micahella Tuscano
Devotion Leader: Joey Sangil
Opening Prayer: Ella Segismundo
Closing Prayer: Kate Datuin
————————————————

23
Presider: Ate Mary Jean Nueva
Devotion Leader: Jabez Salvano
Opening Prayer: Leonel Valle
Closing Prayer: July Sangil
————————————————

30
Presider: Caleb Hilis
Devotion Leader: Christine Segismundo
Opening Prayer: Genesis Hilis
Closing Prayer: Micahella Tuscano
————————————————
`;

// Hard-code May 2025 assignments for reference in future months
const may2025Assignments = [
  {
    date: "May 2",
    "Presider": "July Sangil",
    "Devotion Leader": "Kate Datuin",
    "Opening Prayer": "Joey Sangil",
    "Closing Prayer": "Genesis Hilis"
  },
  {
    date: "May 9",
    "Presider": "Jabez Salvano",
    "Devotion Leader": "Leonel Valle",
    "Opening Prayer": "Caleb Hilis",
    "Closing Prayer": "Ate Mary Jean Nueva"
  },
  {
    date: "May 16",
    "Presider": "Micahella Tuscano",
    "Devotion Leader": "Joey Sangil",
    "Opening Prayer": "Ella Segismundo",
    "Closing Prayer": "Kate Datuin"
  },
  {
    date: "May 23",
    "Presider": "Ate Mary Jean Nueva",
    "Devotion Leader": "Jabez Salvano",
    "Opening Prayer": "Leonel Valle",
    "Closing Prayer": "July Sangil"
  },
  {
    date: "May 30",
    "Presider": "Caleb Hilis",
    "Devotion Leader": "Christine Segismundo",
    "Opening Prayer": "Genesis Hilis",
    "Closing Prayer": "Micahella Tuscano"
  }
];

// Last devotion leader in May 2025 is Christine Segismundo
// We need to know her index for future months
const lastDevotionLeaderIndex = members.indexOf("Christine Segismundo");

// Track devotion leader progression across months and years
const devotionLeaderTracker = {
  // Set last index based on the last devotion leader in May 2025
  lastIndex: members.indexOf("Christine Segismundo"),
  // Track progress by month and year (map of "YYYY-MM" to index)
  progress: {
    // Pre-populate May 2025
    "2025-5": members.indexOf("Christine Segismundo")
  }
};

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async message => {
  // Kung ang message ay "!schedule <month>" or "!schedule <month> + <year>" or "!schedule <month> <year>"
  if (message.content.startsWith('!schedule')) {
    const args = message.content.split(' ');
    
    // Check for the different formats with year
    let month, year;
    let inputText = message.content.substring('!schedule'.length).trim();
    
    // Handle "!schedule month + year" format
    if (inputText.includes('+')) {
      const parts = inputText.split('+').map(part => part.trim());
      month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      year = parseInt(parts[1]);
      
      if (isNaN(year)) {
        year = new Date().getFullYear();
      }
    } 
    // Handle "!schedule month year" format (with space between month and year)
    else if (args.length >= 3 && !isNaN(parseInt(args[2]))) {
      month = args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase();
      year = parseInt(args[2]);
    }
    else if (args[1]) {
      // Handle "!schedule month" format
      month = args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase();
      year = new Date().getFullYear();
    } else {
      // Kung walang binigay na month, gamitin ang current month
      const currentDate = new Date();
      month = currentDate.toLocaleString('en-US', { month: 'long' });
      year = currentDate.getFullYear();
    }

    // Generate or retrieve cached schedule
    const schedule = getOrGenerateSchedule(month, year);
    await message.channel.send(schedule);
  }
});

// Function to get cached schedule or generate a new one
function getOrGenerateSchedule(month, year) {
  const cacheKey = `${month}-${year}`;
  
  // Special case: Return the predefined May 2025 schedule
  if (month === "May" && year === 2025) {
    return may2025Schedule;
  }
  
  // If schedule for this month+year already exists, return it
  if (scheduleCache[cacheKey]) {
    return scheduleCache[cacheKey];
  }
  
  // Calculate the seed based on month and year
  // This ensures different random assignments for different months/years
  const seed = parseInt(`${year}${getMonthNumber(month)}`);
  
  // Generate new schedule and cache it
  const newSchedule = generateSchedule(month, year, seed);
  scheduleCache[cacheKey] = newSchedule;
  return newSchedule;
}

// Helper function to get month number
function getMonthNumber(monthName) {
  const months = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(monthName);
  return (monthIndex !== -1) ? monthIndex + 1 : 1; // 1-based month number
}

// Helper function to check if month/year is July 2025 or later
function isJuly2025OrLater(month, year) {
  const months = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(month);
  return (year > 2025) || (year === 2025 && monthIndex >= 6); // July is index 6
}

// Function para mag-generate ng schedule
function generateSchedule(month, year, seed) {
  // Get previous and current month/year as date objects for comparison
  const months = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(month);
  const currentDate = new Date(year, monthIndex, 1);
  
  // Calculate how many months have passed since our reference point (May 2025)
  const referenceDate = new Date(2025, 4, 1); // May 2025 (0-based month)
  const monthDiff = (currentDate.getFullYear() - referenceDate.getFullYear()) * 12 + 
                    (currentDate.getMonth() - referenceDate.getMonth());
  
  // Calculate devotion leader starting index based on progression
  // Each month advances by the number of Fridays in that month
  let startingDevotionLeaderIndex = devotionLeaderTracker.lastIndex;
  
  // If the requested date is before our reference point (May 2025)
  // We'll just use a random but consistent approach
  if (monthDiff < 0) {
    // Generate a consistent but different schedule for past months
    startingDevotionLeaderIndex = (devotionLeaderTracker.lastIndex + monthDiff) % members.length;
    if (startingDevotionLeaderIndex < 0) {
      startingDevotionLeaderIndex += members.length; // Keep it positive
    }
  } 
  // If the requested date is after our reference point (May 2025)
  else if (monthDiff > 0) {
    // Get all previous months between reference and current date
    let tempDate = new Date(referenceDate);
    while (tempDate < currentDate) {
      const tempMonthKey = `${tempDate.getFullYear()}-${tempDate.getMonth() + 1}`;
      
      // Check if we already processed this month
      if (!devotionLeaderTracker.progress[tempMonthKey]) {
        // Count Fridays in this month
        const fridaysInMonth = getAllFridays(
          months[tempDate.getMonth()], 
          tempDate.getFullYear()
        ).length;
        
        // Advance devotion leader index
        startingDevotionLeaderIndex = (startingDevotionLeaderIndex + fridaysInMonth) % members.length;
        
        // Store progress
        devotionLeaderTracker.progress[tempMonthKey] = startingDevotionLeaderIndex;
      } else {
        // Use already calculated progress
        startingDevotionLeaderIndex = devotionLeaderTracker.progress[tempMonthKey];
      }
      
      // Move to next month
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
  }
  
  // Set custom random seed for consistent yet different schedules
  const oldRandom = Math.random;
  // Simple pseudo-random function based on seed
  Math.random = function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Kunin ang lahat ng fridays sa month na ito
  const fridays = getAllFridays(month, year);
  
  // Tracking para sa total assignments per member
  const assignmentCounts = {};
  
  // Tracking para sa role assignments (to prevent duplicates in same role)
  const roleAssignments = {};
  
  // Initialize tracking objects
  members.forEach(member => {
    assignmentCounts[member] = 0;
  });
  // Also initialize for openingPrayerOnlyMembers
  openingPrayerOnlyMembers.forEach(member => {
    assignmentCounts[member] = 0;
  });
  
  positions.forEach(position => {
    roleAssignments[position] = new Set();
  });
  
  // Para sa tracking ng last week assignments
  let lastWeekAssigned = new Set();
  
  // If requested month is right after May 2025, use the last week assignments from May
  if (year === 2025 && month === "June") {
    // Use the last week of May 2025
    lastWeekAssigned = new Set([
      "Caleb Hilis",
      "Christine Segismundo",
      "Genesis Hilis",
      "Micahella Tuscano"
    ]);
  } else {
    // Default last week assignments
    lastWeekAssigned = new Set([
      "Caleb Hilis", 
      "Christine Segismundo", 
      "Genesis Hilis", 
      "Micahella Tuscano"
    ]);
  }
  
  let schedule = `Hello, Good day! This is the schedule for our CG every Friday night throughout **${month} ${year}**.\n\n`;
  
  // Current devotion leader index for this month
  let devotionLeaderIndex = startingDevotionLeaderIndex;
  
  // --- Special handling for July 2025 Opening Prayer ---
  let openingPrayerJuly2025Order = [];
  if (year === 2025 && month === "July") {
    // Use the four new members in order for the first four Fridays
    openingPrayerJuly2025Order = [...openingPrayerOnlyMembers];
    // If there are more than 4 Fridays, fill the rest with the normal pool
  }

  // Iteration sa bawat Friday
  fridays.forEach((friday, weekIndex) => {
    const weeklyAssignments = {};
    const assignedThisWeek = new Set();
    
    schedule += `${friday.getDate()}\n`;
    
    // STEP 1: I-assign muna ang Devotion Leader (sequential)
    // Update devotion leader index to next person
    devotionLeaderIndex = (devotionLeaderIndex + 1) % members.length;
    const devotionLeader = members[devotionLeaderIndex];
    
    weeklyAssignments["Devotion Leader"] = devotionLeader;
    assignedThisWeek.add(devotionLeader);
    assignmentCounts[devotionLeader]++;
    roleAssignments["Devotion Leader"].add(devotionLeader);
    
    // STEP 2: Assign other positions (Presider, Opening Prayer, Closing Prayer)
    // Array of positions without Devotion Leader
    const otherPositions = positions.filter(pos => pos !== "Devotion Leader");
    
    // Shuffle array para random order ng assignment
    shuffleArray(otherPositions);
    
    otherPositions.forEach(position => {
      // --- Special handling for Opening Prayer in July 2025 ---
      if (position === "Opening Prayer" && year === 2025 && month === "July" && weekIndex < openingPrayerJuly2025Order.length) {
        const selectedMember = openingPrayerJuly2025Order[weekIndex];
        weeklyAssignments[position] = selectedMember;
        assignedThisWeek.add(selectedMember);
        assignmentCounts[selectedMember]++;
        roleAssignments[position].add(selectedMember);
        return;
      }
      // For Opening Prayer, use extended list if July 2025 or later
      let pool = members;
      if (position === "Opening Prayer" && isJuly2025OrLater(month, year)) {
        pool = members.concat(openingPrayerOnlyMembers);
      }

      let eligibleMembers = pool.filter(member => {
        return !assignedThisWeek.has(member) && 
               !lastWeekAssigned.has(member) && 
               assignmentCounts[member] < 2 &&
               !roleAssignments[position].has(member);
      });
      
      // Kung walang eligible, relax ng requirement sa last week
      if (eligibleMembers.length === 0) {
        eligibleMembers = pool.filter(member => {
          return !assignedThisWeek.has(member) && 
                 assignmentCounts[member] < 2 &&
                 !roleAssignments[position].has(member);
        });
      }
      
      // Kung wala pa ring eligible, relax assignment count constraint
      if (eligibleMembers.length === 0) {
        eligibleMembers = pool.filter(member => 
          !assignedThisWeek.has(member) && 
          !roleAssignments[position].has(member)
        );
      }
      
      // Last resort: If still no eligible members, allow repeated roles
      if (eligibleMembers.length === 0) {
        eligibleMembers = pool.filter(member => !assignedThisWeek.has(member));
      }
      
      // Random selection
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      const selectedMember = eligibleMembers[randomIndex];
      
      weeklyAssignments[position] = selectedMember;
      assignedThisWeek.add(selectedMember);
      assignmentCounts[selectedMember]++;
      roleAssignments[position].add(selectedMember);
    });
    
    // Reset last week assigned for next iteration
    lastWeekAssigned = new Set([...assignedThisWeek]);
    
    // Add to schedule text in correct position order
    positions.forEach(position => {
      schedule += `${position}: ${weeklyAssignments[position]}\n`;
    });
    
    schedule += "————————————————\n\n";
  });
  
  // Update the last devotion leader index for this month/year
  const currentMonthKey = `${year}-${monthIndex + 1}`;
  devotionLeaderTracker.progress[currentMonthKey] = devotionLeaderIndex;
  
  // Restore original random function
  Math.random = oldRandom;
  
  return schedule;
}
  


// Function para kunin lahat ng Fridays sa isang month
function getAllFridays(monthName, year) {
  const months = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(monthName);
  
  if (monthIndex === -1) return [];
  
  const fridays = [];
  const date = new Date(year, monthIndex, 1);
  
  // Hanapin ang unang Friday
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }
  
  // Ilagay lahat ng Fridays sa array
  while (date.getMonth() === monthIndex) {
    fridays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }
  
  return fridays;
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Optional: Save schedules to a file for persistence across bot restarts
// You would need the fs module: const fs = require('fs');
function saveSchedulesToFile() {
  try {
    const data = JSON.stringify(scheduleCache);
    require('fs').writeFileSync('./schedules.json', data);
    console.log('Schedules saved to file');
  } catch (err) {
    console.error('Error saving schedules:', err);
  }
}

// Optional: Load schedules from file on startup
function loadSchedulesFromFile() {
  try {
    if (require('fs').existsSync('./schedules.json')) {
      const data = require('fs').readFileSync('./schedules.json', 'utf8');
      const loaded = JSON.parse(data);
      Object.assign(scheduleCache, loaded);
      console.log('Schedules loaded from file');
    }
  } catch (err) {
    console.error('Error loading schedules:', err);
  }
}

// Optional: Load schedules on startup
// loadSchedulesFromFile();

// Optional: Save schedules periodically
// setInterval(saveSchedulesToFile, 1000 * 60 * 10); // Save every 10 minutes

client.login(TOKEN);
///-----------------------------------------------------------------------------------------------------------------
// Birthdays
///-----------------------------------------------------------------------------------------------------------------

const birthdayFilePath = "birthdays.json";
let birthdays = {};

// Load birthdays from file
if (fs.existsSync(birthdayFilePath)) {
  birthdays = JSON.parse(fs.readFileSync(birthdayFilePath, "utf8"));
}

client.on("messageCreate", (message) => {
  // Command to set a user's birthday: !setbirthday MM-DD-YYYY
  if (message.content.startsWith("!setbirthday")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      return message.reply('Do "!setbirthday MM-DD-YYYY"');
    }

    const userId = message.author.id;
    const birthday = args[1];

    // Validate the input date
    if (!isValidDate(birthday)) {
      return message.reply('Invalid date format. Please use "!setbirthday MM-DD-YYYY" with a valid date.');
    }

    birthdays[userId] = birthday;
    fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));

    // Calculate age and upcoming birthday date
    const today = new Date();
    const birthDate = new Date(birthday);
    const upcomingBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 8, 0, 0, 0);

    // Check if the birthday has already passed this year, if so, set it for next year
    if (today > upcomingBirthday) {
      upcomingBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Calculate days until the upcoming birthday
    const oneDay = 1000 * 60 * 60 * 24; // Milliseconds in a day
    const age = upcomingBirthday.getFullYear() - birthDate.getFullYear();
    const daysUntilBirthday = Math.ceil((upcomingBirthday - today) / oneDay);

    // Format the upcoming birthday date as MM-DD-YYYY
    const formattedUpcomingBirthday = `${upcomingBirthday.getMonth() + 1}-${upcomingBirthday.getDate()}-${upcomingBirthday.getFullYear()}`;

    return message.reply(`Birthday set for you on ${birthday}. Your ${age}th Birthday will be announced on ${formattedUpcomingBirthday}, ${daysUntilBirthday} days to go!`);
  }
});

// Announce birthdays at 8 AM EST in a specific channel
setInterval(() => {
  const now = new Date();
  const estOffset = -5; // Eastern Standard Time (EST) offset in hours
  now.setUTCHours(now.getUTCHours() + estOffset, 8, 0, 0);
  const today = now.toISOString().substr(5, 5);
  const birthdayChannelId = "1146210030027288616"; // Replace with your birthday channel ID

  const birthdayChannel = client.channels.cache.get(birthdayChannelId);
  if (!birthdayChannel) {
    console.error(`Birthday channel with ID ${birthdayChannelId} not found.`);
    return;
  }

  for (const userId in birthdays) {
    const user = client.users.cache.get(userId);
    if (!user) {
      delete birthdays[userId];
      fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
      continue;
    }

    if (birthdays[userId] === today) {
      birthdayChannel.send(`🎉 Happy Birthday ${user}! 🎉`);
    }
  }
}, 1000 * 60 * 60 * 24); // Check every 24 hours

// Remove birthday entry when a member leaves
client.on("guildMemberRemove", (member) => {
  delete birthdays[member.user.id];
  fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
});

// Function to validate a date string (MM-DD-YYYY format)
function isValidDate(dateString) {
  const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

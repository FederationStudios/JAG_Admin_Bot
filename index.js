/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { 
  Client, 
  GatewayIntentBits, 
  InteractionType, 
  ActivityType, 
  Collection, 
  EmbedBuilder,
  Options
} = require("discord.js");
const { ApplicationCommandOptionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole } = require("./functions.js");
const fs = require("node:fs");
const config = require("./config.json");
const mongoose = require('mongoose');
const path = require("path");
let ready = false;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.MessageContent
  ],
  // Check if Options is defined before using it
  ...(typeof Options !== 'undefined' ? {
    makeCache: Options.cacheWithLimits({
      MessageManager: 50, // Limit cached messages
      UserManager: 100,   // Limit cached users
      GuildMemberManager: 100 // Limit cached guild members
    }),
    sweepers: {
      // Automatically clean up unused cache
      messages: {
        interval: 3600, // Every hour
        lifetime: 1800  // Remove messages older than 30 minutes
      },
      users: {
        interval: 3600,
        filter: () => user => !user.bot && Date.now() - user.lastMessageTimestamp > 3600000
      }
    }
  } : {})
});

const restrictedRoles = new Map();
client.commands = new Collection();
client.modals = new Collection();
module.exports = { restrictedRoles };

// Removed unused messageLogs Map
const spamCache = new Map();
const actionLog = new Map(); // Added for tracking moderation actions
const SPAM_THRESHOLD = 5;
const TIMEFRAME = 10000;
const MIN_ACCOUNT_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_DB_RETRY_ATTEMPTS = 5; // Added to limit database retry attempts
// Add bypass channels for spam detection
const BYPASS_CHANNELS = [
'993555935937175572',
'908269617552715836'
];




// Removed all command rate limit related code and maps

// Cleanup function for Maps to prevent memory leaks
function setupCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    
    // Clean up spam cache
    spamCache.forEach((times, userId) => {
      const filteredTimes = times.filter(time => now - time < TIMEFRAME);
      if (filteredTimes.length === 0) {
        spamCache.delete(userId);
      } else {
        spamCache.set(userId, filteredTimes);
      }
    });
    
    // Clean up action log
    actionLog.forEach((actions, userId) => {
      const filteredActions = actions.filter(action => now - action.timestamp < 86400000); // 24 hours
      if (filteredActions.length === 0) {
        actionLog.delete(userId);
      } else {
        actionLog.set(userId, filteredActions);
      }
    });
    
    // Removed rate limit cleanup
    
  }, 300000); // Run cleanup every 5 minutes
}

// Database connection with improved retry mechanism and limits
async function connectDatabase() {
  const connectOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip trying IPv6
  };

  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to database');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected, attempting reconnect...');
  });
  
  let retryCount = 0;
  
  async function connectWithRetry() {
    if (retryCount >= MAX_DB_RETRY_ATTEMPTS) {
      console.error(`Failed to connect to MongoDB after ${MAX_DB_RETRY_ATTEMPTS} attempts.`);
      console.warn('Bot will continue without database functionality.');
      return false;
    }
    
    try {
      retryCount++;
      await mongoose.connect(config.bot.uri, connectOptions);
      console.log(`Connected to MongoDB (attempt ${retryCount})`);
      retryCount = 0; // Reset counter on success
      return true;
    } catch (err) {
      console.error(`Failed to connect to MongoDB (attempt ${retryCount}/${MAX_DB_RETRY_ATTEMPTS})`, err);
      
      if (retryCount < MAX_DB_RETRY_ATTEMPTS) {
        const delay = Math.min(5000 * retryCount, 30000); // Exponential backoff with 30s max
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectWithRetry();
      }
      return false;
    }
  }

  return connectWithRetry();
}

// Load modals function (added to fix missing modal loading)
function loadModals() {
  const modalsDir = path.join(__dirname, "modals");
  if (!fs.existsSync(modalsDir)) {
    console.log("[MODAL-LOAD] No modals directory found");
    return;
  }
  
  console.log(`[MODAL-LOAD] Loading from folder: ${modalsDir}`);
  const modalFiles = fs.readdirSync(modalsDir).filter(file => file.endsWith('.js'));
  
  for (const file of modalFiles) {
    try {
      const modal = require(path.join(modalsDir, file));
      client.modals.set(modal.name, modal);
      console.log(`[MODAL-LOAD] Loaded modal: ${modal.name}`);
    } catch (error) {
      console.error(`[MODAL-LOAD] Failed to load modal: ${file}`, error);
    }
  }
}

// Graceful shutdown handler
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    // Log the shutdown
    if (ready && client?.user) {
      try {
        await toConsole(`Bot shutdown initiated: ${signal}`, new Error().stack, client);
      } catch (e) {
        console.error('Failed to log shutdown:', e);
      }
    }
    
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close();
        console.log('Database connection closed');
      } catch (e) {
        console.error('Error closing database connection:', e);
      }
    }
    
    // Logout from Discord
    if (client?.isReady()) {
      try {
        await client.destroy();
        console.log('Discord client destroyed');
      } catch (e) {
        console.error('Error destroying Discord client:', e);
      }
    }
    
    console.log('Shutdown complete');
    process.exit(0);
  };
  
  // Register shutdown handlers
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

//#region Events
client.once("ready", async () => {
  try {
    // Bot Status with efficient rotation (less frequent)
    const activities = [
      "Checking Appeals",
      "Watching Larz",
      "Suman is sleeping",
      "People Abusing"
    ];
  
    // Use less frequent status updates to save resources
    let i = 0;
    client.user.setActivity(activities[0], { type: ActivityType.Watching });
    setInterval(() => {
      client.user.setActivity(activities[i], { type: ActivityType.Watching });
      i = (i + 1) % activities.length;
    }, 14400000); // Change every 4 hours instead of every hour
      
    // Initialize services
    const [dbOk] = await Promise.all([
      connectDatabase(),
      loadModals(), // Added modal loading
      setupCacheCleanup(), // Added memory cleanup
      setupGracefulShutdown() // Added graceful shutdown
    ]);
    // Log service status
    console.log(`Services status: Database: ${dbOk ? 'OK' : 'Limited functionality'}`);

    // Command loading with improved error handling
    const loadCommands = (folderPath, type) => {
      if (!fs.existsSync(folderPath)) {
        console.log(`[CMD-LOAD] No directory found at: ${folderPath}`);
        return [];
      }
      
      console.log(`[CMD-LOAD] Loading from folder: ${folderPath}`);
      return fs.readdirSync(folderPath)
        .filter(f => f.endsWith(".js"))
        .map(command => {
          try {
            const cmd = require(path.join(folderPath, command));
            
            // Use more efficient caching
            client.commands.set(cmd.name, cmd);
            
            // Modify description more efficiently
            if (cmd.data.description) {
              cmd.data.description = `[${type}] ${cmd.data.description}`;
            }
            
            return cmd.data.toJSON();
          } catch (e) {
            console.error(`[CMD-LOAD] Failed to load command: ${command}`, e);
            return null;
          }
        })
        .filter(Boolean); // Remove failed loads
    };

    const cmdPublicDir = path.join(__dirname, "commands", "public");
    const cmdRestrictedDir = path.join(__dirname, "commands", "restricted");
    const cmdMPDir = path.join(__dirname, "commands", "militarypolice");
    
    const globalCommands = loadCommands(cmdPublicDir, "PUBLIC");
    const oaCommands = loadCommands(cmdRestrictedDir, "STAFF");
    const mpCommands = loadCommands(cmdMPDir, "MP");

    try {
      await client.application.commands.set(globalCommands);
      console.log(`[CMD-LOAD] Set ${globalCommands.length} global commands`);
    } catch (error) {
      console.error('[CMD-LOAD] Failed to set global commands:', error);
    }
    
    try {
      // Set restricted commands for the main guild
      const mainGuild = client.guilds.cache.get("1267844279129341994");
      if (mainGuild) {
        await mainGuild.commands.set(oaCommands);
        console.log(`[CMD-LOAD] Set ${oaCommands.length} guild-specific commands (STAFF)`);
      } else {
        console.error('[CMD-LOAD] Main guild not found');
      }

      // Set MP commands for the MP guild
      const mpGuild = client.guilds.cache.get("1300635431418855515");
      if (mpGuild) {
        await mpGuild.commands.set([...oaCommands, ...mpCommands]);
        console.log(`[CMD-LOAD] Set ${oaCommands.length + mpCommands.length} MP guild-specific commands`);
      } else {
        console.error('[CMD-LOAD] MP guild not found');
      }
    } catch (error) {
      console.error('[CMD-LOAD] Failed to set guild commands:', error);
    }
    
    ready = true;
    console.log(`${client.user.tag} is online!`);
    toConsole("Client has logged in and is ready", new Error().stack, client);
     
     // Log bypass channels
  console.log(`[CONFIG] Spam detection bypass channels: ${BYPASS_CHANNELS.join(', ')}`);
  } catch (error) {
    console.error('Error during startup:', error);
    toConsole('Failed during startup', error.stack, client);
  }
});

// Removed isRateLimited function completely

// Enhanced interaction handling with all rate limiting removed
client.on("interactionCreate", async interaction => {
  if (!ready) return interaction.reply({ 
    content: "Bot is still starting up. Please wait a moment.", 
    ephemeral: true 
  });

  try {
    // Process commands without any rate limit checks
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      
      
      await handleCommand(command, interaction);
    } else if (interaction.type === InteractionType.ModalSubmit) {
      await handleModal(interaction);
    } else if (interaction.type === InteractionType.MessageContextMenu) {
      const command = client.commands.get(interaction.commandName);
      await command.run(client, interaction);
    } else if (interaction.type === InteractionType.Autocomplete) {
      const command = client.commands.get(interaction.commandName);
      await command.autocomplete(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    toConsole('Interaction handling failed', error.stack, client);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "An error occurred. Please try again later.", ephemeral: true });
    } else if (interaction.deferred) {
      await interaction.editReply({ content: "An error occurred. Please try again later." });
    }
  }
});

async function handleCommand(command, interaction) {
  const options = [];
  if (interaction.options.data.length > 0) {
    for (const option of interaction.options.data) {
      options.push(`[${ApplicationCommandOptionType[option.type]}] ${option.name}: ${option.value}`);
    }
  }

  toConsole(
    `${interaction.user.tag} (${interaction.user.id}) ran command \`${interaction.commandName}\`:\n> ${options.join("\n> ") || "No options"}`,
    new Error().stack,
    client
  );

  try {
    await command.run(client, interaction, interaction.options);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    await interaction.editReply({
      content: "An error occurred while executing the command. Please try again later.",
      components: []
    });
    toConsole(error.stack, new Error().stack, client);
  }
}

async function handleModal(interaction) {
  const modalName = interaction.customId;
  const modal = client.modals.get(modalName);
  
  if (modal) {
    try {
      await modal.run(client, interaction, interaction.fields);
    } catch (error) {
      console.error(`Error handling modal ${modalName}:`, error);
      await interaction.reply({
        content: "An error occurred while processing the modal. Please try again later.",
        ephemeral: true
      });
    }
  } else {
    await interaction.reply({
      content: "This modal is no longer available.",
      ephemeral: true
    });
    console.warn(`No modal found for: ${modalName}`);
    toConsole(`No modal found for: ${modalName}`, new Error().stack, client);
  }
}

// Log and track moderation actions
function logModAction(action, user, moderator, reason) {
  const userActions = actionLog.get(user.id) || [];
  userActions.push({
    type: action,
    timestamp: Date.now(),
    moderator: moderator.id,
    reason
  });
  actionLog.set(user.id, userActions);
  
  // Log to channel if possible
  const logChannel = client.channels.cache.get(config.discord.logChannel);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle(`Moderation Action: ${action}`)
      .setColor('#FF0000')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})` },
        { name: 'Reason', value: reason || 'No reason provided' }
      )
      .setTimestamp();
      
    logChannel.send({ embeds: [embed] }).catch(console.error);
  }
}

// Event handlers for member join and message creation with improved logging
client.on("guildMemberAdd", (member) => {
  const accountAge = Date.now() - member.user.createdAt.getTime();
  
  if (accountAge < MIN_ACCOUNT_AGE) {
    const warningChannel = member.guild.channels.cache.get(config.discord.logChannel);
    if (warningChannel) {
      const embed = new EmbedBuilder()
        .setTitle('New Account Warning')
        .setColor('#FFA500')
        .setDescription(`⚠️ User ${member.user.tag} joined with a new account.`)
        .addFields(
          { name: 'User ID', value: member.user.id },
          { name: 'Account Age', value: `${Math.floor(accountAge / (24 * 60 * 60 * 1000))} days` }
        )
        .setTimestamp();
        
      warningChannel.send({ embeds: [embed] }).catch(console.error);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
   // Skip spam detection for specified bypass channels
  if (BYPASS_CHANNELS.includes(message.channel.id)) {
    return;
  }
    
  // Use a more memory-efficient spam detection
  const now = Date.now();
  const userLog = spamCache.get(message.author.id) || [];
  
  // Prune old entries more efficiently
  const recentLogs = userLog.filter(time => now - time < TIMEFRAME);
  
  if (recentLogs.length >= SPAM_THRESHOLD) {
    try {
      // Log the spam detection
      const spamContent = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');
      
      // Delete the message
      await message.delete();
      
      // Notify the user
      const warningMsg = await message.channel.send(`${message.author}, please slow down.`);
      setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
      
      // Optional: Implement temporary mute with proper error handling
      const muteRole = message.guild.roles.cache.find(role => 
        role.name.toLowerCase().includes('mute') || role.name.toLowerCase().includes('timeout')
      );
      
      if (muteRole) {
        try {
          await message.member.roles.add(muteRole);
          
          // Log the mute action
          logModAction('Auto-Mute', message.author, client.user, 'Spam detection');
          
          // Remove the role after a minute
          setTimeout(async () => {
            try {
              await message.member.roles.remove(muteRole);
              logModAction('Auto-Unmute', message.author, client.user, 'Temporary mute expired');
            } catch (error) {
              console.error('Failed to remove mute role:', error);
            }
          }, 60000);
        } catch (error) {
          console.error('Failed to apply mute role:', error);
        }
      }
      
      // Log the spam incident
      logModAction('Spam Detection', message.author, client.user, `Sent ${recentLogs.length} messages in ${TIMEFRAME/1000}s. Last message: ${spamContent}`);
    } catch (error) {
      console.error('Error handling spam message:', error);
    }
    
    return;
  }

  recentLogs.push(now);
  spamCache.set(message.author.id, recentLogs);
});

// Start the bot
client.login(config.bot.token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});

// Enhanced error handling
process.on("uncaughtException", (err, origin) => {
  if (!ready) {
    console.error("Fatal error during startup:", err, origin);
    return process.exit(14);
  }
  toConsole(`Uncaught Exception:\n${err}\nOrigin: ${origin}`, new Error().stack, client);
});

process.on("unhandledRejection", async (reason, promise) => {
  if (!ready) {
    console.error("Fatal error during startup:", reason);
    return process.exit(15);
  }

  const error = String(reason?.stack || reason);
  if (error.includes("Interaction has already been acknowledged.") ||
      error.includes("Unknown interaction") ||
      error.includes("Unknown Message") ||
      error.includes("Cannot read properties of undefined (reading 'ephemeral')")) {
    return client.channels.cache.get(config.discord.logChannel)
      .send(`Suppressed error:\n>>> ${error}`);
  }

  toConsole(`Unhandled Rejection:\n${error}`, new Error().stack, client);
});

process.on("warning", async (warning) => {
  if (!ready) {
    console.warn("Startup warning:", warning);
    return;
  }
  toConsole(`Warning:\n${warning}`, new Error().stack, client);
});

process.on("exit", (code) => {
  console.error(`Process exiting with code: ${code}`);
});
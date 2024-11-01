const { Client, GatewayIntentBits, InteractionType, ActivityType, Collection, EmbedBuilder } = require("discord.js");
const { ApplicationCommandOptionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole } = require("./functions.js");
const fs = require("node:fs");
const config = require("./config.json");
const mongoose = require('mongoose');
let ready = false;
const path = require("path");



const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

let statusMessage; // Variable to store the status message

client.commands = new Collection();
client.modals = new Collection();

//#region Events
client.once("ready", async () => {
  // Start of Bot Status
  client.user.setActivity("Military cases and trials...", { type: ActivityType.Watching });
  //End of bot status

  main().catch(err => console.log(err));
  async function main() {
    try {
      await mongoose.connect(config.bot.uri1);
      console.log("Database connection established!");
    } catch (err) {
      console.log("Failed to connect to database: " + err);
    }
  }
  //Commands
  const loadCommands = (folderPath, type) => {
    console.log(`[CMD-LOAD] Loading from folder: ${folderPath}`);
    const commandsArray = [];
    const commands = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
    for (const command of commands) {
      try {
        console.log(`[CMD-LOAD] ${path.join(folderPath,command)}`);
        const cmd = require(path.join(folderPath, command));

        if(cmd.data.description !== "" && cmd.data.description !== undefined) cmd.data.description = `[${type}] ${cmd.data.description}`;

        client.commands.set(cmd.name, cmd);
        commandsArray.push(cmd.data.toJSON());
        console.info(`[CMD-LOAD] Loaded command ${cmd.name}`);
      } catch (e) {
        console.error(`[CMD-LOAD] Failure while loading command: ${command}\n`);
        console.error(e);
      }
    }

    return commandsArray;
  };

  const globalCommands = loadCommands(path.join(__dirname, "commands", "public"),"PUBLIC");
  const staffCommands = loadCommands(path.join(__dirname, "commands", "restricted"), "STAFF");
  const mpcommands = loadCommands(path.join(__dirname, "commands", "militarypolice"), "MP");


// Register commands in all guilds
    await client.application.commands.set(globalCommands);
// Register commands in different guilds   
    await client.guilds.cache.get("1267844279129341994").commands.set(staffCommands);
    await client.guilds.cache.get("493315283574980628").commands.set(mpcommands);
  ready = true;
  
  console.log(`${client.user.tag} is online!`);

  const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Bot Status')
      .setDescription('The bot is **Online**.')
      .setTimestamp()
      .setFooter({ text: 'Bot Status', iconURL: client.user.displayAvatarURL() });

  // Fetch the channel where the status will be posted
  const channel = await client.channels.cache.get(config.discord.statusChannelID);

  // Send the embed to the channel
  statusMessage = await channel.send({ embeds: [embed] });

  console.log('Status message posted.');
  toConsole("Client has logged in and is ready", new Error().stack, client);

});

client.on("interactionCreate", async interaction => {
  if (!ready) return interaction.reply({ content: "Do not send commands, the bot is starting!" });
  switch (interaction.type) {
  case InteractionType.ApplicationCommand: {
    const command = client.commands.get(interaction.commandName);
    if (command) {
     
      const ack = command.run(client, interaction, interaction.options)
        .catch((e) => {
          interaction.editReply({ content: "Something went wrong while executing the command. You have given wrong inputs or if you think it's a problem then please report this to a developer", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });

      let option = [];
      if (interaction.options.type) {
        switch (interaction.options.data[0].type) {
        case ApplicationCommandOptionType.SubcommandGroup: {
          for (let op of interaction.options.data[0].options[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        case ApplicationCommandOptionType.Subcommand: {
          for (let op of interaction.options.data[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        }
      } else {
        for (let op of interaction.options.data) {
          option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
        }
      }
      toConsole(`${interaction.user.tag} (${interaction.user.id}) ran the command \`${interaction.commandName}\` with the following options:\n> ${option.join("\n> ") || "No options"}`, new Error().stack, client);
      await require("node:util").promisify(setTimeout)(1e4);
      if (ack !== null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if (m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The command timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
  }
  }
  if (interaction.isModalSubmit()) {
    // modals need to have the same name as the commands they are started with
    const modalName = interaction.customId;
    const modal = client.modals.get(modalName);
    if (modal) {
      modal.run(client, interaction, interaction.fields);
    } else {
      await interaction.reply("Modal not found.");
      console.warn(`No modal found for: ${modalName}`);
      toConsole(`No modal found for: ${modalName}`,new Error().stack,client);
    }
  }
  if(interaction.isMessageContextMenuCommand())
  {
    const command = client.commands.get(interaction.commandName);
    command.run(client, interaction);

  }
  if(interaction.isAutocomplete()){
    const command = client.commands.get(interaction.commandName);
    await command.autocomplete(interaction);
  }
});
//#endregion

client.login(config.bot.token);

//#region Error Handling
process.on("uncaughtException", (err, origin) => {
  if (!ready) {
    console.warn("Exiting due to a [uncaughtException] during start up");
    console.error(err, origin);
    return process.exit(14);
  }
  // eslint-disable-next-line no-useless-escape
  toConsole(`An [uncaughtException] has occurred.\n\n> ${String(err)}\n> ${String(origin).replaceAll(/:/g, "\:")}`, new Error().stack, client);
});
process.on("unhandledRejection", async (promise) => {
  if (!ready) {
    console.warn("Exiting due to a [unhandledRejection] during start up");
    console.error(promise);
    return process.exit(15);
  }
  if (String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message") || String(promise).includes("Cannot read properties of undefined (reading 'ephemeral')")) return client.channels.cache.get(config.discord.logChannel).send(`A suppressed error has occured at process.on(unhandledRejection):\n>>> ${promise}`);
  // eslint-disable-next-line no-useless-escape
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${String(promise).replaceAll(/:/g, "\:")}`, new Error().stack, client);
});
process.on("warning", async (warning) => {
  if (!ready) {
    console.warn("[warning] has occurred during start up");
    console.warn(warning);
  }
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
process.on("exit", (code) => {
  console.error("[EXIT] The process is exiting!");
  console.error(`[EXIT] Code: ${code}`);

});
// Listen for process shutdown (e.g., CTRL+C or server shutdown)
process.on('SIGINT', async () => {
  console.log('Bot is going offline...');

  // Update the embed to indicate offline status
  if (statusMessage) {
      const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Bot Status')
          .setDescription('The bot is **Offline**.')
          .setTimestamp()
          .setFooter({ text: 'Bot Status', iconURL: client.user.displayAvatarURL() });

      await statusMessage.edit({ embeds: [embed] });
      console.log('Status message updated to offline.');
  }

  process.exit(); // Exit the process
});

process.on('SIGTERM', async () => {
  console.log('Bot is going offline...');

  // Update the embed to indicate offline status
  if (statusMessage) {
      const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Bot Status')
          .setDescription('The bot is **Offline**.')
          .setTimestamp()
          .setFooter({ text: 'Bot Status', iconURL: client.user.displayAvatarURL() });

      await statusMessage.edit({ embeds: [embed] });
      console.log('Status message updated to offline.');
  }

  process.exit(); // Exit the process
});
//#region endregion
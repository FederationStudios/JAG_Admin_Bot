const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { paginationEmbed } = require("../../functions");

module.exports = {
    name: "court_info",
    description: "Info about military court martials and appeal processes.",
    data: new SlashCommandBuilder()
        .setName("court_info")
        .setDescription("Info about military court martials and appeal processes."),
    run: async (client, interaction) => {
        try {
            const embeds = [
                new EmbedBuilder()
                    .setTitle("Military Justice League & Court Information (Page 1)")
                    .setColor(Colors.Red)
                    .addFields(
                        {
                            name: "Military Justice League",
                            value: "The Military Justice League hears appeals submitted by current or former members of the Military. Trials are private, and only involved parties may participate.",
                        },
                        {
                            name: "Summary Appeal Court",
                            value: "**Handles Class I offenses only.** Appeals require a detailed document submitted via `/file_an_appeal`. Alternatively, Class I offenses may also be appealed through the General Appeal Court.",
                        },
                        {
                            name: "General Appeal Court",
                            value: "**Handles all appeals not involving court decisions.** No document is required; a trial will be held. If you were not provided with evidence, you may request it during the pre-trial once added to the ticket.",
                        }
                    ),
                new EmbedBuilder()
                    .setTitle("Military Justice League & Court Information (Page 2)")
                    .setColor(Colors.Red)
                    .addFields(
                        {
                            name: "Appeal Tribunal",
                            value: "**Handles appeals of Military Justice League decisions only.** All qualified judges are assigned, and the trial proceeds without the appellee being present. The appeal process is similar to that of a general appeal.",
                        },
                        {
                            name: "Submitting an Appeal",
                            value: "To submit an appeal, head over to `#request-info` and run the `/file_an_appeal` command. Note: a `google_docs_link` is only required for Summary Appeal Court cases.",
                        }
                    ),
                new EmbedBuilder()
                    .setTitle("Military Justice League & Court Information (Page 3)")
                    .setColor(Colors.Red)
                    .addFields(
                        {
                            name: "You Can't Appeal If:",
                            value: `
- You are pleading guilty but the offense occurred **less than 30 days ago**.
- Your punishment was issued by **military or group leadership**.
- The **Court of Appeals** denied your appeal for the offense.
- The **Military Justice League** denied your appeal (you must appeal the MJL decision itself).
- Your punishment was a **verbal warning** or referral, unless the referral resulted in further punishments.
- Military or group leadership prevents you from appealing.`,
                        }
                    ),
                new EmbedBuilder()
                    .setTitle("Military Justice League & Court Information (Page 4)")
                    .setColor(Colors.Red)
                    .addFields({
                        name: "Questions or Violations",
                        value: "If you believe a member of the office violated the rules or you have evidence, please message any member of the **Military Justice League Command (DJAG+)** or a **Court Administrator**.",
                    }),
            ];

            await paginationEmbed(interaction, embeds);
        } catch (error) {
            console.error("Error handling interaction:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "There was an error while processing your request.",
                    ephemeral: true,
                });
            } else {
                await interaction.followUp({
                    content: "An error occurred while processing your request.",
                    ephemeral: true,
                });
            }
        }
    },
};

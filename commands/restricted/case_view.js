const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js'); // Import paginationEmbed

module.exports = {
    name: 'case_view',
    description: 'View all cases with details',
    data: new SlashCommandBuilder()
        .setName('case_view')
        .setDescription('Fetch and view all case details'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    async run(client, interaction) {
        await interaction.deferReply();

        // Check if the user has appropriate permissions (CoA Leadership)
        const requiredRoles = ['964465282120830986', '1083095989323313242', '1083096092356391043'];

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
          return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command, buddy.`, interaction, client, [true, 30]);
        }

        try {
            // Fetch all cases from the database
            const cases = await case_list.find();

            const pageSize = 5;

            if (!cases || cases.length === 0) {
                return interactionEmbed(3, "No cases found", "", interaction, client, [true, 15]);
            }

            // Create pages of embeds
            let embeds = [];
            for (let i = 0; i < cases.length; i += pageSize) {
                const casesPage = cases.slice(i, i + pageSize);
                const embed = new EmbedBuilder()
                    .setTitle('Case List')
                    .setColor('Red')
                    .setFooter({
                        text: `Page ${Math.floor(i / pageSize) + 1}/${Math.ceil(cases.length / pageSize)}`,
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    });

                casesPage.forEach(caseData => {
                    embed.addFields(
                        { name: `Case ID: ${caseData.case_id}`, value: `**Roblox Username:** ${caseData.roblox_username || 'N/A'}\n**Discord Username:** ${caseData.discord_username || 'N/A'}\n**Status:** ${caseData.case_status || 'N/A'}\n**Prosecuting Authority:** ${caseData.prosecuting_authority || 'N/A'}\n**Division:** ${caseData.division || 'N/A'}` }
                    );

                    if (caseData.judges_assigned) {
                        embed.addFields(
                            { name: 'Judges Username', value: caseData.judges_username || 'N/A' }
                        );
                    }
                });

                embeds.push(embed);
            }

            // Use paginationEmbed function to handle embeds with pagination
            await paginationEmbed(interaction, embeds);
        } catch (error) {
            return interactionEmbed(3, "[ERR-ARGS]", "An error occurred while fetching the records", interaction, client, [true, 15]);
        }
    }
};

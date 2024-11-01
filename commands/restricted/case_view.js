const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js'); // Import paginationEmbed
const { decryptData } = require('../../utils/encryptionUtils.js');
const { requiredRoles } = require('../../config.json').discord;

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
    run: async (client, interaction) => {
        
        await interaction.deferReply({ephemeral:true});
        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
        }
        try {
            // Fetch all cases from the database
            const cases = await case_list.find();

            const pageSize = 5;

            if (!cases || cases.length === 0) {
                return interaction.editReply("No cases found.")
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
                    // Decrypt the usernames before displaying them
                    const decryptedRobloxUsername = caseData.roblox_username 
                        ? decryptData(caseData.roblox_username.encryptedData, caseData.roblox_username.iv) 
                        : 'N/A';
                    const decryptedDiscordUsername = caseData.discord_username 
                        ? decryptData(caseData.discord_username.encryptedData, caseData.discord_username.iv) 
                        : 'N/A';
                        
                    embed.addFields(
                        { name: `Case ID: ${caseData.case_id}`, value: `**Roblox Username:** ${decryptedRobloxUsername}\n**Discord Username:** ${decryptedDiscordUsername}\n**Status:** ${caseData.case_status || 'N/A'}\n**Prosecuting Authority:** ${caseData.prosecuting_authority || 'N/A'}\n**Division:** ${caseData.division || 'N/A'}` }
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
            console.error(error); // Log the error to debug
            return interactionEmbed(3, "[ERR-ARGS]", "An error occurred while fetching the records", interaction, client, [true, 15]);
        }
    }
};

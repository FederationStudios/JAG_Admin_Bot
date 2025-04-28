const { SlashCommandBuilder, CommandInteractionOptionResolver, CommandInteraction, Colors, EmbedBuilder } = require('discord.js');
const Case = require('../../DBModels/Case'); // Adjust the path to your case model
const { decryptData } = require('../../utils/encryptionUtils.js');
const { interactionEmbed } = require("../../functions.js");
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: 'case_details',
    description: 'View details of a specific case by Case ID.',
    data: new SlashCommandBuilder()
        .setName('case_details')
        .setDescription('View details of a specific case by Case ID.')
        .addStringOption(option => 
            option.setName('case_id')
                .setDescription('The ID of the case to view.')
                .setRequired(true)
        ),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} options
     */
    run: async (client, interaction, options) => {
        const caseId = options.getString('case_id');

        await interaction.deferReply({ ephemeral: true });

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command.`, interaction, client, [true, 30]);
        }

        try {
            const caseDetails = await Case.findOne({ case_id: caseId });

            if (!caseDetails) {
                return interaction.editReply({ content: `No case found with ID ${caseId}`, ephemeral: true });
            }

            const decryptedRobloxUsername = caseDetails.roblox_username 
                ? decryptData(caseDetails.roblox_username.encryptedData, caseDetails.roblox_username.iv) 
                : 'N/A';
            const decryptedDiscordUsername = caseDetails.discord_username 
                ? decryptData(caseDetails.discord_username.encryptedData, caseDetails.discord_username.iv) 
                : 'N/A';

            const embed = new EmbedBuilder()
                .setColor(Colors.Aqua)
                .setTitle(`Case Details - ${caseDetails.case_id}`)
                .addFields(
                    { name: 'Roblox Username', value: decryptedRobloxUsername, inline: true },
                    { name: 'Discord Username', value: decryptedDiscordUsername, inline: true },
                    { name: 'Division', value: caseDetails.division || 'N/A', inline: false },
                    { name: 'Prosecuting Authority', value: caseDetails.prosecuting_authority || 'N/A', inline: false },
                    { name: 'Appeal Type', value: caseDetails.appeal_type || 'N/A', inline: false },
                    { name: 'Offenses Adjudicated', value: caseDetails.offenses_adjudicated || 'N/A', inline: false },
                    { name: 'Judges Assigned', value: caseDetails.judges_assigned ? 'Yes' : 'No', inline: true },
                    { name: 'Judges Username(s)', value: (caseDetails.judges_username && caseDetails.judges_username.length > 0) ? caseDetails.judges_username.join(', ') : 'N/A', inline: true },
                    { name: 'Submission Date', value: caseDetails.submission_date ? caseDetails.submission_date.toDateString() : 'N/A', inline: false },
                    { name: 'Case Status', value: caseDetails.case_status || 'N/A', inline: false }
                )
                .setTimestamp(new Date())
                .setFooter({ text: 'Military Justice League System' });

            await interaction.editReply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Error fetching case details:', error);
            await interaction.editReply({ content: 'An error occurred while retrieving the case details.', ephemeral: true });
        }
    },
};

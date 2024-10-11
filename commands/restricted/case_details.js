const { SlashCommandBuilder, CommandInteractionOptionResolver, CommandInteraction, Colors } = require('discord.js');
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
        const caseId = options.getString('case_id'); // Correct usage

        // Defer reply to handle long operations
        await interaction.deferReply({ ephemeral: true });

        // Check if the user has the required roles
        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command.`, interaction, client, [true, 30]);
        }

        try {
            // Find the case by case_id in the database
            const caseDetails = await Case.findOne({ case_id: caseId });

            if (!caseDetails) {
                return interaction.editReply({ content: `No case found with ID ${caseId}`, ephemeral: true });
            }

            // Decrypt usernames if necessary
            const decryptedRobloxUsername = caseDetails.roblox_username 
                ? decryptData(caseDetails.roblox_username.encryptedData, caseDetails.roblox_username.iv) 
                : 'N/A';
            const decryptedDiscordUsername = caseDetails.discord_username 
                ? decryptData(caseDetails.discord_username.encryptedData, caseDetails.discord_username.iv) 
                : 'N/A';

            // Create an embed for the case details
            const embed = {
                color: Colors.Aqua,
                title: `Case Details - ${caseDetails.case_id}`,
                fields: [
                    { name: 'Roblox Username', value: decryptedRobloxUsername, inline: true },
                    { name: 'Discord Username', value: decryptedDiscordUsername, inline: false },
                    { name: 'Division', value: caseDetails.division || 'N/A', inline: false },
                    { name: 'Prosecuting Authority', value: caseDetails.prosecuting_authority || 'N/A', inline: false },
                    { name: 'Court Martial Type', value: caseDetails.court_martial_type || 'N/A', inline: false },
                    { name: 'Offenses Adjudicated', value: caseDetails.offenses_adjudicated || 'N/A', inline: false },
                    { name: 'Judges Assigned', value: caseDetails.judges_assigned ? 'Yes' : 'No', inline: false },
                    { name: 'Judge Username', value: caseDetails.judges_username || 'N/A', inline: false },
                    { name: 'Submission Date', value: caseDetails.submission_date.toDateString() || 'N/A', inline: false },
                    { name: 'Case Status', value: caseDetails.case_status || 'N/A', inline: false }
                ],
                timestamp: new Date(),
                footer: { text: 'Court Martial System' },
            };

            // Reply with the case details
            await interaction.editReply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error fetching case details:', error);
            await interaction.editReply({ content: 'An error occurred while retrieving the case details.', ephemeral: true });
        }
    },
};

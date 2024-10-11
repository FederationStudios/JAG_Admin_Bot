const { SlashCommandBuilder, CommandInteractionOptionResolver, CommandInteraction } = require('discord.js');
const Case = require('../../DBModels/Case'); // Adjust the path to your case model
const { decryptData } = require('../../utils/encryptionUtils.js');
const {interactionEmbed} = require("../../functions.js");
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: "case_details",
    description: "View details of a specific case by Case ID.",
    data: new SlashCommandBuilder()
        .setName('view_case')
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
    run: async(interaction,client,options) => {
        const caseId = interaction.options.getString('case_id');
        
        await interaction.deferReply({ephemeral:true});

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
        }

        try {
            // Find the case by case_id
            const caseDetails = await Case.findOne({ case_id: caseId });

            if (!caseDetails) {
                return interaction.reply({ content: `No case found with ID ${caseId}`, ephemeral: true });
            }

            // Decrypt the Roblox and Discord usernames (assuming you have a decrypt function)
            const decryptedRobloxUsername = caseDetails.roblox_username 
            ? decryptData(caseDetails.roblox_username.encryptedData, caseDetails.roblox_username.iv) 
            : 'N/A';
        const decryptedDiscordUsername = caseDetails.discord_username 
            ? decryptData(caseDetails.discord_username.encryptedData, caseDetails.discord_username.iv) 
            : 'N/A';

            // Create an embed with all case details
            const caseEmbed = {
                color: 0x0099ff,
                title: `Case Details - ${caseDetails.case_id}`,
                fields: [
                    { name: 'Roblox Username', value: decryptedRobloxUsername, inline: true },
                    { name: 'Discord Username', value: decryptedDiscordUsername, inline: true },
                    { name: 'Division', value: caseDetails.division, inline: true },
                    { name: 'Prosecuting Authority', value: caseDetails.prosecuting_authority, inline: true },
                    { name: 'Court Martial Type', value: caseDetails.court_martial_type, inline: true },
                    { name: 'Offenses Adjudicated', value: caseDetails.offenses_adjudicated, inline: false },
                    { name: 'Judges Assigned', value: caseDetails.judges_assigned ? 'Yes' : 'No', inline: true },
                    { name: 'Judge Username', value: caseDetails.judges_username || 'N/A', inline: true },
                    { name: 'Submission Date', value: caseDetails.submission_date.toDateString(), inline: true },
                    { name: 'Case Status', value: caseDetails.case_status, inline: true },
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Court Martial System'
                },
            };

            await interaction.editReply({ embeds: [caseEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error fetching case details:', error);
            interaction.editReply({ content: 'An error occurred while retrieving the case details.', ephemeral: true });
        }
    }
};
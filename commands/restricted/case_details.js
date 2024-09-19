const { SlashCommandBuilder, CommandInteractionOptionResolver, CommandInteraction } = require('discord.js');
const Case = require('../../DBModels/case_list'); // Adjust the path to your case model
const { interactionEmbed } = require('../../functions'); // Assume you have a function to create embeds

module.exports = {
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
    run: async(interaction) => {
        const caseId = interaction.options.getString('case_id');
        
        await interaction.deferReply({ephemeral:true});

        try {
            // Find the case by case_id
            const caseDetails = await Case.findOne({ case_id: caseId });

            if (!caseDetails) {
                return interaction.reply({ content: `No case found with ID ${caseId}`, ephemeral: true });
            }

            // Decrypt the Roblox and Discord usernames (assuming you have a decrypt function)
            const decryptedRobloxUsername = decrypt(caseDetails.roblox_username);
            const decryptedDiscordUsername = decrypt(caseDetails.discord_username);

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
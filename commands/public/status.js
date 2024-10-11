const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case');
const { decryptData } = require('../../utils/encryptionUtils'); // Ensure correct path

module.exports = {
    name: 'status',
    description: 'To check your appeal status.',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('To check your appeal status.'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async(client, interaction, options) => {
        const discordUsername = interaction.user.tag; // Get the user's Discord username (e.g., User#1234)
        await interaction.deferReply({ephemeral: true});
        try {
            // Retrieve all cases from the database
            const cases = await case_list.find();
            
            // Decrypt and filter cases by the user's Discord username
            const userCases = cases.filter(caseItem => {
                const decryptedDiscordUsername = decryptData(caseItem.discord_username.encryptedData, caseItem.discord_username.iv);
                return decryptedDiscordUsername === discordUsername;
            });

            if (userCases.length === 0) {
                return interaction.editReply({ content: 'No cases found for your Discord username.', ephemeral: true });
            }

            // Create an array to hold the embed messages
            const embeds = userCases.map(c => new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Case ID: ${c.case_id}`)
                .addFields(
                    { name: 'Status', value: c.case_status, inline: true },
                    { name: 'Judges Assigned', value: c.judges_assigned ? 'Yes' : 'No', inline: false },
                    { name: 'Judges Username', value: c.judges_username || 'N/A', inline: false }
                )
                .setFooter({
                    text: `JAG - Secure Transmission | Requested at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`,
                    iconURL: client.user.displayAvatarURL()
                })
            );

            // Send the case details in a DM to the user
            for (const embed of embeds) {
                await interaction.user.send({ embeds: [embed] });
            }

            await interaction.editReply({ content: 'I have sent your case details to your DMs.', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'An error occurred while fetching your case details.', ephemeral: true });
        }
    }
};

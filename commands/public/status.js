const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, Colors, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case');
const { decryptData } = require('../../utils/encryptionUtils'); // Ensure correct path

module.exports = {
    name: 'status',
    description: 'Check your appeal status.',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check your appeal status.'),

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const discordUsername = interaction.user.tag;
        await interaction.deferReply({ ephemeral: true });

        try {
            const cases = await case_list.find({ 'discord_username.encryptedData': { $exists: true } });

            const userCases = cases.filter(caseItem => {
                const decryptedDiscordUsername = caseItem.discord_username && caseItem.discord_username.encryptedData && caseItem.discord_username.iv
                    ? decryptData(caseItem.discord_username.encryptedData, caseItem.discord_username.iv)
                    : null;

                if (!decryptedDiscordUsername) {
                    console.warn(`Skipping case ID ${caseItem.case_id} due to missing or invalid discord_username data.`);
                    return false;
                }

                return decryptedDiscordUsername === discordUsername;
            });

            if (userCases.length === 0) {
                return interaction.editReply({ content: '❌ No cases found for your Discord username.', ephemeral: true });
            }

            const embeds = userCases.map(c => new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle(`Case ID: ${c.case_id}`)
                .addFields(
                    { name: 'Status', value: c.case_status || 'N/A', inline: true },
                    { name: 'Judges Assigned', value: c.judges_assigned ? 'Yes' : 'No', inline: true },
                    { name: 'Judges Username(s)', value: (c.judges_username && Array.isArray(c.judges_username) && c.judges_username.length > 0) ? c.judges_username.join(', ') : 'N/A', inline: false }
                )
                .setFooter({
                    text: `JAG - Secure Transmission | Requested at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`,
                    iconURL: client.user.displayAvatarURL()
                })
            );

            try {
                const batchSize = 5;
                for (let i = 0; i < embeds.length; i += batchSize) {
                    const batch = embeds.slice(i, i + batchSize);
                    await interaction.user.send({ embeds: batch });
                }
                await interaction.editReply({ content: '✅ I have sent your case details to your DMs.', ephemeral: true });
            } catch (dmError) {
                console.error('Error sending DM:', dmError);
                await interaction.editReply({ content: '❌ Could not send you a DM. Please check if your DMs are open.', ephemeral: true });
            }

        } catch (error) {
            console.error('Error fetching cases:', error);
            await interaction.editReply({ content: '❌ An unexpected error occurred while fetching your case details. Please contact support.', ephemeral: true });
        }
    }
};

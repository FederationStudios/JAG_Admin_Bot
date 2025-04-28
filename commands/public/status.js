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
            const cases = await case_list.find();

            const userCases = cases.filter(caseItem => {
                const decryptedDiscordUsername = decryptData(caseItem.discord_username.encryptedData, caseItem.discord_username.iv);
                return decryptedDiscordUsername === discordUsername;
            });

            if (userCases.length === 0) {
                return interaction.editReply({ content: '❌ No cases found for your Discord username.', ephemeral: true });
            }

            const embeds = userCases.map(c => new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle(`Case ID: ${c.case_id}`)
                .addFields(
                    { name: 'Status', value: c.case_status, inline: true },
                    { name: 'Judges Assigned', value: c.judges_assigned ? 'Yes' : 'No', inline: true },
                    { name: 'Judges Username(s)', value: (c.judges_username && Array.isArray(c.judges_username) && c.judges_username.length > 0) ? c.judges_username.join(', ') : 'N/A', inline: false }
                )
                .setFooter({
                    text: `JAG - Secure Transmission | Requested at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`,
                    iconURL: client.user.displayAvatarURL()
                })
            );

            try {
                for (const embed of embeds) {
                    await interaction.user.send({ embeds: [embed] });
                }
                await interaction.editReply({ content: '✅ I have sent your case details to your DMs.', ephemeral: true });
            } catch (dmError) {
                console.error('Error sending DM:', dmError);
                await interaction.editReply({ content: '❌ Could not send you a DM. Please check if your DMs are open.', ephemeral: true });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ An error occurred while fetching your case details.', ephemeral: true });
        }
    }
};

const { SlashCommandBuilder, Client, CommandInteraction, Colors } = require('discord.js');

module.exports = {
    name: 'court_info',
    description: 'Provides information about military court martials and sanctions',
    data: new SlashCommandBuilder()
        .setName('court_info')
        .setDescription('Provides information about military court martials and sanctions'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */         
    run: async (client, interaction) => {
        try {
            const embed = {
                title: 'Military Court Martials and Sanctions',
                color: Colors.Red,
                fields: [
                    {
                        name: 'Sanctions',
                        value: `Formal corrective actions like Counseling, Admonishment, Additional Duty, Rank Reduction, or Reassignment. Not appealable but can request a court martial instead.`,
                    },
                    {
                        name: 'Summary Court Martial',
                        value: `Handles Class I & II offenses up to Colonel. Punishments: Hell Jacks, Grammar Jacks, Demotion, Rank Lock, Division Removal, Additional Duty, Jail Time.`,
                    },
                    {
                        name: 'Appeal against Summary Court Martial',
                        value: `Appeal to Summary Appeal Court. Can uphold, reverse, or impose new sentences.`,
                    },
                    {
                        name: 'General Court Martial',
                        value: `Handles Class III offenses & certain Class II offenses. Punishments: Hell Jacks, Grammar Jacks, Unlimited Demotion, Blacklists, Decommissioning, Jail Time.`,
                    },
                    {
                        name: 'General Appeal Court',
                        value: `Hears appeals from General Court Martials. Can uphold, reverse, impose new sentences, or order a retrial.`,
                    },
                    {
                        name: 'Special Court Martial',
                        value: `Handles special cases. Unlimited in punishment within Armed Forces powers.`,
                    },
                    {
                        name: 'Court of Appeals',
                        value: `Overarching court for civilian and military appeals, including those from Summary and General Appeal Courts.`,
                    },
                ],
                footer: {
                  text: `Requested by ${interaction.member.user.username}`,
                  iconUrl: interaction.user.displayAvatarURL()
                },
                timestamp: new Date()
            };

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
            } else {
                await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
            }
        }
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Case = require('../../DBModels/Case');

module.exports = {
    name: "divisions_stats",
    description: "divisions_stats",
    data: new SlashCommandBuilder()
        .setName('divisions_stats')
        .setDescription('Count the number of cases per division'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply();

        try {
            // Aggregate cases by division and count
            const divisionCounts = await Case.aggregate([
                {
                    $group: {
                        _id: '$division',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Create an embed message
            const embed = new EmbedBuilder()
                .setColor('#0099ff')  // Set the color of the embed
                .setTitle('Case Counts by Division')
                .setDescription('Below are the counts of cases grouped by division:')
                .setTimestamp();

            // Add each division and its case count to the embed
            divisionCounts.forEach(division => {
                embed.addFields({ name: `${division._id}`, value: `${division.count} cases`, inline: true });
            });

            // Send the embed response
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while counting the cases.');
        }
    },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const Judgment = require('../../DBModels/Judgment.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js');
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: 'view_judgement_results',
    description: 'View all judgment results with links to the summary documents',
    data: new SlashCommandBuilder()
        .setName('view_judgement_results')
        .setDescription('Fetch and view all judgment results'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", '', interaction, client, [true, 30]);
        }

        try {
            const judgments = await Judgment.find().sort({ submitted_date: -1 }); // Sort newest first
            const pageSize = 5;

            if (!judgments || judgments.length === 0) {
                return interaction.editReply({ content: "No judgment results found.", ephemeral: true });
            }

            const embeds = [];
            for (let i = 0; i < judgments.length; i += pageSize) {
                const judgmentsPage = judgments.slice(i, i + pageSize);
                const embed = new EmbedBuilder()
                    .setTitle('Military Justice League - Judgment Results')
                    .setColor('Blue')
                    .setFooter({
                        text: `Page ${Math.floor(i / pageSize) + 1} of ${Math.ceil(judgments.length / pageSize)}`,
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    });

                judgmentsPage.forEach(judgment => {
                    embed.addFields(
                        { 
                            name: `Case ID: ${judgment.case_id}`, 
                            value: `**Summary Judgment Link:** [View Document](${judgment.result_doc_link})\n**Submitted Date:** ${judgment.submitted_date.toLocaleDateString()}` 
                        }
                    );
                });

                embeds.push(embed);
            }

            await paginationEmbed(interaction, embeds);

        } catch (error) {
            console.error('Error fetching judgment results:', error);
            return interactionEmbed(3, "[ERR-ARGS]", "An error occurred while fetching the records.", interaction, client, [true, 15]);
        }
    }
};
